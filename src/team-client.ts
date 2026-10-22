import { createClient } from "@supabase/supabase-js";
// Public key only. Database membership checks, RLS and checked RPCs enforce authorization.
export const TEAM_URL = "https://buzcduwjeddaqwsrbwlf.supabase.co";
export const TEAM_KEY = "sb_publishable_D-FJbw811QbRCF8Il57mTg_ilIQ3xnw";
import { createLoginSession, LOGIN_MODES, watchLoginSession } from './login-session.js';
export { LOGIN_MODES, watchLoginSession };
export const loginSession = createLoginSession({namespace:'yj-rental-login-v1',local:globalThis.localStorage,tab:globalThis.sessionStorage});
const previousKey=globalThis.sessionStorage?.getItem('yj-rental-tab-auth-key');
if(previousKey) loginSession.migrateLegacy(globalThis.sessionStorage,previousKey);
export const teamClient = createClient(TEAM_URL, TEAM_KEY, {
  auth: {
    storage: loginSession.storage,
    storageKey: loginSession.storageKey,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  db: { retry: false },
  global: {
    fetch: (input: RequestInfo | URL, init: RequestInit = {}) =>
      fetch(input, {
        ...init,
        signal: init.signal
          ? AbortSignal.any([init.signal, AbortSignal.timeout(20000)])
          : AbortSignal.timeout(20000),
      }),
  },
});
export const ROLES: Record<string, string> = {
  MANAGER: "主管",
  STAFF: "客服／行政",
  ENGINEER: "工程師",
  DRIVER: "收送人員",
};
export function teamError(e: unknown) {
  const err = e as { code?: string; message?: string };
  if (["PT409", "40001"].includes(err?.code || ""))
    return "同事已更新報價或核准狀態。你的表單仍保留，請先保存修改，再載入最新版本。";
  if (err?.code === "42501")
    return "權限不足或帳號已停用，請重新整理登入狀態並聯絡主管。";
  if (err?.message === "Invalid login credentials")
    return "帳號或密碼不正確，請核對電子郵件及密碼。";
  return err?.message || "連線未完成，表單仍保留，請稍後重試。";
}

export { quoteFingerprint, officialText, officialHtml } from "./team-format";
export type { RentalHead, RentalSnapshot, RentalDocument } from "./team-format";

// Read only from a verified, active database membership; never from user_metadata.
export const effectiveTeamRole = (member: {role:string;staff_access?:boolean}) => member.role==='ENGINEER' && member.staff_access===true ? 'STAFF' : member.role;
