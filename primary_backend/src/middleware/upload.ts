import multer from "multer";
import path from "path";
import fs from "fs";

const TEMP_DIR = path.join(__dirname, "../../uploaded-files/temp");

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    // Unique temp name to prevent collisions during the upload phase
    const tempName = `upload_${Date.now()}_${Math.round(Math.random() * 1E9)}`;
    cb(null, tempName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 } // 1GB Limit
});

export default upload;
