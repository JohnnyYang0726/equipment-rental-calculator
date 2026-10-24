import {createNoticeBoard} from './notice-board.js';
import React, { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { Quote } from "./quote-core";
import { money, quoteText } from "./quote-core";
import {
  teamClient as client,
  teamError,
  effectiveTeamRole,
  loginSession, LOGIN_MODES, watchLoginSession,
  ROLES,
  officialText,
  officialHtml,
  quoteFingerprint,
  type RentalHead,
  type RentalSnapshot,
  type RentalDocument,
} from "./team-client";
type Member = {
  org_id: string;
  user_id: string | null;
  email: string;
  display_name: string;
  role: string;
  active: boolean;
  staff_access?: boolean;
};
type Version = {
  revision: number;
  snapshot: RentalSnapshot;
  created_name: string;
  created_at: string;
};
type EventRow = {
  id: number;
  revision: number;
  event: string;
  reason: string;
  actor_name: string;
  created_at: string;
};
type Link = {
  id: string;
  number: string;
  org: string;
  revision: number;
  fingerprint: string;
};
const statusName = {
  REVIEW: "已保存",
  APPROVED: "已保存（舊核准紀錄）",
  REJECTED: "歷史退回紀錄",
};
const time = (s: string) =>
  new Date(s).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
function unwrap<T>(result: { data: T; error: unknown }): T {
  if (result.error) throw result.error;
  return result.data;
}
function file(name: string, text: string, type: string) {
  const u = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
export default function TeamWorkspace({
  open,
  onClose,
  quote,
  resetKey,
  onLoad,
  onCanonical,
  onClear,
  onAccess,
}: {
  onAccess: (allowed:boolean)=>void;
  open: boolean;
  onClose: () => void;
  quote: Quote;
  resetKey: number;
  onLoad: (q: Quote) => void;
  onCanonical: (submitted: Quote, canonical: Quote) => void;
  onClear: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const quoteRef = useRef(quote);
  quoteRef.current = quote;
  const [user, setUser] = useState<User | null>(null),
    [memberships, setMemberships] = useState<Member[]>([]),
    [org, setOrg] = useState(""),
    [orgName, setOrgName] = useState(""),
    [role, setRole] = useState("");
  const noticeBoard=useRef<ReturnType<typeof createNoticeBoard>|null>(null);
  useEffect(()=>{const b=createNoticeBoard();noticeBoard.current=b;return()=>{b.dispose();noticeBoard.current=null}},[]);
  useEffect(()=>{noticeBoard.current?.setContext({client,user,org,role})},[user,org,role]);
  const [loginMode,setLoginMode]=useState(loginSession.preference());
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(
      "請使用檢測／維修系統已開通的員工帳號登入。",
    );
  const [rows, setRows] = useState<RentalHead[]>([]),
    [search, setSearch] = useState(""),
    [searchApplied, setSearchApplied] = useState(""),
    [link, setLink] = useState<Link | null>(null);
  const [selected, setSelected] = useState<RentalHead | null>(null),
    [versions, setVersions] = useState<Version[]>([]),
    [events, setEvents] = useState<EventRow[]>([]),
    [view, setView] = useState<RentalSnapshot | null>(null),
    [reason, setReason] = useState("");
  const [pendingLoad, setPendingLoad] = useState<RentalDocument | null>(null);
  const [employees, setEmployees] = useState<Member[]>([]),
    [employeeEmail, setEmployeeEmail] = useState(""),
    [employeeName, setEmployeeName] = useState(""),
    [employeeRole, setEmployeeRole] = useState("STAFF"),
    [employeeActive, setEmployeeActive] = useState(true),
    [invite, setInvite] = useState("");
  const running = useRef(false),
    generation = useRef(0),
    orgRef = useRef(org),
    linkRef = useRef(link);
  orgRef.current = org;
  linkRef.current = link;
  const manager = role === "MANAGER",
    operator = manager || role === "STAFF";
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    else if (!open && dialog.current?.open) dialog.current?.close();
  }, [open]);
  const clearPrivate = useCallback(() => {
    setRows([]);
    setSelected(null);
    setVersions([]);
    setEvents([]);
    setView(null);
    setPendingLoad(null);
    setEmployees([]);
    setInvite("");
    setLink(null);
    setRole("");
    onAccess(false);
  }, [onAccess]);
  useEffect(() => {
    setLink(null);
    setPendingLoad(null);
  }, [resetKey]);
  useEffect(() => {
    if (link && quote.id !== link.number) setLink(null);
  }, [quote.id, link]);
  async function run(action: () => Promise<void>) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      await action();
    } catch (e) {
      setMessage(teamError(e));
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  const context = useCallback(
    async (preferred?: string) => {
      const token = ++generation.current;
      loginSession.active();
      const { data, error } = await client.auth.getUser();
      if (error || !data.user) {
        if (token !== generation.current) return;
        setUser(null);
        setMemberships([]);
        setOrg("");
        clearPrivate();
        return;
      }
      const u = data.user;
      unwrap(await client.rpc("yj_join_workspaces"));
      const ms = unwrap(
        await client
          .from("yj_memberships")
          .select("org_id,user_id,email,display_name,role,active,staff_access")
          .eq("user_id", u.id)
          .eq("active", true),
      ) as Member[];
      if (token !== generation.current) return;
      setUser(u);
      setMemberships(ms);
      const chosen =
        ms.find((m) => m.org_id === (preferred || orgRef.current)) || ms[0];
      if (!chosen) {
        clearPrivate();
        setOrg("");
        setMessage("帳號未列入啟用員工名單，請聯絡主管。");
        return;
      }
      const o = unwrap(
        await client
          .from("yj_organizations")
          .select("name")
          .eq("id", chosen.org_id)
          .single(),
      );
      if (token !== generation.current) return;
      setOrg(chosen.org_id);
      setOrgName(o.name);
      setRole(effectiveTeamRole(chosen));
      onAccess(["MANAGER","STAFF"].includes(effectiveTeamRole(chosen)) && u.user_metadata?.yj_password_setup!==true);
      if (!["MANAGER", "STAFF"].includes(effectiveTeamRole(chosen))) {
        setRows([]);
        setEmployees([]);
        setSelected(null);
        setVersions([]);
        setView(null);
        setEvents([]);
        setLink(null);
        setMessage(
          "你的角色可使用原本分派功能；租賃報價金額與核准僅開放主管、客服／行政。",
        );
      }
    },
    [clearPrivate,onAccess],
  );
  useEffect(() => {
    const stopRetention=watchLoginSession(loginSession,()=>{
      ++generation.current; setUser(null); setMemberships([]); setOrg(''); clearPrivate();
      setMessage('登入保存期限已到、已在其他分頁登出或變更帳號，請重新登入。');
      client.auth.stopAutoRefresh();
    });
    void context().catch((e) => {clearPrivate();setMessage(teamError(e));});
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        ++generation.current;
        setUser(null);
        setMemberships([]);
        setOrg("");
        clearPrivate();
      } else
        setTimeout(
          () => void context().catch((e) => {clearPrivate();setMessage(teamError(e));}),
          0,
        );
    });
    return () => {
      stopRetention();
      subscription.unsubscribe();
      ++generation.current;
    };
  }, [context, clearPrivate]);
  const refreshRows = useCallback(
    async (orgId: string, query: string) => {
      const token = generation.current;
      const active = unwrap(
        await client
          .from("yj_memberships")
          .select("role,active,staff_access")
          .eq("org_id", orgId)
          .eq("user_id", user?.id || "00000000-0000-0000-0000-000000000000")
          .eq("active", true)
          .maybeSingle(),
      );
      if (token !== generation.current || orgRef.current !== orgId) return;
      if (!active || !["MANAGER", "STAFF"].includes(effectiveTeamRole(active))) {
        clearPrivate();
        setMessage("帳號已停用或權限已變更，請重新確認登入狀態。");
        return;
      }
      let request = client
        .from("yj_rental_quotes")
        .select("*")
        .eq("org_id", orgId)
        .order("updated_at", { ascending: false })
        .limit(100);
      if (query.trim())
        request = request.ilike(
          /^R\d{4}/i.test(query.trim()) ? "number" : "customer",
          "%" + query.trim() + "%",
        );
      const result = unwrap(await request) as RentalHead[];
      if (token !== generation.current || orgRef.current !== orgId) return;
      const staff =
        active.role === "MANAGER"
          ? (unwrap(
              await client
                .from("yj_memberships")
                .select("org_id,user_id,email,display_name,role,active,staff_access")
                .eq("org_id", orgId)
                .order("display_name"),
            ) as Member[])
          : [];
      if (token !== generation.current || orgRef.current !== orgId) return;
      setRole(effectiveTeamRole(active));
      onAccess(user?.user_metadata?.yj_password_setup!==true);
      setRows(result);
      setEmployees(staff);
      if (active.role !== "MANAGER") setInvite("");
    },
    [user?.id, clearPrivate,onAccess],
  );
  useEffect(() => {
    if (!org || !user || !operator) return;
    let cancelled = false;
    const refresh = () => {
      if (!running.current && !document.hidden)
        void refreshRows(org, searchApplied).catch((e) => {
          if (!cancelled) {clearPrivate();setMessage(teamError(e));}
        });
    };
    refresh();
    const timer = setInterval(refresh, 15000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [org, user?.id, operator, refreshRows, searchApplied]);
  async function sendReset(address:string) {
    address=address.trim().toLowerCase();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) throw Error("請先填寫正確的登入電子郵件");
    unwrap(await client.auth.resetPasswordForEmail(address,{redirectTo:"https://yongjiesystems.github.io/testing/?reset=1"}));
    setMessage("若帳號可接收重設信，請到該信箱（含垃圾郵件）開啟最新連結，由本人設定至少12字元的新密碼。未收到請聯絡系統管理人員。");
  }
  async function detail(head: RentalHead) {
    const token = generation.current;
    const newest = unwrap(
      await client
        .from("yj_rental_quotes")
        .select("*")
        .eq("id", head.id)
        .single(),
    ) as RentalHead;
    const history = unwrap(
      await client
        .from("yj_rental_versions")
        .select("revision,snapshot,created_name,created_at")
        .eq("quote_id", head.id)
        .order("revision", { ascending: false })
        .limit(100),
    ) as Version[];
    const audit = unwrap(
      await client
        .from("yj_rental_events")
        .select("id,revision,event,reason,actor_name,created_at")
        .eq("quote_id", head.id)
        .order("id", { ascending: false })
        .limit(100),
    ) as EventRow[];
    if (token !== generation.current || orgRef.current !== head.org_id) return;
    setSelected(newest);
    setVersions(history);
    setEvents(audit);
    setView(history[0]?.snapshot || null);
    setReason("");
  }
  async function sync() {
    if (!org || !operator) throw Error("請先以主管或客服登入");
    const submitted = structuredClone(quoteRef.current);
    if (submitted.lines.some(line => line.override === "待估"))
      throw Error("客製化金額尚未填寫，請回到品項填每台整段基本租金後再保存團隊。可先保存本機草稿。");
    const current = linkRef.current;
    if (current && current.org !== org)
      throw Error("團隊不同，請先另開詢價或載入本團隊報價");
    const document = unwrap(
      await client.rpc("yj_save_rental", {
        p_org: org,
        p_id: current?.id || null,
        p_expected: current?.revision || 0,
        p_quote: submitted,
      }),
    ) as RentalDocument;
    if (orgRef.current !== org) return;
    if (quoteRef.current.id === submitted.id) {
      onCanonical(submitted, document.snapshot.quote);
      setLink({
        id: document.head.id,
        number: document.head.number,
        org,
        revision: document.head.revision,
        fingerprint: quoteFingerprint(document.snapshot.quote),
      });
    }
    await refreshRows(org, searchApplied);
    await detail(document.head);
    setMessage(
      `已同步 ${document.head.number} 第${document.head.revision}版；${document.head.workflow === "APPROVED" ? "內容未變，沿用已保存版本" : "已保存，同事可接手"}。`,
    );
  }
  async function official(head: RentalHead, mode: "copy" | "text" | "print") {
    const token = generation.current;
    const document = unwrap(
      await client.rpc("yj_official_rental", {
        p_id: head.id,
        p_expected: head.revision,
      }),
    ) as RentalDocument;
    if (token !== generation.current || orgRef.current !== head.org_id) return;
    const text = officialText(document);
    if (mode === "copy") await navigator.clipboard.writeText(text);
    else
      file(
        `${head.number}-v${head.revision}.${mode === "print" ? "html" : "txt"}`,
        mode === "print" ? officialHtml(text) : text,
        mode === "print"
          ? "text/html;charset=utf-8"
          : "text/plain;charset=utf-8",
      );
    setMessage(
      mode === "copy"
        ? "✓ 已核對最新共用版本並複製客戶報價。"
        : mode === "print"
          ? "正式報價已下載；開啟檔案後可按「列印正式報價」。"
          : "正式文字報價已下載。",
    );
  }
  const dirty = !!link && link.fingerprint !== quoteFingerprint(quote);
  return (
    <dialog
      ref={dialog}
      className="team-dialog"
      aria-labelledby="rental-team-title"
      onClose={() => {
        setInvite("");
        onClose();
      }}
    >
      <header className="team-header">
        <div>
          <p className="eyebrow">共用員工帳號 · 共用報價版本</p>
          <h2 id="rental-team-title">租賃共用紀錄</h2>
        </div>
        <button onClick={() => dialog.current?.close()}>返回詢價表</button>
      </header>
      <p className="notice" role="status">
        {message}
      </p>
      {!user ? (
        <form
          className="team-login"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              try {
                loginSession.begin(loginMode);
                unwrap(
                  await client.auth.signInWithPassword({
                    email: email.trim().toLowerCase(),
                    password,
                  }),
                );
                client.auth.startAutoRefresh();
                await context();
                setMessage(
                  "登入成功。共用報價只在按同步時上傳，本機草稿不會自動上傳。",
                );
              } finally {
                setPassword("");
              }
            });
          }}
        >
          <h3>員工登入</h3>
          <p className="helper">
            使用檢測／維修程式已開通的同一組帳號。新員工由主管登錄並提供一次性開通連結。
          </p>
          <label className="field">
            <span>登入電子郵件</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>登入密碼</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <label className="field"><span>登入保存方式</span><select value={loginMode} disabled={busy} onChange={e=>setLoginMode(e.target.value)}>{Object.entries(LOGIN_MODES).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
          <p className="helper">24 小時／30 天從登入成功起算，關閉網頁後仍可恢復；共用電腦請選僅本次登入。登出、無痕模式或清除網站資料會使記住登入失效。各程式分別保存。共用電腦離開前請按登出；瀏覽器還原分頁可能保留本次登入。</p>
          <button className="primary" disabled={busy}>
            登入租賃團隊
          </button><button type="button" disabled={busy} onClick={()=>void run(()=>sendReset(email))}>忘記密碼／寄送重設信</button>
        </form>
      ) : (
        <>
          <p>密碼由本人設定，主管看不到密碼。需要變更自己的密碼，請在<a href="https://yongjiesystems.github.io/testing/?tab=team" target="_blank" rel="noopener noreferrer">檢測系統的團隊作業</a>按「變更我的密碼」。</p>
          <div className="team-identity">
            <p>
              {user.email} · {memberships.find(m=>m.org_id===org)?.role==='ENGINEER' ? '工程師（助理同等作業權限）' : ROLES[role] || "待確認權限"} · {orgName}<br/>{loginSession.describe()}
            </p>
            <div className="toolbar">
              <button
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await context();
                    if (org && operator) await refreshRows(org, searchApplied);
                    setMessage("已更新員工狀態與團隊清單。");
                  })
                }
              >
                更新團隊資料
              </button>
              <button
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    const hadLink = !!link;
                    const result = await client.auth.signOut({
                      scope: "local",
                    });
                    loginSession.clear();
                    clearPrivate();
                    setUser(null);
                    if (hadLink) onClear();
                    setMessage(
                      "已登出並清除此程式在本瀏覽器記住的登入；本機另存的草稿仍在。",
                    );
                  })
                }
              >
                登出／清除記住登入
              </button>
            </div>
          </div>
          {memberships.length > 1 && (
            <label className="field">
              <span>選擇團隊（切換會清除已載入的共用畫面）</span>
              <select
                disabled={busy}
                value={org}
                onChange={(e) => {
                  const next = e.target.value;
                  clearPrivate();
                  onClear();
                  setOrg(next);
                  void run(() => context(next));
                }}
              >
                {memberships.map((m) => (
                  <option key={m.org_id} value={m.org_id}>
                    {m.display_name} · {ROLES[m.role]} · {m.org_id}
                  </option>
                ))}
              </select>
            </label>
          )}
          {operator && (
            <>
              <section className="team-section">
                <h3>同步目前租賃詢價</h3>
                <p>
                  {link
                    ? `${link.number} · 目前載入第${link.revision}版${dirty ? " · 有未同步修改" : " · 已與此版本同步"}`
                    : "目前未連結共用報價；第一次同步會建立新單。"}
                </p>
                <p className="helper">
                  只有按此按鈕才上傳本張報價；不會上傳本機其他草稿。費用未齊也可先保存詢價；確定報價仍須補齊必要費用與條件。
                </p>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() => void run(sync)}
                >
                  保存到團隊
                </button>
              </section>
              <section className="team-section">
                <h3>共用租賃報價</h3>
                <p className="helper">
                  清單每15秒更新，最多顯示最新100筆；編輯中的詢價表不會自動被覆寫。輸入客戶名稱，或以R開頭的報價單號搜尋。
                </p>
                <form
                  className="team-search"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSearchApplied(search);
                    void run(() => refreshRows(org, search));
                  }}
                >
                  <label className="field">
                    <span>搜尋共用客戶／單號</span>
                    <input
                      value={search}
                      maxLength={200}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  <button disabled={busy}>搜尋</button>
                </form>
                <div className="team-quotes">
                  {!rows.length && (
                    <p className="helper">目前沒有符合條件的共用報價。</p>
                  )}
                  {rows.map((h) => (
                    <article key={h.id} className="team-row">
                      <div>
                        <strong>{h.customer || "未填客戶"}</strong>
                        <p>
                          {h.number} · 第{h.revision}版 ·{" "}
                          <span className={"workflow " + h.workflow}>
                            {statusName[h.workflow]}
                          </span>
                        </p>
                        <small>
                          {money(h.total)}
                          {h.pending ? "（另有待估）" : ""} ·{" "}
                          {time(h.updated_at)}
                        </small>
                      </div>
                      <div className="toolbar">
                        <button
                          disabled={busy}
                          onClick={() => void run(() => detail(h))}
                        >
                          查看版本與明細
                        </button>
                        <button
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              const latest = unwrap(
                                await client
                                  .from("yj_rental_quotes")
                                  .select("*")
                                  .eq("id", h.id)
                                  .single(),
                              ) as RentalHead;
                              const version = unwrap(
                                await client
                                  .from("yj_rental_versions")
                                  .select("snapshot")
                                  .eq("quote_id", h.id)
                                  .eq("revision", latest.revision)
                                  .single(),
                              );
                              setPendingLoad({
                                head: latest,
                                snapshot: version.snapshot as RentalSnapshot,
                              });
                            })
                          }
                        >
                          載入修改
                        </button>
                        {true && (
                          <button
                            disabled={busy}
                            onClick={() => void run(() => official(h, "copy"))}
                          >
                            複製客戶報價
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
              {pendingLoad && (
                <section className="confirm-box">
                  <h3>確認替換目前詢價表</h3>
                  <p>
                    {pendingLoad.head.number} · 第{pendingLoad.head.revision}版
                    · {pendingLoad.head.customer}
                    。尚未同步的輸入會被替換，請先保存。
                  </p>
                  <button
                    onClick={() => {
                      const d = pendingLoad;
                      onLoad(structuredClone(d.snapshot.quote));
                      setLink({
                        id: d.head.id,
                        number: d.head.number,
                        org: d.head.org_id,
                        revision: d.head.revision,
                        fingerprint: quoteFingerprint(d.snapshot.quote),
                      });
                      setPendingLoad(null);
                      setMessage("已載入共用版本；修改後再保存，歷史版本會保留。");
                      dialog.current?.close();
                    }}
                  >
                    確認載入共用版本
                  </button>
                  <button onClick={() => setPendingLoad(null)}>取消載入</button>
                </section>
              )}
              {selected && (
                <section className="team-section">
                  <h3>
                    {selected.number} · 第{selected.revision}版
                  </h3>
                  <p>
                    {selected.customer} · {statusName[selected.workflow]}
                    {selected.decision_reason
                      ? " · " + selected.decision_reason
                      : ""}
                  </p>
                  <div className="toolbar">
                    {versions.map((v) => (
                      <button
                        key={v.revision}
                        onClick={() => setView(v.snapshot)}
                      >
                        查看第{v.revision}版（唯讀）
                      </button>
                    ))}
                  </div>
                  {view && (
                    <details className="extra">
                      <summary>
                        展開此版明細（歷史唯讀，不代表最新報價）
                      </summary>
                      <pre>
                        {quoteText(view.quote, { totals: view.totals, internal: true })}
                      </pre>
                      {!!view.totals.checks.length && (
                        <ul className="errors">
                          {view.totals.checks.map((c, n) => (
                            <li key={n}>{c}</li>
                          ))}
                        </ul>
                      )}
                    </details>
                  )}
                  {true && (
                    <div className="toolbar">
                      <button
                        disabled={busy}
                        onClick={() =>
                          void run(() => official(selected, "copy"))
                        }
                      >
                        複製此案客戶報價
                      </button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          void run(() => official(selected, "text"))
                        }
                      >
                        下載客戶文字
                      </button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          void run(() => official(selected, "print"))
                        }
                      >
                        下載／列印客戶報價
                      </button>
                    </div>
                  )}
                  <details className="extra">
                    <summary>保存與異動紀錄</summary>
                    {events.map((e) => (
                      <p className="audit-line" key={e.id}>
                        {time(e.created_at)} · {e.actor_name} · 第{e.revision}版
                        ·{" "}
                        {(
                          {
                            SAVED: "同步報價",
                            APPROVED: "主管核准",
                            REJECTED: "退回／撤回",
                          } as Record<string, string>
                        )[e.event] || e.event}
                        {e.reason ? " · " + e.reason : ""}
                      </p>
                    ))}
                  </details>
                </section>
              )}
              {manager && (
                <section className="team-section">
                  <h3>員工帳號與權限</h3>
                  <p className="helper">
                    三套程式共用員工名單；修改角色或停用也會影響檢測、維修權限。新帳號由本人設定密碼，主管不代設密碼。
                  </p>
                  <div className="form-grid">
                    <label className="field">
                      <span>員工電子郵件</span>
                      <input
                        type="email"
                        value={employeeEmail}
                        onChange={(e) => setEmployeeEmail(e.target.value)}
                        maxLength={254}
                      />
                    </label>
                    <label className="field">
                      <span>員工姓名</span>
                      <input
                        value={employeeName}
                        maxLength={100}
                        onChange={(e) => setEmployeeName(e.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>員工角色</span>
                      <select
                        value={employeeRole}
                        onChange={(e) => setEmployeeRole(e.target.value)}
                      >
                        {Object.entries(ROLES).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={employeeActive}
                        onChange={(e) => setEmployeeActive(e.target.checked)}
                      />
                      啟用帳號
                    </label>
                  </div>
                  <button
                    disabled={busy || !employeeEmail || !employeeName}
                    onClick={() =>
                      void run(async () => {
                        unwrap(
                          await client.rpc("yj_set_employee", {
                            p_org: org,
                            p_email: employeeEmail.trim(),
                            p_name: employeeName,
                            p_role: employeeRole,
                            p_active: employeeActive,
                          }),
                        );
                        await refreshRows(org, searchApplied);
                        setMessage("員工權限已保存，三套程式共用同一名單。");
                      })
                    }
                  >
                    保存員工權限
                  </button>
                  <div className="employee-list">
                    {employees.map((m) => (
                      <article key={m.email}>
                        <p>
                          {m.display_name} · {m.email} · {ROLES[m.role]} ·{" "}
                          {m.active ? "啟用" : "停用"} ·{" "}
                          {m.user_id ? "已開通" : "未開通"}
                        </p>
                        <div className="toolbar">
                          <button
                            disabled={busy}
                            onClick={() => {
                              setEmployeeEmail(m.email);
                              setEmployeeName(m.display_name);
                              setEmployeeRole(m.role);
                              setEmployeeActive(m.active);
                              setInvite("");
                            }}
                          >
                            載入員工設定
                          </button>
                          {m.active && !m.user_id && (
                            <button
                              disabled={busy}
                              onClick={() =>
                                void run(async () => {
                                  const { data, error } =
                                    await client.functions.invoke(
                                      "team-onboard",
                                      {
                                        body: {
                                          mode: "invite",
                                          orgId: org,
                                          email: m.email,
                                        },
                                      },
                                    );
                                  if (error || data?.error)
                                    throw Error(
                                      data?.error ||
                                        "此入口僅開通新帳號；既有帳號請本人直接登入。",
                                    );
                                  setInvite(data.url);
                                  await refreshRows(org, searchApplied);
                                  setMessage(
                                    "一次性開通連結已建立，請私下交給本人設定密碼；不會自動寄信。",
                                  );
                                })
                              }
                            >
                              產生一次性開通連結
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                  <h4>協助員工重設密碼</h4><p>只寄到員工名單中的本人信箱；主管不能查看或代填密碼。</p>{employees.filter(m=>m.active && m.user_id).map(m=><button key={m.email} disabled={busy} onClick={()=>void run(()=>sendReset(m.email))}>寄送重設信：{m.display_name}（{m.email}）</button>)}
                  {invite && (
                    <div className="callout">
                      <p>
                        僅私下交給指定員工。會開啟現有檢測系統的安全密碼設定頁，設定後可登入租賃系統。
                      </p>
                      <a
                        href={invite}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        開啟員工設定頁
                      </a>
                      <label className="field">
                        <span>一次性開通連結（請勿公開）</span>
                        <input readOnly value={invite} />
                      </label>
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </>
      )}
    </dialog>
  );
}
