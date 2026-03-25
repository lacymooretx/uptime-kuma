const { RemoteBrowser } = require("../remote-browser");
const { testRemoteBrowser } = require("../monitor-types/real-browser-monitor-type");
const { log } = require("../../src/util");

class RemoteBrowserService {

    /**
     * Save (add or update) a remote browser
     * @param {object} remoteBrowser Remote browser config
     * @param {number|null} remoteBrowserID Existing ID to update, or null for new
     * @param {number} userID User ID
     * @returns {Promise<object>} Saved remote browser bean
     */
    static async save(remoteBrowser, remoteBrowserID, userID) {
        return await RemoteBrowser.save(remoteBrowser, remoteBrowserID, userID);
    }

    /**
     * Delete a remote browser
     * @param {number} remoteBrowserID Remote browser ID
     * @param {number} userID User ID
     * @returns {Promise<void>}
     */
    static async delete(remoteBrowserID, userID) {
        await RemoteBrowser.delete(remoteBrowserID, userID);
    }

    /**
     * Test a remote browser connection
     * @param {object} remoteBrowser Remote browser config
     * @returns {Promise<string>} Result message
     */
    static async test(remoteBrowser) {
        let check = await testRemoteBrowser(remoteBrowser.url);
        log.info("remoteBrowser", "Tested remote browser: " + check);
        if (check) {
            return "Connected Successfully.";
        }
        return "";
    }
}

module.exports = RemoteBrowserService;
