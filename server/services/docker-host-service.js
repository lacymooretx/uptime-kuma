const { DockerHost } = require("../docker");
const { log } = require("../../src/util");

class DockerHostService {

    /**
     * Save (add or update) a docker host
     * @param {object} dockerHost Docker host config
     * @param {number|null} dockerHostID Existing ID to update, or null for new
     * @param {number} userID User ID
     * @returns {Promise<object>} Saved docker host bean
     */
    static async save(dockerHost, dockerHostID, userID) {
        return await DockerHost.save(dockerHost, dockerHostID, userID);
    }

    /**
     * Delete a docker host
     * @param {number} dockerHostID Docker host ID
     * @param {number} userID User ID
     * @returns {Promise<void>}
     */
    static async delete(dockerHostID, userID) {
        await DockerHost.delete(dockerHostID, userID);
    }

    /**
     * Test a docker host connection
     * @param {object} dockerHost Docker host config to test
     * @returns {Promise<string>} Result message
     */
    static async test(dockerHost) {
        let amount = await DockerHost.testDockerHost(dockerHost);
        if (amount >= 1) {
            return "Connected Successfully. Amount of containers: " + amount;
        } else {
            return "Connected Successfully, but there are no containers?";
        }
    }
}

module.exports = DockerHostService;
