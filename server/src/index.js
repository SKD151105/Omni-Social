import dotenv from "dotenv";
import { logger } from "./utils/logger.js";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
        });
    } catch (error) {
        logger.error("Server startup error", { error });
        process.exit(1);
    }
};

startServer();