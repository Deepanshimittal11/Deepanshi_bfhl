require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { buildBfhlResponse } = require("./lib/bfhl");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/bfhl", (req, res) => {
  const { data } = req.body;

  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ error: "Request body must contain a 'data' array." });
  }

  const response = buildBfhlResponse(data);
  res.json(response);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
