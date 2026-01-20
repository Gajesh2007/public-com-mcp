// Account tools for Public.com MCP Server

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PublicApiClient } from "../client/public-api";
import {
  GetAccountsSchema,
  GetPortfolioSchema,
  GetAccountHistorySchema,
} from "../schemas";

export function registerAccountTools(
  server: McpServer,
  client: PublicApiClient
) {
  // Get accounts
  server.tool(
    "get_accounts",
    "List all trading accounts associated with your API key",
    GetAccountsSchema,
    async () => {
      try {
        const response = await client.getAccounts();

        if (response.accounts.length === 0) {
          return {
            content: [{ type: "text", text: "No accounts found" }],
          };
        }

        const formatted = response.accounts.map((a) => {
          return [
            `**Account ${a.accountNumber}**`,
            `  ID: ${a.accountId}`,
            `  Type: ${a.accountType}`,
            `  Status: ${a.accountStatus}`,
          ].join("\n");
        });

        return {
          content: [{ type: "text", text: formatted.join("\n\n") }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching accounts: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get portfolio
  server.tool(
    "get_portfolio",
    "Get portfolio snapshot including positions, equity, cash balance, and buying power",
    GetPortfolioSchema,
    async ({ accountId }) => {
      try {
        const portfolio = await client.getPortfolio(accountId);

        const lines = [
          `**Portfolio for Account ${portfolio.accountId}**`,
          `Account Type: ${portfolio.accountType}`,
          "",
          "### Buying Power",
          `Cash Only: $${portfolio.buyingPower.cashOnlyBuyingPower}`,
          `Margin: $${portfolio.buyingPower.buyingPower}`,
          `Options: $${portfolio.buyingPower.optionsBuyingPower}`,
          "",
          "### Equity Breakdown",
        ];

        for (const eq of portfolio.equity) {
          const pct = eq.percentageOfPortfolio
            ? ` (${eq.percentageOfPortfolio}%)`
            : "";
          lines.push(`${eq.type}: $${eq.value}${pct}`);
        }

        lines.push("", "### Positions");

        if (portfolio.positions.length === 0) {
          lines.push("No open positions");
        } else {
          for (const pos of portfolio.positions) {
            const posLines = [
              `**${pos.instrument.symbol}** - ${pos.instrument.name} (${pos.instrument.type})`,
              `  Quantity: ${pos.quantity}`,
            ];
            if (pos.currentValue) posLines.push(`  Current Value: $${pos.currentValue}`);
            if (pos.costBasis?.unitCost) posLines.push(`  Avg Cost: $${pos.costBasis.unitCost}`);
            if (pos.costBasis?.gainValue) {
              const gain = parseFloat(pos.costBasis.gainValue);
              const sign = gain >= 0 ? "+" : "";
              posLines.push(`  Gain/Loss: ${sign}$${pos.costBasis.gainValue}`);
            }
            if (pos.costBasis?.gainPercentage) {
              const pct = parseFloat(pos.costBasis.gainPercentage);
              const sign = pct >= 0 ? "+" : "";
              posLines.push(`  Gain %: ${sign}${pos.costBasis.gainPercentage}%`);
            }
            lines.push(posLines.join("\n"));
          }
        }

        if (portfolio.orders && portfolio.orders.length > 0) {
          lines.push("", "### Open Orders", `${portfolio.orders.length} open order(s)`);
        }

        return {
          content: [{ type: "text", text: lines.join("\n") }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching portfolio: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get account history
  server.tool(
    "get_account_history",
    "Get account transaction history with optional time range filtering and pagination",
    GetAccountHistorySchema,
    async ({ accountId, startTime, endTime, continuationToken }) => {
      try {
        const response = await client.getHistory(
          { startTime, endTime, continuationToken },
          accountId
        );

        if (response.events.length === 0) {
          return {
            content: [{ type: "text", text: "No history events found" }],
          };
        }

        const lines = ["**Account History**", ""];

        for (const event of response.events) {
          const eventLines = [
            `**${event.eventType}** - ${event.timestamp}`,
            `  ${event.description}`,
          ];
          if (event.amount) eventLines.push(`  Amount: $${event.amount}`);
          if (event.instrument) {
            eventLines.push(
              `  Instrument: ${event.instrument.symbol} (${event.instrument.type})`
            );
          }
          lines.push(eventLines.join("\n"));
        }

        if (response.continuationToken) {
          lines.push(
            "",
            `_More results available. Use continuationToken: ${response.continuationToken}_`
          );
        }

        return {
          content: [{ type: "text", text: lines.join("\n") }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching history: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
