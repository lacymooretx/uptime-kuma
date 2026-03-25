const express = require("express");
const router = express.Router();
const { asyncHandler } = require("./middleware");
const TagService = require("../../services/tag-service");

// GET /tags — List all tags
router.get("/", asyncHandler(async (req, res) => {
    const data = await TagService.list();
    res.json({ ok: true, data });
}));

// POST /tags — Create tag
router.post("/", asyncHandler(async (req, res) => {
    const tag = await TagService.add(req.body);
    res.status(201).json({ ok: true, data: tag });
}));

// PUT /tags/:id — Update tag
router.put("/:id", asyncHandler(async (req, res) => {
    req.body.id = parseInt(req.params.id);
    const tag = await TagService.edit(req.body);
    res.json({ ok: true, data: tag });
}));

// DELETE /tags/:id — Delete tag
router.delete("/:id", asyncHandler(async (req, res) => {
    await TagService.delete(parseInt(req.params.id));
    res.json({ ok: true, msg: "Deleted." });
}));

module.exports = router;
