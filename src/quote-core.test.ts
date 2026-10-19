import test from "node:test";
import assert from "node:assert/strict";
import {
  PLANS,
  newQuote,
  makeLine,
  calculateLine,
  calculateQuote,
  quoteText,
  restoreQuote,
  type Quote,
} from "./quote-core.ts";

// Independent expectations transcribed from the original published calculator.
const original: Record<string, [number, number]> = {
  "laser-bw": [100, 2000],
  "laser-bwm": [150, 2000],
  "laser-c1": [100, 2000],
  "laser-c2": [200, 2000],
  "laser-cm": [1500, 2000],
  "ink-bw": [100, 2000],
  "ink-bwm": [150, 2000],
  "ink-c": [1500, 2000],
  "ink-cm": [1500, 2000],
  "dot-310": [100, 2000],
  "dot-690": [200, 2000],
  "pc-day": [100, 4000],
  "pc-screen": [200, 4000],
  "pc-office": [300, 4000],
  "pc-month": [600, 4000],
  "pc-graphic": [1000, 8000],
  "pc-custom": [2000, 12000],
  "nb-short": [850, 4000],
  "nb-month": [1500, 4000],
  "nb-gaming": [3000, 8000],
};
for (const [id, [price, deposit]] of Object.entries(original))
  test(`original price and deposit preserved: ${id}`, () => {
    const l = makeLine("equipment", id);
    const r = calculateLine(l);
    assert.equal(r.amount, price);
    assert.equal(r.deposit, deposit);
  });
test("catalog has all 20 original plans without extras presented as existing prices", () => {
  assert.equal(PLANS.length, 20);
  assert.deepEqual(
    new Set(PLANS.map((p) => p.id)),
    new Set(Object.keys(original)),
  );
});
test("original per-rental print allowance retained and multiplied per device", () => {
  const l = makeLine("equipment", "laser-bwm");
  Object.assign(l, { qty: "2", periods: "2", pages: "100" });
  assert.equal(calculateLine(l).amount, 900);
});
test("inkjet retains original per-device whole-dollar rounding", () => {
  const l = makeLine("equipment", "ink-bw");
  Object.assign(l, { qty: "3", pages: "53" });
  assert.equal(calculateLine(l).amount, 300);
  l.pages = "54";
  assert.equal(calculateLine(l).amount, 303);
});
test("color single charges total black and color pages, no free allowance", () => {
  const l = makeLine("equipment", "laser-c1");
  l.pages = "100";
  assert.equal(calculateLine(l).amount, 400);
});
test("notebook tier has exact 1,6,15 day prices; over-limit never silently capped", () => {
  const l = makeLine("equipment", "nb-short");
  for (const [days, price] of [
    [1, 850],
    [6, 1600],
    [15, 2950],
  ]) {
    l.periods = String(days);
    assert.equal(calculateLine(l).amount, price);
  }
  l.periods = "16";
  assert.equal(calculateLine(l).amount, null);
});
test("manual pending is distinct from an explicitly confirmed zero", () => {
  const l = makeLine("urgent");
  l.name = "優先整備";
  assert.equal(calculateLine(l).amount, null);
  l.price = "0";
  assert.equal(calculateLine(l).amount, 0);
});
test("invalid and excessive money/counts do not become free or negative prices", () => {
  for (const price of [
    "-1",
    "Infinity",
    "NaN",
    "1.234",
    "1e8",
    "10000001",
    "",
  ]) {
    const l = makeLine("custom");
    l.name = "設定";
    l.price = price;
    assert.equal(calculateLine(l).amount, null);
  }
  for (const qty of ["0", "-1", "1.5", "1001"]) {
    const l = makeLine("equipment", "pc-day");
    l.qty = qty;
    assert.equal(calculateLine(l).amount, null);
  }
});
test("three-year equipment limit enforced in monthly and daily plans", () => {
  const l = makeLine("equipment", "pc-month");
  l.periods = "36";
  assert.equal(calculateLine(l).amount, 21600);
  l.periods = "37";
  assert.equal(calculateLine(l).amount, null);
  const d = makeLine("equipment", "pc-day");
  d.periods = "1097";
  assert.equal(calculateLine(d).amount, null);
});
test("manual overrides require reasons and apply per device, preserving extra usage", () => {
  const l = makeLine("equipment", "laser-bw");
  Object.assign(l, { qty: "2", pages: "60", override: "50" });
  assert.equal(calculateLine(l).amount, null);
  l.overrideReason = "核定專案價";
  assert.equal(calculateLine(l).amount, 120);
});
function full(): Quote {
  const q = newQuote();
  q.lines = [makeLine("equipment", "pc-month")];
  Object.assign(q.inquiry, {
    customer: "QA COMPANY",
    staff: "QA STAFF",
    start: "2026-11-01",
    end: "2026-12-01",
    validUntil: "2026-10-30",
    tax: "included",
    depositMode: "collect",
    deposit: "4000",
    payment: "按約定支付",
    delivery: "客戶自取自還",
    stockConfirmed: true,
    scopeConfirmed: true,
    periodsConfirmed: true,
    reviewed: true,
  });
  return q;
}
test("mixed-order equipment-only discount excludes software, delivery, urgent and print usage", () => {
  const q = full();
  q.lines[0] = makeLine("equipment", "laser-bw");
  q.lines[0].pages = "60";
  for (const kind of [
    "software",
    "network",
    "delivery",
    "urgent",
    "custom",
  ] as const) {
    const l = makeLine(kind);
    Object.assign(l, { name: kind, price: "100", scope: "一次性服務" });
    q.lines.push(l);
  }
  q.discount = { type: "percent", value: "10", reason: "同址整批" };
  const s = calculateQuote(q);
  assert.equal(s.subtotal, 610);
  assert.equal(s.discountBase, 100);
  assert.equal(s.discount, 10);
  assert.equal(s.total, 600);
});
test("blank discount, negative values, excessive discount and missing reason block confirmed output", () => {
  for (const [value, reason] of [
    ["", ""],
    ["-10", "調整"],
    ["601", "調整"],
    ["10", ""],
  ]) {
    const q = full();
    q.discount = { type: "amount", value, reason };
    assert.equal(calculateQuote(q).ready, false);
  }
});
test("discount and tax calculated once in cents; deposit is not revenue", () => {
  const q = full();
  q.discount = { type: "percent", value: "10", reason: "長租" };
  q.inquiry.tax = "exclusive";
  const s = calculateQuote(q);
  assert.equal(s.discount, 60);
  assert.equal(s.tax, 27);
  assert.equal(s.total, 567);
  assert.equal(s.deposit, 4000);
});
test("manual equipment can opt into discount but toner purchases cannot", () => {
  const q = full();
  q.lines = [makeLine("equipment", "laser-cm")];
  q.lines[0].discountable = true;
  assert.equal(calculateQuote(q).discountBase, 0);
  const l = makeLine("equipment");
  Object.assign(l, {
    name: "螢幕",
    price: "100",
    scope: "含維修耗材",
    discountable: true,
  });
  q.lines = [l];
  assert.equal(calculateQuote(q).discountBase, 100);
});
test("unknown line never turns partial total into confirmed quotation", () => {
  const q = full();
  const l = makeLine("network");
  l.name = "配線";
  q.lines.push(l);
  const s = calculateQuote(q);
  assert.equal(s.pending, 1);
  assert.equal(s.subtotal, 600);
  assert.equal(s.ready, false);
  assert.match(quoteText(q), /非完整確定報價/);
});
test("confirmed quote requires actual complete data, not just final checkbox", () => {
  const q = full();
  assert.equal(calculateQuote(q).ready, true);
  q.inquiry.tax = "pending";
  assert.equal(calculateQuote(q).ready, false);
});
test("software bundled with equipment still requires license confirmation", () => {
  const q = full();
  q.lines = [makeLine("equipment", "pc-office")];
  assert.equal(calculateQuote(q).ready, false);
  q.inquiry.licenseConfirmed = true;
  assert.equal(calculateQuote(q).ready, true);
});
test("delivery has separate fee gate and review; original 800 is not multiplied by device quantity", () => {
  const q = full();
  q.lines[0].qty = "10";
  q.inquiry.delivery = "專人送裝及回收";
  q.inquiry.address = "QA ADDRESS";
  assert.equal(calculateQuote(q).ready, false);
  const l = makeLine("delivery");
  Object.assign(l, {
    name: "送裝＋回收",
    price: "800",
    scope: "本次同址來回核定金額",
  });
  q.lines.push(l);
  q.inquiry.transportConfirmed = true;
  assert.equal(calculateQuote(q).ready, true);
  assert.equal(calculateQuote(q).total, 6800);
});
test("urgent option needs separate fee line and deadline; zero must be explicit", () => {
  const q = full();
  q.inquiry.urgency = "當日急件";
  assert.equal(calculateQuote(q).ready, false);
  const l = makeLine("urgent");
  Object.assign(l, { name: "優先整備", price: "0", scope: "核定免收" });
  q.lines.push(l);
  assert.equal(calculateQuote(q).ready, false);
  q.inquiry.readyAt = "2026-11-01T09:00";
  assert.equal(calculateQuote(q).ready, true);
  q.inquiry.urgency = "交期待確認";
  assert.equal(calculateQuote(q).ready, false);
});
test("calendar dates, individual dates and three-year limits block invalid formal output", () => {
  const q = full();
  q.inquiry.end = "2030-11-02";
  assert.equal(calculateQuote(q).ready, false);
  q.inquiry.end = "2026-02-30";
  assert.equal(calculateQuote(q).ready, false);
  q.inquiry.end = "2026-12-01";
  q.lines[0].end = "2026-10-01";
  assert.equal(calculateQuote(q).ready, false);
});
test("saved draft roundtrip retains every item, price, policy and loses final human approval", () => {
  const q = full();
  const loaded = restoreQuote(JSON.stringify(q));
  assert.equal(loaded.inquiry.reviewed, false);
  assert.deepEqual(loaded.lines, q.lines);
  assert.match(quoteText(loaded), /包含維修及耗材/);
  assert.match(quoteText(loaded), /送裝／回收另計/);
  assert.equal(calculateQuote(loaded).ready, false);
});
test("malformed backups and duplicate item ids rejected without mutating current data", () => {
  assert.throws(() => restoreQuote("{}"));
  assert.throws(() => restoreQuote("null"));
  const q = full();
  q.lines.push({ ...q.lines[0] });
  assert.throws(() => restoreQuote(JSON.stringify(q)));
  const bad = full();
  (bad.inquiry as any).customer = 42;
  assert.throws(() => restoreQuote(JSON.stringify(bad)));
});
test("summary carries known/pending totals, service scope, periods, discount and separate deposit consistently", () => {
  const q = full();
  q.discount = { type: "amount", value: "100", reason: "核定半年專案" };
  const t = quoteText(q, { internal: true });
  assert.match(t, /全租期費用：NT\$ 500/);
  assert.match(t, /押金（不計入租金）：NT\$ 4,000/);
  assert.match(t, /核定半年專案/);
  assert.match(t, /報價草稿（資料已齊，待主管核准）/);
});

test("customer summary shows quoted override without internal pricing or approval reasons", () => {
  const q = full();
  q.lines = [makeLine("equipment", "pc-day")];
  Object.assign(q.lines[0], {
    override: "600",
    overrideReason: "內部整備成本",
  });
  q.discount = { type: "amount", value: "100", reason: "內部議價底線" };
  const t = quoteText(q);
  assert.match(t, /全租期費用：NT\$ 500/);
  assert.match(t, /押金另計：NT\$ 4,000/);
  assert.ok(!t.includes("原單價"));
  assert.ok(!t.includes("內部整備成本"));
  assert.ok(!t.includes("內部議價底線"));
  assert.ok(!t.includes("待確認："));
  assert.ok(!t.includes("報價人員"));
  const official = quoteText(q, {
    approval: {
      revision: 2,
      name: "內部主管",
      at: "2026-10-19T00:00:00Z",
      reason: "內部底價核准",
    },
  });
  assert.match(official, /正式報價/);
  assert.match(official, /第2版/);
  assert.ok(!official.includes("內部底價核准"));
  assert.match(quoteText(q, { internal: true }), /內部整備成本/);
});
test("customer summary omits zero discount and empty optional sections", () => {
  const q = full();
  const t = quoteText(q);
  for (const text of [
    "優惠：",
    "需求補充：無",
    "正常預約",
    "用途：",
    "價目：",
    "主管頁",
    "租期1天",
  ])
    assert.ok(!t.includes(text), text);
  assert.match(t, /包含維修及耗材/);
  assert.match(t, /送裝／回收另計/);
  assert.match(t, /草稿/);
});
test("customer summary retains pending amounts and explicitly marks unknown tax and deposit", () => {
  const q = newQuote();
  q.lines = [makeLine("network")];
  q.lines[0].name = "網路工程";
  const t = quoteText(q);
  assert.match(t, /待估/);
  assert.match(t, /另有1項待估，未包含於合計/);
  assert.match(t, /稅額待確認/);
  assert.match(t, /押金另計：待確認/);
  assert.match(t, /非完整確定報價/);
});
