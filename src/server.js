import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

process.on("SIGINT", () => {
  console.info("Interrupted");
  process.exit(0);
});

const app = express();

const currentDir = new URL(".", import.meta.url).pathname + "/files";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const clearFiles = () => {
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

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file || !req.body.filename) {
    return res.status(400).send("No file or filename provided");
  }

  const filename = req.body.filename;
  const filepath = path.resolve(currentDir, filename);

  // Create folder if not exists
  const directory = path.dirname(filepath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  // Write buffer to file
  fs.writeFile(filepath, req.file.buffer, (err) => {
    if (err) {
      return res.status(500).send("Error writing file");
    }
    res.send(`File uploaded as ${filename}`);
  });
});

app.get("/health", (req, res) => {
  res.status(200).send("Server is healthy");
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
