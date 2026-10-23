import React, { lazy, Suspense, useRef, useState, useCallback } from "react";
const TeamWorkspace = lazy(() => import("./TeamWorkspace"));
import {
  Calculator,
  Plus,
  Phone,
  ClipboardList,
  Copy,
  Save,
  Download,
  BookOpen,
  Printer,
  RotateCcw,
} from "lucide-react";
import {
  PLANS,
  KIND_NAMES,
  newQuote,
  makeLine,
  calculateQuote,
  quoteText,
  restoreQuote,
  money,
  type Quote,
  type Inquiry,
  type Line,
  type Kind,
} from "./quote-core";
const STORAGE = "yj_rental_inquiry_v1";
const MANUAL: Record<Kind, string[]> = {
  equipment: [
    "獨立螢幕",
    "路由器／交換器",
    "Wi-Fi基地台 AP",
    "其他設備／特殊租期",
  ],
  software: [
    "Office 授權（另確認適用方式）",
    "客戶授權軟體代安裝",
    "繪圖／3D軟體專案",
    "整批環境設定",
  ],
  network: ["網路配線", "Wi-Fi規劃與設定", "現場連線測試", "工程師駐點支援"],
  delivery: [
    "原專人運送與網路驅動設定（800元／次）",
    "專人送裝",
    "到期回收",
    "物流來回",
    "額外搬運／設定",
  ],
  urgent: ["優先整備", "當日專送調度", "夜間／假日施工", "大量臨時需求"],
  custom: ["特殊項目人工報價"],
};
function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="check">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
function download(name: string, text: string, type: string) {
  const u = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
const HELP = [
  "使用本人帳號，不必向主管索取每日核准。 三套使用同一組員工帳號，各網站分別登入。選24小時、專用電腦30天或共用電腦僅本次登入。 工程師帳號會顯示「助理同等作業權限」，可照助理方式報價。 主管負責新增／停用員工、調整帳號權限、查看主管私有成本及發布公司公告；一般報價與收送安排不再等主管核准。 忘記密碼時寄重設信，由本人開最新信件設定；不要把密碼交給同事。 先按更新團隊資料，必要時登出重登；停用或未開通帳號請找主管。 離開時登出；本機草稿與團隊紀錄是分開保存的。",
  "先問需求，再用同一張單加入多個品項。 問設備、數量、用途、起租與歸還日期。 問軟體、網路環境、現場安裝、收送及是否急件。 填客戶、聯絡方式、報價人員與交付地點。 不知道的費用先留待估，確認免收才填0。 所有租賃含維修及耗材；送裝、回收另計，租期1天至3年。 先確認庫存與人員，才向客戶承諾交付時間。",
  "設備、軟體、網路、收送及急件分項列清楚。 選原價設備方案並加入報價，核對數量與計費期數。 半年填6個月、全年填12個月；日期記錄不會自動改計費期數。 特殊設備、軟體、網路工程與急件用人工報價。 已包含的螢幕、Office或工時不要再加一次。 有軟體時仍要確認授權來源、版本及安裝方式。 列印設備的額度與超印費依各品項約定，不是不限量承諾。",
  "保留必要條件，取消重複的內部確認勾選。 確認送裝及回收費已分項加入。 優惠只作用在選定的設備基本租金，優惠金額與原因要核對。 確認稅額、另列押金、付款安排及有效期限。 費用或條件未齊可保存詢價；確定報價需補齊必要欄位，不需主管核准。 保存報價不會保留庫存或自動安排出車。 本次只簡化流程，原價與押金參考未調整。",
  "同事都以最新保存版本接手，不再走核准流程。 按「團隊紀錄」，再按「保存到團隊」。 從共用清單搜尋客戶或單號，可載入修改。 第一次保存建立共用單號；修改後再保存，歷史版本會保留。 網路失敗時保留本機草稿；成功提示才代表共用保存完成。 不影響助理及已開通同等權限工程師正常估價。 只能看本人所屬團隊的資料，不會因取消核准就開放其他團隊。",
  "報價條件要清楚，文字不必長。 先看客戶報價預覽，核對品項、數量、租期、金額、押金及交付約定。 本機按「複製客戶報價」或「列印客戶報價」。 共用清單的客戶版輸出會核對最新版本及必要條件。 客戶版不寫草稿，但有待估時會清楚標示，不能當確定價格。 JSON備份含內部資料，不是客戶報價。 費用、庫存與交期仍依雙方確認；保存不代表已履約。",
  "主管寫一次，同事在三套頁面上方都能看到。 主管登入後，在頁面上方「公司公告」展開「主管：發布／管理公告」。 填標題與內容，按「發布公告」。只能填純文字，不需要排版。 三套程式約30秒內更新；一般同事只需閱讀，不必打卡。 要修改時選既有公告，改字後發布；不再適用時按下架，異動紀錄仍保留。 同一團隊三套共用公告，不必每套各發一次。 已發布的公告仍可顯示；沒有公告也不影響報價。"
];
export default function App() {
  const [q, setQ] = useState<Quote>(newQuote);
  const [kind, setKind] = useState<Kind>("equipment");
  const [planId, setPlanId] = useState(PLANS[0].id);
  const [manual, setManual] = useState(MANUAL.equipment[0]);
  const [editing, setEditing] = useState("");
  const [undo, setUndo] = useState<Line | null>(null);
  const [replace, setReplace] = useState<"new" | "load" | null>(null);
  const [message, setMessage] = useState(
    "開始接聽需求，未知費用先留待估。保存草稿只在本機瀏覽器。",
  );
  const [paste, setPaste] = useState("");
  const [pendingImport, setPendingImport] = useState<Quote | null>(null);
  const [teamOpen, setTeamOpen] = useState(true);
  const [teamStarted, setTeamStarted] = useState(true);
  const [quoteAccess,setQuoteAccess]=useState(false);
  const onAccess=useCallback((allowed:boolean)=>{setQuoteAccess(allowed);if(!allowed)setTeamOpen(true);},[]);
  const [resetKey, setResetKey] = useState(0);
  const file = useRef<HTMLInputElement>(null),
    help = useRef<HTMLDialogElement>(null),
    helpBtn = useRef<HTMLButtonElement>(null);
  const i = q.inquiry;
  const s = calculateQuote(q);
  const text = quoteText(q);
  function edit(fn: (v: Quote) => Quote) {
    setQ((prev) => {
      const next = fn(prev);
      return { ...next, inquiry: { ...next.inquiry, reviewed: false } };
    });
  }
  function iq(key: keyof Inquiry, value: string | boolean) {
    if (key === "reviewed")
      setQ((prev) => ({
        ...prev,
        inquiry: { ...prev.inquiry, reviewed: value as boolean },
      }));
    else
      edit((prev) => ({ ...prev, inquiry: { ...prev.inquiry, [key]: value } }));
  }
  function line(id: string, patch: Partial<Line>) {
    edit((prev) => ({
      ...prev,
      lines: prev.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
  }
  function add() {
    if (q.lines.length >= 100) {
      setMessage("最多100項，請另開報價");
      return;
    }
    const l = makeLine(
      kind,
      kind === "equipment" && planId !== "manual" ? planId : "",
    );
    if (!l.planId) {
      l.name = manual;
      if (kind === "equipment") l.unit = "天";
      if (kind === "delivery" && manual.startsWith("原專人")) {
        l.price = "800";
        l.scope =
          "原800元／次運送與網路驅動設定；請註明本次涵蓋地點與設定台數，回收另計。";
      }
    }
    edit((prev) => ({ ...prev, lines: [...prev.lines, l] }));
    setEditing(l.id);
    setMessage("已加入「" + l.name + "」，請確認數量、期數及範圍。");
  }
  function save() {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(q));
      setMessage("本機草稿已保存；不會自動共用給同事。換電腦前請下載備份。");
    } catch {
      setMessage("保存失敗：儲存空間不足或被停用，請立即下載備份。");
    }
  }
  function replaceNow() {
    try {
      if (replace === "new") setQ(newQuote());
      else {
        const v = localStorage.getItem(STORAGE);
        if (!v) throw Error("沒有已保存的草稿");
        setQ(restoreQuote(v));
      }
      setResetKey((v) => v + 1);
      setEditing("");
      setUndo(null);
      setMessage("畫面已替換，尚未覆寫本機保存；請重新核對。");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "載入失敗");
    }
    setReplace(null);
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setMessage("✓ 已複製客戶報價；請記得保存到團隊供同事查詢。");
    } catch {
      setMessage("無法使用剪貼簿，請展開完整文字自行複製，或下載文字檔。");
    }
  }
  function importText(value: string) {
    try {
      if (value.length > 2000000) throw Error("備份過大");
      setPendingImport(restoreQuote(value));
      setMessage("備份格式已通過，請在頁首確認是否替換目前畫面。");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "匯入失敗，原內容保留",
      );
    }
  }
  const input = (
    key: keyof Inquiry,
    label: string,
    type = "text",
    placeholder = "",
  ) => (
    <Field label={label}>
      <input
        type={type}
        value={String(i[key])}
        maxLength={500}
        placeholder={placeholder}
        onInput={
          type === "date" || type === "datetime-local"
            ? (e) => iq(key, e.currentTarget.value)
            : undefined
        }
        onChange={(e) => iq(key, e.target.value)}
      />
    </Field>
  );
  const area = (key: keyof Inquiry, label: string, placeholder = "") => (
    <Field label={label}>
      <textarea
        value={String(i[key])}
        maxLength={2000}
        placeholder={placeholder}
        onChange={(e) => iq(key, e.target.value)}
      />
    </Field>
  );
  const select = (key: keyof Inquiry, label: string, options: string[]) => (
    <Field label={label}>
      <select value={String(i[key])} onChange={(e) => iq(key, e.target.value)}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </Field>
  );
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-icon">
            <Calculator size={26} />
          </span>
          <div>
            <p className="eyebrow">永捷系統科技 · 內部報價工具</p>
            <h1>
              租賃詢價與多品項報價 <span>v2.0.0</span>
            </h1>
            <p>先問需求，再逐項估價；特殊服務保留人工確認。</p>
          </div>
        </div>
        <div className="toolbar">
          <button
            className="primary"
            onClick={() => (setTeamStarted(true), setTeamOpen(true))}
          >
            團隊紀錄
          </button>
          <button ref={helpBtn} onClick={() => help.current?.showModal()}>
            <BookOpen size={17} />
            操作說明
          </button>
          <button disabled={!quoteAccess} onClick={save}>
            <Save size={17} />
            保存草稿
          </button>
          <button disabled={!quoteAccess} onClick={() => setReplace("load")}>載入草稿</button>
          <button disabled={!quoteAccess} onClick={() => setReplace("new")}>另開新詢價</button>
        </div>
      </header>
      <p className="policy">
        所有租賃含維修及耗材 · 送裝／回收另計 · 租期1天～3年 · 原設備價格保留
      </p>
      <p className="notice" role="status">
        {message}
      </p>
      {quoteAccess && replace && (
        <div className="confirm-box" role="alert">
          <p>替換目前畫面前，請先保存或下載備份。</p>
          <button onClick={replaceNow}>
            確認{replace === "new" ? "另開新詢價" : "載入草稿"}
          </button>
          <button disabled={!quoteAccess} onClick={() => setReplace(null)}>取消</button>
        </div>
      )}
      {quoteAccess && pendingImport && (
        <div className="confirm-box" role="alert">
          <p>
            備份 {pendingImport.id}（{pendingImport.lines.length}
            個品項）已通過檢查。匯入會替換目前畫面，請先保存或下載原內容。
          </p>
          <button
            onClick={() => {
              setQ(pendingImport);
              setResetKey((v) => v + 1);
              setPendingImport(null);
              setEditing("");
              setUndo(null);
              setPaste("");
              setMessage("備份已載入，請重新核對；尚未覆寫本機保存。");
            }}
          >
            確認匯入並替換畫面
          </button>
          <button onClick={() => setPendingImport(null)}>取消匯入</button>
        </div>
      )}
      <Suspense fallback={<p role="status">載入團隊功能…</p>}>
        {teamStarted && (
          <TeamWorkspace
            open={teamOpen}
            onClose={() => setTeamOpen(false)}
            onAccess={onAccess}
            quote={q}
            resetKey={resetKey}
            onLoad={(loaded) => {
              setQ(loaded);
              setEditing("");
              setUndo(null);
              setPendingImport(null);
              setReplace(null);
              setMessage(
                "已載入共用報價；修改後請同步，共用輸出會核對最新保存版本。",
              );
            }}
            onCanonical={(submitted, canonical) => {
              setQ((current) =>
                current.id === submitted.id
                  ? { ...current, id: canonical.id }
                  : current,
              );
            }}
            onClear={() => {
              setQ(newQuote());
              setEditing("");
              setResetKey((v) => v + 1);
            }}
          />
        )}
      </Suspense>
      {!quoteAccess && <section className="card"><h2>請先使用員工帳號登入</h2><p>主管、客服／行政與已開通助理權限的工程師登入後可估價。三套程式使用同一組帳號，各網站請分別登入。</p><a href="https://yongjiesystems.github.io/testing/?tab=warranty">公開保固與驅動查詢</a></section>}
      {quoteAccess && <>
      <div className="workspace">
        <main>
          <section className="card">
            <div className="section-title">
              <span className="step-icon">
                <Phone size={19} />
              </span>
              <div>
                <p className="eyebrow">STEP 01 · 接電話先問</p>
                <h2>客戶與使用需求</h2>
              </div>
            </div>
            <div className="form-grid">
              {input("customer", "客戶／公司名稱")}
              {input("contact", "聯絡人")}
              {input("phone", "聯絡電話", "tel")}
              {input("staff", "報價人員")}
              {input(
                "purpose",
                "用途／工作內容",
                "text",
                "例如：教育訓練、短期辦公、3D繪圖",
              )}
              {input("readyAt", "最晚送達／安裝完成時間", "datetime-local")}
              {input("start", "起租日期", "date")}
              {input("end", "歸還日期", "date")}
            </div>
            <p className="helper">
              日期記錄約定期間，不會自動更改費用。天數、月數需逐項確認；半年填6個月，全年填12個月，原月租不自動打折。最長3年。
            </p>
            <details className="extra">
              <summary>軟體、網路與現場條件（可先記錄）</summary>
              <div className="form-grid">
                {area(
                  "software",
                  "軟體／版本／授權來源",
                  "客戶自備授權？需安裝哪個版本與外掛？",
                )}
                {area(
                  "network",
                  "網路需求",
                  "是否已有網路？同時連線台數？需配線、Wi-Fi或上網線路？",
                )}
                {area("access", "樓層／電梯／進場限制")}
                {area("notes", "其他需求與備註")}
              </div>
            </details>
          </section>
          <section className="card">
            <div className="section-title">
              <span className="step-icon">
                <ClipboardList size={20} />
              </span>
              <div>
                <p className="eyebrow">STEP 02 · 同一張報價一起估</p>
                <h2>加入設備與服務</h2>
              </div>
            </div>
            <div className="kind-tabs" aria-label="品項類別">
              {(Object.keys(KIND_NAMES) as Kind[]).map((k) => (
                <button
                  key={k}
                  aria-pressed={kind === k}
                  className={kind === k ? "selected" : ""}
                  onClick={() => {
                    setKind(k);
                    setManual(MANUAL[k][0]);
                  }}
                >
                  {KIND_NAMES[k]}
                </button>
              ))}
            </div>
            <div className="add-item">
              {kind === "equipment" ? (
                <>
                  <Field label="原價設備方案">
                    <select
                      value={planId}
                      onChange={(e) => setPlanId(e.target.value)}
                    >
                      {[...new Set(PLANS.map((p) => p.group))].map((g) => (
                        <optgroup key={g} label={g}>
                          {PLANS.filter((p) => p.group === g).map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}｜
                              {p.tier
                                ? "首日850，續日150"
                                : money(p.rate) +
                                  "／" +
                                  (p.id === "laser-cm" ? "色" : p.unit)}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                      <option value="manual">
                        螢幕／網路設備／特殊租期（人工報價）
                      </option>
                    </select>
                  </Field>
                  {planId === "manual" && (
                    <Field label="人工設備項目">
                      <select
                        value={manual}
                        onChange={(e) => setManual(e.target.value)}
                      >
                        {MANUAL.equipment.map((n) => (
                          <option key={n}>{n}</option>
                        ))}
                      </select>
                    </Field>
                  )}
                </>
              ) : (
                <Field label="常用服務或特殊項目">
                  <select
                    value={manual}
                    onChange={(e) => setManual(e.target.value)}
                  >
                    {MANUAL[kind].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </Field>
              )}
              <button className="primary" onClick={add}>
                <Plus size={18} />
                加入本張報價
              </button>
            </div>
            <p className="helper">
              原設備及800元運送設定沿用原價。新軟體、工程、急件與螢幕無預設價，請人工確認。空白是待估，確認免費才填0。
            </p>
            {kind === "urgent" && (
              <p className="callout">
                先確認庫存、人員與可完成時間，再估優先整備、專送或特殊時段費；同一段工時不可重複收費。
              </p>
            )}
            {kind === "software" && (
              <p className="callout">
                軟體授權費與代安裝費分開列；繪圖／3D軟體先確認適用授權及相容性。套裝已含的項目不要重複加價。
              </p>
            )}
            {kind === "network" && (
              <p className="callout">
                網路設備租金、配線、設定、上網線路及駐點分開估。Wi-Fi設備不代表已含網際網路或全場覆蓋。
              </p>
            )}
            <div className="line-list">
              {!q.lines.length && (
                <div className="empty">
                  <ClipboardList size={28} />
                  <p>尚未加入品項</p>
                  <span>同一張單可加入主機、螢幕、軟體、網路及收送。</span>
                </div>
              )}
              {q.lines.map((l, n) => {
                const r = s.rows[n],
                  p = PLANS.find((v) => v.id === l.planId);
                return (
                  <article key={l.id} className="line-card">
                    <div className="line-heading">
                      <div>
                        <span className="tag">{KIND_NAMES[l.kind]}</span>
                        <h3>
                          {n + 1}. {l.name || "未命名項目"}
                        </h3>
                        <p>
                          {l.qty}件 × {l.periods}
                          {p?.id === "laser-cm" ? "色" : l.unit}
                        </p>
                      </div>
                      <div className="line-actions">
                        <strong className={r.amount === null ? "pending" : ""}>
                          {r.amount === null ? "待估／需修正" : money(r.amount)}
                        </strong>
                        <button
                          aria-label={`編輯第${n + 1}項`}
                          aria-expanded={editing === l.id}
                          onClick={() =>
                            setEditing(editing === l.id ? "" : l.id)
                          }
                        >
                          {editing === l.id ? "收起" : "編輯"}
                        </button>
                        <button
                          className="quiet"
                          aria-label={`移除第${n + 1}項`}
                          onClick={() => {
                            setUndo(l);
                            edit((v) => ({
                              ...v,
                              lines: v.lines.filter((row) => row.id !== l.id),
                            }));
                          }}
                        >
                          移除
                        </button>
                      </div>
                    </div>
                    {editing === l.id && (
                      <div className="line-editor">
                        <div className="form-grid">
                          <Field label="項目名稱">
                            <input
                              value={l.name}
                              maxLength={200}
                              onChange={(e) =>
                                line(l.id, { name: e.target.value })
                              }
                            />
                          </Field>
                          <Field label="數量（設備台數／服務數量）">
                            <input
                              type="number"
                              min="1"
                              max="1000"
                              step="1"
                              value={l.qty}
                              onChange={(e) =>
                                line(l.id, { qty: e.target.value })
                              }
                            />
                          </Field>
                          <Field
                            label={
                              p?.id === "laser-cm"
                                ? "每台購買色數"
                                : "計費期數（天／月／次數）"
                            }
                          >
                            <input
                              type="number"
                              min="1"
                              max={p?.tier ? 15 : l.unit === "月" ? 36 : 1096}
                              step="1"
                              value={l.periods}
                              onChange={(e) =>
                                line(l.id, { periods: e.target.value })
                              }
                            />
                          </Field>
                          {p ? (
                            <Field label="原價計費說明">
                              <output>
                                {p.tier
                                  ? "首日850元，續日150元"
                                  : money(p.rate) +
                                    "／" +
                                    (p.id === "laser-cm" ? "色" : p.unit)}
                              </output>
                            </Field>
                          ) : (
                            <>
                              <Field label="計費單位">
                                <select
                                  value={l.unit}
                                  onChange={(e) =>
                                    line(l.id, { unit: e.target.value })
                                  }
                                >
                                  {[
                                    "次",
                                    "天",
                                    "月",
                                    "小時",
                                    "點",
                                    "趟",
                                    "人日",
                                  ].map((v) => (
                                    <option key={v}>{v}</option>
                                  ))}
                                </select>
                              </Field>
                              <Field label="人工單價（未知留空）">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  max="10000000"
                                  value={l.price}
                                  placeholder="待估"
                                  onChange={(e) =>
                                    line(l.id, { price: e.target.value })
                                  }
                                />
                              </Field>
                            </>
                          )}
                          {p?.usage !== undefined && (
                            <Field label="每台整段租期預估印量（彩雷含黑白＋彩色）">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={l.pages}
                                onChange={(e) =>
                                  line(l.id, { pages: e.target.value })
                                }
                              />
                            </Field>
                          )}
                        </div>
                        {p && <p className="helper">{p.note}</p>}
                        {p?.tier && Number(l.periods) >= 6 && (
                          <p className="callout">
                            短租基本費已高於月租1,500元，可另選文書筆電月租比較；須確認適用期間與條件，不自動轉換。
                          </p>
                        )}
                        <Field label="本項範圍／規格／已含與另計">
                          <textarea
                            value={l.scope}
                            maxLength={3000}
                            placeholder="例如：十台同址設定，不含新增配線；送裝與回收分別列項。"
                            onChange={(e) =>
                              line(l.id, { scope: e.target.value })
                            }
                          />
                        </Field>
                        <details className="extra">
                          <summary>個別日期、人工調價與優惠範圍</summary>
                          <div className="form-grid">
                            <Field label="本項起租日期（空白沿用整案）">
                              <input
                                type="date"
                                value={l.start}
                                onInput={(e) =>
                                  line(l.id, { start: e.currentTarget.value })
                                }
                                onChange={(e) =>
                                  line(l.id, { start: e.target.value })
                                }
                              />
                            </Field>
                            <Field label="本項歸還日期（空白沿用整案）">
                              <input
                                type="date"
                                value={l.end}
                                onInput={(e) =>
                                  line(l.id, { end: e.currentTarget.value })
                                }
                                onChange={(e) =>
                                  line(l.id, { end: e.target.value })
                                }
                              />
                            </Field>
                            <Field
                              label="人工調整：每台整段基本費"
                              hint="留空沿用計算，不包含超印；所有台數套用同一調整。"
                            >
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={l.override}
                                onChange={(e) =>
                                  line(l.id, { override: e.target.value })
                                }
                              />
                            </Field>
                            <Field label="人工調價原因">
                              <input
                                value={l.overrideReason}
                                maxLength={500}
                                onChange={(e) =>
                                  line(l.id, { overrideReason: e.target.value })
                                }
                              />
                            </Field>
                          </div>
                          {l.kind === "equipment" && p?.id !== "laser-cm" && (
                            <Check
                              label="此設備基本租金可套用整案優惠（不含超印）"
                              checked={l.discountable}
                              onChange={(v) => line(l.id, { discountable: v })}
                            />
                          )}
                        </details>
                        {!!r.errors.length && (
                          <ul className="errors">
                            {r.errors.map((e) => (
                              <li key={e}>{e}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
            {undo && (
              <button
                onClick={() => {
                  if (q.lines.length < 100) {
                    edit((v) => ({ ...v, lines: [...v.lines, undo] }));
                    setUndo(null);
                  }
                }}
              >
                <RotateCcw size={16} />
                復原剛才移除的項目
              </button>
            )}
          </section>
          <section className="card">
            <div className="section-title">
              <span className="step-number">03</span>
              <div>
                <p className="eyebrow">交付與商務條件</p>
                <h2>收送、優惠及付款</h2>
              </div>
            </div>
            <div className="form-grid">
              {select("delivery", "交付方式", [
                "待確認",
                "客戶自取自還",
                "專人送裝及回收",
                "僅送達／回收另約",
                "物流寄送來回",
                "多地點／特殊交付",
              ])}
              {select("urgency", "時效需求（費用請另外加品項）", [
                "正常預約",
                "優先整備",
                "當日急件",
                "夜間／假日",
                "交期待確認",
              ])}
              {input("address", "交付地址／地點")}
              {input("validUntil", "報價有效至", "date")}
              <Field label="設備優惠方式">
                <select
                  value={q.discount.type}
                  onChange={(e) =>
                    edit((v) => ({
                      ...v,
                      discount: {
                        ...v.discount,
                        type: e.target.value as "amount" | "percent",
                        value: "0",
                      },
                    }))
                  }
                >
                  <option value="amount">減免固定金額</option>
                  <option value="percent">折讓百分比（填10＝減10%）</option>
                </select>
              </Field>
              <Field
                label={
                  q.discount.type === "percent"
                    ? "折讓百分比（0～100）"
                    : "減免金額"
                }
              >
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  max={q.discount.type === "percent" ? 100 : s.discountBase}
                  value={q.discount.value}
                  onChange={(e) =>
                    edit((v) => ({
                      ...v,
                      discount: { ...v.discount, value: e.target.value },
                    }))
                  }
                />
              </Field>
            </div>
            <Field label="優惠原因（有優惠必填）">
              <input
                value={q.discount.reason}
                maxLength={500}
                placeholder="例如：同址整批交付／半年承租優惠，依核定條件"
                onChange={(e) =>
                  edit((v) => ({
                    ...v,
                    discount: { ...v.discount, reason: e.target.value },
                  }))
                }
              />
            </Field>
            <p className="helper">
              可優惠設備基本租金：{money(s.discountBase)}
              。一次只套用一筆優惠；軟體、工程、收送、急件、碳粉及超印不參與。人工設備需明確勾選。
            </p>
            <div className="form-grid">
              <Field label="稅額方式">
                <select
                  value={i.tax}
                  onChange={(e) => iq("tax", e.target.value)}
                >
                  <option value="pending">待確認</option>
                  <option value="included">報價已含稅，不另加</option>
                  <option value="exclusive">未稅，另加5%</option>
                </select>
              </Field>
              <Field label="押金方式">
                <select
                  value={i.depositMode}
                  onChange={(e) => iq("depositMode", e.target.value)}
                >
                  <option value="pending">待確認</option>
                  <option value="collect">另收押金</option>
                  <option value="waive">本案免押金（填原因）</option>
                </select>
              </Field>
              {i.depositMode === "collect" &&
                input("deposit", "本案押金總額", "number")}
              {input("depositReason", "押金說明／免收原因")}
            </div>
            {i.depositMode === "collect" && (
              <p className="helper">
                原設備押金參考合計 {money(s.suggestedDeposit)}（不含人工設備）。
                <button
                  onClick={() => iq("deposit", String(s.suggestedDeposit))}
                >
                  帶入原設備押金參考
                </button>
                請核對後調整。
              </p>
            )}
            {area(
              "payment",
              "付款安排／續租與提前歸還約定",
              "例如：首次費用及押金交付前支付，後續按月；續租與提前歸還另約。",
            )}
          </section>
          <section className="card">
            <div className="section-title">
              <span className="step-number">04</span>
              <div>
                <p className="eyebrow">輸出前逐項確認</p>
                <h2>報價核對</h2>
              </div>
            </div>
            <p className="helper">
              先看客戶報價預覽，再核對費用、日期及交付約定。請按頁首「團隊紀錄」保存共用；保存到團隊後即可從團隊頁輸出客戶報價。修改後再保存，保留經辦與歷史版本。
            </p>
            <Check
              label="如需配送，已分別確認送裝與回收費，並列入收送品項"
              checked={i.transportConfirmed}
              onChange={(v) => iq("transportConfirmed", v)}
            />
            <Check
              label="如含軟體，已確認授權來源、版本及安裝方式"
              checked={i.licenseConfirmed}
              onChange={(v) => iq("licenseConfirmed", v)}
            />
          </section>
          <section className="card">
            <h2>備份與匯入</h2>
            <p className="helper">
              此處只備份本機草稿；多人共用請按頁首「團隊紀錄」同步。備份含客戶資料，請依公司方式保存。
            </p>
            <div className="toolbar">
              <button
                onClick={() =>
                  download(
                    `${q.id}.json`,
                    JSON.stringify(q, null, 2),
                    "application/json",
                  )
                }
              >
                <Download size={17} />
                下載本案備份
              </button>
              <button onClick={() => file.current?.click()}>匯入備份</button>
              <input
                hidden
                ref={file}
                type="file"
                accept=".json,application/json"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    if (f.size > 2000000) throw Error("檔案過大");
                    importText(await f.text());
                  } catch (error) {
                    setMessage(
                      error instanceof Error
                        ? error.message
                        : "匯入失敗，原內容保留",
                    );
                  } finally {
                    e.target.value = "";
                  }
                }}
              />
            </div>
            <details className="extra">
              <summary>無法選檔？貼上JSON備份文字</summary>
              <Field label="JSON備份文字">
                <textarea
                  value={paste}
                  onChange={(e) => setPaste(e.target.value)}
                  placeholder="貼上下載的JSON備份內容"
                />
              </Field>
              <button onClick={() => importText(paste)}>
                檢查並匯入備份文字
              </button>
            </details>
          </section>
        </main>
        <aside className="summary-panel" aria-label="即時報價摘要">
          <div className="summary-top">
            <p className="eyebrow">即時報價摘要</p>
            <span className={"status " + (s.ready ? "ready" : "")}>
              {s.ready ? "資料已齊／可交付" : "詢價草稿／待確認"}
            </span>
            <h2>{i.customer || "新租賃詢價"}</h2>
            <p className="order-id">
              {q.id} · {q.lines.length}個品項
            </p>
            <div className="summary-money">
              <span>{s.ready ? "全租期費用" : "目前已估金額"}</span>
              <strong>{money(s.total)}</strong>
              <small>
                {s.pending
                  ? `另有${s.pending}項待估，非完整總價`
                  : s.ready
                    ? "押金另列；付款依本次約定"
                    : "未確認前僅供詢價，並非預約或保留設備"}
              </small>
            </div>
            <dl>
              <div>
                <dt>已估品項小計</dt>
                <dd>{money(s.subtotal)}</dd>
              </div>
              <div>
                <dt>設備租金優惠</dt>
                <dd>−{money(s.discount)}</dd>
              </div>
              <div>
                <dt>
                  {i.tax === "exclusive"
                    ? "另加5%稅額"
                    : i.tax === "included"
                      ? "已含稅"
                      : "稅額待確認"}
                </dt>
                <dd>{i.tax === "exclusive" ? money(s.tax) : "—"}</dd>
              </div>
              <div>
                <dt>另列押金</dt>
                <dd>{s.deposit === null ? "待確認" : money(s.deposit)}</dd>
              </div>
            </dl>
            <p className="summary-note">
              此處為整段租期估價，非每月帳單或到期應收。付款安排依完整文字約定。
            </p>
            {!!s.checks.length && (
              <details open className="checklist">
                <summary>還有{s.checks.length}項需要確認</summary>
                <ul>
                  {s.checks.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </details>
            )}
            <details className="text-preview customer-preview" open>
              <summary>客戶報價預覽</summary>
              <p className="helper">以下與複製、下載文字及列印內容相同。交付前請核對品項、租期、費用與必要條件。</p>
              <pre>{text}</pre>
            </details>
            <button className="primary full" onClick={copy}>
              <Copy size={17} />
              複製客戶報價
            </button>
            <div className="output-buttons">
              <button
                onClick={() =>
                  download(`${q.id}.txt`, text, "text/plain;charset=utf-8")
                }
              >
                <Download size={16} />
                下載文字
              </button>
              <button onClick={() => window.print()}>
                <Printer size={16} />
                列印客戶報價
              </button>
            </div>
          </div>
        </aside>
      </div>
      <section className="print-only">
        <h1>永捷租賃報價</h1>
        <pre>{text}</pre>
      </section>
      </>}
      <dialog
        ref={help}
        className="help-dialog"
        aria-labelledby="help-title"
        onClose={() => helpBtn.current?.focus()}
      >
        <header>
          <h2 id="help-title">操作說明／電話詢價步驟</h2>
          <button onClick={() => help.current?.close()}>返回報價</button>
        </header>
        <div className="manual-actions">
          <p>三套程式共用完整手冊｜2026/10/23 第4版・22 頁。含新版客戶預覽、複製摘要、列印與另存PDF步驟；可下載保存或選印需要的頁面。</p>
          <a href="/manuals/employee-handbook-2026-10-23-simple.pdf" target="_blank" rel="noopener noreferrer">開啟／列印員工手冊 PDF</a>
          <a href="/manuals/employee-handbook-2026-10-23-simple.pdf" download>下載員工手冊 PDF</a>
        </div>
        <p>先用已開通的員工帳號登入。三套程式共用帳號，各網站分別登入；忘記密碼在登入頁按「寄送重設信」，由本人開信設定。主管可在員工名單寄送重設信，也可停用帳號與調整角色。保固與驅動查詢免登入。</p><ol>
          {HELP.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
      </dialog>
    </div>
  );
}
