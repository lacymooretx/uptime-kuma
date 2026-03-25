const { R } = require("redbean-node");
const { log } = require("../../src/util");
const { passwordStrength } = require("check-password-strength");
const TranslatableError = require("../translatable-error");
const { UptimeKumaServer } = require("../uptime-kuma-server");
const { Settings } = require("../settings");
const { getSettings, setSettings, setting } = require("../util-server");
const { resetChrome } = require("../monitor-types/real-browser-monitor-type");
const User = require("../model/user");
const passwordHash = require("../password-hash");

class SettingsService {

    /**
     * Get general settings
     * @returns {Promise<object>} Settings data
     */
    static async get() {
        const server = UptimeKumaServer.getInstance();
        const data = await getSettings("general");

        if (!data.serverTimezone) {
            data.serverTimezone = await server.getTimezone();
        }

        return data;
    }

    /**
     * Set general settings
     * @param {object} data Settings data
     * @param {string|null} currentPassword Current password (for disabling auth)
     * @param {number} userID User ID of the requester
     * @returns {Promise<void>}
     */
    static async set(data, currentPassword, userID) {
        const server = UptimeKumaServer.getInstance();

        // If currently is disabled auth, don't need to check
        const currentDisabledAuth = await setting("disableAuth");
        if (!currentDisabledAuth && data.disableAuth) {
            // Verify password when trying to disable auth
            let user = await R.findOne("user", " id = ? AND active = 1 ", [userID]);
            if (!user || !passwordHash.verify(currentPassword, user.password)) {
                throw new Error("Incorrect current password");
            }
        }

        // Log out all clients if enabling auth
        if (currentDisabledAuth && !data.disableAuth) {
            server.disconnectAllSocketClients(userID, null);
        }

        const previousChromeExecutable = await Settings.get("chromeExecutable");
        const previousNSCDStatus = await Settings.get("nscd");

        await setSettings("general", data);
        server.entryPage = data.entryPage;

        if (data.serverTimezone) {
            await server.setTimezone(data.serverTimezone);
        }

        if (previousChromeExecutable !== data.chromeExecutable) {
            log.info("settings", "Chrome executable is changed. Resetting Chrome...");
            await resetChrome();
        }

        if (previousNSCDStatus !== data.nscd) {
            if (data.nscd) {
                await server.startNSCDServices();
            } else {
                await server.stopNSCDServices();
            }
        }
    }

    /**
     * Change user password
     * @param {string} currentPassword Current password
     * @param {string} newPassword New password
     * @param {number} userID User ID
     * @returns {Promise<string>} New JWT token
     */
    static async changePassword(currentPassword, newPassword, userID) {
        const server = UptimeKumaServer.getInstance();

        if (!newPassword) {
            throw new Error("Invalid new password");
        }

        if (passwordStrength(newPassword).value === "Too weak") {
            throw new TranslatableError("passwordTooWeak");
        }

        let user = await R.findOne("user", " id = ? AND active = 1 ", [userID]);
        if (!user || !passwordHash.verify(currentPassword, user.password)) {
            throw new Error("Incorrect current password");
        }

        await user.resetPassword(newPassword);

        server.disconnectAllSocketClients(user.id, null);

        return User.createJWT(user, server.jwtSecret);
    }
}

module.exports = SettingsService;
