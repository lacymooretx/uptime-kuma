const { Proxy } = require("../proxy");

class ProxyService {

    /**
     * Save (add or update) a proxy
     * @param {object} proxy Proxy config
     * @param {number|null} proxyID Existing ID to update, or null for new
     * @param {number} userID User ID
     * @returns {Promise<object>} Saved proxy bean
     */
    static async save(proxy, proxyID, userID) {
        return await Proxy.save(proxy, proxyID, userID);
    }

    /**
     * Delete a proxy
     * @param {number} proxyID Proxy ID
     * @param {number} userID User ID
     * @returns {Promise<void>}
     */
    static async delete(proxyID, userID) {
        await Proxy.delete(proxyID, userID);
        await Proxy.reloadProxy();
    }

    /**
     * Apply proxy to existing monitors and reload
     * @returns {Promise<void>}
     */
    static async reloadProxy() {
        await Proxy.reloadProxy();
    }
}

module.exports = ProxyService;
