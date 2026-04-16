const { R } = require("redbean-node");
const { nanoid } = require("nanoid");
const passwordHash = require("../password-hash");
const apicache = require("../modules/apicache");
const APIKey = require("../model/api_key");
const { Settings } = require("../settings");
const { log } = require("../../src/util");

class ApiKeyService {

    /**
     * Get all API keys for a user (public info only)
     * @param {number} userID User ID
     * @returns {Promise<object[]>} List of API key public JSON
     */
    static async list(userID) {
        let result = [];
        const list = await R.find("api_key", "user_id=?", [userID]);
        for (let bean of list) {
            result.push(bean.toPublicJSON());
        }
        return result;
    }

    /**
     * Add a new API key
     * @param {object} key Key metadata {name, expires, active}
     * @param {number} userID User ID
     * @returns {Promise<{bean: object, formattedKey: string}>} The saved bean and formatted key
     */
    static async add(key, userID) {
        let clearKey = nanoid(40);
        let hashedKey = await passwordHash.generate(clearKey);
        key["key"] = hashedKey;
        let bean = await APIKey.save(key, userID);

        log.debug("apikeys", "Added API Key");

        let formattedKey = "uk" + bean.id + "_" + clearKey;

        // Enable API auth if the user creates a key
        await Settings.set("apiKeysEnabled", true);

        return { bean, formattedKey };
    }

    /**
     * Delete an API key
     * @param {number} keyID API key ID
     * @param {number} userID User ID
     * @returns {Promise<void>}
     */
    static async delete(keyID, userID) {
        log.debug("apikeys", `Deleted API Key: ${keyID} User ID: ${userID}`);
        await R.exec("DELETE FROM api_key WHERE id = ? AND user_id = ? ", [keyID, userID]);
        apicache.clear();
    }

    /**
     * Disable an API key
     * @param {number} keyID API key ID
     * @param {number} userID User ID
     * @returns {Promise<void>}
     */
    static async disable(keyID, userID) {
        log.debug("apikeys", `Disabled Key: ${keyID} User ID: ${userID}`);
        await R.exec("UPDATE api_key SET active = false WHERE id = ? ", [keyID]);
        apicache.clear();
    }

    /**
     * Enable an API key
     * @param {number} keyID API key ID
     * @param {number} userID User ID
     * @returns {Promise<void>}
     */
    static async enable(keyID, userID) {
        log.debug("apikeys", `Enabled Key: ${keyID} User ID: ${userID}`);
        await R.exec("UPDATE api_key SET active = true WHERE id = ? ", [keyID]);
        apicache.clear();
    }

    /**
     * Reconcile an API key from env (UPTIME_KUMA_BOOTSTRAP_API_KEY).
     * Expected format: uk<id>_<clear>. Upserts an api_key row with that id
     * owned by the first active user, bcrypt(clear) as the stored hash,
     * active=true, expires=2099, name="Bootstrap (env)". Also enables
     * apiKeysEnabled. Safe to run on every startup; idempotent.
     * @returns {Promise<void>}
     */
    static async bootstrapFromEnv() {
        const envKey = process.env.UPTIME_KUMA_BOOTSTRAP_API_KEY;
        if (!envKey) {
            return;
        }
        if (!envKey.startsWith("uk") || !envKey.includes("_")) {
            log.warn("apikeys", "UPTIME_KUMA_BOOTSTRAP_API_KEY is malformed (expected uk<id>_<clear>), skipping");
            return;
        }
        const underscoreIdx = envKey.indexOf("_");
        const idStr = envKey.substring(2, underscoreIdx);
        const clear = envKey.substring(underscoreIdx + 1);
        const id = parseInt(idStr, 10);
        if (!Number.isInteger(id) || id <= 0 || !clear) {
            log.warn("apikeys", "UPTIME_KUMA_BOOTSTRAP_API_KEY is malformed, skipping");
            return;
        }

        const firstUser = await R.findOne("user", " active = 1 ORDER BY id ASC ");
        if (!firstUser) {
            log.info("apikeys", "Bootstrap API key skipped: no active user yet");
            return;
        }

        const hashedKey = await passwordHash.generate(clear);
        const expires = "2099-01-01 00:00:00";
        const name = "Bootstrap (env)";
        const existing = await R.findOne("api_key", " id = ? ", [id]);

        if (existing) {
            await R.exec(
                "UPDATE api_key SET key = ?, name = ?, user_id = ?, active = true, expires = ? WHERE id = ?",
                [hashedKey, name, firstUser.id, expires, id]
            );
            log.info("apikeys", `Bootstrap API key id=${id} reconciled from env`);
        } else {
            await R.exec(
                "INSERT INTO api_key (id, key, name, user_id, active, expires, created_date) VALUES (?, ?, ?, ?, true, ?, ?)",
                [id, hashedKey, name, firstUser.id, expires, new Date().toISOString()]
            );
            log.info("apikeys", `Bootstrap API key id=${id} created from env`);
        }

        await Settings.set("apiKeysEnabled", true);
        apicache.clear();
    }
}

module.exports = ApiKeyService;
