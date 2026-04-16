import express from "express";
import cors from "cors";
import authRoutes from "./authRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// AUTH API
app.use("/api", authRoutes);

const PORT = 4000;

app.listen(PORT, () => {
  console.log(`Auth API running on http://localhost:${PORT}`);
});