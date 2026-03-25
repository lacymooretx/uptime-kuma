const express = require("express");
const router = express.Router();
const { asyncHandler } = require("./middleware");
const { UptimeKumaServer } = require("../../uptime-kuma-server");
const checkVersion = require("../../check-version");
const Database = require("../../database");

// GET /info — Server info
router.get("/", asyncHandler(async (req, res) => {
    const server = UptimeKumaServer.getInstance();
    res.json({
        ok: true,
        data: {
            version: checkVersion.version,
            latestVersion: checkVersion.latestVersion,
            serverTimezone: await server.getTimezone(),
            serverTimezoneOffset: server.getTimezoneOffset(),
            isContainer: process.env.UPTIME_KUMA_IS_CONTAINER === "1",
            dbType: Database.dbConfig.type,
        },
    });
}));

module.exports = router;
