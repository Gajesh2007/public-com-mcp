// Options tools for Public.com MCP Server

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PublicApiClient } from "../client/public-api";
import {
  GetOptionExpirationsSchema,
  GetOptionChainSchema,
  GetOptionGreeksSchema,
} from "../schemas";
import { InstrumentType, type Quote } from "../client/types";

function formatOptionQuote(quote: Quote, optionType: "CALL" | "PUT"): string {
  const symbol = quote.instrument.symbol;
  const lines = [
    `${optionType}: ${symbol}`,
    quote.last ? `  Last: $${quote.last}` : null,
    quote.bid ? `  Bid: $${quote.bid} x ${quote.bidSize ?? "?"}` : null,
    quote.ask ? `  Ask: $${quote.ask} x ${quote.askSize ?? "?"}` : null,
    quote.volume ? `  Vol: ${quote.volume}` : null,
    quote.openInterest ? `  OI: ${quote.openInterest}` : null,
  ].filter(Boolean);

  return lines.join("\n");
}

export function registerOptionsTools(
  server: McpServer,
  client: PublicApiClient
) {
  // Get option expirations
  server.tool(
    "get_option_expirations",
    "Get available option expiration dates for an underlying symbol",
    GetOptionExpirationsSchema,
    async ({ symbol, type }) => {
      try {
        const response = await client.getOptionExpirations({
          symbol,
          type: type as InstrumentType,
        });

        const lines = [
          `**Option Expirations for ${response.baseSymbol}**`,
          "",
          ...response.expirations.map((exp) => `- ${exp}`),
        ];

        return {
          content: [{ type: "text", text: lines.join("\n") }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching expirations: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get option chain
  server.tool(
    "get_option_chain",
    "Get the full options chain (calls and puts) for a specific expiration date",
    GetOptionChainSchema,
    async ({ symbol, type, expirationDate }) => {
      try {
        const response = await client.getOptionChain(
          { symbol, type: type as InstrumentType },
          expirationDate
        );

        const lines = [
          `**Options Chain for ${response.baseSymbol}**`,
          `Expiration: ${expirationDate}`,
          "",
          "### CALLS",
          "",
        ];

        if (response.calls.length > 0) {
          lines.push(...response.calls.map((c) => formatOptionQuote(c, "CALL")));
        } else {
          lines.push("No calls available");
        }

        lines.push("", "### PUTS", "");

        if (response.puts.length > 0) {
          lines.push(...response.puts.map((p) => formatOptionQuote(p, "PUT")));
        } else {
          lines.push("No puts available");
        }

        return {
          content: [{ type: "text", text: lines.join("\n") }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching option chain: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get option Greeks
  server.tool(
    "get_option_greeks",
    "Get Greeks (delta, gamma, theta, vega, rho, IV) for option contracts",
    GetOptionGreeksSchema,
    async ({ osiSymbols }) => {
      try {
        const response = await client.getOptionGreeks(osiSymbols);

        if (response.greeks.length === 0) {
          return {
            content: [{ type: "text", text: "No Greeks data found" }],
          };
        }

        const formatted = response.greeks.map((g) => {
          const lines = [
            `**${g.symbol}**`,
            `  Delta: ${g.greeks.delta}`,
            `  Gamma: ${g.greeks.gamma}`,
            `  Theta: ${g.greeks.theta}`,
            `  Vega: ${g.greeks.vega}`,
            `  Rho: ${g.greeks.rho}`,
            `  IV: ${(parseFloat(g.greeks.impliedVolatility) * 100).toFixed(2)}%`,
          ];
          return lines.join("\n");
        });

        return {
          content: [{ type: "text", text: formatted.join("\n\n") }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching Greeks: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
