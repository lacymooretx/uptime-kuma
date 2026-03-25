const express = require("express");
const router = express.Router();
const { asyncHandler } = require("./middleware");
const StatusPageService = require("../../services/status-page-service");
const IncidentService = require("../../services/incident-service");

// GET /status-pages — List all
router.get("/", asyncHandler(async (req, res) => {
    const data = await StatusPageService.list();
    res.json({ ok: true, data });
}));

// GET /status-pages/:slug — Get by slug
router.get("/:slug", asyncHandler(async (req, res) => {
    const data = await StatusPageService.get(req.params.slug);
    res.json({ ok: true, data });
}));

// POST /status-pages — Create
router.post("/", asyncHandler(async (req, res) => {
    const slug = await StatusPageService.add(req.body.title, req.body.slug);
    res.status(201).json({ ok: true, data: { slug } });
}));

// PUT /status-pages/:slug — Save/update
router.put("/:slug", asyncHandler(async (req, res) => {
    const publicGroupList = await StatusPageService.save(
        req.params.slug,
        req.body.config || req.body,
        req.body.imgDataUrl || "",
        req.body.publicGroupList || []
    );
    res.json({ ok: true, data: { publicGroupList } });
}));

// DELETE /status-pages/:slug — Delete
router.delete("/:slug", asyncHandler(async (req, res) => {
    await StatusPageService.delete(req.params.slug);
    res.json({ ok: true, msg: "Deleted." });
}));

// --- Incident sub-routes ---

// GET /status-pages/:slug/incidents — List incidents (history)
router.get("/:slug/incidents", asyncHandler(async (req, res) => {
    const cursor = req.query.cursor || null;
    const result = await IncidentService.getHistory(req.params.slug, cursor, false);
    res.json({ ok: true, data: result });
}));

// POST /status-pages/:slug/incidents — Create incident
router.post("/:slug/incidents", asyncHandler(async (req, res) => {
    const incident = await IncidentService.post(req.params.slug, req.body);
    res.status(201).json({ ok: true, data: incident });
}));

// PUT /status-pages/:slug/incidents/:id — Edit incident
router.put("/:slug/incidents/:id", asyncHandler(async (req, res) => {
    const incident = await IncidentService.edit(req.params.slug, parseInt(req.params.id), req.body);
    res.json({ ok: true, data: incident });
}));

// DELETE /status-pages/:slug/incidents/:id — Delete incident
router.delete("/:slug/incidents/:id", asyncHandler(async (req, res) => {
    await IncidentService.delete(req.params.slug, parseInt(req.params.id));
    res.json({ ok: true, msg: "Deleted." });
}));

// POST /status-pages/:slug/incidents/:id/resolve — Resolve incident
router.post("/:slug/incidents/:id/resolve", asyncHandler(async (req, res) => {
    const incident = await IncidentService.resolve(req.params.slug, parseInt(req.params.id));
    res.json({ ok: true, data: incident });
}));

// POST /status-pages/:slug/incidents/unpin — Unpin all incidents
router.post("/:slug/incidents/unpin", asyncHandler(async (req, res) => {
    await IncidentService.unpin(req.params.slug);
    res.json({ ok: true, msg: "Unpinned." });
}));

module.exports = router;
