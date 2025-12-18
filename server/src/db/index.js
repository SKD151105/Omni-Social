import mongoose from "mongoose";
import dotenv from "dotenv";
import { DB_NAME } from "../constants.js";
import { logger } from "../utils/logger.js";

dotenv.config();

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
    } catch (error) {
        logger.error("MongoDB Connection Failed", { error });
        process.exit(1);
    }
};

export default connectDB;