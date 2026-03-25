/**
 * Wraps an async route handler to catch errors and forward to Express error handler
 * @param {Function} fn Async route handler
 * @returns {Function} Express middleware
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Express error handler for API v1 routes.
 * Returns JSON errors instead of HTML.
 * @param {Error} err Error object
 * @param {express.Request} req Express request
 * @param {express.Response} res Express response
 * @param {express.NextFunction} next Next handler
 * @returns {void}
 */
function apiErrorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    const status = err.status || 500;
    res.status(status).json({
        ok: false,
        msg: err.message || "Internal server error",
    });
}

module.exports = {
    asyncHandler,
    apiErrorHandler,
};
