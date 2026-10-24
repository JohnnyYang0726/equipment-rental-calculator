import type { Quote } from "./quote-core";
import { quoteText, calculateQuote } from "./quote-core";
import { customerDocumentHtml, CUSTOMER_DOCUMENT_CSS } from "./customer-document";
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
  return `<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>永捷租賃報價</title><style>${CUSTOMER_DOCUMENT_CSS}body{max-width:850px;margin:30px auto;padding:24px;background:white}button{padding:12px 20px;margin-bottom:20px;font:inherit}@media print{button{display:none}body{padding:0;margin:0}@page{size:A4;margin:15mm}}</style><button onclick="window.print()">列印客戶報價</button><main class="customer-document">${customerDocumentHtml(text)}</main></html>`;
}
