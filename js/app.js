/* عناياتي — منطق التطبيق (بدون مكتبات) */
(function () {
  "use strict";

  const DATA = window.ENAYATI_DATA;
  const CUR = DATA.currency;
  const STORE_KEY = "enayati.bookings.v1";
  const STEPS = ["الخدمة", "المختص", "الموعد", "الدفع"];
  const DAYS_AHEAD = 14;
  const SLOT_MIN = 30;
  const LOCALE = "ar-SA-u-ca-gregory-nu-latn";

  const $app = document.getElementById("app");

  /* ---------- أيقونات ---------- */
  const I = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    scissors: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    star: '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18.3 5.5 22l1.7-7.4L1.5 9.6 9 8.9z"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
    /* أيقونات الأقسام */
    hair: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12"/></svg>',
    beard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4v6a7 7 0 0 0 14 0V4"/><path d="M9 13c1 .8 2 1 3 1s2-.2 3-1"/><path d="M12 17v4"/></svg>',
    skin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/></svg>',
    nails: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="9" width="8" height="12" rx="2"/><path d="M10 9V6a2 2 0 0 1 4 0v3"/><path d="M8 13h8"/></svg>',
    makeup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3l7 7-9 9H5v-7z"/><path d="M5 19l-2 2"/><path d="M10 8l6 6"/></svg>',
    kids: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01"/><path d="M9 15c.8.7 1.9 1 3 1s2.2-.3 3-1"/></svg>'
  };
  const CATS = DATA.categories;

  /* ---------- الحالة ---------- */
  const state = {
    view: "home",       // splash | home | cats | cat | book | done | mine | profile
    catId: null,
    editProfile: false,
    clearAsk: false,
    filter: "all",      // all | men | women
    salonId: null,
    step: 0,
    services: [],
    staffId: null,      // "any" أو معرّف المختص
    date: null,         // YYYY-MM-DD
    time: null,         // HH:MM
    payment: null,
    paying: false,
    lastBooking: null,
    cancelAsk: null
  };

  /* ---------- التخزين المحلي ---------- */
  function loadBookings() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch (e) { return memBookings; }
  }
  let memBookings = [];
  function saveBookings(list) {
    memBookings = list;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch (e) { /* يعمل بالذاكرة فقط */ }
  }
  const mem = {};
  function getItem(k, fallback) {
    try { const v = localStorage.getItem(k); return v === null ? (k in mem ? mem[k] : fallback) : JSON.parse(v); } catch (e) { return k in mem ? mem[k] : fallback; }
  }
  function setItem(k, v) { mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ذاكرة فقط */ } }

  const PROFILE_KEY = "enayati.profile.v1";
  const THEME_KEY = "enayati.theme";
  const WELCOME_KEY = "enayati.welcomed";
  const loadProfile = () => getItem(PROFILE_KEY, { name: "", phone: "", email: "", pref: "all", since: new Date().toISOString() });
  function saveProfile(p) { setItem(PROFILE_KEY, p); }

  /* ---------- الوضع الليلي والنهاري ---------- */
  function applyTheme(t) {
    const root = document.documentElement;
    if (t === "light" || t === "dark") root.setAttribute("data-theme", t); else root.removeAttribute("data-theme");
  }
  const currentTheme = () => getItem(THEME_KEY, "system");
  const isDark = () => { const t = currentTheme(); return t === "dark" || (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches); };
  function setTheme(t) { setItem(THEME_KEY, t); applyTheme(t); }
  applyTheme(currentTheme());

  /* ---------- أدوات ---------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const salon = () => DATA.salons.find((s) => s.id === state.salonId);
  const chosenServices = () => salon().services.filter((s) => state.services.includes(s.id));
  const totalPrice = () => chosenServices().reduce((a, s) => a + s.price, 0);
  const totalMin = () => chosenServices().reduce((a, s) => a + s.min, 0);
  const money = (n) => `${n.toLocaleString("en-US")} ${CUR}`;
  const pad = (n) => String(n).padStart(2, "0");
  const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const fromMin = (m) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;

  function fmtTime(t) {
    const [h, m] = t.split(":").map(Number);
    const suffix = h < 12 || h === 24 ? "ص" : "م";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${pad(m)} ${suffix}`;
  }
  function fmtDuration(min) {
    if (min < 60) return `${min} دقيقة`;
    const h = Math.floor(min / 60), m = min % 60;
    const hs = h === 1 ? "ساعة" : h === 2 ? "ساعتان" : `${h} ساعات`;
    return m ? `${hs} و${m} دقيقة` : hs;
  }
  const fmtDate = (iso, opts) => parseISO(iso).toLocaleDateString(LOCALE, opts || { weekday: "long", day: "numeric", month: "long" });
  const initials = (name) => name.replace(/^(صالون|ستوديو|ال)\s*/, "").trim().charAt(0);

  /* توفّر تجريبي ثابت: بعض الأوقات محجوزة مسبقاً لكل مختص */
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function isBusy(salonId, staffId, date, minute) {
    const mine = loadBookings().some((b) => b.status !== "cancelled" && b.salonId === salonId && b.staffId === staffId && b.date === date &&
      minute < toMin(b.time) + b.minutes && minute + SLOT_MIN > toMin(b.time));
    return mine || hash(`${salonId}|${staffId}|${date}|${minute}`) % 100 < 32;
  }
  function freeStaff(s, date, start, duration, staffId) {
    const pool = staffId && staffId !== "any" ? s.staff.filter((p) => p.id === staffId) : s.staff;
    return pool.find((p) => {
      for (let m = start; m < start + duration; m += SLOT_MIN) if (isBusy(s.id, p.id, date, m)) return false;
      return true;
    });
  }
  function slotsFor(date) {
    const s = salon();
    const dur = Math.max(totalMin(), SLOT_MIN);
    const now = new Date();
    const today = isoDate(now) === date;
    const nowMin = now.getHours() * 60 + now.getMinutes() + 30;
    const out = [];
    for (let m = s.hours.open * 60; m + dur <= s.hours.close * 60; m += SLOT_MIN) {
      const past = today && m < nowMin;
      out.push({ time: fromMin(m), free: !past && !!freeStaff(s, date, m, dur, state.staffId) });
    }
    return out;
  }

  /* ---------- الهوية حسب الصالون ---------- */
  function applyBrand(s) {
    const root = document.documentElement.style;
    if (s) { root.setProperty("--brand-base", s.brand.primary); root.setProperty("--brand-accent", s.brand.accent); }
    else { root.removeProperty("--brand-base"); root.removeProperty("--brand-accent"); }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", s ? s.brand.primary : "#0E4F4A");
  }

  /* ---------- الشاشات ---------- */
  function viewHome() {
    const list = DATA.salons.filter((s) => state.filter === "all" || s.type === state.filter);
    const seg = [["all", "الكل"], ["men", "رجالي"], ["women", "نسائي"]]
      .map(([k, l]) => `<button type="button" data-act="filter" data-v="${k}" aria-pressed="${state.filter === k}">${l}</button>`).join("");
    const cards = list.map((s) => `
      <button type="button" class="salon" data-act="salon" data-v="${s.id}" style="--salon-color:${s.brand.primary};--salon-accent:${s.brand.accent}">
        <span class="monogram" aria-hidden="true">${esc(initials(s.name))}</span>
        <span class="salon-info">
          <h3>${esc(s.name)}</h3>
          <p>${esc(s.tagline)}</p>
          <span class="meta">
            <span><b class="num">${I.star} ${s.rating}</b> (${s.reviews})</span>
            <span>${esc(s.area)}</span>
            <span class="num">${fmtTime(fromMin(s.hours.open * 60))} – ${fmtTime(fromMin(s.hours.close * 60))}</span>
          </span>
        </span>
        <span class="tag">${s.type === "men" ? "رجالي" : "نسائي"}</span>
      </button>`).join("");
    const p = loadProfile();
    const h = new Date().getHours();
    const greet = h < 12 ? "صباح الخير" : "مساء الخير";
    const next = upcomingBookings()[0];
    const nextCard = next ? (() => {
      const s = DATA.salons.find((x) => x.id === next.salonId);
      return `<button type="button" class="next-visit" data-act="mine">
        <span class="next-label">موعدك القادم</span>
        <span class="next-main">${esc(s.name)} · ${next.serviceNames.map(esc).join("، ")}</span>
        <span class="next-when">${fmtDate(next.date)} · <span class="num">${fmtTime(next.time)}</span></span>
      </button>`;
    })() : "";
    return `
      <section class="screen">
        ${topbar()}
        <div class="hello"><p class="greet">${greet}${p.name ? `، ${esc(p.name.split(" ")[0])}` : ""}</p><h1>أناقتك على موعد</h1></div>
        ${nextCard}
        <div class="block">
          <div class="block-head"><h2 class="section-title">الأقسام</h2><button type="button" class="link" data-act="cats">عرض الكل</button></div>
          <div class="cat-row">${CATS.map((c) => `
            <button type="button" class="cat-chip" data-act="cat" data-v="${c.id}">
              <span class="cat-ic" aria-hidden="true">${I[c.id]}</span><span>${esc(c.name)}</span>
            </button>`).join("")}</div>
        </div>
        <div class="block">
          <h2 class="section-title">الصوالين</h2>
          <div class="segments" role="group" aria-label="نوع الصالون">${seg}</div>
          <div class="salons">${cards}</div>
        </div>
      </section>${tabbar("home")}`;
  }

  function themeBtn() {
    const dark = isDark();
    return `<button type="button" class="icon-btn" data-act="toggle-theme" aria-label="${dark ? "الوضع النهاري" : "الوضع الليلي"}" title="${dark ? "الوضع النهاري" : "الوضع الليلي"}">${dark ? I.sun : I.moon}</button>`;
  }

  function topbar(back, title) {
    if (back) {
      return `<header class="topbar">
        <button type="button" class="icon-btn" data-act="back" aria-label="رجوع">${I.back}</button>
        <div class="logo">${esc(title || "عناياتي")}</div>
        ${themeBtn()}
      </header>`;
    }
    return `<header class="topbar">
      <div class="logo"><span class="logo-mark">${I.scissors.replace("<svg", '<svg width="20" height="20"')}</span>عناياتي</div>
      ${themeBtn()}
    </header>`;
  }

  function stepsBar() {
    return `<ol class="steps" aria-label="خطوات الحجز">${STEPS.map((l, i) =>
      `<li class="${i < state.step ? "done" : i === state.step ? "current" : ""}" ${i === state.step ? 'aria-current="step"' : ""}>${l}</li>`).join("")}</ol>`;
  }

  function salonHead(s) {
    return `<div class="salon-head">
      <span class="monogram" aria-hidden="true">${esc(initials(s.name))}</span>
      <div><h2 style="font-size:var(--fs-lg)">${esc(s.name)}</h2><p>${esc(s.area)} · ${s.type === "men" ? "رجالي" : "نسائي"}</p></div>
    </div>`;
  }

  function stepServices(s) {
    return `<div><h2 class="section-title">اختر الخدمة</h2><p class="hint">يمكنك اختيار أكثر من خدمة.</p></div>
      <div class="options" role="group" aria-label="الخدمات">${s.services.map((sv) => `
        <button type="button" class="option with-check" data-act="service" data-v="${sv.id}" aria-pressed="${state.services.includes(sv.id)}">
          <span class="check">${I.check}</span>
          <span class="title">${esc(sv.name)}</span>
          <span class="price num">${money(sv.price)}</span>
          <span class="sub">${esc(sv.desc)} · <span class="num">${fmtDuration(sv.min)}</span></span>
        </button>`).join("")}</div>`;
  }

  function stepStaff(s) {
    const any = { id: "any", name: "أي مختص متاح", role: "أقرب موعد", years: null };
    const label = s.type === "men" ? "اختر الحلاق" : "اختر المختصة";
    return `<div><h2 class="section-title">${label}</h2><p class="hint">اختر "أي مختص متاح" لتظهر لك أوقات أكثر.</p></div>
      <div class="staff" role="radiogroup" aria-label="${label}">${[any, ...s.staff].map((p) => `
        <button type="button" role="radio" class="person" data-act="staff" data-v="${p.id}" aria-checked="${state.staffId === p.id}">
          <span class="avatar" aria-hidden="true">${p.id === "any" ? "✦" : esc(p.name.charAt(0))}</span>
          <span class="name">${esc(p.name)}</span>
          <span class="role">${esc(p.role)}${p.years ? ` · <span class="num">${p.years}</span> سنة خبرة` : ""}</span>
        </button>`).join("")}</div>`;
  }

  function stepTime() {
    const base = new Date(); base.setHours(0, 0, 0, 0);
    const days = [];
    for (let i = 0; i < DAYS_AHEAD; i++) { const d = new Date(base); d.setDate(base.getDate() + i); days.push(isoDate(d)); }
    if (!state.date) state.date = days[0];
    const dayBtns = days.map((iso, i) => {
      const d = parseISO(iso);
      const dow = i === 0 ? "اليوم" : i === 1 ? "غداً" : d.toLocaleDateString(LOCALE, { weekday: "short" });
      return `<button type="button" role="radio" class="day" data-act="date" data-v="${iso}" aria-checked="${state.date === iso}" aria-label="${fmtDate(iso)}">
        <span class="dow">${dow}</span><span class="dnum num">${d.getDate()}</span><span class="mon">${d.toLocaleDateString(LOCALE, { month: "short" })}</span></button>`;
    }).join("");
    const slots = slotsFor(state.date);
    const groups = [["صباحاً", (m) => m < 12 * 60], ["ظهراً وعصراً", (m) => m >= 12 * 60 && m < 18 * 60], ["مساءً", (m) => m >= 18 * 60]];
    const freeCount = slots.filter((x) => x.free).length;
    const periods = groups.map(([label, fn]) => {
      const g = slots.filter((x) => fn(toMin(x.time)));
      if (!g.length) return "";
      return `<div class="period"><h4>${label}</h4><div class="slots" role="radiogroup" aria-label="${label}">${g.map((x) =>
        `<button type="button" role="radio" class="slot" data-act="time" data-v="${x.time}" aria-checked="${state.time === x.time}" ${x.free ? "" : 'disabled aria-label="محجوز"'}>${fmtTime(x.time)}</button>`).join("")}</div></div>`;
    }).join("");
    return `<div><h2 class="section-title">حدد الموعد</h2><p class="hint">مدة الخدمات: <span class="num">${fmtDuration(totalMin())}</span></p></div>
      <div class="days" role="radiogroup" aria-label="اليوم">${dayBtns}</div>
      ${freeCount ? periods : `<div class="empty">${I.cal}<p>لا توجد أوقات متاحة في هذا اليوم. جرّب يوماً آخر أو اختر "أي مختص متاح".</p></div>`}`;
  }

  function staffLabel(s, id) { return id === "any" ? "أي مختص متاح" : s.staff.find((p) => p.id === id).name; }

  function stepPay(s) {
    return `<div><h2 class="section-title">المراجعة والدفع</h2></div>
      <div class="summary">
        <div class="row"><span>الخدمات</span><span>${chosenServices().map((x) => esc(x.name)).join("، ")}</span></div>
        <div class="row"><span>${s.type === "men" ? "الحلاق" : "المختصة"}</span><span>${esc(staffLabel(s, state.staffId))}</span></div>
        <div class="row"><span>الموعد</span><span>${fmtDate(state.date)}<br><span class="num">${fmtTime(state.time)}</span></span></div>
        <div class="row"><span>المدة</span><span class="num">${fmtDuration(totalMin())}</span></div>
        <div class="row total"><span>الإجمالي</span><span class="num">${money(totalPrice())}</span></div>
      </div>
      <div><h3 class="section-title" style="font-size:var(--fs-md)">طريقة الدفع</h3></div>
      <div class="options" role="radiogroup" aria-label="طريقة الدفع">${DATA.payments.map((p) => `
        <button type="button" role="radio" class="option with-check" data-act="pay" data-v="${p.id}" aria-checked="${state.payment === p.id}">
          <span class="check" style="border-radius:50%">${I.check}</span>
          <span class="title">${esc(p.name)}</span><span></span>
          <span class="sub">${esc(p.note)}</span>
        </button>`).join("")}</div>
      <p class="demo-note">نسخة تجريبية: لا يتم خصم أي مبلغ. يُربط الدفع لاحقاً ببوابة دفع (مثل Moyasar أو HyperPay).</p>`;
  }

  function canNext() {
    return [state.services.length > 0, !!state.staffId, !!(state.date && state.time), !!state.payment && !state.paying][state.step];
  }

  function viewBook() {
    const s = salon();
    const body = [stepServices, stepStaff, stepTime, stepPay][state.step](s);
    const label = state.paying ? "جاري الدفع…" : state.step < 3 ? "التالي"
      : state.payment === "cash" ? "تأكيد الحجز" : `ادفع ${money(totalPrice())}`;
    return `<section class="screen">
        ${topbar(true)}
        ${salonHead(s)}
        ${stepsBar()}
        ${body}
      </section>
      <div class="action-bar"><div class="action-inner">
        <div class="action-total"><small>الإجمالي</small><b class="num">${money(totalPrice())}</b></div>
        <button type="button" class="btn" data-act="next" ${canNext() ? "" : "disabled"}>${label}</button>
      </div></div>`;
  }

  function viewDone() {
    const b = state.lastBooking;
    const s = DATA.salons.find((x) => x.id === b.salonId);
    return `<section class="screen">
        ${topbar()}
        <div class="ticket">
          <div class="ticket-top">
            <span class="ok">${I.check}</span>
            <h2>تم تأكيد حجزك</h2>
            <p>${esc(s.name)} بانتظارك</p>
          </div>
          <div class="ticket-cut"></div>
          <div class="ticket-body summary" style="border:0">
            <div class="row"><span>رقم الحجز</span><span class="code num">${b.code}</span></div>
            <div class="row"><span>الموعد</span><span>${fmtDate(b.date)}<br><span class="num">${fmtTime(b.time)}</span></span></div>
            <div class="row"><span>الخدمات</span><span>${b.serviceNames.map(esc).join("، ")}</span></div>
            <div class="row"><span>${s.type === "men" ? "الحلاق" : "المختصة"}</span><span>${esc(b.staffName)}</span></div>
            <div class="row total"><span>${b.payment === "cash" ? "يُدفع في الصالون" : "المدفوع"}</span><span class="num">${money(b.total)}</span></div>
          </div>
        </div>
        <p class="hint" style="text-align:center">احضر قبل موعدك بـ ١٠ دقائق. يمكنك الإلغاء من "مواعيدي".</p>
      </section>
      <div class="action-bar"><div class="action-inner">
        <button type="button" class="btn ghost" data-act="home">حجز جديد</button>
        <button type="button" class="btn" data-act="mine">مواعيدي</button>
      </div></div>`;
  }

  function bookingStatus(b) {
    if (b.status === "cancelled") return ["cancelled", "ملغى"];
    const end = parseISO(b.date); end.setMinutes(toMin(b.time) + b.minutes);
    return end < new Date() ? ["past", "منتهٍ"] : ["upcoming", "قادم"];
  }

  function viewMine() {
    const list = loadBookings().slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const items = list.map((b) => {
      const s = DATA.salons.find((x) => x.id === b.salonId);
      const [cls, txt] = bookingStatus(b);
      const asking = state.cancelAsk === b.code;
      return `<article class="booking">
        <div class="booking-head">
          <div><h3>${esc(s.name)}</h3><p class="hint">${b.serviceNames.map(esc).join("، ")} · ${esc(b.staffName)}</p></div>
          <span class="status ${cls}">${txt}</span>
        </div>
        <div class="booking-when">${I.cal}<span>${fmtDate(b.date)} · <span class="num">${fmtTime(b.time)}</span></span></div>
        <div class="meta"><span>رقم الحجز <b class="num" style="direction:ltr;display:inline-block">${b.code}</b></span><span class="num">${money(b.total)}</span></div>
        ${cls === "upcoming" ? (asking
          ? `<div class="confirm-box"><p>هل تريد إلغاء هذا الموعد؟</p><div class="booking-actions">
               <button type="button" class="btn danger" data-act="cancel-yes" data-v="${b.code}">نعم، ألغِ الموعد</button>
               <button type="button" class="btn ghost" data-act="cancel-no">تراجع</button></div></div>`
          : `<div class="booking-actions"><button type="button" class="btn ghost" data-act="cancel-ask" data-v="${b.code}">إلغاء الموعد</button>
               <button type="button" class="btn ghost" data-act="rebook" data-v="${b.salonId}">احجز مجدداً</button></div>`)
          : `<div class="booking-actions"><button type="button" class="btn ghost" data-act="rebook" data-v="${b.salonId}">احجز مجدداً</button></div>`}
      </article>`;
    }).join("");
    return `<section class="screen">
        ${topbar()}
        <div class="hello"><h1>مواعيدي</h1></div>
        ${list.length ? `<div class="bookings">${items}</div>`
          : `<div class="empty">${I.cal}<p>لا توجد مواعيد بعد. ستظهر حجوزاتك هنا بعد تأكيدها.</p><button type="button" class="btn" style="flex:none;padding-inline:28px" data-act="home">احجز موعدك الأول</button></div>`}
      </section>${tabbar("mine")}`;
  }

  function tabbar(active) {
    const upcoming = upcomingBookings().length;
    const tab = (act, icon, label, extra) =>
      `<button type="button" class="tab" data-act="${act}" ${active === act ? 'aria-current="page"' : ""}>${icon}${label}${extra || ""}</button>`;
    return `<nav class="tabbar" aria-label="التنقل"><div class="tabbar-inner">
      ${tab("home", I.home, "الرئيسية")}
      ${tab("cats", I.grid, "الأقسام")}
      ${tab("mine", I.cal, "مواعيدي", upcoming ? `<span class="badge num">${upcoming}</span>` : "")}
      ${tab("profile", I.user, "حسابي")}
    </div></nav>`;
  }

  const upcomingBookings = () => loadBookings().filter((b) => bookingStatus(b)[0] === "upcoming")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  /* ---------- الأقسام ---------- */
  function servicesInCat(catId) {
    const out = [];
    DATA.salons.forEach((s) => s.services.forEach((sv) => { if (sv.cat === catId) out.push({ s, sv }); }));
    return out;
  }

  function viewCats() {
    return `<section class="screen">
        ${topbar()}
        <div class="hello"><h1>الأقسام</h1><p>اختر ما تحتاجه، ونعرض لك الصوالين التي تقدمه.</p></div>
        <div class="cat-grid">${CATS.map((c) => {
          const n = servicesInCat(c.id).length;
          return `<button type="button" class="cat-card" data-act="cat" data-v="${c.id}">
            <span class="cat-ic" aria-hidden="true">${I[c.id]}</span>
            <span class="cat-name">${esc(c.name)}</span>
            <span class="cat-desc">${esc(c.desc)}</span>
            <span class="cat-count num">${n === 1 ? "خدمة واحدة" : n === 2 ? "خدمتان" : n <= 10 ? `${n} خدمات` : `${n} خدمة`}</span>
          </button>`;
        }).join("")}</div>
      </section>${tabbar("cats")}`;
  }

  function viewCat() {
    const c = CATS.find((x) => x.id === state.catId);
    const items = servicesInCat(c.id).sort((a, b) => a.sv.price - b.sv.price);
    return `<section class="screen">
        ${topbar(true, c.name)}
        <div class="cat-hero"><span class="cat-ic" aria-hidden="true">${I[c.id]}</span><div><h1>${esc(c.name)}</h1><p>${esc(c.desc)}</p></div></div>
        <p class="hint">مرتبة من الأقل سعراً. اضغط على الخدمة لتبدأ الحجز مباشرة.</p>
        <div class="options">${items.map(({ s, sv }) => `
          <button type="button" class="svc-row" data-act="catsvc" data-v="${s.id}|${sv.id}" style="--salon-color:${s.brand.primary};--salon-accent:${s.brand.accent}">
            <span class="monogram sm" aria-hidden="true">${esc(initials(s.name))}</span>
            <span class="svc-info"><span class="title">${esc(sv.name)}</span><span class="sub">${esc(s.name)} · <span class="num">${fmtDuration(sv.min)}</span></span></span>
            <span class="price num">${money(sv.price)}</span>
          </button>`).join("")}</div>
      </section>${tabbar("cats")}`;
  }

  /* ---------- حسابي ---------- */
  function profileStats() {
    const all = loadBookings();
    const visits = all.filter((b) => bookingStatus(b)[0] === "past");
    const spent = visits.reduce((a, b) => a + b.total, 0);
    const count = (arr, key) => arr.reduce((m, x) => { m[key(x)] = (m[key(x)] || 0) + 1; return m; }, {});
    const top = (m) => Object.entries(m).sort((a, b) => b[1] - a[1])[0];
    const favSalon = top(count(visits.length ? visits : all.filter((b) => b.status !== "cancelled"), (b) => b.salonId));
    const favSvc = top(count((visits.length ? visits : all.filter((b) => b.status !== "cancelled")).flatMap((b) => b.serviceNames), (x) => x));
    return {
      visits: visits.length, upcoming: upcomingBookings().length,
      cancelled: all.filter((b) => b.status === "cancelled").length,
      spent, points: Math.floor(spent / 10),
      favSalon: favSalon ? DATA.salons.find((s) => s.id === favSalon[0]) : null,
      favSvc: favSvc ? favSvc[0] : null,
      last: visits.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0] || null
    };
  }

  const REWARD_EVERY = 5;

  function viewProfile() {
    const p = loadProfile();
    const st = profileStats();
    const toReward = REWARD_EVERY - (st.visits % REWARD_EVERY);
    const progress = ((st.visits % REWARD_EVERY) / REWARD_EVERY) * 100;
    const theme = currentTheme();
    const since = new Date(p.since).toLocaleDateString(LOCALE, { month: "long", year: "numeric" });
    const prefLabel = { all: "الكل", men: "رجالي", women: "نسائي" }[p.pref || "all"];

    const info = state.editProfile ? `
      <form class="card form" id="profile-form" novalidate>
        <label for="pf-name">الاسم</label>
        <input id="pf-name" name="name" type="text" autocomplete="name" value="${esc(p.name)}" placeholder="مثال: عبدالعزيز">
        <label for="pf-phone">رقم الجوال</label>
        <input id="pf-phone" name="phone" type="tel" inputmode="tel" dir="ltr" autocomplete="tel" value="${esc(p.phone)}" placeholder="05XXXXXXXX">
        <p class="field-error" id="pf-phone-err" hidden>اكتب رقم جوال سعودي من 10 أرقام يبدأ بـ 05.</p>
        <label for="pf-email">البريد الإلكتروني (اختياري)</label>
        <input id="pf-email" name="email" type="email" dir="ltr" autocomplete="email" value="${esc(p.email)}" placeholder="name@example.com">
        <label for="pf-pref">الصوالين المفضلة</label>
        <select id="pf-pref" name="pref">
          ${[["all", "الكل"], ["men", "رجالي"], ["women", "نسائي"]].map(([v, l]) => `<option value="${v}" ${p.pref === v ? "selected" : ""}>${l}</option>`).join("")}
        </select>
        <div class="booking-actions"><button type="submit" class="btn">حفظ البيانات</button><button type="button" class="btn ghost" data-act="edit-cancel">إلغاء</button></div>
      </form>` : `
      <div class="card">
        <div class="row"><span>الاسم</span><span>${p.name ? esc(p.name) : '<span class="hint">لم يُضف بعد</span>'}</span></div>
        <div class="row"><span>الجوال</span><span class="num" dir="ltr">${p.phone ? esc(p.phone) : '<span class="hint">لم يُضف بعد</span>'}</span></div>
        <div class="row"><span>البريد</span><span dir="ltr">${p.email ? esc(p.email) : '<span class="hint">—</span>'}</span></div>
        <div class="row"><span>الصوالين المفضلة</span><span>${prefLabel}</span></div>
        <div class="row"><span>عضو منذ</span><span>${since}</span></div>
      </div>
      <button type="button" class="btn ghost wide" data-act="edit-profile">تعديل البيانات</button>`;

    return `<section class="screen">
        ${topbar()}
        <div class="profile-head">
          <span class="avatar lg" aria-hidden="true">${p.name ? esc(p.name.charAt(0)) : I.user}</span>
          <div><h1>${p.name ? esc(p.name) : "حسابي"}</h1><p class="hint">${p.name ? `نقاط الولاء: <b class="num">${st.points}</b>` : "أضف اسمك ورقمك ليسهل على الصالون التواصل معك."}</p></div>
        </div>

        <div class="stats">
          <div class="stat"><b class="num">${st.visits}</b><span>الزيارات</span></div>
          <div class="stat"><b class="num">${st.upcoming}</b><span>القادمة</span></div>
          <div class="stat"><b class="num">${st.spent.toLocaleString("en-US")}</b><span>${CUR} إنفاق</span></div>
          <div class="stat"><b class="num">${st.points}</b><span>النقاط</span></div>
        </div>

        <div class="card reward">
          <div class="block-head"><b>برنامج الولاء</b><span class="hint num">${st.visits % REWARD_EVERY} / ${REWARD_EVERY}</span></div>
          <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${REWARD_EVERY}" aria-valuenow="${st.visits % REWARD_EVERY}"><span style="width:${progress}%"></span></div>
          <p class="hint">${toReward === REWARD_EVERY && st.visits ? "مبروك! زيارتك القادمة عليها خصم ٢٠٪." : `باقي ${toReward === 1 ? "زيارة واحدة" : toReward === 2 ? "زيارتان" : `<b class="num">${toReward}</b> زيارات`} وتحصل على خصم ٢٠٪.`}</p>
        </div>

        <div class="card">
          <div class="row"><span>الصالون المفضل</span><span>${st.favSalon ? esc(st.favSalon.name) : "—"}</span></div>
          <div class="row"><span>الخدمة الأكثر طلباً</span><span>${st.favSvc ? esc(st.favSvc) : "—"}</span></div>
          <div class="row"><span>آخر زيارة</span><span>${st.last ? fmtDate(st.last.date, { day: "numeric", month: "long" }) : "—"}</span></div>
          <div class="row"><span>مواعيد ملغاة</span><span class="num">${st.cancelled}</span></div>
        </div>

        <div class="block"><h2 class="section-title">بياناتي</h2>${info}</div>

        <div class="block">
          <h2 class="section-title">المظهر</h2>
          <div class="segments" role="radiogroup" aria-label="المظهر">
            ${[["light", "نهاري", I.sun], ["dark", "ليلي", I.moon], ["system", "تلقائي", ""]].map(([v, l, ic]) =>
              `<button type="button" role="radio" data-act="theme" data-v="${v}" aria-pressed="${theme === v}" aria-checked="${theme === v}">${ic ? ic.replace("<svg", '<svg width="16" height="16" class="seg-ic"') : ""}${l}</button>`).join("")}
          </div>
          <p class="hint">"تلقائي" يتبع إعداد جوالك.</p>
        </div>

        <div class="block">
          ${state.clearAsk
            ? `<div class="confirm-box"><p>سيُحذف سجل مواعيدك وبياناتك من هذا الجهاز. هل أنت متأكد؟</p><div class="booking-actions">
                <button type="button" class="btn danger" data-act="clear-yes">نعم، احذف</button><button type="button" class="btn ghost" data-act="clear-no">تراجع</button></div></div>`
            : `<button type="button" class="btn danger wide" data-act="clear-ask">حذف بياناتي من الجهاز</button>`}
        </div>
      </section>${tabbar("profile")}`;
  }

  /* ---------- الواجهة الترحيبية ---------- */
  function viewSplash() {
    const first = !getItem(WELCOME_KEY, false);
    return `<section class="splash ${first ? "first" : ""}" aria-label="مرحباً بك في عناياتي">
      <div class="splash-mark" aria-hidden="true">${I.scissors}</div>
      <h1 class="splash-name">عناياتي</h1>
      <p class="splash-line">أناقتك على موعد</p>
      ${first
        ? `<p class="splash-sub">احجز صالونك المفضل، رجالي أو نسائي، في أقل من دقيقة.</p>
           <button type="button" class="btn splash-btn" data-act="enter">ابدأ الآن</button>`
        : `<button type="button" class="splash-skip" data-act="enter">دخول</button>`}
    </section>`;
  }

  /* ---------- العرض ---------- */
  function render() {
    applyBrand(state.view === "book" || state.view === "done" ? salon() : null);
    $app.innerHTML = { splash: viewSplash, home: viewHome, cats: viewCats, cat: viewCat, book: viewBook, done: viewDone, mine: viewMine, profile: viewProfile }[state.view]();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && state.view === "splash") meta.setAttribute("content", "#0E4F4A");
  }
  function go(view) {
    if (view !== state.view) state.prev = state.view;
    state.view = view; state.cancelAsk = null; state.editProfile = false; state.clearAsk = false;
    render(); window.scrollTo(0, 0);
  }

  function startBooking(id, serviceId) {
    state.bookFrom = state.view;
    Object.assign(state, { salonId: id, step: serviceId ? 1 : 0, services: serviceId ? [serviceId] : [], staffId: null, date: null, time: null, payment: null });
    go("book");
  }

  function makeCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let c = ""; for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
    return `EN-${c}`;
  }

  function confirmBooking() {
    const s = salon();
    const start = toMin(state.time);
    const person = freeStaff(s, state.date, start, Math.max(totalMin(), SLOT_MIN), state.staffId);
    if (!person) { toast("هذا الوقت لم يعد متاحاً، اختر وقتاً آخر"); state.step = 2; state.time = null; render(); return; }
    state.paying = true; render();
    setTimeout(() => {
      const b = {
        code: makeCode(), salonId: s.id, staffId: person.id, staffName: person.name,
        services: state.services.slice(), serviceNames: chosenServices().map((x) => x.name),
        date: state.date, time: state.time, minutes: totalMin(), total: totalPrice(),
        payment: state.payment, status: "confirmed", createdAt: new Date().toISOString()
      };
      saveBookings([...loadBookings(), b]);
      state.paying = false; state.lastBooking = b;
      go("done");
    }, 900);
  }

  let toastTimer;
  function toast(msg) {
    let t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
  }

  /* ---------- الأحداث ---------- */
  $app.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el || el.disabled) return;
    const v = el.dataset.v;
    switch (el.dataset.act) {
      case "filter": state.filter = v; render(); break;
      case "salon": startBooking(v); break;
      case "rebook": startBooking(v); break;
      case "home": go("home"); break;
      case "mine": go("mine"); break;
      case "cats": go("cats"); break;
      case "profile": go("profile"); break;
      case "cat": state.catId = v; go("cat"); break;
      case "catsvc": { const [sid, svid] = v.split("|"); startBooking(sid, svid); break; }
      case "enter": enterApp(); break;
      case "toggle-theme": setTheme(isDark() ? "light" : "dark"); render(); break;
      case "theme": setTheme(v); render(); break;
      case "edit-profile": state.editProfile = true; render(); { const f = document.getElementById("pf-name"); if (f) f.focus(); } break;
      case "edit-cancel": state.editProfile = false; render(); break;
      case "clear-ask": state.clearAsk = true; render(); break;
      case "clear-no": state.clearAsk = false; render(); break;
      case "clear-yes":
        saveBookings([]); saveProfile({ name: "", phone: "", email: "", pref: "all", since: new Date().toISOString() });
        state.clearAsk = false; render(); toast("تم حذف بياناتك من هذا الجهاز"); break;
      case "back":
        if (state.view === "cat") { go(state.prev === "home" ? "home" : "cats"); break; }
        if (state.step > 0 && !(state.step === 1 && state.bookFrom === "cat" && state.services.length === 1)) { state.step--; render(); window.scrollTo(0, 0); }
        else go(state.bookFrom === "cat" ? "cat" : "home");
        break;
      case "service": {
        const i = state.services.indexOf(v);
        i >= 0 ? state.services.splice(i, 1) : state.services.push(v);
        state.time = null; render(); break;
      }
      case "staff": state.staffId = v; state.time = null; render(); break;
      case "date": state.date = v; state.time = null; render(); break;
      case "time": state.time = v; render(); break;
      case "pay": state.payment = v; render(); break;
      case "next":
        if (!canNext()) return;
        if (state.step < 3) { state.step++; render(); window.scrollTo(0, 0); } else confirmBooking();
        break;
      case "cancel-ask": state.cancelAsk = v; render(); break;
      case "cancel-no": state.cancelAsk = null; render(); break;
      case "cancel-yes":
        saveBookings(loadBookings().map((b) => (b.code === v ? { ...b, status: "cancelled" } : b)));
        state.cancelAsk = null; render(); toast("تم إلغاء الموعد"); break;
    }
  });

  /* حفظ بيانات الحساب */
  $app.addEventListener("submit", (e) => {
    if (e.target.id !== "profile-form") return;
    e.preventDefault();
    const f = e.target;
    const phone = f.phone.value.replace(/[\s-]/g, "").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
    const err = document.getElementById("pf-phone-err");
    if (phone && !/^05\d{8}$/.test(phone)) { err.hidden = false; f.phone.setAttribute("aria-invalid", "true"); f.phone.focus(); return; }
    const p = loadProfile();
    saveProfile({ ...p, name: f.name.value.trim(), phone, email: f.email.value.trim(), pref: f.pref.value });
    state.filter = f.pref.value;
    state.editProfile = false; render(); toast("تم حفظ بياناتك");
  });

  /* تحديث الأيقونة عند تغيّر وضع الجوال وهو على "تلقائي" */
  try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (currentTheme() === "system") render(); }); } catch (e) { /* متصفح قديم */ }

  /* الواجهة الترحيبية: أول مرة تنتظر زر "ابدأ الآن"، وبعدها تظهر لحظة قصيرة */
  let splashTimer;
  function enterApp() {
    clearTimeout(splashTimer);
    setItem(WELCOME_KEY, true);
    const el = document.querySelector(".splash");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (el && !reduce) { el.classList.add("leaving"); setTimeout(() => go("home"), 280); } else go("home");
  }
  state.filter = loadProfile().pref || "all";
  state.view = "splash";
  render();
  if (getItem(WELCOME_KEY, false)) splashTimer = setTimeout(enterApp, 1400);

  /* تثبيت التطبيق على الجوال والعمل بدون إنترنت */
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => { /* المتصفح لا يسمح، والتطبيق يعمل بدونه */ });
    });
  }
})();
