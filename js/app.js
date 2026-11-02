/* عناياتي — منطق التطبيق (بدون مكتبات) */
(function () {
  "use strict";

  const DATA = window.ENAYATI_DATA;
  const CUR = DATA.currency;

  /* وضع الصالون الواحد: الرابط ‎?s=sanad‎ يحوّل التطبيق إلى تطبيق خاص بالصالون */
  const SALON = (() => {
    try { const id = (new URLSearchParams(location.search).get("s") || "").toLowerCase(); return DATA.salons.find((x) => x.id === id) || null; }
    catch (e) { return null; }
  })();
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
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
  };

  /* ---------- الحالة ---------- */
  const state = {
    view: "home",       // splash | home | book | done | mine | profile
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
  const WELCOME_KEY = "enayati.welcomed" + (SALON ? ":" + SALON.id : "");
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

  /* في وضع الصالون تظهر حجوزات هذا الصالون فقط */
  const myBookings = () => loadBookings().filter((b) => !SALON || b.salonId === SALON.id);

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
    if (SALON) return viewSalonHome(SALON);
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
    const nextCard = nextVisitCard();
    return `
      <section class="screen">
        ${topbar()}
        <div class="hello"><p class="greet">${greet}${p.name ? `، ${esc(p.name.split(" ")[0])}` : ""}</p><h1>أناقتك على موعد</h1></div>
        ${nextCard}
        <div class="block">
          <h2 class="section-title">الصوالين</h2>
          <div class="segments" role="group" aria-label="نوع الصالون">${seg}</div>
          <div class="salons">${cards}</div>
        </div>
      </section>${tabbar("home")}`;
  }

  function nextVisitCard() {
    const next = upcomingBookings()[0];
    if (!next) return "";
    const s = DATA.salons.find((x) => x.id === next.salonId);
    return `<button type="button" class="next-visit" data-act="mine">
        <span class="next-label">موعدك القادم</span>
        <span class="next-main">${SALON ? "" : `${esc(s.name)} · `}${next.serviceNames.map(esc).join("، ")}</span>
        <span class="next-when">${fmtDate(next.date)} · <span class="num">${fmtTime(next.time)}</span></span>
      </button>`;
  }

  function openStatus(s) {
    const now = new Date();
    const m = now.getHours() * 60 + now.getMinutes();
    const open = m >= s.hours.open * 60 && m < s.hours.close * 60;
    return open
      ? { open, text: `مفتوح الآن · يغلق ${fmtTime(fromMin(s.hours.close * 60))}` }
      : { open, text: `مغلق الآن · يفتح ${fmtTime(fromMin(s.hours.open * 60))}` };
  }

  /* الصفحة الرئيسية في وضع الصالون الواحد */
  function viewSalonHome(s) {
    const st = openStatus(s);
    const p = loadProfile();
    const h = new Date().getHours();
    const greet = `${h < 12 ? "صباح الخير" : "مساء الخير"}${p.name ? `، ${esc(p.name.split(" ")[0])}` : ""}`;
    const maps = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(s.name + " " + s.address);
    return `<section class="screen">
        ${topbar()}
        <div class="salon-hero">
          <span class="monogram xl" aria-hidden="true">${esc(initials(s.name))}</span>
          <div class="salon-hero-text">
            <p class="greet-on">${greet}</p>
            <h1>${esc(s.name)}</h1>
            <p class="slogan">${esc(s.slogan)}</p>
          </div>
          <div class="hero-meta">
            <span><b class="num">${I.star} ${s.rating}</b> (${s.reviews} تقييم)</span>
            <span class="open-pill ${st.open ? "is-open" : ""}">${st.text}</span>
          </div>
          <button type="button" class="btn hero-btn" data-act="salon" data-v="${s.id}">احجز موعدك</button>
        </div>
        ${nextVisitCard()}

        <div class="block">
          <h2 class="section-title">الخدمات والأسعار</h2>
          <div class="options">${s.services.map((sv) => `
            <button type="button" class="option svc" data-act="salon-svc" data-v="${sv.id}">
              <span class="title">${esc(sv.name)}</span>
              <span class="price num">${money(sv.price)}</span>
              <span class="sub">${esc(sv.desc)} · <span class="num">${fmtDuration(sv.min)}</span></span>
              <span class="go" aria-hidden="true">احجز</span>
            </button>`).join("")}</div>
        </div>

        <div class="block">
          <h2 class="section-title">${s.type === "men" ? "فريق الحلاقين" : "فريق المختصات"}</h2>
          <div class="team">${s.staff.map((m) => `
            <div class="member">
              <span class="avatar" aria-hidden="true">${esc(m.name.charAt(0))}</span>
              <span class="name">${esc(m.name)}</span>
              <span class="role">${esc(m.role)} · <span class="num">${m.years}</span> سنة</span>
            </div>`).join("")}</div>
        </div>

        <div class="block">
          <h2 class="section-title">عن ${esc(s.name)}</h2>
          <p class="about">${esc(s.about)}</p>
          <div class="card">
            <div class="row"><span>العنوان</span><span>${esc(s.address)}</span></div>
            <div class="row"><span>ساعات العمل</span><span class="num">يومياً ${fmtTime(fromMin(s.hours.open * 60))} – ${fmtTime(fromMin(s.hours.close * 60))}</span></div>
          </div>
          <a class="btn ghost wide map-link" href="${maps}" target="_blank" rel="noopener">افتح الموقع في الخرائط</a>
        </div>

        <a class="powered" href="./">يعمل بواسطة <b>عناياتي</b></a>
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
        <div class="logo">${esc(title || (SALON ? SALON.name : "عناياتي"))}</div>
        ${themeBtn()}
      </header>`;
    }
    const mark = SALON ? `<span class="logo-mark salon-mark">${esc(initials(SALON.name))}</span>${esc(SALON.name)}`
      : `<span class="logo-mark">${I.scissors.replace("<svg", '<svg width="20" height="20"')}</span>عناياتي`;
    return `<header class="topbar">
      <div class="logo">${mark}</div>
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
    const list = myBookings().slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
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
      ${tab("mine", I.cal, "مواعيدي", upcoming ? `<span class="badge num">${upcoming}</span>` : "")}
      ${tab("profile", I.user, "حسابي")}
    </div></nav>`;
  }

  const upcomingBookings = () => myBookings().filter((b) => bookingStatus(b)[0] === "upcoming")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  /* ---------- حسابي ---------- */
  function profileStats() {
    const all = myBookings();
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
    if (SALON) {
      return `<section class="splash salon-splash" aria-label="مرحباً بك في ${esc(SALON.name)}">
        <div class="splash-mark mono" aria-hidden="true">${esc(initials(SALON.name))}</div>
        <h1 class="splash-name">${esc(SALON.name)}</h1>
        <p class="splash-line">${esc(SALON.slogan)}</p>
        ${first
          ? `<p class="splash-sub">احجز موعدك في ${esc(SALON.name)} بخطوات بسيطة.</p>
             <button type="button" class="btn splash-btn" data-act="enter">ابدأ الآن</button>`
          : `<button type="button" class="splash-skip" data-act="enter">دخول</button>`}
        <p class="splash-powered">يعمل بواسطة عناياتي</p>
      </section>`;
    }
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
    applyBrand(SALON || (state.view === "book" || state.view === "done" ? salon() : null));
    $app.innerHTML = { splash: viewSplash, home: viewHome, book: viewBook, done: viewDone, mine: viewMine, profile: viewProfile }[state.view]();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && state.view === "splash") meta.setAttribute("content", SALON ? SALON.brand.primary : "#0E4F4A");
  }
  function go(view) {
    if (view !== state.view) state.prev = state.view;
    state.view = view; state.cancelAsk = null; state.editProfile = false; state.clearAsk = false;
    render(); window.scrollTo(0, 0);
  }

  function startBooking(id, serviceId) {
    Object.assign(state, { salonId: id, step: 0, services: serviceId ? [serviceId] : [], staffId: null, date: null, time: null, payment: null });
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
      case "salon-svc": startBooking(SALON.id, v); break;
      case "home": go("home"); break;
      case "mine": go("mine"); break;
      case "profile": go("profile"); break;
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
        if (state.step > 0) { state.step--; render(); window.scrollTo(0, 0); } else go("home");
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
  if (SALON) {
    document.title = SALON.name;
    const set = (sel, attr, val) => { const el = document.querySelector(sel); if (el) el.setAttribute(attr, val); };
    set('link[rel="manifest"]', "href", `manifests/${SALON.id}.webmanifest`);
    set('link[rel="apple-touch-icon"]', "href", `icons/salons/${SALON.id}-180.png`);
    set('link[rel="icon"]', "href", `icons/salons/${SALON.id}-192.png`);
    set('link[rel="icon"]', "type", "image/png");
    set('meta[name="apple-mobile-web-app-title"]', "content", SALON.name);
    set('meta[name="description"]', "content", `${SALON.name}: ${SALON.slogan}. احجز موعدك بخطوات بسيطة.`);
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
