const express = require("express");
const router = express.Router();
const { asyncHandler } = require("./middleware");
const MonitorService = require("../../services/monitor-service");
const TagService = require("../../services/tag-service");

// GET /monitors — List all monitors
router.get("/", asyncHandler(async (req, res) => {
    const list = await MonitorService.list(req.userID);
    res.json({ ok: true, data: list });
}));

// GET /monitors/:id — Get single monitor
router.get("/:id", asyncHandler(async (req, res) => {
    const monitor = await MonitorService.get(parseInt(req.params.id), req.userID);
    res.json({ ok: true, data: monitor });
}));

// POST /monitors — Create monitor
router.post("/", asyncHandler(async (req, res) => {
    const monitorID = await MonitorService.add(req.body, req.userID);
    res.status(201).json({ ok: true, data: { monitorID } });
}));

// PUT /monitors/:id — Full update
router.put("/:id", asyncHandler(async (req, res) => {
    req.body.id = parseInt(req.params.id);
    const monitorID = await MonitorService.edit(req.body, req.userID);
    res.json({ ok: true, data: { monitorID } });
}));

// PATCH /monitors/:id — Partial update (merge with existing)
router.patch("/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    // Get existing monitor data (in JSON format from toJSON)
    const existing = await MonitorService.get(id, req.userID);

    // The existing data has accepted_statuscodes_json as a string, but edit() expects
    // accepted_statuscodes as an array. Parse it back.
    if (existing.accepted_statuscodes_json && !existing.accepted_statuscodes) {
        try {
            existing.accepted_statuscodes = JSON.parse(existing.accepted_statuscodes_json);
        } catch (e) {
            existing.accepted_statuscodes = ["200-299"];
        }
    }

    // Similarly, parse back JSON fields that edit() will re-stringify
    for (const field of ["kafkaProducerBrokers", "kafkaProducerSaslOptions", "conditions", "rabbitmqNodes"]) {
        if (typeof existing[field] === "string") {
            try {
                existing[field] = JSON.parse(existing[field]);
            } catch (e) {
                // keep as-is
            }
        }
    }

    // Merge with patch data (patch overrides existing)
    const merged = { ...existing, ...req.body, id };

    // Ensure notificationIDList exists
    if (!merged.notificationIDList) {
        merged.notificationIDList = existing.notificationIDList || {};
    }

    const monitorID = await MonitorService.edit(merged, req.userID);
    res.json({ ok: true, data: { monitorID } });
}));

// DELETE /monitors/:id — Delete monitor
router.delete("/:id", asyncHandler(async (req, res) => {
    const deleteChildren = req.query.deleteChildren === "true";
    await MonitorService.delete(parseInt(req.params.id), req.userID, deleteChildren);
    res.json({ ok: true, msg: "Deleted." });
}));

// POST /monitors/:id/pause — Pause
router.post("/:id/pause", asyncHandler(async (req, res) => {
    await MonitorService.pauseMonitor(req.userID, parseInt(req.params.id));
    res.json({ ok: true, msg: "Paused." });
}));

// POST /monitors/:id/resume — Resume
router.post("/:id/resume", asyncHandler(async (req, res) => {
    await MonitorService.startMonitor(req.userID, parseInt(req.params.id));
    res.json({ ok: true, msg: "Resumed." });
}));

// GET /monitors/:id/beats — Heartbeats
router.get("/:id/beats", asyncHandler(async (req, res) => {
    const hours = parseInt(req.query.hours) || 24;
    const data = await MonitorService.getBeats(parseInt(req.params.id), hours);
    res.json({ ok: true, data });
}));

// GET /monitors/:id/chart — Chart data
router.get("/:id/chart", asyncHandler(async (req, res) => {
    const period = parseInt(req.query.period) || 24;
    const data = await MonitorService.getChartData(parseInt(req.params.id), period);
    res.json({ ok: true, data });
}));

// GET /monitors/:id/important-heartbeats — Paginated
router.get("/:id/important-heartbeats", asyncHandler(async (req, res) => {
    const offset = parseInt(req.query.offset) || 0;
    const count = parseInt(req.query.count) || 25;
    const data = await MonitorService.getImportantHeartbeatsPaged(parseInt(req.params.id), offset, count);
    res.json({ ok: true, data });
}));

// DELETE /monitors/:id/events — Clear events
router.delete("/:id/events", asyncHandler(async (req, res) => {
    await MonitorService.clearEvents(parseInt(req.params.id));
    res.json({ ok: true, msg: "Cleared." });
}));

// DELETE /monitors/:id/heartbeats — Clear heartbeats
router.delete("/:id/heartbeats", asyncHandler(async (req, res) => {
    await MonitorService.clearHeartbeats(parseInt(req.params.id), req.userID);
    res.json({ ok: true, msg: "Cleared." });
}));

// POST /monitors/:monitorID/tags — Add tag to monitor
router.post("/:monitorID/tags", asyncHandler(async (req, res) => {
    await TagService.addMonitorTag(req.body.tagID, parseInt(req.params.monitorID), req.body.value);
    res.status(201).json({ ok: true, msg: "Added." });
}));

// PUT /monitors/:monitorID/tags/:tagID — Edit monitor tag
router.put("/:monitorID/tags/:tagID", asyncHandler(async (req, res) => {
    await TagService.editMonitorTag(parseInt(req.params.tagID), parseInt(req.params.monitorID), req.body.value);
    res.json({ ok: true, msg: "Updated." });
}));

// DELETE /monitors/:monitorID/tags/:tagID — Remove tag from monitor
router.delete("/:monitorID/tags/:tagID", asyncHandler(async (req, res) => {
    await TagService.deleteMonitorTag(parseInt(req.params.tagID), parseInt(req.params.monitorID), req.body.value || "");
    res.json({ ok: true, msg: "Deleted." });
}));

module.exports = router;
