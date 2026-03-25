const express = require("express");
const router = express.Router();
const { asyncHandler } = require("./middleware");
const MaintenanceService = require("../../services/maintenance-service");

// GET /maintenance — List all
router.get("/", asyncHandler(async (req, res) => {
    const data = await MaintenanceService.list(req.userID);
    res.json({ ok: true, data });
}));

// GET /maintenance/:id — Get single
router.get("/:id", asyncHandler(async (req, res) => {
    const data = await MaintenanceService.get(parseInt(req.params.id), req.userID);
    res.json({ ok: true, data });
}));

// POST /maintenance — Create
router.post("/", asyncHandler(async (req, res) => {
    const maintenanceID = await MaintenanceService.add(req.body, req.userID);
    res.status(201).json({ ok: true, data: { maintenanceID } });
}));

// PUT /maintenance/:id — Update
router.put("/:id", asyncHandler(async (req, res) => {
    req.body.id = parseInt(req.params.id);
    const maintenanceID = await MaintenanceService.edit(req.body, req.userID);
    res.json({ ok: true, data: { maintenanceID } });
}));

// DELETE /maintenance/:id — Delete
router.delete("/:id", asyncHandler(async (req, res) => {
    await MaintenanceService.delete(parseInt(req.params.id), req.userID);
    res.json({ ok: true, msg: "Deleted." });
}));

// POST /maintenance/:id/pause — Pause
router.post("/:id/pause", asyncHandler(async (req, res) => {
    await MaintenanceService.pause(parseInt(req.params.id));
    res.json({ ok: true, msg: "Paused." });
}));

// POST /maintenance/:id/resume — Resume
router.post("/:id/resume", asyncHandler(async (req, res) => {
    await MaintenanceService.resume(parseInt(req.params.id));
    res.json({ ok: true, msg: "Resumed." });
}));

// GET /maintenance/:id/monitors — List monitors
router.get("/:id/monitors", asyncHandler(async (req, res) => {
    const data = await MaintenanceService.getMonitors(parseInt(req.params.id));
    res.json({ ok: true, data });
}));

// PUT /maintenance/:id/monitors — Set monitors
router.put("/:id/monitors", asyncHandler(async (req, res) => {
    await MaintenanceService.setMonitors(parseInt(req.params.id), req.body.monitors || req.body);
    res.json({ ok: true, msg: "Updated." });
}));

// GET /maintenance/:id/status-pages — List status pages
router.get("/:id/status-pages", asyncHandler(async (req, res) => {
    const data = await MaintenanceService.getStatusPages(parseInt(req.params.id));
    res.json({ ok: true, data });
}));

// PUT /maintenance/:id/status-pages — Set status pages
router.put("/:id/status-pages", asyncHandler(async (req, res) => {
    await MaintenanceService.setStatusPages(parseInt(req.params.id), req.body.statusPages || req.body);
    res.json({ ok: true, msg: "Updated." });
}));

module.exports = router;
