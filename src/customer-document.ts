const escapeHtml = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

// All customer outputs use quoteText first. This renderer changes layout only.
export function customerDocumentHtml(text: string): string {
  const lines = text.split("\n"), title = lines.shift()?.replace(/^【|】$/g, "") || "永捷租賃報價";
  const first = lines.findIndex(line => /^【/.test(line));
  const metadata = (first < 0 ? lines : lines.splice(0, first)).filter(Boolean);
  const sections: { title: string; lines: string[] }[] = [];
  for (const line of lines) {
    if (/^【.*】$/.test(line)) sections.push({ title: line.slice(1, -1), lines: [] });
    else if (line && sections.length) sections.at(-1)!.lines.push(line);
  }
  return `<header class="quote-document-header"><span>永捷系統科技</span><h2>${escapeHtml(title)}</h2><div class="quote-document-meta">${metadata.map(line => `<p>${escapeHtml(line)}</p>`).join("")}</div></header>` + sections.map(section => {
    if (section.title === "設備與服務") {
      const items: { name: string; quantity: string; amount: string; notes: string[] }[] = [];
      for (const line of section.lines) {
        if (/^\d+\. /.test(line)) items.push({ name: line, quantity: "", amount: "", notes: [] });
        else if (items.length) {
          const item = items.at(-1)!;
          if (!item.quantity && line.includes("｜")) {
            const split = line.indexOf("｜");item.quantity = line.slice(0, split).trim();item.amount = line.slice(split + 1).trim();
          } else item.notes.push(line.trim());
        }
      }
      return `<section class="quote-document-section"><h3>設備與服務</h3><table><thead><tr><th scope="col">品項與內容</th><th scope="col">數量／期間</th><th scope="col">金額</th></tr></thead><tbody>${items.map(item => `<tr><td><strong>${escapeHtml(item.name)}</strong>${item.notes.map(note => `<p>${escapeHtml(note)}</p>`).join("")}</td><td data-label="數量／期間">${escapeHtml(item.quantity)}</td><td class="quote-item-amount" data-label="金額">${escapeHtml(item.amount)}</td></tr>`).join("")}</tbody></table></section>`;
    }
    return `<section class="quote-document-section ${section.title === "費用合計" ? "quote-document-totals" : ""}"><h3>${escapeHtml(section.title)}</h3>${section.lines.map(line => `<p${/^(報價合計|已報價項目合計)：/.test(line) ? ' class="quote-grand-total"' : ""}>${escapeHtml(line)}</p>`).join("")}</section>`;
  }).join("");
}

export const CUSTOMER_DOCUMENT_CSS = `
.customer-document{font-family:"Microsoft JhengHei","PingFang TC",system-ui,sans-serif;color:#17304d;background:white;line-height:1.75;overflow-wrap:anywhere;}
.quote-document-header{border-bottom:3px solid #174eaf;padding-bottom:18px;margin-bottom:22px;}
.quote-document-header>span{font-size:15px;letter-spacing:.08em;color:#425773;}
.quote-document-header h2{font-size:28px!important;line-height:1.4;margin:6px 0 16px;font-weight:700;}
.quote-document-meta{display:flex;flex-wrap:wrap;gap:4px 24px;}.quote-document-meta p{margin:0;}
.quote-document-section{margin:22px 0;}.quote-document-section h3{font-size:20px;font-weight:700;margin:0 0 12px;color:#174eaf;}
.customer-document table{border-collapse:collapse;width:100%;table-layout:fixed;}.customer-document th{background:#eef4fc;text-align:left;padding:12px 10px;border-bottom:2px solid #b4c8e0;font-weight:700;}
.customer-document th:first-child{width:52%;}.customer-document th:nth-child(2){width:25%;}.customer-document th:last-child{width:23%;text-align:right;}
.customer-document td{vertical-align:top;padding:14px 10px;border-bottom:1px solid #d7e1ee;}.customer-document td p{margin:5px 0 0;font-size:.92em;line-height:1.75;color:#425773;white-space:pre-wrap;}
.quote-item-amount{text-align:right;font-weight:700;font-variant-numeric:tabular-nums;}.quote-document-section>p{margin:7px 0;white-space:pre-wrap;}
.quote-document-totals{border:1px solid #b4c8e0;border-radius:12px;padding:18px;background:#f6f9fd;}.quote-grand-total{font-size:23px;font-weight:700;color:#174eaf;border-bottom:1px solid #ccd9e9;padding-bottom:12px;}
@media screen and (max-width:600px){.quote-document-header h2{font-size:24px!important;}.quote-document-meta{display:block;}.customer-document table,.customer-document tbody,.customer-document tr,.customer-document td{display:block;width:100%;}.customer-document thead{display:none;}.customer-document tr{border-bottom:1px solid #c4d3e5;padding:10px 0;}.customer-document td{border:0;padding:5px 0;}.customer-document td[data-label]::before{content:attr(data-label)"：";font-weight:400;}.quote-item-amount{text-align:left;}.quote-document-totals{padding:14px;}.quote-grand-total{font-size:21px;}}
@media print{.customer-document{font-size:11.5pt;color:#111;}.quote-document-header h2{font-size:21pt!important;}.quote-document-section h3{font-size:13pt;}.customer-document th,.customer-document td{padding:8px;}.customer-document tr,.quote-document-totals{break-inside:avoid;}.quote-document-section h3{break-after:avoid;}.quote-grand-total{font-size:16pt;}.quote-document-header{padding-bottom:12px;margin-bottom:16px;}.quote-document-section{margin:16px 0;}}
`;
