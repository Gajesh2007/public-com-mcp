// Integration tests - requires valid API key in .env

import { test, expect, describe, beforeAll } from "bun:test";
import { PublicApiClient } from "../src/client/public-api";
import { InstrumentType } from "../src/client/types";

// Skip if no API key
const apiKey = process.env.PUBLIC_API_SECRET_KEY;
const describeIf = apiKey ? describe : describe.skip;

describeIf("Integration Tests (requires API key)", () => {
  let client: PublicApiClient;
  let accountId: string;

  beforeAll(async () => {
    client = new PublicApiClient(apiKey);

    // Get accounts to find default account ID
    const accounts = await client.getAccounts();
    if (accounts.accounts.length > 0) {
      accountId = accounts.accounts[0].accountId;
      console.log(`Using account: ${accountId}`);
    }
  });

  test("get accounts", async () => {
    const response = await client.getAccounts();
    expect(response.accounts).toBeDefined();
    expect(Array.isArray(response.accounts)).toBe(true);
    console.log(`Found ${response.accounts.length} account(s)`);
  });

  test("get quote for AAPL", async () => {
    const quotes = await client.getQuotes(
      [{ symbol: "AAPL", type: InstrumentType.EQUITY }],
      accountId
    );
    expect(quotes.length).toBeGreaterThan(0);
    expect(quotes[0].instrument.symbol).toBe("AAPL");
    console.log(`AAPL last: $${quotes[0].last}`);
  });

  test("get quote for BTC", async () => {
    const quotes = await client.getQuotes(
      [{ symbol: "BTC", type: InstrumentType.CRYPTO }],
      accountId
    );
    expect(quotes.length).toBeGreaterThan(0);
    expect(quotes[0].instrument.symbol).toBe("BTC");
    console.log(`BTC last: $${quotes[0].last}`);
  });

  test("get option expirations for SPY", async () => {
    const response = await client.getOptionExpirations(
      { symbol: "SPY", type: InstrumentType.EQUITY },
      accountId
    );
    expect(response.baseSymbol).toBe("SPY");
    expect(response.expirations.length).toBeGreaterThan(0);
    console.log(`SPY has ${response.expirations.length} expiration dates`);
    console.log(`Next expiration: ${response.expirations[0]}`);
  });

  test("get portfolio", async () => {
    const portfolio = await client.getPortfolio(accountId);
    expect(portfolio.accountId).toBeDefined();
    expect(portfolio.buyingPower).toBeDefined();
    console.log(`Account type: ${portfolio.accountType}`);
    console.log(`Buying power (margin): $${portfolio.buyingPower.buyingPower}`);
    console.log(`Buying power (options): $${portfolio.buyingPower.optionsBuyingPower}`);
    console.log(`Positions: ${portfolio.positions.length}`);
  });
});
