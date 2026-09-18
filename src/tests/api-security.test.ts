import { describe, it, expect } from "vitest";
import { signSessionPayload, verifySessionPayload, hashPassToken } from "../lib/auth";
import { calculateBayesianScore } from "../lib/ranking-engine";

describe("Grand Food Fest — Security & Algorithm Tests", () => {
  it("securely signs and verifies session payload with HMAC", () => {
    const payload = { sessionId: "sess-12345", passToken: "PASS-000001", role: "ATTENDEE" };
    const token = signSessionPayload(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const decoded = verifySessionPayload<typeof payload>(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.sessionId).toBe("sess-12345");
    expect(decoded?.passToken).toBe("PASS-000001");
  });

  it("tampered token is rejected by signature verification", () => {
    const payload = { role: "ATTENDEE" };
    const token = signSessionPayload(payload);
    const [dataStr, sig] = token.split(".");

    // Tamper with data payload to forge admin role
    const forgedPayload = Buffer.from(JSON.stringify({ role: "ADMIN" })).toString("base64url");
    const tamperedToken = `${forgedPayload}.${sig}`;

    const verified = verifySessionPayload(tamperedToken);
    expect(verified).toBeNull();
  });

  it("produces deterministic SHA-256 pass hash without exposing raw pass token", () => {
    const hash1 = hashPassToken("PASS-000123");
    const hash2 = hashPassToken("PASS-000123");
    const hash3 = hashPassToken("PASS-000999");

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1.length).toBe(64); // standard sha-256 length
  });

  it("Bayesian score balances high volume vs low volume with perfect score", () => {
    const globalAverage = 4.3;
    const threshold = 20;

    // Vendor with 5 ratings of 5.0 (unestablished)
    const newVendorScore = calculateBayesianScore(5, 5.0, globalAverage, threshold);

    // Vendor with 250 ratings of 4.85 (established crowd favorite)
    const veteranVendorScore = calculateBayesianScore(250, 4.85, globalAverage, threshold);

    // The established vendor MUST outrank the 5-vote novelty vendor
    expect(veteranVendorScore).toBeGreaterThan(newVendorScore);
  });
});
