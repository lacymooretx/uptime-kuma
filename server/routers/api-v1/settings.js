const express = require("express");
const router = express.Router();
const { asyncHandler } = require("./middleware");
const SettingsService = require("../../services/settings-service");

// GET /settings — Get general settings
router.get("/", asyncHandler(async (req, res) => {
    const data = await SettingsService.get();
    res.json({ ok: true, data });
}));

// PUT /settings — Update general settings
router.put("/", asyncHandler(async (req, res) => {
    await SettingsService.set(req.body, req.body.currentPassword || null, req.userID);
    res.json({ ok: true, msg: "Saved." });
}));

// POST /settings/change-password — Change password
router.post("/change-password", asyncHandler(async (req, res) => {
    const token = await SettingsService.changePassword(
        req.body.currentPassword,
        req.body.newPassword,
        req.userID
    );
    res.json({ ok: true, data: { token } });
}));

module.exports = router;
