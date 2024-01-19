import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

const app = express();

const currentDir = new URL(".", import.meta.url).pathname;
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file || !req.body.filename) {
    return res.status(400).send("No file or filename provided");
  }

  const filename = req.body.filename;
  const filepath = path.resolve(currentDir, filename);

  // Création de l'arborescence de dossiers si nécessaire
  const directory = path.dirname(filepath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  // Écriture du fichier
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

// Démarrage du serveur
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
