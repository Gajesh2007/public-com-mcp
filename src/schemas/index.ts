// Zod schemas for MCP tool inputs

import { z } from "zod";

// Enums as Zod schemas
export const InstrumentTypeSchema = z.enum([
  "ALT",
  "BOND",
  "CRYPTO",
  "EQUITY",
  "INDEX",
  "MULTI_LEG_INSTRUMENT",
  "OPTION",
  "TREASURY",
]);

export const OrderSideSchema = z.enum(["BUY", "SELL"]);

export const OrderTypeSchema = z.enum(["MARKET", "LIMIT", "STOP", "STOP_LIMIT"]);

export const TimeInForceSchema = z.enum(["DAY", "GTD"]);

export const OpenCloseIndicatorSchema = z.enum(["OPEN", "CLOSE"]);

export const EquityMarketSessionSchema = z.enum(["CORE", "EXTENDED"]);

export const LegInstrumentTypeSchema = z.enum(["EQUITY", "OPTION"]);

// Common schemas
export const OrderInstrumentSchema = z.object({
  symbol: z.string().describe("The ticker symbol (e.g., AAPL, BTC, SPY)"),
  type: InstrumentTypeSchema.describe("The instrument type"),
});

// Market data tool schemas
export const GetQuoteSchema = {
  symbol: z.string().describe("The ticker symbol (e.g., AAPL, BTC)"),
  type: InstrumentTypeSchema.describe("The instrument type (EQUITY, CRYPTO, OPTION, etc.)"),
};

export const GetQuotesSchema = {
  instruments: z
    .array(OrderInstrumentSchema)
    .min(1)
    .max(50)
    .describe("Array of instruments to get quotes for (max 50)"),
};

export const GetInstrumentSchema = {
  symbol: z.string().describe("The ticker symbol"),
  type: InstrumentTypeSchema.describe("The instrument type"),
};

export const SearchInstrumentsSchema = {
  typeFilter: InstrumentTypeSchema.optional().describe(
    "Filter by instrument type (EQUITY, CRYPTO, etc.)"
  ),
  tradingFilter: z.string().optional().describe("Filter by trading capability"),
};

// Options tool schemas
export const GetOptionExpirationsSchema = {
  symbol: z.string().describe("The underlying symbol (e.g., AAPL, SPY)"),
  type: InstrumentTypeSchema.describe("The instrument type (usually EQUITY)"),
};

export const GetOptionChainSchema = {
  symbol: z.string().describe("The underlying symbol (e.g., AAPL, SPY)"),
  type: InstrumentTypeSchema.describe("The instrument type (usually EQUITY)"),
  expirationDate: z
    .string()
    .describe("The expiration date in YYYY-MM-DD format"),
};

export const GetOptionGreeksSchema = {
  osiSymbols: z
    .array(z.string())
    .min(1)
    .max(20)
    .describe(
      "Array of OSI-normalized option symbols (e.g., AAPL230120C00150000)"
    ),
};

// Account tool schemas
export const GetAccountsSchema = {};

export const GetPortfolioSchema = {
  accountId: z.string().optional().describe("Account ID (optional if default is set)"),
};

export const GetAccountHistorySchema = {
  accountId: z.string().optional().describe("Account ID (optional if default is set)"),
  startTime: z.string().optional().describe("Start time in ISO 8601 format"),
  endTime: z.string().optional().describe("End time in ISO 8601 format"),
  continuationToken: z.string().optional().describe("Token for pagination"),
};

// Order expiration schema
export const OrderExpirationSchema = z.object({
  timeInForce: TimeInForceSchema.describe("DAY for same-day, GTD for good-til-date"),
  expirationTime: z
    .string()
    .optional()
    .describe("Expiration datetime in ISO 8601 format (required for GTD)"),
});

// Preflight tool schemas
export const PreflightOrderSchema = {
  symbol: z.string().describe("The ticker symbol"),
  type: InstrumentTypeSchema.describe("The instrument type"),
  orderSide: OrderSideSchema.describe("BUY or SELL"),
  orderType: OrderTypeSchema.describe("MARKET, LIMIT, STOP, or STOP_LIMIT"),
  timeInForce: TimeInForceSchema.describe("DAY or GTD"),
  expirationTime: z.string().optional().describe("Required for GTD orders"),
  quantity: z.string().optional().describe("Number of shares/contracts"),
  amount: z.string().optional().describe("Dollar amount (mutually exclusive with quantity)"),
  limitPrice: z.string().optional().describe("Limit price (for LIMIT/STOP_LIMIT orders)"),
  stopPrice: z.string().optional().describe("Stop price (for STOP/STOP_LIMIT orders)"),
  openCloseIndicator: OpenCloseIndicatorSchema.optional().describe(
    "For options: OPEN or CLOSE"
  ),
  equityMarketSession: EquityMarketSessionSchema.optional().describe(
    "CORE or EXTENDED session"
  ),
  accountId: z.string().optional().describe("Account ID (optional if default is set)"),
};

// Leg schema for multi-leg orders
export const OrderLegSchema = z.object({
  symbol: z.string().describe("The symbol for this leg"),
  type: LegInstrumentTypeSchema.describe("EQUITY or OPTION"),
  side: OrderSideSchema.describe("BUY or SELL"),
  openCloseIndicator: OpenCloseIndicatorSchema.optional().describe(
    "Required for OPTION legs"
  ),
  ratioQuantity: z.number().optional().describe("Ratio between legs"),
});

export const PreflightMultilegSchema = {
  orderType: z.literal("LIMIT").describe("Only LIMIT orders supported for multi-leg"),
  timeInForce: TimeInForceSchema.describe("DAY or GTD"),
  expirationTime: z.string().optional().describe("Required for GTD orders"),
  quantity: z.number().optional().describe("Quantity of the spread"),
  limitPrice: z.string().describe("Limit price for the spread"),
  legs: z
    .array(OrderLegSchema)
    .min(2)
    .max(6)
    .describe("2-6 legs, max 1 equity leg"),
  accountId: z.string().optional().describe("Account ID (optional if default is set)"),
};

// Order tool schemas
export const PlaceOrderSchema = {
  orderId: z.string().uuid().describe("UUID for the order (for idempotency)"),
  symbol: z.string().describe("The ticker symbol"),
  type: InstrumentTypeSchema.describe("The instrument type"),
  orderSide: OrderSideSchema.describe("BUY or SELL"),
  orderType: OrderTypeSchema.describe("MARKET, LIMIT, STOP, or STOP_LIMIT"),
  timeInForce: TimeInForceSchema.describe("DAY or GTD"),
  expirationTime: z.string().optional().describe("Required for GTD orders"),
  quantity: z.string().optional().describe("Number of shares/contracts"),
  amount: z.string().optional().describe("Dollar amount (mutually exclusive with quantity)"),
  limitPrice: z.string().optional().describe("Limit price (for LIMIT/STOP_LIMIT orders)"),
  stopPrice: z.string().optional().describe("Stop price (for STOP/STOP_LIMIT orders)"),
  openCloseIndicator: OpenCloseIndicatorSchema.optional().describe(
    "For options: OPEN or CLOSE"
  ),
  equityMarketSession: EquityMarketSessionSchema.optional().describe(
    "CORE or EXTENDED session"
  ),
  accountId: z.string().optional().describe("Account ID (optional if default is set)"),
};

export const PlaceMultilegOrderSchema = {
  orderId: z.string().uuid().describe("UUID for the order (for idempotency)"),
  quantity: z.number().positive().describe("Quantity of the spread"),
  orderType: z.literal("LIMIT").describe("Only LIMIT orders supported"),
  limitPrice: z.string().optional().describe("Limit price (positive for debit, negative for credit)"),
  timeInForce: TimeInForceSchema.describe("DAY or GTD"),
  expirationTime: z.string().optional().describe("Required for GTD orders"),
  legs: z
    .array(OrderLegSchema)
    .min(2)
    .max(6)
    .describe("2-6 legs, max 1 equity leg"),
  accountId: z.string().optional().describe("Account ID (optional if default is set)"),
};

export const GetOrderSchema = {
  orderId: z.string().describe("The order ID to retrieve"),
  accountId: z.string().optional().describe("Account ID (optional if default is set)"),
};

export const CancelOrderSchema = {
  orderId: z.string().describe("The order ID to cancel"),
  accountId: z.string().optional().describe("Account ID (optional if default is set)"),
};
