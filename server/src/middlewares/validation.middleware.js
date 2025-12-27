import { validate } from "../utils/validator.js";

export const validateBody = rules => (req, res, next) => {
    try {
        req.validatedBody = validate(req.body, rules);
        return next();
    } catch (error) {
        return next(error);
    }
};
