const { R } = require("redbean-node");
const dayjs = require("dayjs");
const StatusPage = require("../model/status_page");

/**
 * Validates incident data
 * @param {object} incident The incident object
 * @returns {void}
 * @throws {Error} If validation fails
 */
function validateIncident(incident) {
    if (!incident.title || incident.title.trim() === "") {
        throw new Error("Please input title");
    }
    if (!incident.content || incident.content.trim() === "") {
        throw new Error("Please input content");
    }
}

class IncidentService {

    /**
     * Post (create/update) an incident
     * @param {string} slug Status page slug
     * @param {object} incident Incident data
     * @returns {Promise<object>} Incident public JSON
     */
    static async post(slug, incident) {
        let statusPageID = await StatusPage.slugToID(slug);
        if (!statusPageID) {
            throw new Error("slug is not found");
        }

        let incidentBean;

        if (incident.id) {
            incidentBean = await R.findOne("incident", " id = ? AND status_page_id = ? ", [
                incident.id,
                statusPageID,
            ]);
        }

        if (incidentBean == null) {
            incidentBean = R.dispense("incident");
        }

        incidentBean.title = incident.title;
        incidentBean.content = incident.content;
        incidentBean.style = incident.style;
        incidentBean.pin = true;
        incidentBean.active = true;
        incidentBean.status_page_id = statusPageID;

        if (incident.id) {
            incidentBean.last_updated_date = R.isoDateTime(dayjs.utc());
        } else {
            incidentBean.created_date = R.isoDateTime(dayjs.utc());
        }

        await R.store(incidentBean);

        return incidentBean.toPublicJSON();
    }

    /**
     * Edit an incident
     * @param {string} slug Status page slug
     * @param {number} incidentID Incident ID
     * @param {object} incident Updated incident data
     * @returns {Promise<object>} Updated incident public JSON
     */
    static async edit(slug, incidentID, incident) {
        let statusPageID = await StatusPage.slugToID(slug);
        if (!statusPageID) {
            throw new Error("slug is not found");
        }

        let bean = await R.findOne("incident", " id = ? AND status_page_id = ? ", [incidentID, statusPageID]);
        if (!bean) {
            throw new Error("Incident not found or access denied");
        }

        validateIncident(incident);

        const validStyles = ["info", "warning", "danger", "primary", "light", "dark"];
        if (!validStyles.includes(incident.style)) {
            incident.style = "warning";
        }

        bean.title = incident.title;
        bean.content = incident.content;
        bean.style = incident.style;
        bean.pin = incident.pin !== false;
        bean.lastUpdatedDate = R.isoDateTime(dayjs.utc());

        await R.store(bean);

        return bean.toPublicJSON();
    }

    /**
     * Delete an incident
     * @param {string} slug Status page slug
     * @param {number} incidentID Incident ID
     * @returns {Promise<void>}
     */
    static async delete(slug, incidentID) {
        let statusPageID = await StatusPage.slugToID(slug);
        if (!statusPageID) {
            throw new Error("slug is not found");
        }

        let bean = await R.findOne("incident", " id = ? AND status_page_id = ? ", [incidentID, statusPageID]);
        if (!bean) {
            throw new Error("Incident not found or access denied");
        }

        await R.trash(bean);
    }

    /**
     * Resolve an incident
     * @param {string} slug Status page slug
     * @param {number} incidentID Incident ID
     * @returns {Promise<object>} Resolved incident public JSON
     */
    static async resolve(slug, incidentID) {
        let statusPageID = await StatusPage.slugToID(slug);
        if (!statusPageID) {
            throw new Error("slug is not found");
        }

        let bean = await R.findOne("incident", " id = ? AND status_page_id = ? ", [incidentID, statusPageID]);
        if (!bean) {
            throw new Error("Incident not found or access denied");
        }

        await bean.resolve();

        return bean.toPublicJSON();
    }

    /**
     * Unpin all incidents for a status page
     * @param {string} slug Status page slug
     * @returns {Promise<void>}
     */
    static async unpin(slug) {
        let statusPageID = await StatusPage.slugToID(slug);
        if (!statusPageID) {
            throw new Error("slug is not found");
        }

        await R.exec("UPDATE incident SET pin = 0 WHERE pin = 1 AND status_page_id = ? ", [statusPageID]);
    }

    /**
     * Get incident history for a status page
     * @param {string} slug Status page slug
     * @param {string|null} cursor Pagination cursor
     * @param {boolean} isPublic Whether the caller is public (no auth)
     * @returns {Promise<object>} Incident history with pagination
     */
    static async getHistory(slug, cursor, isPublic) {
        let statusPageID = await StatusPage.slugToID(slug);
        if (!statusPageID) {
            throw new Error("slug is not found");
        }

        return await StatusPage.getIncidentHistory(statusPageID, cursor, isPublic);
    }
}

module.exports = IncidentService;
