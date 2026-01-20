# Public.com MCP Server

An MCP (Model Context Protocol) server that provides AI assistants with access to Public.com's stock and options trading APIs.

## Features

- **Real-time market data** - Stock and crypto quotes, bid/ask spreads, volume
- **Options analytics** - Chains, expirations, Greeks (delta, gamma, theta, vega, rho, IV)
- **Portfolio management** - View positions, equity, buying power, transaction history
- **Order placement** - Single-leg and multi-leg orders with safety guards
- **Pre-trade analysis** - Preflight calculations for cost estimates before trading

## Prerequisites

- Node.js 18+ or [Bun](https://bun.sh) runtime
- Public.com account with API access
- API secret key from [Public.com Settings](https://public.com/settings/api)

## Installation

### Via npm (recommended)

```bash
npm install -g public-com-mcp
```

### Via npx (no install)

```bash
npx public-com-mcp
```

### From source

```bash
git clone https://github.com/Gajesh2007/public-com-mcp.git
cd public-com-mcp
bun install
```

## Configuration

Edit `.env` with your credentials:

```env
# Required - your API secret key
PUBLIC_API_SECRET_KEY=your-api-secret-key

# Optional - default account ID (use get_accounts to find yours)
PUBLIC_DEFAULT_ACCOUNT_ID=

# Safety - set to "true" to enable live trading (default: false)
ENABLE_TRADING=false
```

## Usage

### With Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

**Using npx (easiest):**
```json
{
  "mcpServers": {
    "public-stocks": {
      "command": "npx",
      "args": ["public-com-mcp"],
      "env": {
        "PUBLIC_API_SECRET_KEY": "your-api-key"
      }
    }
  }
}
```

**Using global install:**
```json
{
  "mcpServers": {
    "public-stocks": {
      "command": "public-com-mcp",
      "env": {
        "PUBLIC_API_SECRET_KEY": "your-api-key"
      }
    }
  }
}
```

**Using Bun (from source):**
```json
{
  "mcpServers": {
    "public-stocks": {
      "command": "bun",
      "args": ["run", "/path/to/public-com-mcp/src/index.ts"]
    }
  }
}
```

### Standalone

```bash
# Via npx
npx public-com-mcp

# Via global install
public-com-mcp

# From source with Bun
bun run src/index.ts
```

### Development

```bash
# Run with hot reload
bun run dev

# Build for distribution
bun run build

# Run tests
bun test
```

## Available Tools

### Market Data
| Tool | Description |
|------|-------------|
| `get_quote` | Get real-time quote for a single symbol |
| `get_quotes` | Batch quotes for multiple symbols (max 50) |
| `get_instrument` | Get trading capabilities for a symbol |
| `search_instruments` | Search/filter available instruments |

### Options
| Tool | Description |
|------|-------------|
| `get_option_expirations` | List available expiration dates |
| `get_option_chain` | Full options chain for an expiration |
| `get_option_greeks` | Greeks for option contracts |

### Account
| Tool | Description |
|------|-------------|
| `get_accounts` | List your trading accounts |
| `get_portfolio` | Portfolio snapshot with positions |
| `get_account_history` | Transaction history |

### Orders
| Tool | Description |
|------|-------------|
| `preflight_order` | Estimate costs before placing |
| `preflight_multileg` | Estimate multi-leg strategy costs |
| `place_order` | Place single-leg order* |
| `place_multileg_order` | Place options spread* |
| `cancel_order` | Cancel pending order* |
| `get_order` | Check order status |

*Requires `ENABLE_TRADING=true`

## Example Prompts

Once connected to Claude, you can ask:

- "What's the current price of AAPL?"
- "Show me the options chain for SPY expiring next Friday"
- "What are the Greeks for AAPL 250 calls expiring in February?"
- "What's in my portfolio?"
- "How much would it cost to buy 10 shares of NVDA?"

## Safety

**Trading is disabled by default.** The `place_order`, `place_multileg_order`, and `cancel_order` tools will not execute unless `ENABLE_TRADING=true` is set in your environment.

When trading is disabled, you can still:
- View real-time quotes and market data
- Analyze options chains and Greeks
- View your portfolio and account history
- Run preflight calculations to estimate order costs

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

## License

MIT

## Disclaimer

This software is provided as-is. Trading stocks and options involves risk. Always verify orders before enabling live trading. The authors are not responsible for any financial losses.
