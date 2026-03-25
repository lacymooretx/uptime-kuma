const { R } = require("redbean-node");
const { log } = require("../../src/util");
const apicache = require("../modules/apicache");
const ImageDataURI = require("../image-data-uri");
const Database = require("../database");
const StatusPage = require("../model/status_page");
const { UptimeKumaServer } = require("../uptime-kuma-server");
const { Settings } = require("../settings");

/**
 * Check slug a-z, 0-9, - only
 * @param {string} slug Slug to test
 * @returns {void}
 * @throws {Error} If slug is invalid
 */
function checkSlug(slug) {
    if (typeof slug !== "string") {
        throw new Error("Slug must be string");
    }
    slug = slug.trim();
    if (!slug) {
        throw new Error("Slug cannot be empty");
    }
    if (!slug.match(/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/)) {
        throw new Error("Invalid Slug");
    }
}

class StatusPageService {

    /**
     * Add a new status page
     * @param {string} title Title
     * @param {string} slug URL slug
     * @returns {Promise<string>} Created slug
     */
    static async add(title, slug) {
        title = title?.trim();
        slug = slug?.trim();

        if (!title || !slug) {
            throw new Error("Please input all fields");
        }

        if (typeof slug !== "string") {
            throw new Error("Slug -Accept string only");
        }

        slug = slug.toLowerCase();
        checkSlug(slug);

        let statusPage = R.dispense("status_page");
        statusPage.slug = slug;
        statusPage.title = title;
        statusPage.theme = "auto";
        statusPage.icon = "";
        statusPage.autoRefreshInterval = 300;
        await R.store(statusPage);

        return slug;
    }

    /**
     * Get a status page by slug
     * @param {string} slug Status page slug
     * @returns {Promise<object>} Status page config JSON
     */
    static async get(slug) {
        let statusPage = await R.findOne("status_page", " slug = ? ", [slug]);
        if (!statusPage) {
            throw new Error("Status page not found");
        }
        return await statusPage.toJSON();
    }

    /**
     * Get list of all status pages
     * @returns {Promise<object[]>} List of status page objects
     */
    static async list() {
        let list = await R.findAll("status_page", " ORDER BY title ");
        return list.map((bean) => bean.toJSON());
    }

    /**
     * Save/update a status page
     * @param {string} slug Current slug
     * @param {object} config Status page config
     * @param {string} imgDataUrl Logo image data URL or URL
     * @param {object[]} publicGroupList Public group list config
     * @returns {Promise<object[]>} Updated public group list
     */
    static async save(slug, config, imgDataUrl, publicGroupList) {
        const server = UptimeKumaServer.getInstance();

        let statusPage = await R.findOne("status_page", " slug = ? ", [slug]);
        if (!statusPage) {
            throw new Error("No slug?");
        }

        checkSlug(config.slug);

        const header = "data:image/png;base64,";

        if (imgDataUrl.startsWith("data:")) {
            if (!imgDataUrl.startsWith(header)) {
                throw new Error("Only allowed PNG logo.");
            }
            const filename = `logo${statusPage.id}.png`;
            await ImageDataURI.outputFile(imgDataUrl, Database.uploadDir + filename);
            config.logo = `/upload/${filename}?t=` + Date.now();
        } else {
            config.logo = imgDataUrl;
        }

        statusPage.slug = config.slug;
        statusPage.title = config.title;
        statusPage.description = config.description;
        statusPage.icon = config.logo;
        statusPage.autoRefreshInterval = config.autoRefreshInterval;
        statusPage.theme = config.theme;
        statusPage.show_tags = config.showTags;
        statusPage.footer_text = config.footerText;
        statusPage.custom_css = config.customCSS;
        statusPage.show_powered_by = config.showPoweredBy;
        statusPage.rss_title = config.rssTitle;
        statusPage.show_only_last_heartbeat = config.showOnlyLastHeartbeat;
        statusPage.show_certificate_expiry = config.showCertificateExpiry;
        statusPage.modified_date = R.isoDateTime();
        statusPage.analytics_id = config.analyticsId;
        statusPage.analytics_script_url = config.analyticsScriptUrl;
        const validAnalyticsTypes = ["google", "umami", "plausible", "matomo"];
        if (config.analyticsType !== null && !validAnalyticsTypes.includes(config.analyticsType)) {
            throw new Error("Invalid analytics type");
        }
        statusPage.analytics_type = config.analyticsType;

        await R.store(statusPage);

        await statusPage.updateDomainNameList(config.domainNameList);
        await StatusPage.loadDomainMappingList();

        // Save Public Group List
        const groupIDList = [];
        let groupOrder = 1;

        for (let group of publicGroupList) {
            let groupBean;
            if (group.id) {
                groupBean = await R.findOne("group", " id = ? AND public = 1 AND status_page_id = ? ", [
                    group.id,
                    statusPage.id,
                ]);
            } else {
                groupBean = R.dispense("group");
            }

            groupBean.status_page_id = statusPage.id;
            groupBean.name = group.name;
            groupBean.public = true;
            groupBean.weight = groupOrder++;

            await R.store(groupBean);

            await R.exec("DELETE FROM monitor_group WHERE group_id = ? ", [groupBean.id]);

            let monitorOrder = 1;

            for (let monitor of group.monitorList) {
                let relationBean = R.dispense("monitor_group");
                relationBean.weight = monitorOrder++;
                relationBean.group_id = groupBean.id;
                relationBean.monitor_id = monitor.id;

                if (monitor.sendUrl !== undefined) {
                    relationBean.send_url = monitor.sendUrl;
                }

                if (monitor.url !== undefined) {
                    relationBean.custom_url = monitor.url;
                }

                await R.store(relationBean);
            }

            groupIDList.push(groupBean.id);
            group.id = groupBean.id;
        }

        // Delete groups that are not in the list
        if (groupIDList.length === 0) {
            await R.exec("DELETE FROM \"group\" WHERE status_page_id = ?", [statusPage.id]);
        } else {
            const slots = groupIDList.map(() => "?").join(",");
            const data = [...groupIDList, statusPage.id];
            await R.exec(`DELETE FROM "group" WHERE id NOT IN (${slots}) AND status_page_id = ?`, data);
        }

        // Also change entry page to new slug if slug changed
        if (server.entryPage === "statusPage-" + slug && statusPage.slug !== slug) {
            server.entryPage = "statusPage-" + statusPage.slug;
            await Settings.set("entryPage", server.entryPage, "general");
        }

        apicache.clear();

        return publicGroupList;
    }

    /**
     * Delete a status page
     * @param {string} slug Status page slug
     * @returns {Promise<void>}
     */
    static async delete(slug) {
        const server = UptimeKumaServer.getInstance();

        let statusPageID = await StatusPage.slugToID(slug);

        if (statusPageID) {
            if (server.entryPage === "statusPage-" + slug) {
                server.entryPage = "dashboard";
                await Settings.set("entryPage", server.entryPage, "general");
            }

            await R.exec("DELETE FROM incident WHERE status_page_id = ? ", [statusPageID]);
            await R.exec("DELETE FROM \"group\" WHERE status_page_id = ? ", [statusPageID]);
            await R.exec("DELETE FROM status_page WHERE id = ? ", [statusPageID]);
            apicache.clear();
        } else {
            throw new Error("Status Page is not found");
        }
    }
}

module.exports = StatusPageService;
