# Configuration Guide

The Workflow SG server reads the following environment variables at runtime:

| Variable | Required | Description |
| --- | --- | --- |
| `OPENAI_API_KEY` | No | Enables the `/api/chat` endpoint. When unset, the endpoint responds with a `503` indicating the chat service is unavailable. |
| `USE_OPENAI_FILE_TOOL` | No | When set to `true`, the agent attempts to initialise the OpenAI file search tool. Falls back to local file search if initialisation fails. |
| `MODEL` | No | Overrides the default model (`gpt-5`) used by the assistant agent. |
| `ALLOWED_ORIGINS` | No | Comma-separated list of additional origins that are permitted to access the API. These entries are merged with built-in Workflow SG domains (including `https://pixsnap.workflow.sg`) and common localhost ports. |

Origins listed in `ALLOWED_ORIGINS` are compared case-insensitively. All subdomains under `*.workflow.sg` are accepted by default.
