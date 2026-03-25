const express = require("express");
const router = express.Router();
const axios = require("axios");
const { asyncHandler } = require("./middleware");
const ConnectWiseManage = require("../../notification-providers/connectwise-manage");

/**
 * Proxy endpoint for fetching ConnectWise Manage data.
 * The frontend sends CW credentials in the request body and specifies
 * what resource to fetch. This avoids CORS issues.
 */
router.post("/proxy", asyncHandler(async (req, res) => {
    const { cwApiUrl, cwCompanyId, cwPublicKey, cwPrivateKey, cwClientId, resource, boardId } = req.body;

    if (!cwApiUrl || !cwCompanyId || !cwPublicKey || !cwPrivateKey || !cwClientId || !resource) {
        return res.status(400).json({ ok: false, msg: "Missing required CW connection fields" });
    }

    const notification = { cwApiUrl, cwCompanyId, cwPublicKey, cwPrivateKey, cwClientId };
    const baseUrl = ConnectWiseManage.buildBaseUrl(notification);
    const headers = ConnectWiseManage.buildHeaders(notification);

    let url;
    switch (resource) {
        case "boards":
            url = `${baseUrl}/service/boards?pageSize=250&orderBy=name`;
            break;
        case "statuses":
            if (!boardId) {
                return res.status(400).json({ ok: false, msg: "boardId required for statuses" });
            }
            url = `${baseUrl}/service/boards/${boardId}/statuses?pageSize=250`;
            break;
        case "types":
            if (!boardId) {
                return res.status(400).json({ ok: false, msg: "boardId required for types" });
            }
            url = `${baseUrl}/service/boards/${boardId}/types?pageSize=250`;
            break;
        case "subtypes":
            if (!boardId) {
                return res.status(400).json({ ok: false, msg: "boardId required for subtypes" });
            }
            url = `${baseUrl}/service/boards/${boardId}/subtypes?pageSize=250`;
            break;
        case "items":
            if (!boardId) {
                return res.status(400).json({ ok: false, msg: "boardId required for items" });
            }
            url = `${baseUrl}/service/boards/${boardId}/items?pageSize=250`;
            break;
        case "members":
            url = `${baseUrl}/system/members?pageSize=1000&conditions=inactiveFlag=false&orderBy=identifier`;
            break;
        default:
            return res.status(400).json({ ok: false, msg: "Unknown resource: " + resource });
    }

    try {
        const resp = await axios.get(url, { headers });
        res.json({ ok: true, data: resp.data });
    } catch (error) {
        const status = error.response?.status || 500;
        const msg = error.response?.data?.message || error.message;
        res.status(status).json({ ok: false, msg });
    }
}));

module.exports = router;
