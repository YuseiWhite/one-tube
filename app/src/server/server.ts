import express from "express";

const app = express();
const PORT = 3001;

app.use(express.json());

// Health check endpoint
app.get("/api/health", (_req, res) => {
	res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Default route
app.get("/", (_req, res) => {
	res.json({ message: "OneTube API Server" });
});

app.listen(PORT, () => {
	console.log(`✅ API server running on http://localhost:${PORT}`);
	console.log(`   Health check: http://localhost:${PORT}/api/health`);
});
