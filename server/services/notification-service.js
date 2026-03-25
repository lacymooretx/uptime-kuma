const { R } = require("redbean-node");
const { Notification } = require("../notification");

class NotificationService {

    /**
     * Get all notifications for a user
     * @param {number} userID User ID
     * @returns {Promise<object[]>} List of notification objects
     */
    static async list(userID) {
        let result = [];
        let list = await R.find("notification", " user_id = ? ", [userID]);

        for (let bean of list) {
            let obj = bean.export();
            obj.isDefault = !!obj.isDefault;
            obj.active = !!obj.active;
            result.push(obj);
        }
        return result;
    }

    /**
     * Add or edit a notification
     * @param {object} notification Notification config object
     * @param {number|null} notificationID Existing ID to update, or null for new
     * @param {number} userID User ID
     * @returns {Promise<object>} The saved notification bean
     */
    static async save(notification, notificationID, userID) {
        return await Notification.save(notification, notificationID, userID);
    }

    /**
     * Delete a notification
     * @param {number} notificationID Notification ID
     * @param {number} userID User ID
     * @returns {Promise<void>}
     */
    static async delete(notificationID, userID) {
        await Notification.delete(notificationID, userID);
    }

    /**
     * Test a notification
     * @param {object} notification Notification config
     * @returns {Promise<string>} Result message
     */
    static async test(notification) {
        return await Notification.send(notification, notification.name + " Testing");
    }

    /**
     * Check if Apprise is available
     * @returns {Promise<boolean>}
     */
    static async checkApprise() {
        return await Notification.checkApprise();
    }
}

module.exports = NotificationService;
