import "dotenv/config";
import { logger } from "./utils/logger.js";
import connectDB from "./db/index.js";
import app from "./app.js";

const PORT = process.env.PORT || 5000;

// Wrapping app.listen in a Promise so we can use async/await
const listenAsync = (port) => {
    return new Promise((resolve, reject) => {
        const server = app
            .listen(port, () => {
                logger.info(`Server running on port ${port}`);
                resolve(server); // resolve when server starts
            })
            .on("error", reject);
    });
};

// Main startup flow: connect DB first, then start server
const startServer = async () => {
    try {
        await connectDB(); 
        logger.info("Database connection established");

        await listenAsync(PORT); // start server only after DB is ready
    } catch (error) {
        logger.error("Server startup error", { error });
        process.exit(1);
    }
};

startServer();