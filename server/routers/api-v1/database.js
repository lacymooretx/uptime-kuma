const express = require("express");
const router = express.Router();
const { asyncHandler } = require("./middleware");
const DatabaseService = require("../../services/database-service");

// GET /database/size — Get database size
router.get("/size", asyncHandler(async (req, res) => {
    const size = await DatabaseService.getSize();
    res.json({ ok: true, data: { size } });
}));

// POST /database/shrink — Shrink database
router.post("/shrink", asyncHandler(async (req, res) => {
    await DatabaseService.shrink();
    res.json({ ok: true, msg: "Database shrunk." });
}));

module.exports = router;
