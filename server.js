const express = require('express');
const path = require('path');
const compression = require('compression');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(compression());
app.use(express.json());

const capabilities = [
  {
    id: 'pipeline-designer',
    title: 'Pipeline Designer',
    description: 'Drag-and-drop tasks, set dependencies, and export reusable automation templates.'
  },
  {
    id: 'compliance-guard',
    title: 'Compliance Guard',
    description: 'Continuously validate workflows against SG regulatory baselines with automated alerts.'
  },
  {
    id: 'analytics-pulse',
    title: 'Analytics Pulse',
    description: 'Track latency, throughput, and team adoption using out-of-the-box dashboards.'
  }
];

const updates = [
  {
    title: 'Workflow SG v1.3',
    date: '2025-09-12',
    summary: 'Added API throttling controls and Slack incident responder integration.'
  },
  {
    title: 'Data Lake Connector',
    date: '2025-08-28',
    summary: 'Seamlessly sync workflow events with Snowflake and BigQuery.'
  }
];

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'workflow-sg',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/capabilities', (_req, res) => {
  res.json(capabilities);
});

app.get('/api/updates', (_req, res) => {
  res.json(updates);
});

app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d'
}));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Workflow SG server listening on port ${PORT}`);
});
