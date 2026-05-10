import cron from "node-cron";
import fs from "fs";
import path from "path";
import db from "../config/db";

const UPLOAD_BASE_DIR = path.join(__dirname, "../../uploaded-files");
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Scans the uploaded-files directory and removes files older than 24 hours.
 * Also marks the corresponding message as deleted in the database.
 */
const performCleanup = async () => {
  console.log(`[Cleanup Service] Starting scheduled cleanup at ${new Date().toLocaleString()}...`);
  
  if (!fs.existsSync(UPLOAD_BASE_DIR)) {
    console.log("[Cleanup Service] Upload directory does not exist. Skipping.");
    return;
  }

  let deletedFilesCount = 0;
  let deletedFoldersCount = 0;

  try {
    const conversationDirs = fs.readdirSync(UPLOAD_BASE_DIR);

    for (const convId of conversationDirs) {
      const convPath = path.join(UPLOAD_BASE_DIR, convId);
      
      // Skip 'temp' folder if any
      if (convId === 'temp') continue;

      if (fs.statSync(convPath).isDirectory()) {
        const files = fs.readdirSync(convPath);

        for (const fileName of files) {
          const filePath = path.join(convPath, fileName);
          const stats = fs.statSync(filePath);
          const age = Date.now() - stats.mtime.getTime();

          if (age > MAX_AGE_MS) {
            try {
              // Delete physical file
              fs.unlinkSync(filePath);
              deletedFilesCount++;

              // Sync with Database
              // Filename format: {messageId}_{originalName}
              const messageId = fileName.split('_')[0];
              if (messageId && !isNaN(Number(messageId))) {
                await db.query("UPDATE messages SET is_deleted = true WHERE id = $1", [parseInt(messageId)]);
              }

              console.log(`[Cleanup Service] Deleted expired file: ${fileName}`);
            } catch (err) {
              console.error(`[Cleanup Service] Error deleting file ${fileName}:`, err);
            }
          }
        }

        // Remove empty conversation folders
        if (fs.readdirSync(convPath).length === 0) {
          fs.rmdirSync(convPath);
          deletedFoldersCount++;
          console.log(`[Cleanup Service] Removed empty folder for conversation: ${convId}`);
        }
      }
    }

    console.log(`[Cleanup Service] Cleanup complete. Removed ${deletedFilesCount} files and ${deletedFoldersCount} empty folders.`);
  } catch (error) {
    console.error("[Cleanup Service] Critical error during cleanup process:", error);
  }
};

/**
 * Initializes the cron job to run every hour.
 */
export const initCleanupJob = () => {
  // Run every hour at minute 0: '0 * * * *'
  // For testing purposes, you could use '*/5 * * * *' (every 5 mins)
  cron.schedule('0 * * * *', () => {
    performCleanup();
  });

  console.log("[Cleanup Service] Cron job initialized (Running every 1 hour).");
};
