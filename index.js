import express from "express";
import multer from "multer";
import os from "os";
import fs from "fs";
import QRCode from "qrcode";

const LOCAL_IP = Object.values(os.networkInterfaces())
    .flat()
    .filter(({ family, internal }) => family === "IPv4" && !internal)
    .map(({ address }) => address)?.[0] ?? "localhost";
const PORT = process.env.PORT ?? 8039;
const DOWNLOADS_DIR = "./downloads/";

const app = express();
app.use(express.static("public"));

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
        if (!fs.existsSync(DOWNLOADS_DIR)) {
            fs.mkdirSync(DOWNLOADS_DIR);
        }
        callback(null, DOWNLOADS_DIR);
    },
    filename: (_req, file, callback) => {
        callback(null, file.originalname);
    }
});
const uploadMiddleware = multer({ storage });

app.post(
    "/upload",
    uploadMiddleware.array("files"),
    (req, res) => {
        if (!req.files || req.files.length === 0) {
            return res.status(400).send("No files uploaded");
        }
        return res.status(200).send();
    }
);

const address = `http://${LOCAL_IP}:${PORT}`;

app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running at ${address}`);
    QRCode.toString(
        `${address}`,
        (_err, text) => {
            console.log(text);
        }
    );
});
