// Market data tools for Public.com MCP Server

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PublicApiClient } from "../client/public-api";
import {
  GetQuoteSchema,
  GetQuotesSchema,
  GetInstrumentSchema,
  SearchInstrumentsSchema,
} from "../schemas";
import { InstrumentType } from "../client/types";

function formatQuote(quote: {
  instrument: { symbol: string; type: string };
  outcome: string;
  last?: string;
  bid?: string;
  bidSize?: number;
  ask?: string;
  askSize?: number;
  volume?: number;
  openInterest?: number;
}): string {
  const lines = [
    `**${quote.instrument.symbol}** (${quote.instrument.type})`,
    `Status: ${quote.outcome}`,
  ];

  if (quote.last) lines.push(`Last: $${quote.last}`);
  if (quote.bid) lines.push(`Bid: $${quote.bid} x ${quote.bidSize ?? "?"}`);
  if (quote.ask) lines.push(`Ask: $${quote.ask} x ${quote.askSize ?? "?"}`);
  if (quote.volume) lines.push(`Volume: ${quote.volume.toLocaleString()}`);
  if (quote.openInterest) lines.push(`Open Interest: ${quote.openInterest.toLocaleString()}`);

  return lines.join("\n");
}

export function registerMarketDataTools(
  server: McpServer,
  client: PublicApiClient
) {
  // Get single quote
  server.tool(
    "get_quote",
    "Get real-time quote data for a single instrument including bid, ask, last price, and volume",
    GetQuoteSchema,
    async ({ symbol, type }) => {
      try {
        const quotes = await client.getQuotes([
          { symbol, type: type as InstrumentType },
        ]);

        if (quotes.length === 0) {
          return {
            content: [{ type: "text", text: `No quote found for ${symbol}` }],
            isError: true,
          };
        }

        return {
          content: [{ type: "text", text: formatQuote(quotes[0]) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching quote: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get multiple quotes
  server.tool(
    "get_quotes",
    "Get real-time quotes for multiple instruments in a single request (max 50)",
    GetQuotesSchema,
    async ({ instruments }) => {
      try {
        const quotes = await client.getQuotes(
          instruments.map((i) => ({
            symbol: i.symbol,
            type: i.type as InstrumentType,
          }))
        );

        if (quotes.length === 0) {
          return {
            content: [{ type: "text", text: "No quotes found" }],
            isError: true,
          };
        }

        const formatted = quotes.map(formatQuote).join("\n\n---\n\n");
        return {
          content: [{ type: "text", text: formatted }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching quotes: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get instrument details
  server.tool(
    "get_instrument",
    "Get detailed information about a specific instrument including trading capabilities",
    GetInstrumentSchema,
    async ({ symbol, type }) => {
      try {
        const instrument = await client.getInstrument(
          symbol,
          type as InstrumentType
        );

        const lines = [
          `**${instrument.symbol}** (${instrument.type})`,
          instrument.name ? `Name: ${instrument.name}` : null,
          `Tradeable: ${instrument.tradeable ? "Yes" : "No"}`,
          `Fractional Trading: ${instrument.fractionalTradingEnabled ? "Yes" : "No"}`,
          `Options Enabled: ${instrument.optionsEnabled ? "Yes" : "No"}`,
        ].filter(Boolean);

        return {
          content: [{ type: "text", text: lines.join("\n") }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching instrument: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Search instruments
  server.tool(
    "search_instruments",
    "Search for available trading instruments with optional filters",
    SearchInstrumentsSchema,
    async ({ typeFilter, tradingFilter }) => {
      try {
        const response = await client.getAllInstruments({
          typeFilter: typeFilter as InstrumentType | undefined,
          tradingFilter,
        });

        if (response.instruments.length === 0) {
          return {
            content: [
              { type: "text", text: "No instruments found matching criteria" },
            ],
          };
        }

        const summary = `Found ${response.instruments.length} instruments\n\n`;
        const list = response.instruments
          .slice(0, 50) // Limit output
          .map((i) => `- ${i.symbol} (${i.type})${i.name ? `: ${i.name}` : ""}`)
          .join("\n");

        const truncated =
          response.instruments.length > 50
            ? `\n\n... and ${response.instruments.length - 50} more`
            : "";

        return {
          content: [{ type: "text", text: summary + list + truncated }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error searching instruments: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
