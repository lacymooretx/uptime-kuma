const basicAuth = require("express-basic-auth");
const passwordHash = require("./password-hash");
const { R } = require("redbean-node");
const { log } = require("../src/util");
const { loginRateLimiter, apiRateLimiter } = require("./rate-limiter");
const { Settings } = require("./settings");
const dayjs = require("dayjs");

/**
 * Login to web app
 * @param {string} username Username to login with
 * @param {string} password Password to login with
 * @returns {Promise<(Bean|null)>} User or null if login failed
 */
exports.login = async function (username, password) {
    if (typeof username !== "string" || typeof password !== "string") {
        return null;
    }

    let user = await R.findOne("user", "TRIM(username) = ? AND active = 1 ", [username.trim()]);

    if (user && passwordHash.verify(password, user.password)) {
        // Upgrade the hash to bcrypt
        if (passwordHash.needRehash(user.password)) {
            await R.exec("UPDATE \"user\" SET password = ? WHERE id = ? ", [
                await passwordHash.generate(password),
                user.id,
            ]);
        }
        return user;
    }

    return null;
};

/**
 * Validate a provided API key
 * @param {string} key API key to verify
 * @returns {boolean} API is ok?
 */
async function verifyAPIKey(key) {
    if (typeof key !== "string") {
        return false;
    }

    // uk prefix + key ID is before _
    let index = key.substring(2, key.indexOf("_"));
    let clear = key.substring(key.indexOf("_") + 1, key.length);

    let hash = await R.findOne("api_key", " id=? ", [index]);

    if (hash === null) {
        return false;
    }

    let current = dayjs();
    let expiry = dayjs(hash.expires);
    if (expiry.diff(current) < 0 || !hash.active) {
        return false;
    }

    return hash && passwordHash.verify(clear, hash.key);
}

/**
 * Validate a provided API key and return the user_id
 * @param {string} key API key to verify
 * @returns {Promise<number|null>} user_id if valid, null otherwise
 */
async function verifyAPIKeyAndGetUserID(key) {
    if (typeof key !== "string") {
        return null;
    }

    let index = key.substring(2, key.indexOf("_"));
    let clear = key.substring(key.indexOf("_") + 1, key.length);

    let hash = await R.findOne("api_key", " id=? ", [index]);

    if (hash === null) {
        return null;
    }

    let current = dayjs();
    let expiry = dayjs(hash.expires);
    if (expiry.diff(current) < 0 || !hash.active) {
        return null;
    }

    if (hash && passwordHash.verify(clear, hash.key)) {
        return hash.user_id;
    }

    return null;
}

/**
 * Callback for basic auth authorizers
 * @callback authCallback
 * @param {any} err Any error encountered
 * @param {boolean} authorized Is the client authorized?
 */

/**
 * Custom authorizer for express-basic-auth
 * @param {string} username Username to login with
 * @param {string} password Password to login with
 * @param {authCallback} callback Callback to handle login result
 * @returns {void}
 */
function apiAuthorizer(username, password, callback) {
    // API Rate Limit
    apiRateLimiter.pass(null, 0).then((pass) => {
        if (pass) {
            verifyAPIKey(password).then((valid) => {
                if (!valid) {
                    log.warn("api-auth", "Failed API auth attempt: invalid API Key");
                }
                callback(null, valid);
                // Only allow a set number of api requests per minute
                // (currently set to 60)
                apiRateLimiter.removeTokens(1);
            });
        } else {
            log.warn("api-auth", "Failed API auth attempt: rate limit exceeded");
            callback(null, false);
        }
    });
}

/**
 * Custom authorizer for express-basic-auth
 * @param {string} username Username to login with
 * @param {string} password Password to login with
 * @param {authCallback} callback Callback to handle login result
 * @returns {void}
 */
function userAuthorizer(username, password, callback) {
    // Login Rate Limit
    loginRateLimiter.pass(null, 0).then((pass) => {
        if (pass) {
            exports.login(username, password).then((user) => {
                callback(null, user != null);

                if (user == null) {
                    log.warn("basic-auth", "Failed basic auth attempt: invalid username/password");
                    loginRateLimiter.removeTokens(1);
                }
            });
        } else {
            log.warn("basic-auth", "Failed basic auth attempt: rate limit exceeded");
            callback(null, false);
        }
    });
}

/**
 * Use basic auth if auth is not disabled
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction} next Next handler in chain
 * @returns {Promise<void>}
 */
exports.basicAuth = async function (req, res, next) {
    const middleware = basicAuth({
        authorizer: userAuthorizer,
        authorizeAsync: true,
        challenge: true,
    });

    const disabledAuth = await Settings.get("disableAuth");

    if (!disabledAuth) {
        middleware(req, res, next);
    } else {
        next();
    }
};

/**
 * Use use API Key if API keys enabled, else use basic auth
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction} next Next handler in chain
 * @returns {Promise<void>}
 */
exports.apiAuth = async function (req, res, next) {
    if (!(await Settings.get("disableAuth"))) {
        let usingAPIKeys = await Settings.get("apiKeysEnabled");
        let middleware;
        if (usingAPIKeys) {
            middleware = basicAuth({
                authorizer: apiAuthorizer,
                authorizeAsync: true,
                challenge: true,
            });
        } else {
            middleware = basicAuth({
                authorizer: userAuthorizer,
                authorizeAsync: true,
                challenge: true,
            });
        }
        middleware(req, res, next);
    } else {
        next();
    }
};

/**
 * REST API auth middleware.
 * Parses Authorization: Basic header manually.
 * Supports API key (password starts with "uk") or username/password.
 * Sets req.userID on success. Returns 401 JSON (not HTML challenge) on failure.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction} next Next handler in chain
 * @returns {Promise<void>}
 */
exports.restApiAuth = async function (req, res, next) {
    // If auth is disabled, find the first user and use their ID
    if (await Settings.get("disableAuth")) {
        let user = await R.findOne("user", " active = 1 ");
        if (user) {
            req.userID = user.id;
        }
        return next();
    }

    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Basic ")) {
        return res.status(401).json({ ok: false, msg: "Missing or invalid Authorization header. Use Basic auth." });
    }

    let decoded;
    try {
        decoded = Buffer.from(authHeader.substring(6), "base64").toString("utf-8");
    } catch (e) {
        return res.status(401).json({ ok: false, msg: "Invalid Authorization header encoding." });
    }

    const colonIndex = decoded.indexOf(":");
    if (colonIndex === -1) {
        return res.status(401).json({ ok: false, msg: "Invalid Authorization header format." });
    }

    const username = decoded.substring(0, colonIndex);
    const password = decoded.substring(colonIndex + 1);

    // Check if it's an API key (password starts with "uk")
    if (password.startsWith("uk")) {
        // Rate limit
        if (!(await apiRateLimiter.pass(null, 0))) {
            return res.status(429).json({ ok: false, msg: "Too many requests. Please try again later." });
        }

        const userID = await verifyAPIKeyAndGetUserID(password);
        apiRateLimiter.removeTokens(1);

        if (userID) {
            req.userID = userID;
            return next();
        } else {
            log.warn("rest-api-auth", "Failed API key auth attempt");
            return res.status(401).json({ ok: false, msg: "Invalid API key." });
        }
    } else {
        // Username/password auth
        if (!(await loginRateLimiter.pass(null, 0))) {
            return res.status(429).json({ ok: false, msg: "Too many requests. Please try again later." });
        }

        const user = await exports.login(username, password);
        if (user) {
            req.userID = user.id;
            return next();
        } else {
            loginRateLimiter.removeTokens(1);
            log.warn("rest-api-auth", "Failed basic auth attempt");
            return res.status(401).json({ ok: false, msg: "Invalid username or password." });
        }
    }
};
