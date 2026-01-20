// Order tools for Public.com MCP Server
// IMPORTANT: Order placement requires ENABLE_TRADING=true environment variable

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PublicApiClient } from "../client/public-api";
import {
  PreflightOrderSchema,
  PreflightMultilegSchema,
  PlaceOrderSchema,
  PlaceMultilegOrderSchema,
  GetOrderSchema,
  CancelOrderSchema,
} from "../schemas";
import {
  InstrumentType,
  OrderSide,
  OrderType,
  TimeInForce,
  OpenCloseIndicator,
  EquityMarketSession,
  LegInstrumentType,
  type PreflightRequest,
  type PreflightMultiLegRequest,
  type OrderRequest,
  type MultilegOrderRequest,
} from "../client/types";

function assertTradingEnabled(): void {
  if (process.env.ENABLE_TRADING !== "true") {
    throw new Error(
      "Order placement is DISABLED. Set ENABLE_TRADING=true in environment to enable trading. " +
        "This is a safety measure to prevent accidental trades."
    );
  }
}

function formatPreflightResponse(preflight: {
  instrument: { symbol: string; type: string };
  orderValue: string;
  estimatedCommission?: string;
  estimatedQuantity?: string;
  estimatedCost?: string;
  buyingPowerRequirement?: string;
  estimatedProceeds?: string;
}): string {
  const lines = [
    `**Preflight for ${preflight.instrument.symbol}**`,
    "",
    `Order Value: $${preflight.orderValue}`,
  ];

  if (preflight.estimatedQuantity) {
    lines.push(`Est. Quantity: ${preflight.estimatedQuantity}`);
  }
  if (preflight.estimatedCommission) {
    lines.push(`Est. Commission: $${preflight.estimatedCommission}`);
  }
  if (preflight.estimatedCost) {
    lines.push(`Est. Cost: $${preflight.estimatedCost}`);
  }
  if (preflight.estimatedProceeds) {
    lines.push(`Est. Proceeds: $${preflight.estimatedProceeds}`);
  }
  if (preflight.buyingPowerRequirement) {
    lines.push(`Buying Power Req: $${preflight.buyingPowerRequirement}`);
  }

  return lines.join("\n");
}

export function registerOrderTools(
  server: McpServer,
  client: PublicApiClient
) {
  // Preflight single-leg order
  server.tool(
    "preflight_order",
    "Calculate estimated costs and requirements for a single-leg order before placing it (read-only)",
    PreflightOrderSchema,
    async ({
      symbol,
      type,
      orderSide,
      orderType,
      timeInForce,
      expirationTime,
      quantity,
      amount,
      limitPrice,
      stopPrice,
      openCloseIndicator,
      equityMarketSession,
      accountId,
    }) => {
      try {
        const request: PreflightRequest = {
          instrument: { symbol, type: type as InstrumentType },
          orderSide: orderSide as OrderSide,
          orderType: orderType as OrderType,
          expiration: {
            timeInForce: timeInForce as TimeInForce,
            expirationTime,
          },
          quantity,
          amount,
          limitPrice,
          stopPrice,
          openCloseIndicator: openCloseIndicator as OpenCloseIndicator | undefined,
          equityMarketSession: equityMarketSession as EquityMarketSession | undefined,
        };

        const preflight = await client.performPreflightCalculation(
          request,
          accountId
        );

        return {
          content: [{ type: "text", text: formatPreflightResponse(preflight) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Preflight error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Preflight multi-leg order
  server.tool(
    "preflight_multileg",
    "Calculate estimated costs for a multi-leg options strategy before placing it (read-only)",
    PreflightMultilegSchema,
    async ({
      orderType,
      timeInForce,
      expirationTime,
      quantity,
      limitPrice,
      legs,
      accountId,
    }) => {
      try {
        const request: PreflightMultiLegRequest = {
          orderType: orderType as OrderType,
          expiration: {
            timeInForce: timeInForce as TimeInForce,
            expirationTime,
          },
          quantity,
          limitPrice,
          legs: legs.map((leg) => ({
            instrument: {
              symbol: leg.symbol,
              type: leg.type as LegInstrumentType,
            },
            side: leg.side as OrderSide,
            openCloseIndicator: leg.openCloseIndicator as OpenCloseIndicator | undefined,
            ratioQuantity: leg.ratioQuantity,
          })),
        };

        const preflight = await client.performMultiLegPreflightCalculation(
          request,
          accountId
        );

        const lines = [
          `**Multi-Leg Preflight for ${preflight.baseSymbol}**`,
          preflight.strategyName ? `Strategy: ${preflight.strategyName}` : null,
          "",
          `Order Value: $${preflight.orderValue}`,
          preflight.estimatedCommission
            ? `Est. Commission: $${preflight.estimatedCommission}`
            : null,
          preflight.estimatedCost ? `Est. Cost: $${preflight.estimatedCost}` : null,
          preflight.estimatedProceeds
            ? `Est. Proceeds: $${preflight.estimatedProceeds}`
            : null,
          preflight.buyingPowerRequirement
            ? `Buying Power Req: $${preflight.buyingPowerRequirement}`
            : null,
          "",
          "### Legs",
          ...preflight.legs.map(
            (leg) =>
              `- ${leg.side} ${leg.instrument.symbol} (${leg.instrument.type}) x${leg.ratioQuantity}`
          ),
        ].filter(Boolean);

        return {
          content: [{ type: "text", text: lines.join("\n") }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Preflight error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Place single-leg order
  server.tool(
    "place_order",
    "Place a single-leg order (REQUIRES ENABLE_TRADING=true). This executes a REAL trade.",
    PlaceOrderSchema,
    async ({
      orderId,
      symbol,
      type,
      orderSide,
      orderType,
      timeInForce,
      expirationTime,
      quantity,
      amount,
      limitPrice,
      stopPrice,
      openCloseIndicator,
      equityMarketSession,
      accountId,
    }) => {
      try {
        assertTradingEnabled();

        const request: OrderRequest = {
          orderId,
          instrument: { symbol, type: type as InstrumentType },
          orderSide: orderSide as OrderSide,
          orderType: orderType as OrderType,
          expiration: {
            timeInForce: timeInForce as TimeInForce,
            expirationTime,
          },
          quantity,
          amount,
          limitPrice,
          stopPrice,
          openCloseIndicator: openCloseIndicator as OpenCloseIndicator | undefined,
          equityMarketSession: equityMarketSession as EquityMarketSession | undefined,
        };

        const result = await client.placeOrder(request, accountId);

        return {
          content: [
            {
              type: "text",
              text: [
                "**Order Submitted Successfully**",
                "",
                `Order ID: ${result.orderId}`,
                `Symbol: ${symbol}`,
                `Side: ${orderSide}`,
                `Type: ${orderType}`,
                quantity ? `Quantity: ${quantity}` : `Amount: $${amount}`,
                "",
                "_Note: Order placement is asynchronous. Use get_order to check status._",
              ].join("\n"),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Order error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Place multi-leg order
  server.tool(
    "place_multileg_order",
    "Place a multi-leg options order (REQUIRES ENABLE_TRADING=true). This executes a REAL trade.",
    PlaceMultilegOrderSchema,
    async ({
      orderId,
      quantity,
      orderType,
      limitPrice,
      timeInForce,
      expirationTime,
      legs,
      accountId,
    }) => {
      try {
        assertTradingEnabled();

        const request: MultilegOrderRequest = {
          orderId,
          quantity,
          type: orderType as OrderType,
          limitPrice,
          expiration: {
            timeInForce: timeInForce as TimeInForce,
            expirationTime,
          },
          legs: legs.map((leg) => ({
            instrument: {
              symbol: leg.symbol,
              type: leg.type as LegInstrumentType,
            },
            side: leg.side as OrderSide,
            openCloseIndicator: leg.openCloseIndicator as OpenCloseIndicator | undefined,
            ratioQuantity: leg.ratioQuantity,
          })),
        };

        const result = await client.placeMultilegOrder(request, accountId);

        const legSummary = legs
          .map((l) => `  ${l.side} ${l.symbol} (${l.type})`)
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text: [
                "**Multi-Leg Order Submitted Successfully**",
                "",
                `Order ID: ${result.orderId}`,
                `Quantity: ${quantity}`,
                `Limit Price: ${limitPrice ?? "Market"}`,
                "",
                "Legs:",
                legSummary,
                "",
                "_Note: Order placement is asynchronous. Use get_order to check status._",
              ].join("\n"),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Order error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get order status
  server.tool(
    "get_order",
    "Get the status and details of a specific order",
    GetOrderSchema,
    async ({ orderId, accountId }) => {
      try {
        const order = await client.getOrder(orderId, accountId);

        const lines = [
          `**Order ${order.orderId}**`,
          "",
          `Status: **${order.status}**`,
          `Symbol: ${order.instrument.symbol} (${order.instrument.type})`,
          `Side: ${order.side}`,
          `Type: ${order.type}`,
        ];

        if (order.quantity) lines.push(`Quantity: ${order.quantity}`);
        if (order.notionalValue) lines.push(`Notional Value: $${order.notionalValue}`);
        if (order.limitPrice) lines.push(`Limit Price: $${order.limitPrice}`);
        if (order.stopPrice) lines.push(`Stop Price: $${order.stopPrice}`);
        if (order.filledQuantity) lines.push(`Filled Qty: ${order.filledQuantity}`);
        if (order.averagePrice) lines.push(`Avg Price: $${order.averagePrice}`);
        if (order.createdAt) lines.push(`Created: ${order.createdAt}`);
        if (order.closedAt) lines.push(`Closed: ${order.closedAt}`);
        if (order.rejectReason) lines.push(`Reject Reason: ${order.rejectReason}`);

        if (order.legs && order.legs.length > 0) {
          lines.push("", "Legs:");
          for (const leg of order.legs) {
            lines.push(
              `  ${leg.side} ${leg.instrument.symbol} (${leg.instrument.type}) x${leg.ratioQuantity ?? 1}`
            );
          }
        }

        return {
          content: [{ type: "text", text: lines.join("\n") }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching order: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Cancel order
  server.tool(
    "cancel_order",
    "Cancel a pending order (REQUIRES ENABLE_TRADING=true)",
    CancelOrderSchema,
    async ({ orderId, accountId }) => {
      try {
        assertTradingEnabled();

        await client.cancelOrder(orderId, accountId);

        return {
          content: [
            {
              type: "text",
              text: [
                "**Cancel Request Submitted**",
                "",
                `Order ID: ${orderId}`,
                "",
                "_Note: Cancellation is asynchronous. Use get_order to confirm cancellation._",
              ].join("\n"),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Cancel error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
