import type { Quote } from "./quote-core";
import { quoteText, calculateQuote } from "./quote-core";
export function quoteFingerprint(quote: Quote) {
  const sort = (value: unknown): unknown =>
    Array.isArray(value)
      ? value.map(sort)
      : value && typeof value === "object"
        ? Object.fromEntries(
            Object.entries(value)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, v]) => [k, sort(v)]),
          )
        : value;
  return JSON.stringify(sort(quote));
}
export type RentalHead = {
  id: string;
  org_id: string;
  client_ref: string;
  number: string;
  customer: string;
  revision: number;
  state_version: number;
  workflow: "REVIEW" | "APPROVED" | "REJECTED";
  total: number;
  pending: number;
  approved_revision: number | null;
  approved_at: string | null;
  approved_by: string | null;
  decision_reason: string;
  updated_at: string;
};
export type RentalSnapshot = {
  quote: Quote;
  totals: ReturnType<typeof calculateQuote>;
  priceVersion: number;
};
export type RentalDocument = {
  head: RentalHead;
  snapshot: RentalSnapshot;
  approverName?: string;
  exportable?: boolean;
};
export function officialText(document: RentalDocument) {
 if(document.exportable!==true)throw Error('請重新取得最新共用版本');
 return quoteText(document.snapshot.quote,{totals:{...document.snapshot.totals,ready:true}});
}
export function officialHtml(text: string) {
  const escaped = text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
  return `<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>永捷租賃正式報價</title><style>body{font-family:system-ui,"Microsoft JhengHei",sans-serif;max-width:850px;margin:30px auto;padding:20px;color:#1e293b}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.8}button{padding:12px 20px}@media print{button{display:none}body{padding:0;margin:0}@page{margin:15mm}}</style><button onclick="window.print()">列印正式報價</button><pre>${escaped}</pre></html>`;
}
