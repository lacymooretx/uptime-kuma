const express = require("express");
const router = express.Router();
const { asyncHandler } = require("./middleware");
const DockerHostService = require("../../services/docker-host-service");
const { R } = require("redbean-node");

// GET /docker-hosts — List all
router.get("/", asyncHandler(async (req, res) => {
    const list = await R.find("docker_host", " user_id = ? ", [req.userID]);
    const data = list.map((bean) => bean.toJSON());
    res.json({ ok: true, data });
}));

// POST /docker-hosts — Create
router.post("/", asyncHandler(async (req, res) => {
    const bean = await DockerHostService.save(req.body, null, req.userID);
    res.status(201).json({ ok: true, data: { id: bean.id } });
}));

// PUT /docker-hosts/:id — Update
router.put("/:id", asyncHandler(async (req, res) => {
    const bean = await DockerHostService.save(req.body, parseInt(req.params.id), req.userID);
    res.json({ ok: true, data: { id: bean.id } });
}));

// DELETE /docker-hosts/:id — Delete
router.delete("/:id", asyncHandler(async (req, res) => {
    await DockerHostService.delete(parseInt(req.params.id), req.userID);
    res.json({ ok: true, msg: "Deleted." });
}));

// POST /docker-hosts/test — Test connection
router.post("/test", asyncHandler(async (req, res) => {
    const msg = await DockerHostService.test(req.body);
    res.json({ ok: true, msg });
}));

module.exports = router;
