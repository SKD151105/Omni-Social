import { ApiError } from "./ApiError.js";

const typeChecks = {
    string: val => typeof val === "string",
    number: val => typeof val === "number" && !Number.isNaN(val),
    boolean: val => typeof val === "boolean",
    objectId: val => typeof val === "string" && /^[a-fA-F0-9]{24}$/.test(val),
};

export const validate = (data, rules) => {
    const errors = [];
    const validated = {};

    for (const [field, rule] of Object.entries(rules)) {
        const value = data?.[field];
        const {
            required = false,
            type,
            minLength,
            pattern,
            transform,
        } = rule;

        if (required && (value === undefined || value === null || value === "")) {
            errors.push({ field, message: "is required" });
            continue;
        }

        if (value === undefined || value === null) {
            continue; // optional and not provided
        }

        let val = value;
        if (transform === "trim" && typeof val === "string") {
            val = val.trim();
        }

        if (type) {
            const checker = typeChecks[type];
            if (!checker) {
                throw new Error(`Unknown type rule: ${type}`);
            }
            if (!checker(val)) {
                errors.push({ field, message: `must be of type ${type}` });
                continue;
            }
        }

        if (minLength !== undefined && typeof val === "string" && val.length < minLength) {
            errors.push({ field, message: `must have length >= ${minLength}` });
            continue;
        }

        if (pattern && typeof val === "string" && !(new RegExp(pattern)).test(val)) {
            errors.push({ field, message: "is invalid" });
            continue;
        }

        validated[field] = val;
    }

    if (errors.length) {
        throw new ApiError(400, "Validation failed", errors);
    }

    return validated;
};
