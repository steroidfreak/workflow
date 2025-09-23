import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

import compression from "compression";
import cors from "cors";
import express from "express";
import { assistant, run, user } from "@openai/agents";

import { agent } from "./agent.js";

const app = express();
const port = Number.parseInt(process.env.PORT ?? "3000", 10);

const capabilities = [
  {
    id: "pipeline-designer",
    title: "Pipeline Designer",
    description: "Drag-and-drop tasks, set dependencies, and export reusable automation templates.",
  },
  {
    id: "compliance-guard",
    title: "Compliance Guard",
    description: "Continuously validate workflows against SG regulatory baselines with automated alerts.",
  },
  {
    id: "analytics-pulse",
    title: "Analytics Pulse",
    description: "Track latency, throughput, and team adoption using out-of-the-box dashboards.",
  },
];

const updates = [
  {
    title: "Workflow SG v1.3",
    date: "2025-09-12",
    summary: "Added API throttling controls and Slack incident responder integration.",
  },
  {
    title: "Data Lake Connector",
    date: "2025-08-28",
    summary: "Seamlessly sync workflow events with Snowflake and BigQuery.",
  },
];

app.use(cors());
app.use(compression());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "workflow-sg",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/capabilities", (_req, res) => {
  res.json(capabilities);
});

app.get("/api/updates", (_req, res) => {
  res.json(updates);
});

app.post("/api/chat", async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: "Chat service is not configured." });
  }

  const { message, history } = req.body ?? {};

  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Message is required." });
  }

  const sanitizedHistory = Array.isArray(history)
    ? history
        .filter(
          (entry) =>
            entry &&
            typeof entry.role === "string" &&
            typeof entry.content === "string" &&
            (entry.role === "assistant" || entry.role === "user"),
        )
        .slice(-6)
        .map((entry) => {
          const trimmed = entry.content.slice(0, 1500).trim();
          return entry.role === "assistant" ? assistant(trimmed) : user(trimmed);
        })
    : [];

  const runInput = [...sanitizedHistory, user(message.trim().slice(0, 1800))];

  try {
    const result = await run(agent, runInput, {
      maxTurns: 8,
      conversationId: req.body?.conversationId,
    });

    const reply = typeof result.finalOutput === "string" ? result.finalOutput.trim() : "";

    if (!reply) {
      return res.status(502).json({ error: "Unexpected response from assistant." });
    }

    res.json({ reply });
  } catch (error) {
    console.error("Agent chat request failed", error);
    const statusCode = error?.status === 429 ? 429 : 500;
    const responseMessage =
      statusCode === 429
        ? "Our assistant is receiving a lot of questions. Please try again shortly."
        : "Unable to reach the assistant right now.";

    res.status(statusCode).json({ error: responseMessage });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  express.static(path.join(__dirname, "..", "public"), {
    maxAge: "1d",
    setHeaders: (response, filePath) => {
      if (path.extname(filePath) === ".html") {
        response.setHeader("Cache-Control", "no-cache, max-age=0, must-revalidate");
      }
    },
  }),
);

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.listen(port, () => {
  console.log(`Workflow SG server listening on port ${port}`);
});
