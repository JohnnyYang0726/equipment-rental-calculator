import React, { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { Quote } from "./quote-core";
import { money, quoteText } from "./quote-core";
import {
  teamClient as client,
  teamError,
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
  REVIEW: "待主管核准",
  APPROVED: "已核准",
  REJECTED: "已退回",
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
}: {
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
  }, []);
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
          .select("org_id,user_id,email,display_name,role,active")
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
      setRole(chosen.role);
      if (!["MANAGER", "STAFF"].includes(chosen.role)) {
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
    [clearPrivate],
  );
  useEffect(() => {
    void context().catch((e) => setMessage(teamError(e)));
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
          () => void context().catch((e) => setMessage(teamError(e))),
          0,
        );
    });
    return () => {
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
          .select("role,active")
          .eq("org_id", orgId)
          .eq("user_id", user?.id || "00000000-0000-0000-0000-000000000000")
          .eq("active", true)
          .maybeSingle(),
      );
      if (token !== generation.current || orgRef.current !== orgId) return;
      if (!active || !["MANAGER", "STAFF"].includes(active.role)) {
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
                .select("org_id,user_id,email,display_name,role,active")
                .eq("org_id", orgId)
                .order("display_name"),
            ) as Member[])
          : [];
      if (token !== generation.current || orgRef.current !== orgId) return;
      setRole(active.role);
      setRows(result);
      setEmployees(staff);
      if (active.role !== "MANAGER") setInvite("");
    },
    [user?.id, clearPrivate],
  );
  useEffect(() => {
    if (!org || !user || !operator) return;
    let cancelled = false;
    const refresh = () => {
      if (!running.current && !document.hidden)
        void refreshRows(org, searchApplied).catch((e) => {
          if (!cancelled) setMessage(teamError(e));
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
      `已同步 ${document.head.number} 第${document.head.revision}版；${document.head.workflow === "APPROVED" ? "內容未變，原核准仍有效" : "正式報價須主管核准"}。`,
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
        ? "已向後端核對最新核准版本並複製正式報價。"
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
          <h2 id="rental-team-title">租賃團隊／主管核准</h2>
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
                unwrap(
                  await client.auth.signInWithPassword({
                    email: email.trim(),
                    password,
                  }),
                );
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
          <button className="primary" disabled={busy}>
            登入租賃團隊
          </button>
        </form>
      ) : (
        <>
          <div className="team-identity">
            <p>
              {user.email} · {ROLES[role] || "待確認權限"} · {orgName}
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
                    if (result.error) throw result.error;
                    clearPrivate();
                    setUser(null);
                    if (hadLink) onClear();
                    setMessage(
                      "已登出此分頁；從團隊載入的畫面已清除。本機另存的草稿仍在。",
                    );
                  })
                }
              >
                登出此分頁
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
                  只有按此按鈕才上傳本張報價；不會上傳本機其他草稿。資料仍待估也可先同步，但無法核准。
                </p>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() => void run(sync)}
                >
                  同步目前報價／送主管核准
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
                          查看版本與核准
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
                        {h.workflow === "APPROVED" && (
                          <button
                            disabled={busy}
                            onClick={() => void run(() => official(h, "copy"))}
                          >
                            複製正式報價
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
                      setMessage("已載入共用版本；修改後需同步並重新核准。");
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
                        展開此版明細（歷史唯讀，不代表最新核准）
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
                  {manager && (
                    <div className="decision-box">
                      <label className="field">
                        <span>
                          主管核准／退回原因（核對最新第{selected.revision}版）
                        </span>
                        <textarea
                          value={reason}
                          maxLength={1000}
                          onChange={(e) => setReason(e.target.value)}
                        />
                      </label>
                      <div className="toolbar">
                        {(["APPROVED", "REJECTED"] as const).map((decision) => (
                          <button
                            key={decision}
                            className={decision === "APPROVED" ? "primary" : ""}
                            disabled={busy || !reason.trim()}
                            onClick={() =>
                              void run(async () => {
                                unwrap(
                                  await client.rpc("yj_decide_rental", {
                                    p_id: selected.id,
                                    p_expected: selected.revision,
                                    p_state: selected.state_version,
                                    p_decision: decision,
                                    p_reason: reason,
                                  }),
                                );
                                await refreshRows(org, searchApplied);
                                await detail(selected);
                                setMessage(
                                  decision === "APPROVED"
                                    ? "主管已核准此版，正式輸出仍會再次核對後端狀態。"
                                    : "已退回並記錄原因，修改後同步新版本。",
                                );
                              })
                            }
                          >
                            {decision === "APPROVED"
                              ? "核准最新版本"
                              : "退回／撤回核准"}
                          </button>
                        ))}
                      </div>
                      <p className="helper">
                        核准會再次核對版本與完整資料；不能用舊清單核准新價格，也不能核准待估項目。
                      </p>
                    </div>
                  )}
                  {selected.workflow === "APPROVED" && (
                    <div className="toolbar">
                      <button
                        disabled={busy}
                        onClick={() =>
                          void run(() => official(selected, "copy"))
                        }
                      >
                        複製此案正式報價
                      </button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          void run(() => official(selected, "text"))
                        }
                      >
                        下載正式文字
                      </button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          void run(() => official(selected, "print"))
                        }
                      >
                        下載正式報價（可列印）
                      </button>
                    </div>
                  )}
                  <details className="extra">
                    <summary>異動與核准紀錄</summary>
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
