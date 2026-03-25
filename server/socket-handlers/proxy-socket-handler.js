const { checkLogin } = require("../util-server");
const { sendProxyList } = require("../client");
const { UptimeKumaServer } = require("../uptime-kuma-server");
const ProxyService = require("../services/proxy-service");

/**
 * Handlers for proxy
 * @param {Socket} socket Socket.io instance
 * @returns {void}
 */
module.exports.proxySocketHandler = (socket) => {
    socket.on("addProxy", async (proxy, proxyID, callback) => {
        try {
            checkLogin(socket);

            const proxyBean = await ProxyService.save(proxy, proxyID, socket.userID);
            await sendProxyList(socket);

            if (proxy.applyExisting) {
                await ProxyService.reloadProxy();
                const server = UptimeKumaServer.getInstance();
                await server.sendMonitorList(socket);
            }

            callback({
                ok: true,
                msg: "Saved.",
                msgi18n: true,
                id: proxyBean.id,
            });
        } catch (e) {
            callback({
                ok: false,
                msg: e.message,
            });
        }
    });

    socket.on("deleteProxy", async (proxyID, callback) => {
        try {
            checkLogin(socket);

            await ProxyService.delete(proxyID, socket.userID);
            await sendProxyList(socket);

            callback({
                ok: true,
                msg: "successDeleted",
                msgi18n: true,
            });
        } catch (e) {
            callback({
                ok: false,
                msg: e.message,
            });
        }
    });
};
