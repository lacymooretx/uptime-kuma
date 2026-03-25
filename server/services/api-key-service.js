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
}

module.exports = ApiKeyService;
