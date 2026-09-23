import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import express from "express";
import { kallGateway } from "./clients/aiGateway.js";
import { rettssakRouter } from "./features/rettssak/routes/rettssak.js";

const rot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
dotenv.config({ path: path.join(rot, ".env.local"), quiet: true });

const app = express();
app.use(express.json({ limit: "20kb" }));
app.use("/api", rettssakRouter(kallGateway));

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`Backend kjører på http://localhost:${port}`);
});
