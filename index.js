import express from "express";
import multer from "multer";
import os from "os";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import QRCode from "qrcode";
import archiver from "archiver";

const LOCAL_IP =
    Object.values(os.networkInterfaces())
        .flat()
        .filter(({ family, internal }) => family === "IPv4" && !internal)
        .map(({ address }) => address)?.[0] ?? "localhost";
const PORT = process.env.PORT ?? 8039;

const TEMP_DIR = "./temp/";
const UPLOADS_DIR = "./uploads/";
const SHARED_DIR = "./shared/";

fs.mkdirSync(TEMP_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(SHARED_DIR, { recursive: true });

const app = express();
app.use(express.static("public"));
app.use(express.json());

const storage = multer.diskStorage({
    destination: (req, _file, callback) => {
        const destinationDir = req.query.zip ? TEMP_DIR : UPLOADS_DIR;
        callback(null, destinationDir);
    },
    filename: (_req, file, callback) => {
        const name = Buffer.from(file.originalname, "latin1").toString("utf-8");
        callback(null, name);
    },
});
const uploadMiddleware = multer({ storage });

app.post("/uploads", uploadMiddleware.array("files"), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
    }

    if (req.query.zip) {
        const archive = archiver("zip", { zlib: { level: 9 } });
        const archiveFilename = `${crypto.randomUUID()}.zip`;
        const archivePath = path.join(UPLOADS_DIR, archiveFilename);
        const archiveStream = fs.createWriteStream(archivePath);
        archive.pipe(archiveStream);

        const files = req.files.map((file) => ({
            name: file.filename,
            path: path.join(TEMP_DIR, file.filename),
        }));

        files.forEach((file) => {
            archive.file(file.path, { name: file.name });
        });

        await archive.finalize();
        files.forEach(async (file) => {
            await fsp.rm(file.path);
        });
    }

    return res.sendStatus(200);
});

app.get("/shared", async (_req, res) => {
    try {
        const fileNames = await fsp.readdir(SHARED_DIR);
        const filesInfo = await Promise.all(
            fileNames.map(async (file) => {
                const fullPath = path.join(SHARED_DIR, file);
                const stat = await fsp.stat(fullPath);
                return { file, size: stat.size };
            })
        );
        return res.json(filesInfo);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
});

app.post("/shared", async (req, res) => {
    try {
        const files = req.body;
        if (!Array.isArray(files) || files.length === 0) {
            return res.status(400).json({ error: "No filenames provided" });
        }

        const archive = archiver("zip", { zlib: { level: 9 } });
        res.attachment(`${crypto.randomUUID()}.zip`);
        archive.pipe(res);

        for (const file of files) {
            const fileBaseName = path.basename(file);
            const fullPath = path.join(SHARED_DIR, fileBaseName);

            try {
                await fsp.access(fullPath);
                archive.file(fullPath, { name: fileBaseName });
            } catch {
                /* empty */
            }
        }
        await archive.finalize();
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
});

const address = `http://${LOCAL_IP}:${PORT}`;
app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running at ${address}`);
    QRCode.toString(`${address}`, (_err, text) => {
        console.log(text);
    });
});
