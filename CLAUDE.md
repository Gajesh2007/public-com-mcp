# Public.com MCP Server - Development Guidelines

## Runtime

Use Bun instead of Node.js:
- `bun run src/index.ts` to start the server
- `bun test` to run integration tests
- `bun install` for dependencies
- Bun automatically loads `.env` - don't use dotenv

## Project Structure

```
src/
├── index.ts          # Entry point (stdio transport)
├── server.ts         # MCP server configuration
├── client/
│   ├── types.ts      # TypeScript type definitions
│   ├── auth.ts       # API token management
│   └── public-api.ts # HTTP client for Public.com
├── tools/
│   ├── market-data.ts # Quote & instrument tools
│   ├── options.ts     # Options chain & Greeks
│   ├── account.ts     # Portfolio & history
│   └── orders.ts      # Order placement (guarded)
└── schemas/
    └── index.ts       # Zod validation schemas
```

## Key Patterns

### Tool Registration

Tools are registered in `src/server.ts` using MCP SDK:
```typescript
server.tool("tool_name", "description", schema, async (args) => {
  // handler
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});
```

### Safety Guards

Order tools check `ENABLE_TRADING=true` before executing:
```typescript
function assertTradingEnabled(): void {
  if (process.env.ENABLE_TRADING !== "true") {
    throw new Error("Trading is disabled");
  }
}
```

### Auth Flow

Public.com uses token exchange:
1. API secret → `/userapiauthservice/personal/access-tokens` → access token
2. Access token used as Bearer for all requests
3. Auto-refresh before expiry (5-min buffer)

## Testing

Integration tests require a valid API key in `.env`:
```bash
bun test
```

To test MCP protocol via stdio:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | bun run src/index.ts
```

## API Reference

- Base URL: `https://api.public.com`
- Postman collection: https://github.com/public-com/postman-collections

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PUBLIC_API_SECRET_KEY` | Yes | API key from public.com/settings/api |
| `PUBLIC_DEFAULT_ACCOUNT_ID` | No | Default account (use get_accounts to find) |
| `ENABLE_TRADING` | No | Set "true" to enable order placement |
