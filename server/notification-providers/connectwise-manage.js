const NotificationProvider = require("./notification-provider");
const axios = require("axios");
const { DOWN, UP } = require("../../src/util");
const { log } = require("../../src/util");
const { R } = require("redbean-node");

class ConnectWiseManage extends NotificationProvider {
    name = "ConnectWiseManage";

    /**
     * Build auth headers for CW Manage API
     * @param {object} notification Notification config (connection creds)
     * @returns {object} Headers object
     */
    static buildHeaders(notification) {
        const authString = `${notification.cwCompanyId}+${notification.cwPublicKey}:${notification.cwPrivateKey}`;
        const encoded = Buffer.from(authString).toString("base64");
        return {
            "Authorization": `Basic ${encoded}`,
            "clientId": notification.cwClientId,
            "Content-Type": "application/json",
            "Accept": "application/json",
        };
    }

    /**
     * Build CW Manage API base URL
     * @param {object} notification Notification config
     * @returns {string} Base URL
     */
    static buildBaseUrl(notification) {
        let url = notification.cwApiUrl || "";
        return url.replace(/\/+$/, "");
    }

    /**
     * Get per-monitor CW config
     * @param {object} monitorJSON Monitor details
     * @returns {object} CW config for this monitor
     */
    static getMonitorCwConfig(monitorJSON) {
        if (!monitorJSON) {
            return {};
        }
        if (typeof monitorJSON.cwConfig === "string") {
            try {
                return JSON.parse(monitorJSON.cwConfig);
            } catch (e) {
                return {};
            }
        }
        return monitorJSON.cwConfig || {};
    }

    /**
     * Store the active ticket ID in the monitor's cw_config
     * @param {number} monitorId Monitor ID
     * @param {object} cwConfig Current CW config
     * @param {number|null} ticketId Ticket ID to store, or null to clear
     * @returns {Promise<void>}
     */
    static async storeActiveTicketId(monitorId, cwConfig, ticketId) {
        const updated = { ...cwConfig, activeTicketId: ticketId };
        await R.exec("UPDATE monitor SET cw_config = ? WHERE id = ?", [JSON.stringify(updated), monitorId]);
    }

    /**
     * @inheritdoc
     */
    async send(notification, msg, monitorJSON = null, heartbeatJSON = null) {
        const okMsg = "Sent Successfully.";
        const baseUrl = ConnectWiseManage.buildBaseUrl(notification);
        const headers = ConnectWiseManage.buildHeaders(notification);
        const axiosConfig = this.getAxiosConfigWithProxy({ headers });
        const cwConfig = ConnectWiseManage.getMonitorCwConfig(monitorJSON);

        // Test notification — just verify the connection
        if (!heartbeatJSON) {
            const resp = await axios.get(`${baseUrl}/system/info`, axiosConfig);
            return `Connection OK (${resp.data?.companyName || "Connected"})`;
        }

        try {
            if (heartbeatJSON.status === DOWN) {
                if (!cwConfig.boardId || !cwConfig.downStatusId) {
                    log.warn("connectwise", `Monitor ${monitorJSON?.name} has no CW board/status configured, skipping`);
                    return okMsg;
                }

                const ticket = {
                    summary: `[Uptime Kuma] ${monitorJSON ? monitorJSON.name : "Monitor"} is DOWN`,
                    board: { id: parseInt(cwConfig.boardId) },
                    status: { id: parseInt(cwConfig.downStatusId) },
                    initialDescription: msg,
                };

                if (cwConfig.typeId) {
                    ticket.type = { id: parseInt(cwConfig.typeId) };
                }
                if (cwConfig.subTypeId) {
                    ticket.subType = { id: parseInt(cwConfig.subTypeId) };
                }
                if (cwConfig.itemId) {
                    ticket.item = { id: parseInt(cwConfig.itemId) };
                }
                if (cwConfig.memberId) {
                    ticket.owner = { identifier: cwConfig.memberId };
                }

                const resp = await axios.post(`${baseUrl}/service/tickets`, ticket, axiosConfig);
                const ticketId = resp.data.id;
                log.info("connectwise", `Created ticket #${ticketId} for monitor ${monitorJSON?.name}`);

                // Store ticket ID on the monitor for later UP resolution
                if (monitorJSON?.id) {
                    await ConnectWiseManage.storeActiveTicketId(monitorJSON.id, cwConfig, ticketId);
                }

                return okMsg;

            } else if (heartbeatJSON.status === UP) {
                if (!cwConfig.upStatusId) {
                    log.warn("connectwise", `Monitor ${monitorJSON?.name} has no CW UP status configured, skipping`);
                    return okMsg;
                }

                const activeTicketId = cwConfig.activeTicketId;
                if (!activeTicketId) {
                    log.info("connectwise", `No active ticket for monitor ${monitorJSON?.name}, skipping UP update`);
                    return okMsg;
                }

                // Update the ticket status
                const patchOps = [
                    { op: "replace", path: "status", value: { id: parseInt(cwConfig.upStatusId) } },
                ];
                await axios.patch(`${baseUrl}/service/tickets/${activeTicketId}`, patchOps, axiosConfig);
                log.info("connectwise", `Updated ticket #${activeTicketId} to UP status for monitor ${monitorJSON?.name}`);

                // Clear the stored ticket ID
                if (monitorJSON?.id) {
                    await ConnectWiseManage.storeActiveTicketId(monitorJSON.id, cwConfig, null);
                }

                return okMsg;
            }

            return okMsg;
        } catch (error) {
            this.throwGeneralAxiosError(error);
        }
    }
}

module.exports = ConnectWiseManage;
