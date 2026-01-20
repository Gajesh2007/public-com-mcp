// MCP Server configuration for Public.com

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PublicApiClient } from "./client/public-api";
import {
  registerMarketDataTools,
  registerOptionsTools,
  registerAccountTools,
  registerOrderTools,
} from "./tools";

export function createServer(): McpServer {
  // Get configuration from environment
  const apiSecretKey = process.env.PUBLIC_API_SECRET_KEY;
  const defaultAccountId = process.env.PUBLIC_DEFAULT_ACCOUNT_ID;

  if (!apiSecretKey) {
    console.error(
      "Warning: PUBLIC_API_SECRET_KEY not set. Most tools will fail."
    );
  }

  // Create API client
  const client = new PublicApiClient(apiSecretKey, defaultAccountId);

  // Create MCP server
  const server = new McpServer({
    name: "public-com-stocks",
    version: "1.0.0",
    description:
      "MCP Server for Public.com stock and options data. Provides real-time quotes, options chains, Greeks, portfolio data, and trading capabilities.",
  });

  // Register all tools
  registerMarketDataTools(server, client);
  registerOptionsTools(server, client);
  registerAccountTools(server, client);
  registerOrderTools(server, client);

  // Log trading status
  if (process.env.ENABLE_TRADING === "true") {
    console.error(
      "WARNING: Trading is ENABLED. Order placement tools will execute real trades."
    );
  } else {
    console.error(
      "Info: Trading is disabled. Set ENABLE_TRADING=true to enable order placement."
    );
  }

  return server;
}
