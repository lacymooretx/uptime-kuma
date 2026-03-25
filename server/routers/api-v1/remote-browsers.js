const express = require("express");
const router = express.Router();
const { asyncHandler } = require("./middleware");
const RemoteBrowserService = require("../../services/remote-browser-service");
const { R } = require("redbean-node");

// GET /remote-browsers — List all
router.get("/", asyncHandler(async (req, res) => {
    const list = await R.find("remote_browser", " user_id = ? ", [req.userID]);
    const data = list.map((bean) => bean.toJSON());
    res.json({ ok: true, data });
}));

// POST /remote-browsers — Create
router.post("/", asyncHandler(async (req, res) => {
    const bean = await RemoteBrowserService.save(req.body, null, req.userID);
    res.status(201).json({ ok: true, data: { id: bean.id } });
}));

// PUT /remote-browsers/:id — Update
router.put("/:id", asyncHandler(async (req, res) => {
    const bean = await RemoteBrowserService.save(req.body, parseInt(req.params.id), req.userID);
    res.json({ ok: true, data: { id: bean.id } });
}));

// DELETE /remote-browsers/:id — Delete
router.delete("/:id", asyncHandler(async (req, res) => {
    await RemoteBrowserService.delete(parseInt(req.params.id), req.userID);
    res.json({ ok: true, msg: "Deleted." });
}));

// POST /remote-browsers/test — Test connection
router.post("/test", asyncHandler(async (req, res) => {
    const msg = await RemoteBrowserService.test(req.body);
    res.json({ ok: true, msg });
}));

module.exports = router;
