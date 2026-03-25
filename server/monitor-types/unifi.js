const { MonitorType } = require("./monitor-type");
const { UP, log } = require("../../src/util");
const dayjs = require("dayjs");
const axios = require("axios");

const UNIFI_API_BASE = "https://api.ui.com/v1/devices";

class UniFiMonitorType extends MonitorType {
    name = "unifi";

    /**
     * @inheritdoc
     */
    async check(monitor, heartbeat, _server) {
        const apiKey = monitor.basic_auth_pass;
        const targetMac = (monitor.hostname || "").trim().toLowerCase();

        if (!apiKey) {
            throw new Error("UniFi API Key is required");
        }
        if (!targetMac) {
            throw new Error("Device MAC address is required");
        }

        const startTime = dayjs().valueOf();

        let response;
        try {
            response = await axios.get(UNIFI_API_BASE, {
                headers: {
                    "X-API-KEY": apiKey,
                    "Accept": "application/json",
                },
                timeout: (monitor.timeout || 30) * 1000,
            });
        } catch (err) {
            if (err.response) {
                if (err.response.status === 401) {
                    throw new Error("Invalid UniFi API Key");
                }
                if (err.response.status === 429) {
                    throw new Error("UniFi API rate limit exceeded. Try increasing the monitor interval.");
                }
                throw new Error(`UniFi API returned HTTP ${err.response.status}`);
            }
            throw new Error(`Failed to reach UniFi API: ${err.message}`);
        }

        heartbeat.ping = Math.round(dayjs().valueOf() - startTime);

        const data = response.data;
        if (!data || !data.data || !Array.isArray(data.data)) {
            throw new Error("Unexpected UniFi API response format");
        }

        // Search all hosts for the target device by MAC
        let device = null;
        let hostName = null;

        for (const host of data.data) {
            if (!host.devices || !Array.isArray(host.devices)) {
                continue;
            }
            for (const dev of host.devices) {
                const devMac = (dev.mac || "").toLowerCase();
                if (devMac === targetMac) {
                    device = dev;
                    hostName = host.hostName || host.hostId || "Unknown";
                    break;
                }
            }
            if (device) {
                break;
            }
        }

        if (!device) {
            throw new Error(`Device with MAC ${targetMac} not found in UniFi account`);
        }

        const deviceName = device.name || "Unknown";
        const deviceModel = device.model || "Unknown";
        const deviceIp = device.ip || "N/A";
        const status = (device.status || "").toLowerCase();

        if (status === "online") {
            heartbeat.status = UP;
            heartbeat.msg = `${deviceName} (${deviceModel}) is online | IP: ${deviceIp} | Site: ${hostName}`;
        } else if (status === "offline") {
            throw new Error(`${deviceName} (${deviceModel}) is offline | Site: ${hostName}`);
        } else {
            // Fallback: check last_seen timestamp
            if (device.last_seen) {
                const lastSeen = dayjs(device.last_seen);
                const diffMinutes = dayjs().diff(lastSeen, "minute");
                if (diffMinutes > 5) {
                    throw new Error(`${deviceName} (${deviceModel}) last seen ${diffMinutes} minutes ago | Site: ${hostName}`);
                } else {
                    heartbeat.status = UP;
                    heartbeat.msg = `${deviceName} (${deviceModel}) status: ${status || "unknown"}, last seen ${diffMinutes}m ago | IP: ${deviceIp} | Site: ${hostName}`;
                }
            } else {
                throw new Error(`${deviceName} (${deviceModel}) status: ${status || "unknown"} | Site: ${hostName}`);
            }
        }
    }
}

module.exports = {
    UniFiMonitorType,
};
