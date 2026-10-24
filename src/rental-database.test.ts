import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import {
  newQuote,
  makeLine,
  changePricingMode,
  PLANS,
  calculateQuote,
  type Quote,
} from "./quote-core.ts";
const db = new PGlite();

test("new custom choice survives shared persistence with the same amount and deposit", async () => {
 const q = draft();q.lines[0] = changePricingMode(q.lines[0], "custom");
 Object.assign(q.lines[0], { qty: "3", periods: "6", override: "2500", overrideReason: "半年整段專案價" });
 const saved = await save(q);const local = calculateQuote(q);
 assert.equal(saved.snapshot.totals.subtotal, 7500);
 for(const k of ["total", "discountBase", "deposit", "suggestedDeposit", "ready"] as const) assert.equal(saved.snapshot.totals[k], local[k]);
 assert.equal(saved.snapshot.quote.lines[0].override, "2500");
});
test("unfinished custom price is rejected by the database, never silently uses public rate", async () => {
 const q = draft();q.lines[0] = changePricingMode(q.lines[0], "custom");
 q.lines[0].overrideReason = "待確認專案";
 await assert.rejects(save(q), /金額|數值|數字|numeric/);
});
const ids = Object.fromEntries(
  [
    "org",
    "otherOrg",
    "manager",
    "manager2",
    "staff",
    "engineer",
    "driver",
    "outsider",
    "otherManager",
  ].map((k, n) => [
    k,
    `00000000-0000-4000-8000-${String(n + 1).padStart(12, "0")}`,
  ]),
);
async function as(who: string, sql: string, args: unknown[] = []) {
  await db.exec("begin;set local role authenticated;");
  try {
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [
      ids[who] || who,
    ]);
    const r = await db.query(sql, args);
    await db.exec("commit");
    return r.rows as any[];
  } catch (e) {
    await db.exec("rollback");
    throw e;
  }
}
function draft() {
  const q = newQuote();
  q.lines = [makeLine("equipment", "pc-month")];
  Object.assign(q.inquiry, {
    customer: "QA RENTAL",
    staff: "QA",
    start: "2026-11-01",
    end: "2026-12-01",
    validUntil: "2026-10-30",
    tax: "included",
    depositMode: "collect",
    deposit: "4000",
    payment: "QA",
    delivery: "客戶自取自還",
    stockConfirmed: true,
    scopeConfirmed: true,
    periodsConfirmed: true,
    reviewed: true,
  });
  return q;
}
async function save(
  q: Quote,
  expected = 0,
  id: string | null = null,
  actor = "staff",
  org = ids.org,
) {
  return (
    await as(actor, "select public.yj_save_rental($1,$2,$3,$4) result", [
      org,
      id,
      expected,
      q,
    ])
  )[0].result;
}
before(async () => {
  await db.exec(
    `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`,
  );
  await db.exec(
    await readFile(
      new URL("../supabase/fixtures/inspection_workspace.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.exec(
    await readFile(
      new URL("../supabase/rental_workspace.sql", import.meta.url),
      "utf8",
    ),
  );
  for (const org of ["org", "otherOrg"])
    await db.query(
      "insert into public.yj_organizations(id,name,pricebook) values($1,$2,$3)",
      [ids[org], org, {}],
    );
  for (const [name, role] of [
    ["manager", "MANAGER"],
    ["manager2", "MANAGER"],
    ["staff", "STAFF"],
    ["engineer", "ENGINEER"],
    ["driver", "DRIVER"],
    ["otherManager", "MANAGER"],
    ["outsider", null],
  ]) {
    await db.query("insert into auth.users values($1,$2,now())", [
      ids[name],
      name + "@example.test",
    ]);
    if (role)
      await db.query(
        "insert into public.yj_memberships(org_id,user_id,email,display_name,role) values($1,$2,$3,$4,$5)",
        [
          ids[name === "otherManager" ? "otherOrg" : "org"],
          ids[name],
          name.toLowerCase() + "@example.test",
          name,
          role,
        ],
      );
  }
 await db.exec(await readFile(new URL('../supabase/engineer_staff_access.sql',import.meta.url),'utf8'));
});
after(() => db.close());

test('opt-in engineer gets staff rental operations without approval or employee management',async()=>{
 await db.query('update public.yj_memberships set staff_access=true where user_id=$1',[ids.engineer]);
 try {
  const r=await save(draft(),0,null,'engineer');assert.equal(r.head.revision,1);
  assert.ok((await as('engineer','select * from public.yj_rental_quotes')).length>0);
  await assert.rejects(as('engineer','select public.yj_decide_rental($1,1,1,$2,$3)',[r.head.id,'APPROVED','no']),{code:'42501'});
  await assert.rejects(as('engineer','update public.yj_memberships set role=\'MANAGER\''),{code:'42501'});
  assert.equal((await as('engineer','select * from public.yj_rental_quotes where org_id=$1',[ids.otherOrg])).length,0);
 } finally { await db.query('update public.yj_memberships set staff_access=false where user_id=$1',[ids.engineer]); }
});
test("anonymous cannot read rental tables, call mutations or private calculation", async () => {
  await db.exec("set role anon");
  try {
    for (const sql of [
      "select * from public.yj_rental_quotes",
      "select public.yj_official_rental(null,0)",
      "select yj_private.rental_snapshot('{}')",
    ])
      await assert.rejects(db.query(sql), { code: "42501" });
  } finally {
    await db.exec("reset role");
  }
});
test("all original server prices and deposits equal browser calculations", async () => {
  for (const p of PLANS) {
    const q = draft();
    q.lines = [makeLine("equipment", p.id)];
    const r = await save(q);
    const local = calculateQuote(q);
    assert.equal(r.snapshot.totals.total, local.total, p.id);
    assert.equal(
      r.snapshot.totals.suggestedDeposit,
      local.suggestedDeposit,
      p.id,
    );
  }
});
test("server ignores forged totals, catalogue and admin claims", async () => {
  const q: any = draft();
  q.total = 1;
  q.role = "MANAGER";
  q.lines[0].rate = 1;
  const r = await save(q);
  assert.equal(r.head.total, 600);
  assert.equal(r.snapshot.quote.role, undefined);
  assert.equal(r.snapshot.quote.lines[0].rate, undefined);
});
test("manual line, usage, quantity, override, discount, tax and deposit match browser", async () => {
  const q = draft();
  q.lines = [makeLine("equipment", "ink-bw")];
  Object.assign(q.lines[0], { qty: "3", pages: "54", periods: "2" });
  const l = makeLine("network");
  Object.assign(l, { name: "配線", price: "300.35", scope: "QA" });
  q.lines.push(l);
  q.discount = { type: "percent", value: "10", reason: "QA" };
  q.inquiry.tax = "exclusive";
  const r = await save(q);
  const local = calculateQuote(q);
  for (const k of [
    "subtotal",
    "discountBase",
    "discount",
    "net",
    "tax",
    "total",
    "deposit",
    "suggestedDeposit",
    "pending",
    "ready",
  ])
    assert.equal(r.snapshot.totals[k], local[k], k);
});
test("saves are idempotent, preserve versions, and stale editors cannot overwrite", async () => {
  const q = draft();
  const first = await save(q);
  const retry = await save(q);
  assert.equal(retry.head.id, first.head.id);
  assert.equal(retry.head.revision, 1);
  const q2 = structuredClone(q);
  q2.inquiry.notes = "new";
  const second = await save(q2, 1, first.head.id);
  assert.equal(second.head.revision, 2);
  await assert.rejects(save(q, 1, first.head.id), { code: "PT409" });
  assert.equal(
    (
      await as(
        "staff",
        "select count(*)::integer n from public.yj_rental_versions where quote_id=$1",
        [first.head.id],
      )
    )[0].n,
    2,
  );
});
test("restored canonical quote without its cloud link cannot create a duplicate", async () => {
  const r = await save(draft());
  const q = r.snapshot.quote;
  q.inquiry.notes = "local backup";
  await assert.rejects(save(q), { code: "PT409" });
});
test("staff cannot approve, reject, update raw tables, or modify version history", async () => {
  const r = await save(draft());
  await assert.rejects(
    as("staff", "select public.yj_decide_rental($1,1,1,$2,$3)", [
      r.head.id,
      "APPROVED",
      "fake",
    ]),
    { code: "42501" },
  );
  await assert.rejects(
    as("staff", "update public.yj_rental_quotes set workflow='APPROVED'"),
    { code: "42501" },
  );
  await assert.rejects(
    as("manager", "update public.yj_rental_versions set snapshot='{}'"),
    { code: "42501" },
  );
});
test("outside users, drivers and engineers cannot read or mutate rental quotations", async () => {
  const r = await save(draft());
  for (const actor of ["outsider", "driver", "engineer"]) {
    assert.deepEqual(
      await as(actor, "select * from public.yj_rental_quotes"),
      [],
    );
    assert.deepEqual(
      await as(actor, "select * from public.yj_rental_versions"),
      [],
    );
    await assert.rejects(save(draft(), 0, null, actor), { code: "42501" });
    await assert.rejects(
      as(actor, "select public.yj_official_rental($1,1)", [r.head.id]),
      { code: "42501" },
    );
  }
});
test("other company cannot read or approve a leaked rental id", async () => {
  const r = await save(draft());
  assert.deepEqual(
    await as("otherManager", "select * from public.yj_rental_quotes"),
    [],
  );
  await assert.rejects(
    save(draft(), 1, r.head.id, "otherManager", ids.otherOrg),
    { code: "42501" },
  );
  await assert.rejects(
    as("otherManager", "select public.yj_decide_rental($1,1,1,$2,$3)", [
      r.head.id,
      "APPROVED",
      "cross org",
    ]),
    { code: "42501" },
  );
});
test("incomplete drafts sync but cannot be approved, even with forged ready=true", async () => {
  const q: any = draft();
  const l = makeLine("network");
  l.name = "待估";
  q.lines.push(l);
  q.ready = true;
  const r = await save(q);
  assert.equal(r.snapshot.totals.ready, false);
  await assert.rejects(
    as("manager", "select public.yj_decide_rental($1,1,1,$2,$3)", [
      r.head.id,
      "APPROVED",
      "try",
    ]),
    /待估/,
  );
});
test("only manager can approve complete current version; official export rechecks state", async () => {
  const r = await save(draft());
  await assert.rejects(
    as("staff", "select public.yj_official_rental($1,1)", [r.head.id]),
    { code: "PT409" },
  );
  await as("manager", "select public.yj_decide_rental($1,1,1,$2,$3)", [
    r.head.id,
    "APPROVED",
    "QA actual approval",
  ]);
  const out = (
    await as("staff", "select public.yj_official_rental($1,1) result", [
      r.head.id,
    ])
  )[0].result;
  assert.equal(out.head.approved_revision, 1);
  assert.equal(out.approverName, "manager");
  assert.equal(out.snapshot.totals.total, 600);
});
test("new version invalidates approval and stale manager decisions are rejected", async () => {
  const q = draft();
  const r = await save(q);
  await as("manager", "select public.yj_decide_rental($1,1,1,$2,$3)", [
    r.head.id,
    "APPROVED",
    "first",
  ]);
  await assert.rejects(
    as("manager2", "select public.yj_decide_rental($1,1,1,$2,$3)", [
      r.head.id,
      "REJECTED",
      "stale",
    ]),
    { code: "PT409" },
  );
  q.lines[0].qty = "2";
  const second = await save(q, 1, r.head.id);
  assert.equal(second.head.workflow, "REVIEW");
  assert.equal(second.head.approved_revision, null);
  await assert.rejects(
    as("staff", "select public.yj_official_rental($1,1)", [r.head.id]),
    { code: "PT409" },
  );
});
test("reject reason and history persist without deleting prior versions", async () => {
  const r = await save(draft());
  await assert.rejects(
    as("manager", "select public.yj_decide_rental($1,1,1,$2,$3)", [
      r.head.id,
      "REJECTED",
      "",
    ]),
    /原因/,
  );
  await as("manager", "select public.yj_decide_rental($1,1,1,$2,$3)", [
    r.head.id,
    "REJECTED",
    "補齊設備規格",
  ]);
  const events = await as(
    "staff",
    "select event,reason from public.yj_rental_events where quote_id=$1 order by id",
    [r.head.id],
  );
  assert.equal(events.at(-1).reason, "補齊設備規格");
  assert.equal(events.at(-1).event, "REJECTED");
});
test("deactivation takes effect on existing identities, not only next login", async () => {
  const r = await save(draft());
  await db.query(
    "update public.yj_memberships set active=false where user_id=$1",
    [ids.staff],
  );
  try {
    assert.deepEqual(
      await as("staff", "select * from public.yj_rental_quotes"),
      [],
    );
    await assert.rejects(
      as("staff", "select public.yj_official_rental($1,1)", [r.head.id]),
      { code: "42501" },
    );
    await assert.rejects(save(draft()), { code: "42501" });
  } finally {
    await db.query(
      "update public.yj_memberships set active=true where user_id=$1",
      [ids.staff],
    );
  }
});
test("malformed schemas, altered preset units and invalid money fail on server", async () => {
  for (const transform of [
    (q: any) => delete q.schema,
    (q: any) => (q.lines[0].unit = "次"),
    (q: any) => (q.lines[0].qty = "-1"),
    (q: any) => delete q.discount.type,
  ]) {
    const q = draft();
    transform(q);
    await assert.rejects(save(q));
  }
});
test("three year and individual date restrictions are enforced independently of client", async () => {
  const q = draft();
  q.inquiry.end = "2030-01-01";
  const r = await save(q);
  assert.equal(r.snapshot.totals.ready, false);
  await assert.rejects(
    as("manager", "select public.yj_decide_rental($1,1,1,$2,$3)", [
      r.head.id,
      "APPROVED",
      "test",
    ]),
    /待估|待確認/,
  );
});
