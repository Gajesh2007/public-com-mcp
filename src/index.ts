#!/usr/bin/env bun
// Public.com MCP Server Entry Point

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server";

async function main() {
  const server = createServer();

  // Use stdio transport for MCP communication
  const transport = new StdioServerTransport();

  // Connect server to transport
  await server.connect(transport);

  console.error("Public.com MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
