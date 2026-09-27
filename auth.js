(function () {
  const AUTH_KEY = "eightfaces-lock-v1";
  const SESS_KEY = "eightfaces-session";
  function $(id) { return document.getElementById(id); }
  function authGet() { try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "null"); } catch (e) { return null; } }
  function authSet(obj) { localStorage.setItem(AUTH_KEY, JSON.stringify(obj)); }
  function hasSession() { return !!(sessionStorage.getItem(SESS_KEY) || localStorage.getItem(SESS_KEY)); }
  function setSession(remember) { sessionStorage.setItem(SESS_KEY, "1"); if (remember) localStorage.setItem(SESS_KEY, "1"); else localStorage.removeItem(SESS_KEY); }
  function clearSession() { sessionStorage.removeItem(SESS_KEY); localStorage.removeItem(SESS_KEY); }
  async function sha(text) { const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)); return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join(""); }
  function salt() { const a = new Uint8Array(16); crypto.getRandomValues(a); return Array.from(a).map(b => b.toString(16).padStart(2, "0")).join(""); }
  async function hashPass(password, s) { return sha(s + "::" + password); }
  function showErr(msg) { const el = $("gate-err"); if (el) el.textContent = msg || ""; }
  function lockScreen() { document.documentElement.classList.add("locked"); document.body.classList.add("locked"); }
  function unlockScreen() { document.documentElement.classList.remove("locked"); document.body.classList.remove("locked"); if (typeof renderHome === "function") renderHome(); else if (typeof home === "function") home(); }
  function paintGate() {
    const rec = authGet(); const setup = $("gate-setup"); const login = $("gate-login"); const lead = $("gate-lead");
    if (!setup || !login) return;
    if (rec && rec.hash) { setup.hidden = true; login.hidden = false; if (lead) lead.textContent = (rec.name ? rec.name + "，" : "") + "輸入密碼先入八面。"; }
    else { setup.hidden = false; login.hidden = true; if (lead) lead.textContent = "第一次用先設一個只有你知嘅密碼。密碼只存在呢部瀏覽器，伺服器睇唔到。"; }
  }
  async function createAccount() {
    const name = ($("gate-name") && $("gate-name").value.trim()) || "";
    const a = ($("gate-pass1") && $("gate-pass1").value) || "";
    const b = ($("gate-pass2") && $("gate-pass2").value) || "";
    if (a.length < 6) return showErr("密碼至少 6 個字。");
    if (a !== b) return showErr("兩次密碼唔一致。");
    const s = salt();
    authSet({ name: name, salt: s, hash: await hashPass(a, s), createdAt: Date.now() });
    if (name && window.state && state.profile) { state.profile.name = name; if (typeof save === "function") save(); }
    setSession(true); showErr(""); unlockScreen();
  }
  async function login() {
    const rec = authGet(); if (!rec || !rec.hash) return createAccount();
    const pass = ($("gate-pass") && $("gate-pass").value) || "";
    const remember = $("gate-remember") && $("gate-remember").checked;
    if (!pass) return showErr("請輸入密碼。");
    if ((await hashPass(pass, rec.salt)) !== rec.hash) return showErr("密碼唔正確。");
    setSession(!!remember); showErr(""); unlockScreen();
  }
  function logout() { clearSession(); const p = $("gate-pass"); if (p) p.value = ""; paintGate(); lockScreen(); }
  async function changePassword(oldPass, nextPass) {
    const rec = authGet(); if (!rec || !rec.hash) return "未開戶。";
    if ((await hashPass(oldPass, rec.salt)) !== rec.hash) return "舊密碼唔正確。";
    if (!nextPass || nextPass.length < 6) return "新密碼至少 6 個字。";
    const s = salt();
    authSet({ name: rec.name || "", salt: s, hash: await hashPass(nextPass, s), createdAt: rec.createdAt, updatedAt: Date.now() });
    return "";
  }
  window.today = function () { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  if (typeof calMonth !== "undefined") calMonth = window.today().slice(0, 7);
  paintGate();
  if (!authGet() || !hasSession()) lockScreen(); else unlockScreen();
  if ($("gate-create")) $("gate-create").onclick = function () { createAccount().catch(function () { showErr("開戶失敗。"); }); };
  if ($("gate-enter")) $("gate-enter").onclick = function () { login().catch(function () { showErr("登入失敗。"); }); };
  if ($("btn-logout")) $("btn-logout").onclick = logout;
  ["gate-pass", "gate-pass2"].forEach(function (id) { const el = $(id); if (el) el.addEventListener("keydown", function (e) { if (e.key === "Enter") (id === "gate-pass" ? login() : createAccount()); }); });
  window.eightfacesAuth = { logout: logout, changePassword: changePassword, authGet: authGet };
})();
