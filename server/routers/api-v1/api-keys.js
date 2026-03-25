const express = require("express");
const router = express.Router();
const { asyncHandler } = require("./middleware");
const ApiKeyService = require("../../services/api-key-service");

// GET /api-keys — List all
router.get("/", asyncHandler(async (req, res) => {
    const data = await ApiKeyService.list(req.userID);
    res.json({ ok: true, data });
}));

// POST /api-keys — Create
router.post("/", asyncHandler(async (req, res) => {
    const { bean, formattedKey } = await ApiKeyService.add(req.body, req.userID);
    res.status(201).json({ ok: true, data: { id: bean.id, key: formattedKey } });
}));

// DELETE /api-keys/:id — Delete
router.delete("/:id", asyncHandler(async (req, res) => {
    await ApiKeyService.delete(parseInt(req.params.id), req.userID);
    res.json({ ok: true, msg: "Deleted." });
}));

// POST /api-keys/:id/enable — Enable
router.post("/:id/enable", asyncHandler(async (req, res) => {
    await ApiKeyService.enable(parseInt(req.params.id), req.userID);
    res.json({ ok: true, msg: "Enabled." });
}));

// POST /api-keys/:id/disable — Disable
router.post("/:id/disable", asyncHandler(async (req, res) => {
    await ApiKeyService.disable(parseInt(req.params.id), req.userID);
    res.json({ ok: true, msg: "Disabled." });
}));

module.exports = router;
