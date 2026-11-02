/* عناياتي — أدوات مشتركة للوحة الصالون ولوحة الإدارة */
window.UI = (function () {
  "use strict";
  const LOCALE = "ar-SA-u-ca-gregory-nu-latn";
  const THEME_KEY = "enayati.theme";
  const pad = (n) => String(n).padStart(2, "0");

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => `${Number(n || 0).toLocaleString("en-US")} ${window.ENAYATI_DATA.currency}`;
  const fromMin = (m) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  function fmtTime(t) {
    const [h, m] = t.split(":").map(Number);
    return `${h % 12 === 0 ? 12 : h % 12}:${pad(m)} ${h < 12 ? "ص" : "م"}`;
  }
  const hourLabel = (h) => fmtTime(fromMin(h * 60));
  const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const fmtDate = (iso, opts) => parseISO(iso).toLocaleDateString(LOCALE, opts || { weekday: "long", day: "numeric", month: "long" });
  const initials = (name) => String(name || "؟").replace(/^(صالون|ستوديو)\s+/, "").replace(/^ال(?=\S{2})/, "").trim().charAt(0) || "؟";
  const DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

  /* حالة الحجز كما تُعرض */
  function bookingState(b) {
    if (b.status === "cancelled") return ["cancelled", "ملغى"];
    if (b.status === "noshow") return ["noshow", "لم يحضر"];
    if (b.status === "completed") return ["completed", "مكتمل"];
    const end = parseISO(b.date); end.setMinutes(toMin(b.time) + b.minutes);
    return end < new Date() ? ["past", "بانتظار التأكيد"] : ["upcoming", "مؤكد"];
  }

  /* الوضع الليلي والنهاري (نفس إعداد تطبيق العميل) */
  function getTheme() { try { return JSON.parse(localStorage.getItem(THEME_KEY)) || "system"; } catch (e) { return "system"; } }
  function applyTheme(t) {
    const root = document.documentElement;
    if (t === "light" || t === "dark") root.setAttribute("data-theme", t); else root.removeAttribute("data-theme");
  }
  const isDark = () => { const t = getTheme(); return t === "dark" || (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches); };
  function toggleTheme() {
    const t = isDark() ? "light" : "dark";
    try { localStorage.setItem(THEME_KEY, JSON.stringify(t)); } catch (e) { /* لا شيء */ }
    applyTheme(t);
  }
  applyTheme(getTheme());

  function applyBrand(primary, accent) {
    const root = document.documentElement.style;
    if (primary) root.setProperty("--brand-base", primary); else root.removeProperty("--brand-base");
    if (accent) root.setProperty("--brand-accent", accent); else root.removeProperty("--brand-accent");
  }

  let toastTimer;
  function toast(msg) {
    let t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
  }

  async function copy(text, input) {
    try { await navigator.clipboard.writeText(text); toast("تم نسخ الرابط"); }
    catch (e) { if (input) { input.focus(); input.select(); } toast("حدّد الرابط وانسخه"); }
  }

  const I = {
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l-5-5 5-5M5 12h12"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    team: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    store: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>'
  };

  const themeBtn = () => `<button type="button" class="icon-btn" data-act="toggle-theme" aria-label="${isDark() ? "الوضع النهاري" : "الوضع الليلي"}">${isDark() ? I.sun : I.moon}</button>`;

  return { esc, money, fromMin, toMin, fmtTime, hourLabel, isoDate, parseISO, fmtDate, initials, DAYS, bookingState,
    isDark, toggleTheme, applyBrand, toast, copy, I, themeBtn };
})();
