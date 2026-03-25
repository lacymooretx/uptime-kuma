const express = require("express");
const router = express.Router();
const { restApiAuth } = require("../../auth");
const { apiErrorHandler } = require("./middleware");

// Apply REST API auth to all routes
router.use(restApiAuth);

// Mount sub-routers
router.use("/monitors", require("./monitors"));
router.use("/tags", require("./tags"));
router.use("/notifications", require("./notifications"));
router.use("/maintenance", require("./maintenance"));
router.use("/status-pages", require("./status-pages"));
router.use("/settings", require("./settings"));
router.use("/docker-hosts", require("./docker-hosts"));
router.use("/proxies", require("./proxies"));
router.use("/remote-browsers", require("./remote-browsers"));
router.use("/api-keys", require("./api-keys"));
router.use("/database", require("./database"));
router.use("/info", require("./info"));

// Error handler — must be after all routes
router.use(apiErrorHandler);

module.exports = router;
