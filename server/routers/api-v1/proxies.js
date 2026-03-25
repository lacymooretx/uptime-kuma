const express = require("express");
const router = express.Router();
const { asyncHandler } = require("./middleware");
const ProxyService = require("../../services/proxy-service");
const { R } = require("redbean-node");

// GET /proxies — List all
router.get("/", asyncHandler(async (req, res) => {
    const list = await R.find("proxy", " user_id = ? ", [req.userID]);
    const data = list.map((bean) => bean.export());
    res.json({ ok: true, data });
}));

// POST /proxies — Create
router.post("/", asyncHandler(async (req, res) => {
    const bean = await ProxyService.save(req.body, null, req.userID);
    res.status(201).json({ ok: true, data: { id: bean.id } });
}));

// PUT /proxies/:id — Update
router.put("/:id", asyncHandler(async (req, res) => {
    const bean = await ProxyService.save(req.body, parseInt(req.params.id), req.userID);
    res.json({ ok: true, data: { id: bean.id } });
}));

// DELETE /proxies/:id — Delete
router.delete("/:id", asyncHandler(async (req, res) => {
    await ProxyService.delete(parseInt(req.params.id), req.userID);
    res.json({ ok: true, msg: "Deleted." });
}));

module.exports = router;
