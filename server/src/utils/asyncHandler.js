// Wrap async route handlers and forward any error (sync or async) to Express.
export const asyncHandler = (handler) => async (req, res, next) => {
    try {
        await handler(req, res, next);
    } catch (err) {
        next(err);
    }
};

// export const asyncHandler = (handler) => (req, res, next) => {
//     Promise.resolve(handler(req, res, next)).catch(next);
// };
