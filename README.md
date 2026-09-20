# ExpertMCP

[![MCP](https://img.shields.io/badge/MCP-Model_Context_Protocol-blue)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-green)]()

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that provides an `ask_expert` tool, allowing MCP clients to query an LLM-powered expert independently on any topic. Each invocation is stateless and does not retain conversation history.

## Features

- **Ask an Expert** - Query an LLM expert on any topic with a single tool call
- **Configurable System Prompt** - Define expert behavior via environment variable or file
- **Customizable Model** - Choose any OpenAI-compatible model (default: `gpt-4o-mini`)
- **OpenAI-Compatible** - Works with OpenAI or any compatible API endpoint
- **Retry Logic** - Automatically retries transient errors with exponential backoff
- **Type-Safe** - Built with TypeScript and Zod schema validation

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Configuration

ExpertMCP is configured via the following environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | - | OpenAI API key |
| `OPENAI_BASE_URL` | No | `https://api.openai.com/v1` | OpenAI-compatible API base URL |
| `EXPERT_SYSTEM_PROMPT` | No | `"You are a helpful expert. Answer the user's question concisely and accurately."` | System prompt for the expert |
| `EXPERT_SYSTEM_PROMPT_FILE` | No | - | Path to a file containing the system prompt (overrides `EXPERT_SYSTEM_PROMPT`) |
| `EXPERT_MODEL` | No | `gpt-4o-mini` | Model identifier to use |

## Usage

### As an MCP Server

Start the server:

```bash
npm start
```

The server communicates via [stdio](https://modelcontextprotocol.io/docs/concepts/transports#stdio).

### Available Tool

#### `ask_expert`

Ask an expert about a specific topic. Each invocation is independent and does not retain conversation history.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `question` | `string` | The question to ask the expert |

**Example:**

```json
{
  "question": "What is the time complexity of quicksort?"
}
```

### Example with MCP Client

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["dist/index.js"],
  env: {
    OPENAI_API_KEY: "your-api-key",
    EXPERT_MODEL: "gpt-4o",
  },
});

const client = new Client({ name: "example-client", version: "1.0.0" });
await client.connect(transport);

const result = await client.callTool({
  name: "ask_expert",
  arguments: {
    question: "Explain the CAP theorem in simple terms.",
  },
});

console.log(result);
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run watch
```

## License

MIT
