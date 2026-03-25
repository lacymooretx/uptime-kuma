const express = require("express");
const router = express.Router();
const { asyncHandler } = require("./middleware");
const NotificationService = require("../../services/notification-service");

// GET /notifications — List all
router.get("/", asyncHandler(async (req, res) => {
    const data = await NotificationService.list(req.userID);
    res.json({ ok: true, data });
}));

// POST /notifications — Create
router.post("/", asyncHandler(async (req, res) => {
    const bean = await NotificationService.save(req.body, null, req.userID);
    res.status(201).json({ ok: true, data: { id: bean.id } });
}));

// PUT /notifications/:id — Update
router.put("/:id", asyncHandler(async (req, res) => {
    const bean = await NotificationService.save(req.body, parseInt(req.params.id), req.userID);
    res.json({ ok: true, data: { id: bean.id } });
}));

// DELETE /notifications/:id — Delete
router.delete("/:id", asyncHandler(async (req, res) => {
    await NotificationService.delete(parseInt(req.params.id), req.userID);
    res.json({ ok: true, msg: "Deleted." });
}));

// POST /notifications/test — Test notification
router.post("/test", asyncHandler(async (req, res) => {
    const msg = await NotificationService.test(req.body);
    res.json({ ok: true, msg });
}));

module.exports = router;
