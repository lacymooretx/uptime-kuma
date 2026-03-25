const { R } = require("redbean-node");
const { log } = require("../../src/util");
const apicache = require("../modules/apicache");
const { UptimeKumaServer } = require("../uptime-kuma-server");
const Maintenance = require("../model/maintenance");

class MaintenanceService {

    /**
     * Add a new maintenance
     * @param {object} maintenance Maintenance config
     * @param {number} userID User ID
     * @returns {Promise<number>} New maintenance ID
     */
    static async add(maintenance, userID) {
        const server = UptimeKumaServer.getInstance();

        let bean = await Maintenance.jsonToBean(R.dispense("maintenance"), maintenance);
        bean.user_id = userID;
        let maintenanceID = await R.store(bean);

        server.maintenanceList[maintenanceID] = bean;
        await bean.run(true);

        return maintenanceID;
    }

    /**
     * Edit an existing maintenance
     * @param {object} maintenance Maintenance config with id
     * @param {number} userID User ID
     * @returns {Promise<number>} Maintenance ID
     * @throws {Error} If not found or permission denied
     */
    static async edit(maintenance, userID) {
        const server = UptimeKumaServer.getInstance();

        let bean = server.getMaintenance(maintenance.id);

        if (bean.user_id !== userID) {
            throw new Error("Permission denied.");
        }

        await Maintenance.jsonToBean(bean, maintenance);
        await R.store(bean);
        await bean.run(true);

        return bean.id;
    }

    /**
     * Get a single maintenance
     * @param {number} maintenanceID Maintenance ID
     * @param {number} userID User ID
     * @returns {Promise<object>} Maintenance JSON
     */
    static async get(maintenanceID, userID) {
        let bean = await R.findOne("maintenance", " id = ? AND user_id = ? ", [maintenanceID, userID]);
        if (!bean) {
            throw new Error("Maintenance not found");
        }
        return await bean.toJSON();
    }

    /**
     * Get list of maintenances for a user
     * @param {number} userID User ID
     * @returns {Promise<object>} Map of maintenance ID to JSON
     */
    static async list(userID) {
        const list = await R.find("maintenance", " user_id = ? ORDER BY end_date DESC, title", [userID]);
        const result = {};
        for (const bean of list) {
            result[bean.id] = await bean.toJSON();
        }
        return result;
    }

    /**
     * Delete a maintenance
     * @param {number} maintenanceID Maintenance ID
     * @param {number} userID User ID
     * @returns {Promise<void>}
     */
    static async delete(maintenanceID, userID) {
        const server = UptimeKumaServer.getInstance();

        if (maintenanceID in server.maintenanceList) {
            server.maintenanceList[maintenanceID].stop();
            delete server.maintenanceList[maintenanceID];
        }

        await R.exec("DELETE FROM maintenance WHERE id = ? AND user_id = ? ", [maintenanceID, userID]);
        apicache.clear();
    }

    /**
     * Pause a maintenance
     * @param {number} maintenanceID Maintenance ID
     * @returns {Promise<void>}
     */
    static async pause(maintenanceID) {
        const server = UptimeKumaServer.getInstance();
        let maintenance = server.getMaintenance(maintenanceID);

        if (!maintenance) {
            throw new Error("Maintenance not found");
        }

        maintenance.active = false;
        await R.store(maintenance);
        maintenance.stop();
        apicache.clear();
    }

    /**
     * Resume a maintenance
     * @param {number} maintenanceID Maintenance ID
     * @returns {Promise<void>}
     */
    static async resume(maintenanceID) {
        const server = UptimeKumaServer.getInstance();
        let maintenance = server.getMaintenance(maintenanceID);

        if (!maintenance) {
            throw new Error("Maintenance not found");
        }

        maintenance.active = true;
        await R.store(maintenance);
        await maintenance.run();
        apicache.clear();
    }

    /**
     * Set monitors for a maintenance
     * @param {number} maintenanceID Maintenance ID
     * @param {object[]} monitors List of {id} objects
     * @returns {Promise<void>}
     */
    static async setMonitors(maintenanceID, monitors) {
        await R.exec("DELETE FROM monitor_maintenance WHERE maintenance_id = ?", [maintenanceID]);

        for (const monitor of monitors) {
            let bean = R.dispense("monitor_maintenance");
            bean.import({
                monitor_id: monitor.id,
                maintenance_id: maintenanceID,
            });
            await R.store(bean);
        }

        apicache.clear();
    }

    /**
     * Get monitors for a maintenance
     * @param {number} maintenanceID Maintenance ID
     * @returns {Promise<object[]>} List of {id} objects
     */
    static async getMonitors(maintenanceID) {
        return await R.getAll(
            "SELECT monitor.id FROM monitor_maintenance mm JOIN monitor ON mm.monitor_id = monitor.id WHERE mm.maintenance_id = ? ",
            [maintenanceID]
        );
    }

    /**
     * Set status pages for a maintenance
     * @param {number} maintenanceID Maintenance ID
     * @param {object[]} statusPages List of {id} objects
     * @returns {Promise<void>}
     */
    static async setStatusPages(maintenanceID, statusPages) {
        await R.exec("DELETE FROM maintenance_status_page WHERE maintenance_id = ?", [maintenanceID]);

        for (const statusPage of statusPages) {
            let bean = R.dispense("maintenance_status_page");
            bean.import({
                status_page_id: statusPage.id,
                maintenance_id: maintenanceID,
            });
            await R.store(bean);
        }

        apicache.clear();
    }

    /**
     * Get status pages for a maintenance
     * @param {number} maintenanceID Maintenance ID
     * @returns {Promise<object[]>} List of {id, title} objects
     */
    static async getStatusPages(maintenanceID) {
        return await R.getAll(
            "SELECT status_page.id, status_page.title FROM maintenance_status_page msp JOIN status_page ON msp.status_page_id = status_page.id WHERE msp.maintenance_id = ? ",
            [maintenanceID]
        );
    }
}

module.exports = MaintenanceService;
