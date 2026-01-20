// Basic tests for Public.com MCP Server

import { test, expect, describe } from "bun:test";
import { z } from "zod";
import {
  GetQuoteSchema,
  GetQuotesSchema,
  GetOptionChainSchema,
  PlaceOrderSchema,
  InstrumentTypeSchema,
} from "../src/schemas";

describe("Schemas", () => {
  test("InstrumentTypeSchema validates correctly", () => {
    expect(() => InstrumentTypeSchema.parse("EQUITY")).not.toThrow();
    expect(() => InstrumentTypeSchema.parse("CRYPTO")).not.toThrow();
    expect(() => InstrumentTypeSchema.parse("OPTION")).not.toThrow();
    expect(() => InstrumentTypeSchema.parse("INVALID")).toThrow();
  });

  test("GetQuoteSchema validates correctly", () => {
    const schema = z.object(GetQuoteSchema);
    expect(() =>
      schema.parse({ symbol: "AAPL", type: "EQUITY" })
    ).not.toThrow();
    expect(() => schema.parse({ symbol: "BTC", type: "CRYPTO" })).not.toThrow();
    expect(() => schema.parse({ symbol: "AAPL" })).toThrow(); // missing type
  });

  test("GetQuotesSchema validates correctly", () => {
    const schema = z.object(GetQuotesSchema);
    expect(() =>
      schema.parse({
        instruments: [
          { symbol: "AAPL", type: "EQUITY" },
          { symbol: "GOOGL", type: "EQUITY" },
        ],
      })
    ).not.toThrow();
    expect(() => schema.parse({ instruments: [] })).toThrow(); // min 1
  });

  test("GetOptionChainSchema validates correctly", () => {
    const schema = z.object(GetOptionChainSchema);
    expect(() =>
      schema.parse({
        symbol: "AAPL",
        type: "EQUITY",
        expirationDate: "2024-01-19",
      })
    ).not.toThrow();
  });

  test("PlaceOrderSchema validates UUID", () => {
    const schema = z.object(PlaceOrderSchema);
    const validOrder = {
      orderId: "550e8400-e29b-41d4-a716-446655440000",
      symbol: "AAPL",
      type: "EQUITY",
      orderSide: "BUY",
      orderType: "LIMIT",
      timeInForce: "DAY",
      quantity: "10",
      limitPrice: "150.00",
    };
    expect(() => schema.parse(validOrder)).not.toThrow();

    const invalidOrder = {
      ...validOrder,
      orderId: "not-a-uuid",
    };
    expect(() => schema.parse(invalidOrder)).toThrow();
  });
});

describe("Types", () => {
  test("InstrumentType enum values", async () => {
    const { InstrumentType } = await import("../src/client/types");
    expect(InstrumentType.EQUITY).toBe("EQUITY");
    expect(InstrumentType.OPTION).toBe("OPTION");
    expect(InstrumentType.CRYPTO).toBe("CRYPTO");
  });

  test("OrderStatus enum values", async () => {
    const { OrderStatus } = await import("../src/client/types");
    expect(OrderStatus.NEW).toBe("NEW");
    expect(OrderStatus.FILLED).toBe("FILLED");
    expect(OrderStatus.CANCELLED).toBe("CANCELLED");
  });
});
