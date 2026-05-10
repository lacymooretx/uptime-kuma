const express = require("express");
const router = express.Router();
const { Issuer, generators } = require("openid-client");
const jwt = require("jsonwebtoken");
const { R } = require("redbean-node");
const { UptimeKumaServer } = require("../uptime-kuma-server");
const User = require("../model/user");
const passwordHash = require("../password-hash");
const { log } = require("../../src/util");

// OIDC Configuration from environment
const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID;
const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET;
const OIDC_TENANT_ID = process.env.OIDC_TENANT_ID;
const OIDC_CALLBACK_URL = process.env.OIDC_CALLBACK_URL;
const OIDC_REQUIRED_GROUP = process.env.OIDC_REQUIRED_GROUP;

// Allowlist of post-auth return paths. Anything else falls back to /dashboard
// to prevent open-redirect via the `?return=` query param.
const RETURN_PATH_ALLOWLIST = [ "/dashboard", "/v2/", "/v2" ];
const DEFAULT_RETURN_PATH = "/dashboard";

function resolveReturnPath(raw) {
    if (typeof raw !== "string" || raw.length === 0) return DEFAULT_RETURN_PATH;
    // Reject anything that could parse as an absolute URL or protocol-relative.
    if (raw[0] !== "/" || raw.startsWith("//")) return DEFAULT_RETURN_PATH;
    return RETURN_PATH_ALLOWLIST.some((p) => raw === p || raw.startsWith(p + "/") || raw.startsWith(p + "?"))
        ? raw
        : DEFAULT_RETURN_PATH;
}

let oidcClient = null;

async function getOIDCClient() {
    if (oidcClient) return oidcClient;

    if (!OIDC_CLIENT_ID || !OIDC_CLIENT_SECRET || !OIDC_TENANT_ID) {
        return null;
    }

    const issuerUrl = `https://login.microsoftonline.com/${OIDC_TENANT_ID}/v2.0`;
    const issuer = await Issuer.discover(issuerUrl);

    oidcClient = new issuer.Client({
        client_id: OIDC_CLIENT_ID,
        client_secret: OIDC_CLIENT_SECRET,
        redirect_uris: [OIDC_CALLBACK_URL],
        response_types: ["code"],
    });

    return oidcClient;
}

// Check if OIDC is configured
router.get("/status", async (req, res) => {
    const enabled = !!(OIDC_CLIENT_ID && OIDC_CLIENT_SECRET && OIDC_TENANT_ID);
    res.json({ oidcEnabled: enabled });
});

// Redirect to Entra ID login
router.get("/login", async (req, res) => {
    try {
        const client = await getOIDCClient();
        if (!client) {
            return res.status(500).json({ ok: false, msg: "OIDC not configured" });
        }

        const nonce = generators.nonce();
        const state = generators.state();
        const returnPath = resolveReturnPath(req.query.return);

        // Store nonce, state, and intended return path in short-lived cookies
        res.cookie("oidc_nonce", nonce, { httpOnly: true, secure: true, maxAge: 600000, sameSite: "lax" });
        res.cookie("oidc_state", state, { httpOnly: true, secure: true, maxAge: 600000, sameSite: "lax" });
        res.cookie("oidc_return", returnPath, { httpOnly: true, secure: true, maxAge: 600000, sameSite: "lax" });

        const authUrl = client.authorizationUrl({
            scope: "openid profile email",
            state,
            nonce,
            response_type: "code",
        });

        res.redirect(authUrl);
    } catch (e) {
        log.error("oidc", e.message);
        res.status(500).json({ ok: false, msg: "OIDC login failed: " + e.message });
    }
});

// Handle callback from Entra ID
router.get("/callback", async (req, res) => {
    try {
        const client = await getOIDCClient();
        if (!client) {
            return res.status(500).send("OIDC not configured");
        }

        const nonce = req.cookies?.oidc_nonce;
        const state = req.cookies?.oidc_state;
        const returnPath = resolveReturnPath(req.cookies?.oidc_return);

        // Clear cookies
        res.clearCookie("oidc_nonce");
        res.clearCookie("oidc_state");
        res.clearCookie("oidc_return");

        const params = client.callbackParams(req);
        const tokenSet = await client.callback(OIDC_CALLBACK_URL, params, {
            nonce,
            state,
        });

        const claims = tokenSet.claims();
        log.info("oidc", `OIDC login for: ${claims.preferred_username || claims.email}`);

        // Check group membership
        if (OIDC_REQUIRED_GROUP) {
            const groups = claims.groups || [];
            if (!groups.includes(OIDC_REQUIRED_GROUP)) {
                log.warn("oidc", `User ${claims.preferred_username} not in required group ${OIDC_REQUIRED_GROUP}`);
                return res.status(403).send(`
                    <html><body style="font-family:sans-serif;text-align:center;padding:50px">
                    <h2>Access Denied</h2>
                    <p>You are not a member of the required group to access Uptime Kuma.</p>
                    <p>Contact your administrator.</p>
                    </body></html>
                `);
            }
        }

        // Find or create local user
        const email = (claims.preferred_username || claims.email || "").toLowerCase();
        const displayName = claims.name || email;

        if (!email) {
            return res.status(400).send("No email in OIDC token");
        }

        let user = await R.findOne("user", " username = ? AND active = 1 ", [email]);

        if (!user) {
            // Auto-provision new user
            user = R.dispense("user");
            user.username = email;
            // Set a random password (not used for OIDC login, but required by schema)
            user.password = await passwordHash.generate(generators.nonce() + generators.nonce());
            user.active = true;
            await R.store(user);
            log.info("oidc", `Auto-provisioned user: ${email} (ID: ${user.id})`);
        }

        // Issue JWT using existing Uptime Kuma JWT infrastructure
        const server = UptimeKumaServer.getInstance();
        const token = User.createJWT(user, server.jwtSecret);

        // Redirect to the intended frontend with token. Respects the return cookie
        // set at /login time (allowlisted, defaults to /dashboard).
        const sep = returnPath.includes("?") ? "&" : "?";
        res.redirect(`${returnPath}${sep}token=${encodeURIComponent(token)}`);
    } catch (e) {
        log.error("oidc", e.message);
        res.status(500).send(`
            <html><body style="font-family:sans-serif;text-align:center;padding:50px">
            <h2>Authentication Error</h2>
            <p>${e.message}</p>
            <a href="/">Try again</a>
            </body></html>
        `);
    }
});

module.exports = router;
