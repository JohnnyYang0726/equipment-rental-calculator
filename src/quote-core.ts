export type Kind =
  | "equipment"
  | "software"
  | "network"
  | "delivery"
  | "urgent"
  | "custom";
export const KIND_NAMES: Record<Kind, string> = {
  equipment: "設備租賃",
  software: "軟體／安裝",
  network: "網路工程",
  delivery: "收送／設定",
  urgent: "急件／特殊時段",
  custom: "特殊項目",
};
export type Plan = {
  id: string;
  group: string;
  name: string;
  unit: "天" | "月" | "次";
  rate: number;
  deposit: number;
  note: string;
  usage?: number;
  included?: number;
  tier?: boolean;
};
// Existing published prices and calculation policies are retained, including inkjet rounding.
export const PLANS: Plan[] = [
  {
    id: "laser-bw",
    group: "雷射印表機",
    name: "雷射單功能黑白",
    unit: "天",
    rate: 100,
    deposit: 2000,
    included: 50,
    usage: 1,
    note: "整段租期每台含50張，超印每張1元。",
  },
  {
    id: "laser-bwm",
    group: "雷射印表機",
    name: "雷射多功能黑白",
    unit: "天",
    rate: 150,
    deposit: 2000,
    included: 50,
    usage: 3,
    note: "整段租期每台含50張，超印每張3元。",
  },
  {
    id: "laser-c1",
    group: "雷射印表機",
    name: "雷射單功能彩色・方案1",
    unit: "天",
    rate: 100,
    deposit: 2000,
    included: 0,
    usage: 3,
    note: "黑白與彩色每張均3元，無內含印量；原方案1。",
  },
  {
    id: "laser-c2",
    group: "雷射印表機",
    name: "雷射單功能彩色・方案2",
    unit: "天",
    rate: 200,
    deposit: 2000,
    included: 0,
    usage: 3,
    note: "黑白與彩色每張均3元，無內含印量；原方案2，適用差異請人工確認。",
  },
  {
    id: "laser-cm",
    group: "雷射印表機",
    name: "彩雷買碳免買機",
    unit: "次",
    rate: 1500,
    deposit: 2000,
    note: "原耗材採購借機方案，每台每色1,500元，期數欄填購買色數；請確認碳粉品項、借用期間及退機範圍。",
  },
  {
    id: "ink-bw",
    group: "噴墨印表機",
    name: "噴墨單功能黑白",
    unit: "天",
    rate: 100,
    deposit: 2000,
    included: 50,
    usage: 0.3,
    note: "整段租期每台含50張，超印每張0.3元；依原規則每台超印費無條件捨去至整元。",
  },
  {
    id: "ink-bwm",
    group: "噴墨印表機",
    name: "噴墨多功能黑白",
    unit: "天",
    rate: 150,
    deposit: 2000,
    included: 50,
    usage: 0.3,
    note: "整段租期每台含50張，超印每張0.3元；依原規則每台超印費無條件捨去至整元。",
  },
  {
    id: "ink-c",
    group: "噴墨印表機",
    name: "噴墨單功能彩色",
    unit: "月",
    rate: 1500,
    deposit: 2000,
    note: "含維修及耗材，沿用原月租價；原方案未定內含印量與超印價，請於本項補充用量約定，並非不限量承諾。",
  },
  {
    id: "ink-cm",
    group: "噴墨印表機",
    name: "噴墨多功能彩色",
    unit: "月",
    rate: 1500,
    deposit: 2000,
    note: "含維修及耗材，沿用原月租價；原方案未定內含印量與超印價，請於本項補充用量約定，並非不限量承諾。",
  },
  {
    id: "dot-310",
    group: "點陣印表機",
    name: "LQ310類似後進紙規格",
    unit: "天",
    rate: 100,
    deposit: 2000,
    note: "每台每日含100張，超量須另外約定。",
  },
  {
    id: "dot-690",
    group: "點陣印表機",
    name: "LQ690類似前／後進紙規格",
    unit: "天",
    rate: 200,
    deposit: 2000,
    note: "每台每日含100張，超量須另外約定。",
  },
  {
    id: "pc-day",
    group: "桌上型電腦",
    name: "文書桌機・單主機",
    unit: "天",
    rate: 100,
    deposit: 4000,
    note: "原日租方案；不含螢幕。",
  },
  {
    id: "pc-screen",
    group: "桌上型電腦",
    name: "文書桌機＋螢幕",
    unit: "天",
    rate: 200,
    deposit: 4000,
    note: "已含一台螢幕，不要重複加價。",
  },
  {
    id: "pc-office",
    group: "桌上型電腦",
    name: "文書桌機＋螢幕＋Office365原方案",
    unit: "天",
    rate: 300,
    deposit: 4000,
    note: "原套裝價，已含螢幕；Office授權適用方式須確認，不重複加入同一軟體費。",
  },
  {
    id: "pc-month",
    group: "桌上型電腦",
    name: "文書庫存桌機＋24吋螢幕",
    unit: "月",
    rate: 600,
    deposit: 4000,
    note: "原8代內CPU方案；含一台24吋螢幕，最低承租及維護範圍依本次約定。",
  },
  {
    id: "pc-graphic",
    group: "桌上型電腦",
    name: "繪圖庫存桌機＋24吋螢幕",
    unit: "月",
    rate: 1000,
    deposit: 8000,
    note: "原9代內CPU方案；含一台24吋螢幕，繪圖軟體另確認。",
  },
  {
    id: "pc-custom",
    group: "桌上型電腦",
    name: "客製繪圖桌機＋24吋螢幕",
    unit: "月",
    rate: 2000,
    deposit: 12000,
    note: "原9代內CPU＋32G＋RTX獨顯方案；含螢幕，實際規格須確認。",
  },
  {
    id: "nb-short",
    group: "筆記型電腦",
    name: "文書筆電・15天內短租",
    unit: "天",
    rate: 850,
    deposit: 4000,
    tier: true,
    note: "首日850元，第2天起每日150元，最多15天；不自動切換月租。",
  },
  {
    id: "nb-month",
    group: "筆記型電腦",
    name: "文書筆電・月租",
    unit: "月",
    rate: 1500,
    deposit: 4000,
    note: "沿用每月1,500元，承租與維修範圍依本次約定。",
  },
  {
    id: "nb-gaming",
    group: "筆記型電腦",
    name: "電競筆電・月租",
    unit: "月",
    rate: 3000,
    deposit: 8000,
    note: "沿用每月3,000元，不提供原價短租方案；請確認實際規格。",
  },
];
export type Line = {
  id: string;
  kind: Kind;
  planId: string;
  name: string;
  qty: string;
  periods: string;
  unit: string;
  price: string;
  pages: string;
  scope: string;
  discountable: boolean;
  override: string;
  overrideReason: string;
  start: string;
  end: string;
};
export type Inquiry = {
  customer: string;
  contact: string;
  phone: string;
  staff: string;
  purpose: string;
  start: string;
  end: string;
  readyAt: string;
  address: string;
  access: string;
  software: string;
  network: string;
  delivery: string;
  urgency: string;
  notes: string;
  payment: string;
  validUntil: string;
  tax: "pending" | "included" | "exclusive";
  depositMode: "pending" | "collect" | "waive";
  deposit: string;
  depositReason: string;
  stockConfirmed: boolean;
  scopeConfirmed: boolean;
  periodsConfirmed: boolean;
  licenseConfirmed: boolean;
  transportConfirmed: boolean;
  reviewed: boolean;
};
export type Quote = {
  schema: 1;
  id: string;
  inquiry: Inquiry;
  lines: Line[];
  discount: { type: "amount" | "percent"; value: string; reason: string };
};
export const money = (n: number) =>
  "NT$ " +
  n.toLocaleString("zh-TW", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
export function newQuote(): Quote {
  return {
    schema: 1,
    id:
      "R" +
      new Date()
        .toLocaleDateString("sv-SE", { timeZone: "Asia/Taipei" })
        .replaceAll("-", "") +
      "-" +
      crypto.randomUUID().slice(0, 6).toUpperCase(),
    inquiry: {
      customer: "",
      contact: "",
      phone: "",
      staff: "",
      purpose: "",
      start: "",
      end: "",
      readyAt: "",
      address: "",
      access: "",
      software: "",
      network: "",
      delivery: "待確認",
      urgency: "正常預約",
      notes: "",
      payment: "",
      validUntil: "",
      tax: "pending",
      depositMode: "pending",
      deposit: "",
      depositReason: "",
      stockConfirmed: false,
      scopeConfirmed: false,
      periodsConfirmed: false,
      licenseConfirmed: false,
      transportConfirmed: false,
      reviewed: false,
    },
    lines: [],
    discount: { type: "amount", value: "0", reason: "" },
  };
}
export function makeLine(kind: Kind, planId = ""): Line {
  const p = PLANS.find((p) => p.id === planId);
  return {
    id: crypto.randomUUID(),
    kind,
    planId,
    name: p?.name || "",
    qty: "1",
    periods: "1",
    unit: p?.unit || "次",
    price: "",
    pages: "0",
    scope: p?.note || "",
    discountable: !!p && !p.id.startsWith("laser-cm"),
    override: "",
    overrideReason: "",
    start: "",
    end: "",
  };
}
function numeric(value: string, max: number, integer = false): number | null {
  if (typeof value !== "string" || !/^\d+(?:\.\d{1,2})?$/.test(value.trim()))
    return null;
  const n = Number(value);
  return Number.isFinite(n) && n <= max && (!integer || Number.isInteger(n))
    ? n
    : null;
}
const cents = (n: number) => Math.round(n * 100);
export function calculateLine(line: Line) {
  const errors: string[] = [];
  const qty = numeric(line.qty, 1000, true);
  const periods = numeric(line.periods, 3650, true);
  const p = PLANS.find((p) => p.id === line.planId);
  const pages = numeric(line.pages, 10000000, true);
  if (!line.name.trim()) errors.push("請填項目名稱");
  if (!qty) errors.push("數量須為1～1,000整數");
  if (!periods) errors.push("計費期數須為1～3,650整數");
  if (line.planId && !p) errors.push("找不到原價方案");
  if (line.start && line.end && line.end < line.start)
    errors.push("品項歸還日期早於起租日期");
  if (line.start && line.end && overThreeYears(line.start, line.end))
    errors.push("個別品項租期不可超過3年");
  if (
    line.kind === "equipment" &&
    periods &&
    ((p?.unit || line.unit) === "月"
      ? periods > 36
      : (p?.unit || line.unit) === "天" && periods > 1096)
  )
    errors.push("設備租期須在1天至3年內（月租最多36個月）");
  if (p && line.kind !== "equipment") errors.push("原設備方案只能用於設備租賃");
  if (p?.tier && periods && periods > 15)
    errors.push("筆電短租最多15天，請改選月租或人工估價");
  let base: number | null = null;
  let usage = 0;
  let price = numeric(line.price, 10000000);
  if (p && periods) {
    base = p.tier ? 850 + (periods - 1) * 150 : p.rate * periods;
    if (p.usage !== undefined) {
      if (pages === null) errors.push("每台預估印量須為非負整數");
      else {
        usage = Math.max(0, pages - (p.included || 0)) * p.usage;
        if (p.id.startsWith("ink-")) usage = Math.floor(usage);
      }
    }
  }
  if (!p) {
    if (price === null) errors.push("單價待估或格式不正確");
    else if (periods) base = price * periods;
  }
  if (line.override.trim()) {
    const override = numeric(line.override, 10000000);
    if (override === null) errors.push("人工調整金額格式不正確");
    else base = override;
    if (!line.overrideReason.trim()) errors.push("人工調價須填原因");
  }
  const raw =
    base === null || !qty ? null : ((cents(base) + cents(usage)) * qty) / 100;
  if (raw !== null && (!Number.isFinite(raw) || raw > 1000000000))
    errors.push("單項金額超過支援上限10億元，請拆分報價");
  const amount = errors.length ? null : raw;
  return {
    amount,
    base,
    usage,
    errors,
    deposit: p && qty ? p.deposit * qty : 0,
    discountBase:
      amount !== null &&
      line.discountable &&
      line.kind === "equipment" &&
      p?.id !== "laser-cm"
        ? (cents(base!) * qty!) / 100
        : 0,
  };
}
export function calculateQuote(q: Quote) {
  const rows = q.lines.map(calculateLine);
  const subtotal = rows.reduce((n, r) => n + cents(r.amount ?? 0), 0) / 100;
  const discountBase =
    rows.reduce((n, r) => n + cents(r.discountBase), 0) / 100;
  const errors: string[] = [];
  const value = numeric(
    q.discount.value,
    q.discount.type === "percent" ? 100 : 100000000,
  );
  let discount = 0;
  if (value === null) errors.push("優惠數值格式不正確");
  else
    discount =
      q.discount.type === "percent"
        ? cents((discountBase * value) / 100) / 100
        : value;
  if (discount > discountBase)
    errors.push("優惠不可超過勾選設備的基本租金（不含超印）");
  if (discount > 0 && !q.discount.reason.trim()) errors.push("請填優惠原因");
  const net = cents(subtotal - Math.min(discount, discountBase)) / 100;
  const tax = q.inquiry.tax === "exclusive" ? cents(net * 0.05) / 100 : 0;
  const total = cents(net + tax) / 100;
  const suggestedDeposit = rows.reduce((n, r) => n + r.deposit, 0);
  let deposit: number | null = null;
  if (q.inquiry.depositMode === "collect") {
    deposit = numeric(q.inquiry.deposit, 100000000);
    if (deposit === null) errors.push("請填押金金額；未知不能填成0");
    else if (deposit === 0 && !q.inquiry.depositReason.trim())
      errors.push("零元押金請填原因");
  }
  if (q.inquiry.depositMode === "waive") {
    deposit = 0;
    if (!q.inquiry.depositReason.trim()) errors.push("免押金請填原因");
  }
  const checks: string[] = [];
  if (!q.lines.length) checks.push("尚未加入品項");
  if (rows.some((r) => r.amount === null)) checks.push("有品項待估或輸入錯誤");
  if (errors.length) checks.push(...errors);
  const i = q.inquiry;
  if (!i.customer.trim()) checks.push("客戶名稱未填");
  if (!i.staff.trim()) checks.push("報價人員未填");
  if (!validDate(i.start) || !validDate(i.end) || i.end < i.start)
    checks.push("請確認起租與歸還日期");
  if (i.start && i.end && overThreeYears(i.start, i.end))
    checks.push("租期不可超過3年");
  if (!validDate(i.validUntil)) checks.push("報價有效期限未填或不正確");
  if (i.tax === "pending") checks.push("稅額方式待確認");
  if (i.depositMode === "pending") checks.push("押金方式待確認");
  if (!i.payment.trim()) checks.push("付款安排未填");
  if (i.delivery === "待確認") checks.push("交付方式待確認");
  if (i.delivery !== "客戶自取自還" && !i.address.trim())
    checks.push("交付地點未填");
  if (
    i.delivery !== "待確認" &&
    i.delivery !== "客戶自取自還" &&
    (!i.transportConfirmed || !q.lines.some((l) => l.kind === "delivery"))
  )
    checks.push("送裝及回收另計，請加收送品項並確認兩程費用");
  if (i.urgency === "交期待確認") checks.push("交期待確認，暫不可提供確定報價");
  else if (i.urgency !== "正常預約") {
    if (!q.lines.some((l) => l.kind === "urgent"))
      checks.push("急件或特殊時段費待確認，請另列品項（確認免收才填0）");
    if (!i.readyAt) checks.push("急件請確認最晚送達／安裝完成時間");
  }
  q.lines.forEach((l, n) => {
    if ((l.start && !validDate(l.start)) || (l.end && !validDate(l.end)))
      checks.push(`第${n + 1}項日期格式不正確`);
    const start = l.start || i.start,
      end = l.end || i.end;
    if (start && end && end < start)
      checks.push(`第${n + 1}項歸還日期早於起租日期`);
    if (start && end && overThreeYears(start, end))
      checks.push(`第${n + 1}項租期超過3年`);
  });
  if (q.lines.some((l) => !l.scope.trim()))
    checks.push("有品項尚未說明服務範圍");
  if (
    (q.lines.some((l) => l.kind === "software" || l.planId === "pc-office") ||
      i.software.trim()) &&
    !i.licenseConfirmed
  )
    checks.push("軟體授權與安裝方式未確認");
  return {
    rows,
    subtotal,
    discountBase,
    discount,
    net,
    tax,
    total,
    deposit,
    suggestedDeposit,
    checks: [...new Set(checks)],
    pending: rows.filter((r) => r.amount === null).length,
    ready: checks.length === 0,
  };
}
function validDate(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
function overThreeYears(start: string, end: string) {
  if (!validDate(start) || !validDate(end)) return false;
  const date = new Date(start + "T00:00:00Z");
  date.setUTCFullYear(date.getUTCFullYear() + 3);
  return end > date.toISOString().slice(0, 10);
}
export type OfficialApproval = {
  revision: number;
  name: string;
  at: string;
  reason: string;
};
export function quoteText(
  q: Quote,
  options: {
    totals?: ReturnType<typeof calculateQuote>;
    approval?: OfficialApproval;
    internal?: boolean;
  } = {},
) {
  if (options.internal) return detailedQuoteText(q, options);
  const s = options.totals || calculateQuote(q),
    i = q.inquiry;
  const tax = { pending: "稅額待確認", included: "含稅", exclusive: "含5%稅" }[
    i.tax
  ];
  return [
    options.approval ? "【永捷租賃正式報價】" : "【永捷租賃報價】",
    "單號：" +
      q.id +
      (options.approval ? "／第" + options.approval.revision + "版" : ""),
    "客戶：" + (i.customer || "待填"),
    "租期：" + (i.start || "待確認") + " ～ " + (i.end || "待確認"),
    "",
    "【設備與服務】",
    ...q.lines.flatMap((l, n) => {
      const r = s.rows[n],
        p = PLANS.find((p) => p.id === l.planId);
      const scope = l.scope.trim().replace(/^原方案[；：]?\s*/, "");
      return [
        n + 1 + ". " + (l.name || "待確認品項"),
        "   " +
          l.qty +
          (l.kind === "equipment" ? "台" : "項") +
          " × " +
          l.periods +
          (l.planId === "laser-cm" ? "色" : l.unit) +
          "｜" +
          (r.amount === null ? "待估" : money(r.amount)),
        ...(scope ? ["   " + scope] : []),
        ...(p?.usage !== undefined
          ? ["   " + (scope === p.note ? "" : "整段租期每台含" + (p.included || 0) + "張；" + (p.id.startsWith("laser-c") ? "黑白及彩色" : "") + "超印每張" + money(p.usage) + "；") + "每台預估" + l.pages + "張，超印費" + money(r.usage) + (scope !== p.note && p.id.startsWith("ink-") ? "（每台無條件捨去至整元）" : "")]
          : []),
        ...(l.start || l.end
          ? ["   期間：" + (l.start || i.start) + " ～ " + (l.end || i.end)]
          : []),
      ];
    }),
    "",
    "【費用合計】",
    ...(s.discount > 0
      ? [
          "品項小計：" + money(s.subtotal),
          "設備租金優惠：−" + money(s.discount),
        ]
      : []),
    ...(i.tax === "exclusive" ? ["稅額：" + money(s.tax)] : []),
    (s.pending ? "目前已估合計" : "全租期費用") +
      "：" +
      money(s.total) +
      "（" +
      tax +
      "）",
    ...(s.pending ? ["另有" + s.pending + "項待估，未包含於合計。"] : []),
    "押金另計：" +
      (s.deposit === null
        ? "待確認"
        : s.deposit === 0
          ? "免收"
          : money(s.deposit)),
    "付款：" + (i.payment.trim() || "待確認"),
    "",
    "【交付與必要條件】",
    "交付：" + i.delivery,
    ...(i.address.trim()
      ? ["地點：" + i.address + (i.access ? "／" + i.access : "")]
      : []),
    ...(i.readyAt ? ["交付時間：" + i.readyAt.replace("T", " ")] : []),
    ...(!["正常預約", "交期待確認"].includes(i.urgency)
      ? ["時效：" + i.urgency]
      : []),
    "報價有效至：" + (i.validUntil || "待確認"),
    ...([i.software, i.network, i.notes].some((v) => v.trim())
      ? [
          "補充：" +
            [i.software, i.network, i.notes].filter((v) => v.trim()).join("；"),
        ]
      : []),
    "包含維修及耗材；送裝／回收另計。" +
      (q.lines.some(
        (l) => PLANS.find((p) => p.id === l.planId)?.usage !== undefined,
      )
        ? "列印額度及超印費依上述品項約定。"
        : ""),
    ...(options.approval
      ? ["庫存、交期與續租異動，依雙方確認。"]
      : [s.ready ? "費用、庫存與交期依雙方確認內容辦理。" : "尚有待確認項目，非完整確定報價；費用、庫存與交期須先確認。"]),
  ].join("\n");
}
function detailedQuoteText(
  q: Quote,
  options: {
    totals?: ReturnType<typeof calculateQuote>;
    approval?: OfficialApproval;
  } = {},
) {
  const s = options.totals || calculateQuote(q);
  const i = q.inquiry;
  return [
    `【永捷租賃${options.approval ? "正式報價（主管已核准）" : s.ready ? "報價草稿（資料已齊，待主管核准）" : "詢價草稿／尚未確認"}】`,
    `單號：${q.id}${options.approval ? "／第" + options.approval.revision + "版" : ""}｜價目：原價保留 v1.1.0`,
    ...(options.approval
      ? [
          `核准主管：${options.approval.name}｜時間：${new Date(options.approval.at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}`,
          `核准原因：${options.approval.reason}`,
        ]
      : ["此為本機草稿；正式報價請由團隊頁核對最新核准版本後輸出。"]),
    "租賃規則：所有租賃包含維修及耗材，送裝／回收另計，最低1天、最長3年。原印表機約定印量及超印費仍適用。",
    `客戶：${i.customer || "待填"}${i.contact ? "／" + i.contact : ""}`,
    `聯絡電話：${i.phone || "未填"}｜報價人員：${i.staff || "未填"}`,
    `用途：${i.purpose || "未填"}`,
    `使用期間：${i.start || "待確認"} ～ ${i.end || "待確認"}`,
    `交付完成時間：${i.readyAt.replace("T", " ") || "依約確認"}｜方式：${i.delivery}`,
    `交付地點：${i.address || "依約確認"}${i.access ? "／" + i.access : ""}`,
    `時效需求：${i.urgency}`,
    "",
    "【設備與服務】",
    ...q.lines.flatMap((l, n) => {
      const r = s.rows[n];
      const p = PLANS.find((p) => p.id === l.planId);
      return [
        `${n + 1}. ${l.name || "未命名"}［${KIND_NAMES[l.kind]}］`,
        `數量${l.qty} × ${l.periods}${l.planId === "laser-cm" ? "色" : l.unit}${p?.tier ? "（首日850，續日150）" : !p ? " × 單價" + (l.price || "待估") : "（原單價" + p.rate + "）"}；小計：${r.amount === null ? "待估／需修正" : money(r.amount)}`,
        ...(p?.usage !== undefined
          ? [`每台預估${l.pages}張；每台列印加計${money(r.usage)}；${p.note}`]
          : []),
        ...(l.start || l.end
          ? [`個別期間：${l.start || i.start} ～ ${l.end || i.end}`]
          : []),
        `範圍：${l.scope || "待確認"}`,
        ...(l.override
          ? [
              `人工調整每台基本費：${money(Number(l.override))}；原因：${l.overrideReason || "待填"}`,
            ]
          : []),
      ];
    }),
    "",
    `已估品項小計：${money(s.subtotal)}${s.pending ? "（另有" + s.pending + "項待估）" : ""}`,
    `設備基本租金優惠：-${money(s.discount)}${q.discount.reason ? "（" + q.discount.reason + "）" : ""}`,
    `稅額方式：${{ pending: "待確認", included: "報價已含稅，不另加", exclusive: "未稅另加5%" }[i.tax]}`,
    ...(i.tax === "exclusive" ? [`稅額：${money(s.tax)}`] : []),
    `${s.ready ? "全租期費用" : "目前已估金額（非完整確定報價）"}：${money(s.total)}`,
    `押金（不計入租金）：${s.deposit === null ? "待確認" : money(s.deposit)}${i.depositReason ? "／" + i.depositReason : ""}`,
    `付款安排：${i.payment || "待確認"}（押金與租金分列，並非自動收款）`,
    `報價有效至：${i.validUntil || "待確認"}`,
    `需求補充：${[i.software, i.network, i.notes].filter(Boolean).join("；") || "無"}`,
    ...(!s.ready ? ["待確認：" + s.checks.join("、")] : []),
    "報價不等於預約或保留設備；庫存、交期及服務以雙方確認為準。",
    "日期為交付約定；各品項依列示計費期數計價。續租、提早歸還及新增服務須另行確認。",
  ].join("\n");
}

export function restoreQuote(text: string): Quote {
  const q = JSON.parse(text);
  if (
    !q ||
    q.schema !== 1 ||
    typeof q.id !== "string" ||
    q.id.length > 80 ||
    !Array.isArray(q.lines) ||
    q.lines.length > 100 ||
    !q.inquiry ||
    !q.discount
  )
    throw Error("備份格式不支援");
  const template = newQuote();
  for (const key of Object.keys(template.inquiry)) {
    if (typeof q.inquiry[key] !== typeof template.inquiry[key])
      throw Error("詢價欄位格式錯誤");
    if (typeof q.inquiry[key] === "string" && q.inquiry[key].length > 5000)
      throw Error("文字過長");
  }
  if (
    !["pending", "included", "exclusive"].includes(q.inquiry.tax) ||
    !["pending", "collect", "waive"].includes(q.inquiry.depositMode) ||
    !["amount", "percent"].includes(q.discount.type) ||
    typeof q.discount.value !== "string" ||
    typeof q.discount.reason !== "string"
  )
    throw Error("報價選項格式錯誤");
  const ids = new Set();
  for (const l of q.lines) {
    if (
      !l ||
      !Object.hasOwn(KIND_NAMES, l.kind) ||
      !Object.keys(makeLine("custom")).every(
        (k) => typeof l[k] === typeof makeLine("custom")[k],
      ) ||
      Object.values(l).some((v) => typeof v === "string" && v.length > 5000) ||
      ids.has(l.id)
    )
      throw Error("品項格式錯誤");
    ids.add(l.id);
  }
  // Restoring never carries a previous human confirmation into another editing session.
  q.inquiry.reviewed = false;
  return q;
}
