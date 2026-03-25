const { R } = require("redbean-node");
const { log } = require("../../src/util");
const { UptimeKumaServer } = require("../uptime-kuma-server");
const Monitor = require("../model/monitor");
const { UptimeCalculator } = require("../uptime-calculator");
const Database = require("../database");
const apicache = require("../modules/apicache");

class MonitorService {

    /**
     * Check if a given user owns a specific monitor
     * @param {number} userID User ID
     * @param {number} monitorID Monitor ID
     * @returns {Promise<void>}
     * @throws {Error} If user does not own monitor
     */
    static async checkOwner(userID, monitorID) {
        let row = await R.getRow("SELECT id FROM monitor WHERE id = ? AND user_id = ? ", [monitorID, userID]);
        if (!row) {
            throw new Error("You do not own this monitor.");
        }
    }

    /**
     * Update monitor-notification associations
     * @param {number} monitorID Monitor ID
     * @param {object} notificationIDList Notification ID map
     * @returns {Promise<void>}
     */
    static async updateMonitorNotification(monitorID, notificationIDList) {
        await R.exec("DELETE FROM monitor_notification WHERE monitor_id = ? ", [monitorID]);

        for (let notificationID in notificationIDList) {
            if (notificationIDList[notificationID]) {
                let relation = R.dispense("monitor_notification");
                relation.monitor_id = monitorID;
                relation.notification_id = notificationID;
                await R.store(relation);
            }
        }
    }

    /**
     * Add a new monitor
     * @param {object} monitor Monitor config
     * @param {number} userID User ID
     * @returns {Promise<number>} New monitor ID
     */
    static async add(monitor, userID) {
        const server = UptimeKumaServer.getInstance();
        const io = server.io;

        let bean = R.dispense("monitor");

        let notificationIDList = monitor.notificationIDList;
        delete monitor.notificationIDList;

        // Ensure status code ranges are strings
        if (!monitor.accepted_statuscodes.every((code) => typeof code === "string")) {
            throw new Error("Accepted status codes are not all strings");
        }
        monitor.accepted_statuscodes_json = JSON.stringify(monitor.accepted_statuscodes);
        delete monitor.accepted_statuscodes;

        monitor.kafkaProducerBrokers = JSON.stringify(monitor.kafkaProducerBrokers || []);
        monitor.kafkaProducerSaslOptions = JSON.stringify(monitor.kafkaProducerSaslOptions || {});
        monitor.conditions = JSON.stringify(monitor.conditions || []);
        monitor.rabbitmqNodes = JSON.stringify(monitor.rabbitmqNodes || []);

        // ConnectWise Manage per-monitor config
        if (monitor.cwConfig !== undefined) {
            monitor.cw_config = typeof monitor.cwConfig === "string" ? monitor.cwConfig : JSON.stringify(monitor.cwConfig || null);
            delete monitor.cwConfig;
        }

        const frontendOnlyProperties = [
            "humanReadableInterval",
            "globalpingdnsresolvetypeoptions",
            "responsecheck",
        ];
        for (const prop of frontendOnlyProperties) {
            if (prop in monitor) {
                delete monitor[prop];
            }
        }

        bean.import(monitor);
        if (monitor.retryOnlyOnStatusCodeFailure !== undefined) {
            bean.retry_only_on_status_code_failure = monitor.retryOnlyOnStatusCodeFailure;
        }
        bean.user_id = userID;

        bean.validate();

        await R.store(bean);

        await MonitorService.updateMonitorNotification(bean.id, notificationIDList);

        if (monitor.active !== false) {
            await MonitorService.startMonitor(userID, bean.id);
        }

        log.info("monitor", `Added Monitor: ${bean.id} User ID: ${userID}`);

        return bean.id;
    }

    /**
     * Edit an existing monitor
     * @param {object} monitor Monitor config with id
     * @param {number} userID User ID
     * @returns {Promise<number>} Monitor ID
     */
    static async edit(monitor, userID) {
        const server = UptimeKumaServer.getInstance();
        const io = server.io;

        let removeGroupChildren = false;
        let bean = await R.findOne("monitor", " id = ? ", [monitor.id]);

        if (bean.user_id !== userID) {
            throw new Error("Permission denied.");
        }

        // Check if Parent is Descendant (would cause endless loop)
        if (monitor.parent !== null) {
            const childIDs = await Monitor.getAllChildrenIDs(monitor.id);
            if (childIDs.includes(monitor.parent)) {
                throw new Error("Invalid Monitor Group");
            }
        }

        // Remove children if monitor type has changed (from group to non-group)
        if (bean.type === "group" && monitor.type !== bean.type) {
            removeGroupChildren = true;
        }

        // Ensure status code ranges are strings
        if (!monitor.accepted_statuscodes.every((code) => typeof code === "string")) {
            throw new Error("Accepted status codes are not all strings");
        }

        bean.name = monitor.name;
        bean.description = monitor.description;
        bean.parent = monitor.parent;
        bean.type = monitor.type;
        bean.subtype = monitor.subtype;
        bean.url = monitor.url;
        bean.wsIgnoreSecWebsocketAcceptHeader = monitor.wsIgnoreSecWebsocketAcceptHeader;
        bean.wsSubprotocol = monitor.wsSubprotocol;
        bean.method = monitor.method;
        bean.body = monitor.body;
        bean.ipFamily = monitor.ipFamily;
        bean.headers = monitor.headers;
        bean.basic_auth_user = monitor.basic_auth_user;
        bean.basic_auth_pass = monitor.basic_auth_pass;
        bean.timeout = monitor.timeout;
        bean.oauth_client_id = monitor.oauth_client_id;
        bean.oauth_client_secret = monitor.oauth_client_secret;
        bean.oauth_auth_method = monitor.oauth_auth_method;
        bean.oauth_token_url = monitor.oauth_token_url;
        bean.oauth_scopes = monitor.oauth_scopes;
        bean.oauth_audience = monitor.oauth_audience;
        bean.tlsCa = monitor.tlsCa;
        bean.tlsCert = monitor.tlsCert;
        bean.tlsKey = monitor.tlsKey;
        bean.interval = monitor.interval;
        bean.retryInterval = monitor.retryInterval;
        bean.resendInterval = monitor.resendInterval;
        bean.hostname = monitor.hostname;
        bean.game = monitor.game;
        bean.maxretries = monitor.maxretries;
        bean.port = parseInt(monitor.port);
        bean.location = monitor.location;
        bean.protocol = monitor.protocol;

        if (isNaN(bean.port)) {
            bean.port = null;
        }

        bean.keyword = monitor.keyword;
        bean.invertKeyword = monitor.invertKeyword;
        bean.ignoreTls = monitor.ignoreTls;
        bean.expiryNotification = monitor.expiryNotification;
        bean.domainExpiryNotification = monitor.domainExpiryNotification;
        bean.upsideDown = monitor.upsideDown;
        bean.packetSize = monitor.packetSize;
        bean.maxredirects = monitor.maxredirects;
        bean.accepted_statuscodes_json = JSON.stringify(monitor.accepted_statuscodes);
        bean.save_response = monitor.saveResponse;
        bean.save_error_response = monitor.saveErrorResponse;
        bean.response_max_length = monitor.responseMaxLength;
        bean.dns_resolve_type = monitor.dns_resolve_type;
        bean.dns_resolve_server = monitor.dns_resolve_server;
        bean.pushToken = monitor.pushToken;
        bean.docker_container = monitor.docker_container;
        bean.docker_host = monitor.docker_host;
        bean.proxyId = Number.isInteger(monitor.proxyId) ? monitor.proxyId : null;
        bean.mqttUsername = monitor.mqttUsername;
        bean.mqttPassword = monitor.mqttPassword;
        bean.mqttTopic = monitor.mqttTopic;
        bean.mqttSuccessMessage = monitor.mqttSuccessMessage;
        bean.mqttCheckType = monitor.mqttCheckType;
        bean.mqttWebsocketPath = monitor.mqttWebsocketPath;
        bean.databaseConnectionString = monitor.databaseConnectionString;
        bean.databaseQuery = monitor.databaseQuery;
        bean.authMethod = monitor.authMethod;
        bean.authWorkstation = monitor.authWorkstation;
        bean.authDomain = monitor.authDomain;
        bean.grpcUrl = monitor.grpcUrl;
        bean.grpcProtobuf = monitor.grpcProtobuf;
        bean.grpcServiceName = monitor.grpcServiceName;
        bean.grpcMethod = monitor.grpcMethod;
        bean.grpcBody = monitor.grpcBody;
        bean.grpcMetadata = monitor.grpcMetadata;
        bean.grpcEnableTls = monitor.grpcEnableTls;
        bean.radiusUsername = monitor.radiusUsername;
        bean.radiusPassword = monitor.radiusPassword;
        bean.radiusCalledStationId = monitor.radiusCalledStationId;
        bean.radiusCallingStationId = monitor.radiusCallingStationId;
        bean.radiusSecret = monitor.radiusSecret;
        bean.httpBodyEncoding = monitor.httpBodyEncoding;
        bean.expectedValue = monitor.expectedValue;
        bean.jsonPath = monitor.jsonPath;
        bean.kafkaProducerTopic = monitor.kafkaProducerTopic;
        bean.kafkaProducerBrokers = JSON.stringify(monitor.kafkaProducerBrokers || []);
        bean.kafkaProducerAllowAutoTopicCreation = monitor.kafkaProducerAllowAutoTopicCreation;
        bean.kafkaProducerSaslOptions = JSON.stringify(monitor.kafkaProducerSaslOptions || {});
        bean.kafkaProducerMessage = monitor.kafkaProducerMessage;
        bean.cacheBust = monitor.cacheBust;
        bean.kafkaProducerSsl = monitor.kafkaProducerSsl;
        bean.kafkaProducerAllowAutoTopicCreation = monitor.kafkaProducerAllowAutoTopicCreation;
        bean.gamedigGivenPortOnly = monitor.gamedigGivenPortOnly;
        bean.remote_browser = monitor.remote_browser;
        bean.smtpSecurity = monitor.smtpSecurity;
        bean.snmpVersion = monitor.snmpVersion;
        bean.snmpOid = monitor.snmpOid;
        bean.jsonPathOperator = monitor.jsonPathOperator;
        bean.retry_only_on_status_code_failure = Boolean(monitor.retryOnlyOnStatusCodeFailure);
        bean.timeout = monitor.timeout;
        bean.rabbitmqNodes = JSON.stringify(monitor.rabbitmqNodes || []);
        bean.rabbitmqUsername = monitor.rabbitmqUsername;
        bean.rabbitmqPassword = monitor.rabbitmqPassword;
        bean.conditions = JSON.stringify(monitor.conditions || []);
        bean.manual_status = monitor.manual_status;
        bean.system_service_name = monitor.system_service_name;
        bean.expected_tls_alert = monitor.expectedTlsAlert;

        // ping advanced options
        bean.ping_numeric = monitor.ping_numeric;
        bean.ping_count = monitor.ping_count;
        bean.ping_per_request_timeout = monitor.ping_per_request_timeout;

        // ConnectWise Manage per-monitor config
        if (monitor.cwConfig !== undefined) {
            bean.cw_config = typeof monitor.cwConfig === "string" ? monitor.cwConfig : JSON.stringify(monitor.cwConfig || null);
        } else if (monitor.cw_config !== undefined) {
            bean.cw_config = monitor.cw_config;
        }

        bean.validate();

        await R.store(bean);

        if (removeGroupChildren) {
            await Monitor.unlinkAllChildren(monitor.id);
        }

        await MonitorService.updateMonitorNotification(bean.id, monitor.notificationIDList);

        if (await Monitor.isActive(bean.id, bean.active)) {
            await MonitorService.restartMonitor(userID, bean.id);
        }

        return bean.id;
    }

    /**
     * Get a single monitor
     * @param {number} monitorID Monitor ID
     * @param {number} userID User ID
     * @returns {Promise<object>} Monitor JSON with preload data
     */
    static async get(monitorID, userID) {
        let monitor = await R.findOne("monitor", " id = ? AND user_id = ? ", [monitorID, userID]);
        if (!monitor) {
            throw new Error("Monitor not found");
        }
        const monitorData = [{ id: monitor.id, active: monitor.active }];
        const preloadData = await Monitor.preparePreloadData(monitorData);
        return monitor.toJSON(preloadData);
    }

    /**
     * Get all monitors for a user
     * @param {number} userID User ID
     * @returns {Promise<object>} Map of monitor ID to JSON
     */
    static async list(userID) {
        const server = UptimeKumaServer.getInstance();
        return await server.getMonitorJSONList(userID);
    }

    /**
     * Delete a monitor
     * @param {number} monitorID Monitor ID
     * @param {number} userID User ID
     * @param {boolean} deleteChildren Whether to delete child monitors
     * @returns {Promise<{deletedChildren: number[]}>} Info about deleted children
     */
    static async delete(monitorID, userID, deleteChildren = false) {
        const server = UptimeKumaServer.getInstance();
        const deletedChildIDs = [];

        const monitor = await R.findOne("monitor", " id = ? AND user_id = ? ", [monitorID, userID]);
        if (!monitor) {
            throw new Error("Monitor not found");
        }

        if (monitor.type === "group") {
            const children = await Monitor.getChildren(monitorID);

            if (deleteChildren) {
                if (children && children.length > 0) {
                    for (const child of children) {
                        await Monitor.deleteMonitorRecursively(child.id, userID);
                        deletedChildIDs.push(child.id);
                    }
                }
            } else {
                await Monitor.unlinkAllChildren(monitorID);
            }
        }

        await Monitor.deleteMonitor(monitorID, userID);
        apicache.clear();

        return { deletedChildIDs };
    }

    /**
     * Start/resume a monitor
     * @param {number} userID User ID
     * @param {number} monitorID Monitor ID
     * @returns {Promise<void>}
     */
    static async startMonitor(userID, monitorID) {
        const server = UptimeKumaServer.getInstance();
        const io = server.io;

        await MonitorService.checkOwner(userID, monitorID);

        log.info("manage", `Resume Monitor: ${monitorID} User ID: ${userID}`);

        await R.exec("UPDATE monitor SET active = true WHERE id = ? AND user_id = ? ", [monitorID, userID]);

        let monitor = await R.findOne("monitor", " id = ? ", [monitorID]);

        if (monitor.id in server.monitorList) {
            await server.monitorList[monitor.id].stop();
        }

        server.monitorList[monitor.id] = monitor;
        await monitor.start(io);
    }

    /**
     * Restart a monitor (alias for startMonitor)
     * @param {number} userID User ID
     * @param {number} monitorID Monitor ID
     * @returns {Promise<void>}
     */
    static async restartMonitor(userID, monitorID) {
        return await MonitorService.startMonitor(userID, monitorID);
    }

    /**
     * Pause a monitor
     * @param {number} userID User ID
     * @param {number} monitorID Monitor ID
     * @returns {Promise<void>}
     */
    static async pauseMonitor(userID, monitorID) {
        const server = UptimeKumaServer.getInstance();

        await MonitorService.checkOwner(userID, monitorID);

        log.info("manage", `Pause Monitor: ${monitorID} User ID: ${userID}`);

        await R.exec("UPDATE monitor SET active = false WHERE id = ? AND user_id = ? ", [monitorID, userID]);

        if (monitorID in server.monitorList) {
            await server.monitorList[monitorID].stop();
            server.monitorList[monitorID].active = 0;
        }
    }

    /**
     * Get heartbeats for a monitor
     * @param {number} monitorID Monitor ID
     * @param {number} period Negative hours offset
     * @returns {Promise<object[]>} Heartbeat list
     */
    static async getBeats(monitorID, period) {
        if (period == null) {
            throw new Error("Invalid period.");
        }

        const sqlHourOffset = Database.sqlHourOffset();

        return await R.getAll(`
            SELECT *
            FROM heartbeat
            WHERE monitor_id = ?
              AND time > ${sqlHourOffset}
            ORDER BY time ASC
        `, [monitorID, -period]);
    }

    /**
     * Get chart data for a monitor
     * @param {number} monitorID Monitor ID
     * @param {number} period Period in hours
     * @returns {Promise<object[]>} Chart data
     */
    static async getChartData(monitorID, period) {
        if (period == null) {
            throw new Error("Invalid period.");
        }

        let uptimeCalculator = await UptimeCalculator.getUptimeCalculator(monitorID);

        if (period <= 24) {
            return uptimeCalculator.getDataArray(period * 60, "minute");
        } else if (period <= 720) {
            return uptimeCalculator.getDataArray(period, "hour");
        } else {
            return uptimeCalculator.getDataArray(period / 24, "day");
        }
    }

    /**
     * Get count of important heartbeats (events)
     * @param {number|null} monitorID Monitor ID or null for all
     * @returns {Promise<number>} Count
     */
    static async getImportantHeartbeatCount(monitorID) {
        if (monitorID == null) {
            return await R.count("heartbeat", "important = 1");
        } else {
            return await R.count("heartbeat", "monitor_id = ? AND important = 1", [monitorID]);
        }
    }

    /**
     * Get paginated important heartbeats
     * @param {number|null} monitorID Monitor ID or null for all
     * @param {number} offset Offset
     * @param {number} count Limit
     * @returns {Promise<object[]>} Heartbeat list
     */
    static async getImportantHeartbeatsPaged(monitorID, offset, count) {
        if (monitorID == null) {
            return await R.find("heartbeat", `
                important = 1
                ORDER BY time DESC
                LIMIT ?
                OFFSET ?
            `, [count, offset]);
        } else {
            return await R.find("heartbeat", `
                monitor_id = ?
                AND important = 1
                ORDER BY time DESC
                LIMIT ?
                OFFSET ?
            `, [monitorID, count, offset]);
        }
    }

    /**
     * Clear events for a monitor
     * @param {number} monitorID Monitor ID
     * @returns {Promise<void>}
     */
    static async clearEvents(monitorID) {
        await R.exec("UPDATE heartbeat SET msg = ?, important = ? WHERE monitor_id = ? ", ["", "0", monitorID]);
    }

    /**
     * Clear heartbeats for a monitor
     * @param {number} monitorID Monitor ID
     * @param {number} userID User ID (for restarting the monitor)
     * @returns {Promise<void>}
     */
    static async clearHeartbeats(monitorID, userID) {
        const server = UptimeKumaServer.getInstance();

        await UptimeCalculator.clearStatistics(monitorID);

        if (monitorID in server.monitorList) {
            const monitor = server.monitorList[monitorID];
            if (monitor.active) {
                await MonitorService.restartMonitor(userID, monitorID);
            }
        }
    }

    /**
     * Clear all statistics for all monitors
     * @param {number} userID User ID
     * @returns {Promise<void>}
     */
    static async clearStatistics(userID) {
        const server = UptimeKumaServer.getInstance();

        await UptimeCalculator.clearAllStatistics();

        for (let monitorID in server.monitorList) {
            const monitor = server.monitorList[monitorID];
            if (monitor.active) {
                await MonitorService.restartMonitor(userID, monitorID);
            }
        }
    }
}

module.exports = MonitorService;
