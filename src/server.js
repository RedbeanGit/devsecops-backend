import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { createClient } from "redis";

process.on("SIGINT", () => {
  console.info("Interrupted");
  process.exit(0);
});

const PORT = 3000;

const redisClient = createClient();
const app = express();

const currentDir = new URL(".", import.meta.url).pathname + "/files";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const clearFiles = () => {
  console.log("Clearing files");
  exec("node src/clear.js", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error while trying to run clear.js: ${error}`);
      return;
    }
    if (stderr) {
      console.error(`Error from clear.js: ${stderr}`);
    }
  });
};

setInterval(clearFiles, 30000);

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file || !req.body.filename) {
    return res.status(400).json({ message: "No file or filename provided" });
  }

  const filename = req.body.filename;
  const filepath = path.resolve(currentDir, filename);

  // Create folder if not exists
  const directory = path.dirname(filepath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  // Write buffer to file
  fs.writeFile(filepath, req.file.buffer, async (err) => {
    if (err) {
      return res.status(500).json({ message: "Error writing file" });
    }

    try {
      await redisClient.incr("uploadCount");
      res.json({ filename });
    } catch (err) {
      res.status(500).json({ message: "Error incrementing upload count" });
    }
  });
});

app.get("/count", async (_, res) => {
  try {
    const count = await redisClient.get("uploadCount");
    res.json({ count: count || 0 });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving count from Redis" });
  }
});

app.get("/health", (req, res) => {
  res.status(200).json({ healthy: true });
});

redisClient.connect();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
