import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import { logger } from "../utils/logger.js";
import { Subscription } from "../models/subscription.model.js";

const DEFAULT_URI = `mongodb://localhost:27017/${DB_NAME}`;
const { MONGODB_URI = DEFAULT_URI } = process.env;

const connectDB = async (uri = MONGODB_URI) => {
    try {
        await mongoose.connect(uri, { dbName: DB_NAME });
        // Logging a concise, non-sensitive summary of the active Mongo connection
        logger.info("MongoDB connected", {
            db: mongoose.connection.name,
            host: mongoose.connection.host,
        });

        // Deduplicate subscriptions to allow unique index creation
        try {
            const duplicates = await Subscription.aggregate([
                {
                    $group: {
                        _id: { subscriber: "$subscriber", channel: "$channel" },
                        ids: { $addToSet: "$_id" },
                        count: { $sum: 1 },
                    },
                },
                { $match: { count: { $gt: 1 } } },
            ]);

            for (const dup of duplicates) {
                // Keep one, remove the rest
                const [keepId, ...removeIds] = dup.ids;
                if (removeIds.length) {
                    await Subscription.deleteMany({ _id: { $in: removeIds } });
                }
            }
            if (duplicates.length) {
                logger.info("Deduplicated subscriptions", { removedSets: duplicates.length });
            }
        } catch (dedupeError) {
            logger.warn("Subscription dedupe skipped", { error: dedupeError.message });
        }
    } catch (error) {
        logger.error("MongoDB Connection Failed", { error });
        process.exit(1);
    }
};

export default connectDB;