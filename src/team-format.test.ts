import test from "node:test";
import assert from "node:assert/strict";
import {
  quoteFingerprint,
  officialHtml,
  officialText,
  type RentalDocument,
} from "./team-format.ts";
import { newQuote, calculateQuote } from "./quote-core.ts";
test("fingerprint ignores JSONB object key order but detects changed content", () => {
  const q = newQuote();
  const reordered = JSON.parse(JSON.stringify(q, Object.keys(q).sort()));
  assert.equal(
    quoteFingerprint({ a: 1, b: { y: 2, x: 1 } } as any),
    quoteFingerprint({ b: { x: 1, y: 2 }, a: 1 } as any),
  );
  const q2 = structuredClone(q);
  q2.inquiry.customer = "different";
  assert.notEqual(quoteFingerprint(q), quoteFingerprint(q2));
});
test("printable official HTML escapes customer supplied markup", () => {
  const html = officialHtml('<script>alert(1)</script> & "quote"');
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&amp;"));
});
test("formal text refuses revoked or mismatched approvals", () => {
  const quote = newQuote();
  const d = {
    head: { workflow: "REVIEW", revision: 2, approved_revision: 1 },
    snapshot: { quote, totals: calculateQuote(quote), priceVersion: 1 },
  } as RentalDocument;
  assert.throws(() => officialText(d));
  d.head.workflow = "APPROVED";
  assert.throws(() => officialText(d));
});
