/* عناياتي — منطق التطبيق (بدون مكتبات) */
(function () {
  "use strict";
  const yrs = (n) => (n === 1 ? "سنة" : n === 2 ? "سنتان" : n <= 10 ? `<span class="num">${n}</span> سنوات` : `<span class="num">${n}</span> سنة`);

  /* الصوالين والحجوزات تأتي من طبقة البيانات (js/store.js) */
  const DATA = Object.assign({}, window.ENAYATI_DATA, { salons: Store.salons() });
  const CUR = DATA.currency;

  /* وضع الصالون الواحد: الرابط ‎?s=sanad‎ يحوّل التطبيق إلى تطبيق خاص بالصالون */
  const SALON = (() => {
    try { const id = (new URLSearchParams(location.search).get("s") || "").toLowerCase(); return DATA.salons.find((x) => x.id === id) || null; }
    catch (e) { return null; }
  })();
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
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l1.6-4.7A8.5 8.5 0 1 1 8 19.8z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.8 7L4 20l1-4.5A8 8 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    pin: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
    smile: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8.5 14.5c.9 1 2.1 1.5 3.5 1.5s2.6-.5 3.5-1.5M9 9.5h.01M15 9.5h.01"/></svg>',
    fVery: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M7.5 13.5c1 2 2.6 3 4.5 3s3.5-1 4.5-3z" fill="currentColor"/><path d="M8.5 9.5h.01M15.5 9.5h.01"/></svg>',
    fOk: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8.5 14.5c.9 1 2.1 1.5 3.5 1.5s2.6-.5 3.5-1.5M9 9.5h.01M15 9.5h.01"/></svg>',
    fNo: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8.5 16c.9-1 2.1-1.5 3.5-1.5s2.6.5 3.5 1.5M9 9.5h.01M15 9.5h.01"/></svg>',
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
    cancelAsk: null,
    cust: { name: "", phone: "" },
    openSalon: null,    // صفحة صالون مفتوحة من المنصة
    chat: null,         // { salonId, bookingCode, draft, from }
    cart: { salonId: null, items: {}, note: "", booking: "" },
    calOpen: null,      // رمز الحجز المفتوحة له خيارات التقويم
    qjoin: null,        // { salonId, service, from } حجز الدور عن بُعد
    qLeave: null,       // تأكيد الخروج من الدور
    auth: { phone: "", name: "", code: "", sent: false, sms: "", error: "" }
  };

  /* ---------- التخزين المحلي ---------- */
  const loadBookings = () => Store.bookings();
  const saveBookings = (list) => Store.setBookings(list);
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
  /* الحساب: رقم جوال مؤكَّد برمز تحقق. المواعيد تظهر حسب هذا الرقم، سواء حجز العميل بنفسه أو حجز له الصالون */
  const sessionPhone = () => { const p = loadProfile(); return p.verified && p.phone ? p.phone : ""; };
  const myBookings = () => { const ph = sessionPhone(); return ph ? loadBookings().filter((b) => (!SALON || b.salonId === SALON.id) && b.customer && b.customer.phone === ph) : []; };

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
  const initials = (name) => name.replace(/^(صالون|ستوديو)\s+/, "").replace(/^ال(?=\S{2})/, "").trim().charAt(0);

  /* الوقت محجوز إذا تداخل مع حجز قائم أو دور جارٍ لنفس المختص (من store.js) */
  const isBusy = (salonId, staffId, date, minute) => Store.staffBusy(salonId, staffId, date, minute, SLOT_MIN);
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

  /* ---------- نصوص الوقت ---------- */
  const hoursText = (n) => (n === 1 ? "ساعة واحدة" : n === 2 ? "ساعتين" : n <= 10 ? `${n} ساعات` : `${n} ساعة`);
  const minText = (n) => (n === 1 ? "دقيقة" : n === 2 ? "دقيقتين" : n <= 10 ? `${n} دقائق` : `${n} دقيقة`);
  const policyText = (h) => (h > 0 ? `إلغاء مجاني حتى ${hoursText(h)} قبل الموعد` : "إلغاء مجاني حتى وقت الموعد");
  const startDate = (b) => { const d = parseISO(b.date); d.setHours(...b.time.split(":").map(Number), 0, 0); return d; };
  /* "بعد ساعتين و10 دقائق" إذا كان الموعد اليوم */
  function untilText(b) {
    if (b.date !== isoDate(new Date())) return "";
    const diff = startDate(b).getTime() - Date.now();
    if (diff <= 0) return Date.now() < startDate(b).getTime() + b.minutes * 60000 ? "موعدك الآن" : "";
    const mins = Math.ceil(diff / 60000), h = Math.floor(mins / 60), m = mins % 60;
    const hT = h === 0 ? "" : h === 1 ? "ساعة" : h === 2 ? "ساعتين" : h <= 10 ? `${h} ساعات` : `${h} ساعة`;
    const mT = m === 0 ? "" : m === 1 ? "دقيقة" : m === 2 ? "دقيقتين" : m <= 10 ? `${m} دقائق` : `${m} دقيقة`;
    return "بعد " + [hT, mT].filter(Boolean).join(" و");
  }

  /* ملف تقويم .ics (RFC 5545): توقيت الرياض، وتنبيه قبل الموعد بساعة */
  const icsStamp = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const icsText = (t) => String(t).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  function icsFold(line) {
    const enc = new TextEncoder(); const out = []; let cur = "", bytes = 0, limit = 75;
    for (const ch of line) {
      const n = enc.encode(ch).length;
      if (bytes + n > limit) { out.push(cur); cur = " "; bytes = 1; limit = 75; }
      cur += ch; bytes += n;
    }
    out.push(cur); return out.join("\r\n");
  }
  function eventInfo(b, s) {
    const start = startDate(b), end = new Date(start.getTime() + Math.max(b.minutes, 15) * 60000);
    const where = s.address || s.name;
    const maps = s.location ? `https://www.google.com/maps/search/?api=1&query=${s.location.lat},${s.location.lng}` : "";
    const details = [`رقم الحجز: ${b.code}`, `${s.type === "men" ? "الحلاق" : "المختصة"}: ${b.staffName}`, policyText(b.policy ? b.policy.cancelHours : Store.cancelHours(s)), maps].filter(Boolean).join("\n");
    return { title: `${s.name} · ${b.serviceNames.join("، ")}`, start: icsStamp(start), end: icsStamp(end), where, details };
  }
  function icsFor(b, s) {
    const e = eventInfo(b, s);
    const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Enayati//Booking//AR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
      "BEGIN:VTIMEZONE", "TZID:Asia/Riyadh", "BEGIN:STANDARD", "DTSTART:19700101T000000", "TZOFFSETFROM:+0300", "TZOFFSETTO:+0300", "TZNAME:+03", "END:STANDARD", "END:VTIMEZONE",
      "BEGIN:VEVENT", `UID:${b.code}@enayati`, `DTSTAMP:${now}`, `DTSTART;TZID=Asia/Riyadh:${e.start}`, `DTEND;TZID=Asia/Riyadh:${e.end}`,
      `SUMMARY:${icsText(e.title)}`, `LOCATION:${icsText(e.where)}`, `DESCRIPTION:${icsText(e.details)}`,
      ...(s.location ? [`GEO:${s.location.lat};${s.location.lng}`] : []),
      "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsText("تذكير: موعدك في " + s.name + " بعد ساعة")}`, "TRIGGER:-PT1H", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR"];
    return lines.map(icsFold).join("\r\n") + "\r\n";
  }
  function downloadIcs(code) {
    const b = loadBookings().find((x) => x.code === code); if (!b) return;
    const s = Store.salon(b.salonId);
    const url = URL.createObjectURL(new Blob([icsFor(b, s)], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `enayati-${b.code}.ics`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast("نُزّل ملف التقويم. افتحه لإضافة الموعد");
  }
  const gcalUrl = (b, s) => { const e = eventInfo(b, s);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(e.title)}&dates=${e.start}/${e.end}&ctz=Asia/Riyadh&details=${encodeURIComponent(e.details)}&location=${encodeURIComponent(e.where)}`; };
  const dirUrl = (s) => "https://www.google.com/maps/dir/?api=1&destination=" + (s.location ? `${s.location.lat},${s.location.lng}` : encodeURIComponent(`${s.name} ${s.address || ""}`.trim()));
  const salonUrl = (s) => `${location.origin}${location.pathname}?s=${s.id}`;
  const shareUrl = (b, s) => "https://wa.me/?text=" + encodeURIComponent(`موعدي في ${s.name}\n${fmtDate(b.date)} الساعة ${fmtTime(b.time)}\nرقم الحجز: ${b.code}\n${salonUrl(s)}`);

  /* تفاصيل إضافية للموعد: السياسة، العربون، العدّاد، والأزرار الثلاثة */
  function bookingExtras(b, s) {
    const hours = b.policy ? b.policy.cancelHours : Store.cancelHours(s);
    const until = untilText(b);
    const dep = b.deposit;
    return `${until ? `<p class="countdown">${I.cal}<span>${until}</span></p>` : ""}
      ${dep ? `<div class="dep-lines"><span>العربون: <b class="num">${money(dep.amount)}</b> · ${esc(Store.DEPOSIT_STATES[dep.status] || "")}</span>
        <span>المتبقي في الصالون: <b class="num">${money(Math.max(0, b.total - dep.amount))}</b></span></div>` : ""}
      <p class="policy-line">${policyText(hours)}</p>
      <div class="trio">
        <button type="button" class="trio-btn" data-act="cal" data-v="${b.code}" aria-expanded="${state.calOpen === b.code}">${I.cal}<span>أضف للتقويم</span></button>
        <a class="trio-btn" href="${esc(dirUrl(s))}" target="_blank" rel="noopener">${I.pin}<span>الاتجاهات</span></a>
        <a class="trio-btn" href="${esc(shareUrl(b, s))}" target="_blank" rel="noopener">${I.wa}<span>شارك</span></a>
      </div>
      ${state.calOpen === b.code ? `<div class="cal-choices">
        <button type="button" class="chip" data-act="ics" data-v="${b.code}">ملف التقويم (.ics)</button>
        <a class="chip" href="${esc(gcalUrl(b, s))}" target="_blank" rel="noopener">Google Calendar</a></div>` : ""}`;
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
    let list = DATA.salons.filter((s) => Store.isLive(s) && s.services.length && !s.unlisted && (state.filter === "all" || s.type === state.filter));
    if (state.sortNear && state.here) list = list.slice().sort((a, b) => (distOf(a) ?? 1e9) - (distOf(b) ?? 1e9));
    const seg = [["all", "الكل"], ["men", "رجالي"], ["women", "نسائي"]]
      .map(([k, l]) => `<button type="button" data-act="filter" data-v="${k}" aria-pressed="${state.filter === k}">${l}</button>`).join("");
    const cards = list.map((s) => `
      <button type="button" class="salon" data-act="open-salon" data-v="${s.id}" style="--salon-color:${s.brand.primary};--salon-accent:${s.brand.accent}">
        <span class="monogram" aria-hidden="true">${esc(initials(s.name))}</span>
        <span class="salon-info">
          <h3>${esc(s.name)}</h3>
          <p>${esc(s.tagline)}</p>
          <span class="meta">
            ${statsLine(s, true)}
            ${s.area ? `<span>${esc(s.area)}</span>` : ""}
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
          <div class="block-head"><h2 class="section-title">الصوالين</h2>
            <button type="button" class="near-btn" data-act="near" aria-pressed="${!!(state.sortNear && state.here)}">${I.pin} ${state.locating ? "جاري تحديد موقعك…" : "الأقرب إليّ"}</button></div>
          <div class="segments" role="group" aria-label="نوع الصالون">${seg}</div>
          <div class="salons">${cards}</div>
        </div>
      </section>${tabbar("home")}`;
  }

  function servicesHtml(s, item, label) {
    const groups = [];
    s.services.forEach((sv) => {
      const g = sv.group || "";
      let last = groups[groups.length - 1];
      if (!last || last.name !== g) { last = { name: g, items: [] }; groups.push(last); }
      last.items.push(sv);
    });
    return groups.map((g) => `${g.name ? `<h3 class="group-title">${esc(g.name)}</h3>` : ""}
      <div class="options" role="group" aria-label="${esc(g.name || label)}">${g.items.map(item).join("")}</div>`).join("");
  }
  const svcSub = (sv) => `${sv.desc ? `${esc(sv.desc)} · ` : ""}<span class="num">${fmtDuration(sv.min)}</span>`;

  /* ---------- الموقع والمسافة ---------- */
  const HERE_KEY = "enayati.here";
  const distOf = (s) => (state.here && s.location ? Store.distanceKm(state.here, s.location) : null);
  const fmtKm = (km) => (km < 1 ? `${Math.max(50, Math.round(km * 1000 / 50) * 50)} م` : `${km < 10 ? km.toFixed(1) : Math.round(km)} كم`);
  const n0 = (n) => Number(n).toLocaleString("en-US");
  function locate(done) {
    if (!("geolocation" in navigator)) { toast("جهازك لا يدعم تحديد الموقع"); return; }
    state.locating = true; render();
    navigator.geolocation.getCurrentPosition((pos) => {
      state.here = { lat: pos.coords.latitude, lng: pos.coords.longitude, at: Date.now() };
      setItem(HERE_KEY, state.here); state.locating = false; if (done) done(); render();
    }, () => { state.locating = false; render(); toast("لم نتمكن من معرفة موقعك. فعّل خدمة الموقع واسمح للتطبيق بها."); },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60000 });
  }
  /* سطر الأرقام: الرضا والزيارات والمسافة */
  function statsLine(s, withDistance) {
    const st = Store.salonStats(s);
    const km = withDistance ? distOf(s) : null;
    return `${st.pct != null ? `<span class="sat"><b class="num">${I.smile} ${st.pct}٪</b> راضون</span>` : ""}
      ${st.visits ? `<span><b class="num">${n0(st.visits)}</b> زيارة</span>` : ""}
      ${km != null ? `<span class="dist">${I.pin} <b class="num">${fmtKm(km)}</b></span>` : ""}`;
  }

  function staffLine(s, id) {
    const st = Store.staffStats(s, id);
    if (!st.cuts && st.pct == null) return "";
    const noun = s.type === "men" ? "حلاقة" : "خدمة";
    return `<span class="staff-stats">${st.cuts ? `<b class="num">${n0(st.cuts)}</b> ${noun}` : ""}${st.pct != null ? ` · <b class="num">${st.pct}٪</b> رضا` : ""}</span>`;
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
  /* أزرار التواصل: اتصال، واتساب، محادثة داخل التطبيق */
  const waNumber = (ph) => "966" + String(ph).replace(/^0/, "");
  function contactRow(s, bookingCode) {
    const c = s.contact || {};
    const text = bookingCode ? `السلام عليكم، بخصوص حجزي رقم ${bookingCode} في ${s.name}` : `السلام عليكم، أتواصل معكم من تطبيق عناياتي`;
    const btns = [];
    if (c.chat !== false) btns.push(`<button type="button" class="contact-btn primary" data-act="chat" data-v="${s.id}|${bookingCode || ""}">${I.chat}<span>محادثة</span>${unreadFor(s.id) ? `<span class="badge num">${unreadFor(s.id)}</span>` : ""}</button>`);
    if (c.call !== false && c.phone) btns.push(`<a class="contact-btn" href="tel:${esc(c.phone)}">${I.phone}<span>اتصال</span></a>`);
    if (c.wa !== false && c.whatsapp) btns.push(`<a class="contact-btn" href="https://wa.me/${waNumber(c.whatsapp)}?text=${encodeURIComponent(text)}" target="_blank" rel="noopener">${I.wa}<span>واتساب</span></a>`);
    return btns.length ? `<div class="contact-row">${btns.join("")}</div>` : "";
  }
  const unreadFor = (salonId) => (sessionPhone() ? Store.unread(Store.thread(salonId, sessionPhone()), "customer") : 0);

  /* منتجات الصالون */
  const cartFor = (s) => (state.cart.salonId === s.id ? state.cart.items : {});
  const cartCount = (s) => Object.values(cartFor(s)).reduce((a, n) => a + n, 0);
  const cartTotal = (s) => Object.entries(cartFor(s)).reduce((a, [id, n]) => { const pr = s.products.find((x) => x.id === id); return a + (pr ? pr.price * n : 0); }, 0);
  function productsHtml(s) {
    if (!s.productsEnabled || !s.products.length) return "";
    const cats = [...new Set(s.products.map((x) => x.category || "منتجات"))];
    const items = cartFor(s);
    return `<div class="block" id="products">
      <h2 class="section-title">منتجات الصالون</h2>
      <p class="hint">اطلبها الآن واستلمها من الصالون، أو مع موعدك القادم. الدفع عند الاستلام.</p>
      ${cats.map((c) => `<h3 class="group-title">${esc(c)}</h3>
        <div class="products">${s.products.filter((x) => (x.category || "منتجات") === c).map((x) => {
          const q = items[x.id] || 0;
          return `<div class="product ${x.inStock ? "" : "out"}">
            <span class="product-ic" aria-hidden="true">${I.bag}</span>
            <b class="product-name">${esc(x.name)}</b>
            ${x.desc ? `<span class="hint">${esc(x.desc)}</span>` : ""}
            <span class="product-foot"><b class="num">${money(x.price)}</b>
              ${!x.inStock ? `<span class="status cancelled">نفد</span>`
                : q ? `<span class="qty"><button type="button" data-act="cart-dec" data-v="${x.id}" aria-label="أنقص">−</button><b class="num">${q}</b><button type="button" data-act="cart-add" data-v="${x.id}" aria-label="زد">+</button></span>`
                : `<button type="button" class="btn add-small" data-act="cart-add" data-v="${x.id}">أضف</button>`}</span>
          </div>`;
        }).join("")}</div>`).join("")}
    </div>`;
  }
  function cartBar(s) {
    const n = cartCount(s);
    if (!n) return "";
    return `<div class="cart-bar"><div class="cart-inner">
      <span>${I.bag} <b class="num">${n}</b> ${n === 1 ? "منتج" : n === 2 ? "منتجان" : "منتجات"} · <b class="num">${money(cartTotal(s))}</b></span>
      <button type="button" class="btn" data-act="cart-open">إتمام الطلب</button></div></div>`;
  }

  /* السلة وتأكيد الطلب */
  function viewCart() {
    const s = Store.salon(state.cart.salonId);
    const items = Object.entries(state.cart.items).filter(([, n]) => n > 0).map(([id, n]) => ({ p: s.products.find((x) => x.id === id), n })).filter((x) => x.p);
    const upcoming = upcomingBookings().filter((b) => b.salonId === s.id);
    return `<section class="screen">
        ${topbar(true, "سلة " + s.name)}
        ${items.length ? `<div class="card">${items.map(({ p, n }) => `
          <div class="row cart-row"><span>${esc(p.name)}<br><span class="hint num">${money(p.price)} × ${n}</span></span>
            <span class="qty"><button type="button" data-act="cart-dec" data-v="${p.id}" aria-label="أنقص">−</button><b class="num">${n}</b><button type="button" data-act="cart-add" data-v="${p.id}" aria-label="زد">+</button></span></div>`).join("")}
          <div class="row total"><span>الإجمالي</span><span class="num">${money(cartTotal(s))}</span></div></div>
        <div class="card form">
          <b>الاستلام</b>
          <p class="hint">من ${esc(s.name)}${s.address ? ` · ${esc(s.address)}` : ""}. الدفع عند الاستلام.</p>
          ${upcoming.length ? `<label for="cart-booking">استلمها مع موعدي</label>
            <select id="cart-booking" data-cart="booking"><option value="">لا، سأمرّ لاستلامها</option>${upcoming.map((b) => `<option value="${b.code}" ${state.cart.booking === b.code ? "selected" : ""}>${fmtDate(b.date, { weekday: "long", day: "numeric", month: "short" })} · ${fmtTime(b.time)}</option>`).join("")}</select>` : ""}
          <label for="cart-note">ملاحظة (اختياري)</label>
          <input id="cart-note" data-cart="note" value="${esc(state.cart.note)}" placeholder="مثال: اللون الأحمر من الطلاء">
        </div>
        ${sessionPhone() ? `<button type="button" class="btn wide" data-act="order">تأكيد الطلب</button>` : authBlock("سجّل دخولك لتأكيد الطلب", true)}`
        : `<div class="empty">${I.bag}<p>السلة فارغة.</p></div>`}
      </section>${tabbar("home")}`;
  }

  /* المحادثة مع الصالون */
  function viewChat() {
    const c = state.chat; const s = Store.salon(c.salonId);
    if (!sessionPhone()) {
      return `<section class="screen">${topbar(true, "محادثة " + s.name)}${authBlock("سجّل دخولك لتبدأ المحادثة", true)}</section>${tabbar("mine")}`;
    }
    const t = Store.thread(s.id, sessionPhone());
    if (t && Store.unread(t, "customer")) Store.markRead(s.id, sessionPhone(), "customer");
    const msgs = t ? t.messages : [];
    const quick = ["أريد تعديل موعدي", "هل يوجد وقت متاح اليوم؟", "أين موقعكم بالضبط؟", "هل المنتج متوفر؟"];
    return `<section class="screen chat-screen">
        ${topbar(true, s.name)}
        ${contactRow({ ...s, contact: { ...(s.contact || {}), chat: false } }, c.bookingCode)}
        ${c.bookingCode ? `<p class="chat-ctx">بخصوص الحجز <b class="num" dir="ltr">${esc(c.bookingCode)}</b></p>` : ""}
        <div class="messages" id="messages">
          ${msgs.length ? msgs.map((m) => `<div class="msg ${m.from === "customer" ? "me" : "them"}">
              ${m.bookingCode ? `<span class="msg-ref num" dir="ltr">${esc(m.bookingCode)}</span>` : ""}
              <p>${esc(m.text)}</p><time class="num">${fmtTime(m.at.slice(11, 16))}</time></div>`).join("")
            : `<div class="empty"><p>اكتب رسالتك، ويصل ردّ الصالون هنا. يرد أي فرد من فريق الصالون من لوحته.</p></div>`}
        </div>
        <div class="quick">${quick.map((q) => `<button type="button" class="chip" data-act="chat-quick" data-v="${esc(q)}">${esc(q)}</button>`).join("")}</div>
        <form class="chat-form" id="chat-form" novalidate>
          <input id="chat-input" data-chat="1" autocomplete="off" value="${esc(c.draft || "")}" placeholder="اكتب رسالة…" aria-label="الرسالة">
          <button type="submit" class="btn">إرسال</button>
        </form>
      </section>`;
  }
  function sendChat(text) {
    const c = state.chat; text = String(text || "").trim();
    if (!text) return;
    Store.sendMessage(c.salonId, sessionPhone(), { from: "customer", text, name: loadProfile().name, bookingCode: c.refSent ? null : c.bookingCode || null });
    c.refSent = true;
    c.draft = ""; c.focus = true; render();
  }

  /* ---------- الدور (بدون موعد) ---------- */
  const queuePos = (q) => Store.queueWaiting(q.salonId).findIndex((x) => x.id === q.id) + 1;
  function queueCard(s) {
    if (!s.queue || !s.queue.enabled) return "";
    const est = Store.queueEstimate(s);
    const mine = sessionPhone() ? Store.queueOf(sessionPhone()).find((q) => q.salonId === s.id) : null;
    const open = openStatus(s).open;
    const full = est.waiting >= s.queue.max;
    return `<div class="queue-card" aria-live="polite">
      <div class="q-head"><b>الدور بدون موعد</b><span class="live-dot">مباشر</span></div>
      <p class="q-line">المنتظرون الآن: <b class="num">${est.waiting}</b> · ${est.minutes ? `الانتظار المتوقع نحو <b class="num">${est.minutes}</b> ${est.minutes <= 10 ? "دقائق" : "دقيقة"}` : "لا انتظار تقريباً"}</p>
      ${mine ? `<button type="button" class="q-mine" data-act="mine">دورك <b class="num" dir="ltr">${mine.number}</b> · ${mine.status === "serving" ? "حان دورك، تفضّل" : `ترتيبك <b class="num">${queuePos(mine)}</b>`}</button>`
        : !open ? `<p class="hint">الدور متاح في ساعات العمل.</p>`
        : !s.queue.remote ? `<p class="hint">احضر للصالون، وسجّل اسمك عند الاستقبال.</p>`
        : full ? `<p class="hint">الدور ممتلئ حالياً. جرّب بعد قليل.</p>`
        : `<button type="button" class="btn" data-act="queue-start" data-v="${s.id}">احجز دوري</button>`}
    </div>`;
  }
  function viewQueueJoin() {
    const s = Store.salon(state.qjoin.salonId);
    const est = Store.queueEstimate(s);
    return `<section class="screen">
        ${topbar(true, "احجز دورك")}
        ${salonHead(s)}
        <div class="queue-card"><p class="q-line">المنتظرون الآن: <b class="num">${est.waiting}</b> · ${est.minutes ? `الانتظار المتوقع نحو <b class="num">${est.minutes}</b> ${est.minutes <= 10 ? "دقائق" : "دقيقة"}` : "لا انتظار تقريباً"}</p></div>
        <div><h2 class="section-title">ماذا تريد؟</h2><p class="hint">لحساب وقت انتظار أدق. يمكنك تغييره في الصالون.</p></div>
        <div class="options" role="radiogroup" aria-label="الخدمة">${s.services.map((sv) => `
          <button type="button" role="radio" class="option with-check" data-act="queue-svc" data-v="${sv.id}" aria-checked="${state.qjoin.service === sv.id}">
            <span class="check" style="border-radius:50%">${I.check}</span><span class="title">${esc(sv.name)}</span><span class="price num">${money(sv.price)}</span><span class="sub">${svcSub(sv)}</span>
          </button>`).join("")}</div>
        ${sessionPhone() ? `<div class="card form">
            <div class="verified-row"><span class="num" dir="ltr">${esc(sessionPhone())}</span><span class="ok-tag">رقم مؤكَّد ✓</span></div>
            <label for="qj-name">الاسم</label><input id="qj-name" data-cust="name" autocomplete="name" value="${esc(state.cust.name || loadProfile().name || "")}">
          </div>
          <button type="button" class="btn wide" data-act="queue-join">تأكيد حجز الدور</button>
          <p class="hint">إذا لم تحضر عند وصول دورك، يُحسب غياباً عند الصالون.</p>`
          : authBlock("أكّد رقم جوالك لحجز دورك", true)}
      </section>${tabbar("home")}`;
  }
  function queueMineHtml() {
    if (!sessionPhone()) return "";
    const list = Store.queueOf(sessionPhone()).filter((q) => !SALON || q.salonId === SALON.id);
    if (!list.length) return "";
    return `<div class="block"><h2 class="section-title">دوري الآن</h2>${list.map((q) => {
      const s = Store.salon(q.salonId);
      const pos = queuePos(q);
      const est = Store.queueEstimate(s, q.seq).minutes;
      return `<article class="booking queue-mine">
        <div class="booking-head"><div><h3>${esc(s.name)}</h3><p class="hint">${q.serviceNames.length ? q.serviceNames.map(esc).join("، ") : "بدون موعد"}</p></div>
          <span class="q-number num" dir="ltr">${q.number}</span></div>
        ${q.status === "serving" ? `<p class="q-now">حان دورك، تفضّل${q.staffName ? ` مع ${esc(q.staffName)}` : ""}</p>`
          : `<p class="q-line">ترتيبك: <b class="num">${pos}</b> · ${pos === 1 ? "أنت التالي" : est ? `الانتظار المتوقع نحو <b class="num">${est}</b> ${est <= 10 ? "دقائق" : "دقيقة"}` : "قريباً"}</p>`}
        ${q.notice ? `<div class="sms-sim" role="note"><div class="sms-head"><span>رسالة نصية · ${esc(s.name)}</span><span class="sms-tag">محاكاة: تصل لجوالك</span></div><p>${esc(q.notice)}</p></div>` : ""}
        ${q.status === "waiting" ? (state.qLeave === q.id
          ? `<div class="confirm-box"><p>هل تريد الخروج من الدور؟ سيفقد رقمك مكانه.</p><div class="booking-actions">
              <button type="button" class="btn danger" data-act="queue-leave" data-v="${q.id}">نعم، اخرج</button><button type="button" class="btn ghost" data-act="queue-leave-no">تراجع</button></div></div>`
          : `<div class="booking-actions"><a class="btn ghost" href="${esc(dirUrl(s))}" target="_blank" rel="noopener">${I.pin} الاتجاهات</a><button type="button" class="btn ghost" data-act="queue-leave-ask" data-v="${q.id}">الخروج من الدور</button></div>`) : ""}
      </article>`;
    }).join("")}</div>`;
  }

  function viewSalonHome(s, inPlatform) {
    const st = openStatus(s);
    const p = loadProfile();
    const h = new Date().getHours();
    const greet = `${h < 12 ? "صباح الخير" : "مساء الخير"}${p.name ? `، ${esc(p.name.split(" ")[0])}` : ""}`;
    const maps = "https://www.google.com/maps/search/?api=1&query=" + (s.location ? `${s.location.lat},${s.location.lng}` : encodeURIComponent(s.name + " " + s.address));
    const km = distOf(s);
    const mine = sessionPhone() ? Store.customerVisits(sessionPhone(), s.id) : 0;
    return `<section class="screen">
        ${inPlatform ? topbar(true, s.name) : topbar()}
        <div class="salon-hero">
          <span class="monogram xl" aria-hidden="true">${esc(initials(s.name))}</span>
          <div class="salon-hero-text">
            <p class="greet-on">${greet}</p>
            <h1>${esc(s.name)}</h1>
            <p class="slogan">${esc(s.slogan)}</p>
          </div>
          <div class="hero-meta">
            ${statsLine(s, false)}
            ${s.location ? (km != null ? `<span class="dist">${I.pin} يبعد عنك <b class="num">${fmtKm(km)}</b></span>`
              : `<button type="button" class="dist-btn" data-act="near-one">${I.pin} ${state.locating ? "جاري التحديد…" : "كم يبعد عني؟"}</button>`) : ""}
            ${mine ? `<span>زرته <b class="num">${mine}</b> ${mine === 1 ? "مرة" : mine === 2 ? "مرتين" : "مرات"}</span>` : ""}
            <span class="open-pill ${st.open ? "is-open" : ""}">${st.text}</span>
          </div>
          ${Store.isLive(s) && s.services.length
            ? `<button type="button" class="btn hero-btn" data-act="salon" data-v="${s.id}">احجز موعدك</button>`
            : `<p class="hero-note">${Store.isLive(s) ? "يجهّز الصالون قائمة خدماته، والحجز متاح قريباً." : "الحجز عبر التطبيق متوقف مؤقتاً. تواصل مع الصالون مباشرة."}</p>`}
        </div>
        ${queueCard(s)}
        ${contactRow(s)}
        ${nextVisitCard()}

        <div class="block">
          <h2 class="section-title">الخدمات والأسعار</h2>
          ${servicesHtml(s, (sv) => `
            <button type="button" class="option svc" data-act="salon-svc" data-v="${sv.id}">
              <span class="title">${esc(sv.name)}</span>
              <span class="price num">${money(sv.price)}</span>
              <span class="sub">${svcSub(sv)}</span>
              <span class="go" aria-hidden="true">احجز</span>
            </button>`, "الخدمات والأسعار")}
        </div>

        <div class="block">
          <h2 class="section-title">${s.type === "men" ? "فريق الحلاقين" : "فريق المختصات"}</h2>
          <div class="team">${s.staff.map((m) => `
            <div class="member">
              <span class="avatar" aria-hidden="true">${esc(m.name.charAt(0))}</span>
              <span class="name">${esc(m.name)}</span>
              <span class="role">${esc(m.role)}${m.years ? ` · ${yrs(m.years)}` : ""}</span>
              ${staffLine(s, m.id)}
            </div>`).join("")}</div>
        </div>

        ${productsHtml(s)}

        <div class="block">
          <h2 class="section-title">عن ${esc(s.name)}</h2>
          <p class="about">${esc(s.about)}</p>
          <div class="card">
            ${s.address ? `<div class="row"><span>العنوان</span><span>${esc(s.address)}</span></div>` : ""}
            <div class="row"><span>ساعات العمل</span><span class="num">يومياً ${fmtTime(fromMin(s.hours.open * 60))} – ${fmtTime(fromMin(s.hours.close * 60))}</span></div>
          </div>
          ${s.address ? `<a class="btn ghost wide map-link" href="${maps}" target="_blank" rel="noopener">افتح الموقع في الخرائط</a>` : ""}
        </div>

        ${inPlatform ? "" : `<a class="powered" href="./">يعمل بواسطة <b>عناياتي</b></a>`}
      </section>${cartBar(s)}${tabbar("home")}`;
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
      <div><h2 style="font-size:var(--fs-lg)">${esc(s.name)}</h2><p>${s.area ? `${esc(s.area)} · ` : ""}${s.type === "men" ? "رجالي" : "نسائي"}</p></div>
    </div>`;
  }

  function stepServices(s) {
    if (!s.services.length) return `<div class="empty"><p>لا توجد خدمات متاحة للحجز في هذا الصالون حالياً.</p></div>`;
    return `<div><h2 class="section-title">اختر الخدمة</h2><p class="hint">يمكنك اختيار أكثر من خدمة.</p></div>
      ${servicesHtml(s, (sv) => `
        <button type="button" class="option with-check" data-act="service" data-v="${sv.id}" aria-pressed="${state.services.includes(sv.id)}">
          <span class="check">${I.check}</span>
          <span class="title">${esc(sv.name)}</span>
          <span class="price num">${money(sv.price)}</span>
          <span class="sub">${svcSub(sv)}</span>
        </button>`, "الخدمات")}`;
  }

  function stepStaff(s) {
    const any = { id: "any", name: "أي مختص متاح", role: "أقرب موعد", years: null };
    const label = s.type === "men" ? "اختر الحلاق" : "اختر المختصة";
    return `<div><h2 class="section-title">${label}</h2><p class="hint">اختر "أي مختص متاح" لتظهر لك أوقات أكثر.</p></div>
      <div class="staff" role="radiogroup" aria-label="${label}">${[any, ...s.staff].map((p) => `
        <button type="button" role="radio" class="person" data-act="staff" data-v="${p.id}" aria-checked="${state.staffId === p.id}">
          <span class="avatar" aria-hidden="true">${p.id === "any" ? "✦" : esc(p.name.charAt(0))}</span>
          <span class="name">${esc(p.name)}</span>
          <span class="role">${esc(p.role)}${p.years ? ` · ${yrs(p.years)} خبرة` : ""}</span>
          ${p.id === "any" ? "" : staffLine(s, p.id)}
        </button>`).join("")}</div>`;
  }

  function stepTime() {
    const base = new Date(); base.setHours(0, 0, 0, 0);
    const days = [];
    for (let i = 0; i < DAYS_AHEAD; i++) { const d = new Date(base); d.setDate(base.getDate() + i); days.push(isoDate(d)); }
    const closed = (iso) => (salon().closedDays || []).includes(parseISO(iso).getDay());
    if (!state.date || closed(state.date)) state.date = days.find((d) => !closed(d)) || days[0];
    const dayBtns = days.map((iso, i) => {
      const d = parseISO(iso);
      const dow = i === 0 ? "اليوم" : i === 1 ? "غداً" : d.toLocaleDateString(LOCALE, { weekday: "short" });
      return `<button type="button" role="radio" class="day" data-act="date" data-v="${iso}" aria-checked="${state.date === iso}" aria-label="${fmtDate(iso)}${closed(iso) ? " (مغلق)" : ""}" ${closed(iso) ? "disabled" : ""}>
        <span class="dow">${dow}</span><span class="dnum num">${d.getDate()}</span><span class="mon">${d.toLocaleDateString(LOCALE, { month: "short" })}</span></button>`;
    }).join("");
    const slots = closed(state.date) ? [] : slotsFor(state.date);
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

  const depositNow = (s) => Store.depositFor(s, { phone: sessionPhone(), date: state.date, time: state.time, total: totalPrice() });
  function stepPay(s) {
    const dep = depositNow(s);
    if (dep.required && state.payment === "cash") state.payment = null;
    const methods = DATA.payments.filter((p) => !dep.required || p.id !== "cash");
    return `<div><h2 class="section-title">المراجعة والدفع</h2></div>
      <div class="summary">
        <div class="row"><span>الخدمات</span><span>${chosenServices().map((x) => esc(x.name)).join("، ")}</span></div>
        <div class="row"><span>${s.type === "men" ? "الحلاق" : "المختصة"}</span><span>${esc(staffLabel(s, state.staffId))}</span></div>
        <div class="row"><span>الموعد</span><span>${fmtDate(state.date)}<br><span class="num">${fmtTime(state.time)}</span></span></div>
        <div class="row"><span>المدة</span><span class="num">${fmtDuration(totalMin())}</span></div>
        <div class="row"><span>الإلغاء</span><span>${policyText(Store.cancelHours(s))}</span></div>
        <div class="row total"><span>الإجمالي</span><span class="num">${money(totalPrice())}</span></div>
      </div>
      ${dep.required ? `<div class="deposit-note"><b>يتطلب هذا الحجز عربون <span class="num">${money(dep.amount)}</span> يُخصم من الفاتورة</b>
        <span>${esc(dep.reason)}. ويُدفع الباقي <span class="num">${money(totalPrice() - dep.amount)}</span> في الصالون.</span></div>` : ""}
      <div><h3 class="section-title" style="font-size:var(--fs-md)">${dep.required ? "طريقة دفع العربون" : "طريقة الدفع"}</h3></div>
      <div class="options" role="radiogroup" aria-label="طريقة الدفع">${methods.map((p) => `
        <button type="button" role="radio" class="option with-check" data-act="pay" data-v="${p.id}" aria-checked="${state.payment === p.id}">
          <span class="check" style="border-radius:50%">${I.check}</span>
          <span class="title">${esc(p.name)}</span><span></span>
          <span class="sub">${esc(p.note)}</span>
        </button>`).join("")}</div>
      <div><h3 class="section-title" style="font-size:var(--fs-md)">بياناتك</h3><p class="hint">يصل اسمك ورقمك للصالون ليتواصل معك عند الحاجة.</p></div>
      ${sessionPhone() ? `<div class="card form">
        <div class="verified-row"><span class="num" dir="ltr">${esc(sessionPhone())}</span><span class="ok-tag">رقم مؤكَّد ✓</span></div>
        <label for="cu-name">الاسم</label>
        <input id="cu-name" data-cust="name" type="text" autocomplete="name" value="${esc(state.cust.name)}" placeholder="مثال: عبدالعزيز">
      </div>` : authBlock("أكّد رقم جوالك لإكمال الحجز", true)}
      <p class="demo-note">نسخة تجريبية: لا يتم خصم أي مبلغ. يُربط الدفع لاحقاً ببوابة دفع (مثل Moyasar أو HyperPay).</p>`;
  }

  const normPhone = (v) => String(v || "").replace(/[\s-]/g, "").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
  const validPhone = (v) => /^05\d{8}$/.test(normPhone(v));
  /* تسجيل الدخول برمز تحقق (في الحجز وفي "حسابي") */
  function smsBox(text) {
    return `<div class="sms-sim" role="note"><div class="sms-head"><span>رسالة نصية · عناياتي</span><span class="sms-tag">محاكاة: تصل لجوالك</span></div><p>${esc(text)}</p></div>`;
  }
  function authBlock(title, askName) {
    const a = state.auth;
    if (!a.sent) {
      return `<div class="card form auth">
        <b>${title}</b>
        <p class="hint">نرسل لك رمزاً من 4 أرقام برسالة نصية. إن سبق أن حجزت بالاتصال، ستجد حسابك ومواعيدك جاهزة.</p>
        ${askName ? `<label for="au-name">الاسم</label><input id="au-name" data-auth="name" type="text" autocomplete="name" value="${esc(a.name)}" placeholder="مثال: عبدالعزيز">` : ""}
        <label for="au-phone">رقم الجوال</label>
        <input id="au-phone" data-auth="phone" type="tel" inputmode="tel" dir="ltr" autocomplete="tel" value="${esc(a.phone)}" placeholder="05XXXXXXXX">
        ${a.error ? `<p class="field-error">${esc(a.error)}</p>` : ""}
        <button type="button" class="btn" data-act="auth-send" style="margin-top:12px">أرسل رمز التحقق</button>
      </div>`;
    }
    return `${smsBox(a.sms)}
      <div class="card form auth">
        <b>اكتب الرمز الذي وصلك</b>
        <p class="hint">أُرسل إلى <span class="num" dir="ltr">${esc(a.phone)}</span>، وصالح 5 دقائق.</p>
        <label for="au-code">رمز التحقق</label>
        <input id="au-code" data-auth="code" class="otp-input num" inputmode="numeric" autocomplete="one-time-code" maxlength="4" dir="ltr" placeholder="••••" value="${esc(a.code)}">
        ${a.error ? `<p class="field-error">${esc(a.error)}</p>` : ""}
        <button type="button" class="btn" data-act="auth-verify" style="margin-top:12px">تأكيد</button>
        <div class="row-actions"><button type="button" class="link" data-act="auth-send">إعادة إرسال</button><button type="button" class="link" data-act="auth-reset">تغيير الرقم</button></div>
      </div>`;
  }
  function authSend() {
    const a = state.auth;
    a.phone = normPhone(a.phone);
    if (!validPhone(a.phone)) { a.error = "اكتب رقم جوال سعودي من 10 أرقام يبدأ بـ 05."; return; }
    const r = Store.sendOtp(a.phone, "login");
    if (!r.ok) { a.error = `انتظر ${r.wait} ثانية قبل إعادة الإرسال.`; return; }
    a.sent = true; a.code = ""; a.error = "";
    a.sms = `عناياتي: رمز الدخول ${r.code}. لا تشاركه مع أي أحد. صالح 5 دقائق.`;
  }
  function authVerify() {
    const a = state.auth;
    const res = Store.verifyOtp(a.phone, "login", a.code);
    const msg = { wrong: "الرمز غير صحيح.", expired: "انتهت صلاحية الرمز. أعد الإرسال.", locked: "محاولات كثيرة. أعد إرسال رمز جديد.", missing: "أعد إرسال الرمز." }[res];
    if (msg) { a.error = msg; return false; }
    const existing = Store.customer(a.phone);
    const c = Store.upsertCustomer({ phone: a.phone, name: a.name.trim(), via: "app" });
    const p = loadProfile();
    saveProfile({ ...p, phone: a.phone, verified: true, name: c.name || a.name.trim() || p.name });
    state.cust = { name: c.name || a.name.trim() || p.name || "", phone: a.phone };
    state.auth = newAuth();
    if (existing && existing.createdVia === "salon") {
      const from = DATA.salons.find((x) => x.id === existing.createdBy);
      toast(`أهلاً ${existing.name || ""}! حسابك جاهز${from ? ` من ${from.name}` : ""}، وتجد مواعيدك في "مواعيدي".`);
    } else toast(existing ? "أهلاً بعودتك" : "أُنشئ حسابك برقم مؤكَّد");
    return true;
  }
  const newAuth = () => ({ phone: "", name: "", code: "", sent: false, sms: "", error: "" });

  function canNext() {
    const custOk = !!sessionPhone() && state.cust.name.trim().length >= 2;
    return [state.services.length > 0, !!state.staffId, !!(state.date && state.time), !!state.payment && custOk && !state.paying][state.step];
  }

  function viewBook() {
    const s = salon();
    const body = [stepServices, stepStaff, stepTime, stepPay][state.step](s);
    const dep = state.step === 3 ? depositNow(s) : { required: false };
    const label = state.paying ? "جاري الدفع…" : state.step < 3 ? "التالي"
      : dep.required ? `ادفع العربون ${money(dep.amount)}` : state.payment === "cash" ? "تأكيد الحجز" : `ادفع ${money(totalPrice())}`;
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
            ${b.deposit ? `<div class="row"><span>العربون المدفوع</span><span class="num">${money(b.deposit.amount)}</span></div>
              <div class="row total"><span>المتبقي في الصالون</span><span class="num">${money(b.total - b.deposit.amount)}</span></div>`
              : `<div class="row total"><span>${b.payment === "cash" ? "يُدفع في الصالون" : "المدفوع"}</span><span class="num">${money(b.total)}</span></div>`}
          </div>
          <div class="ticket-extras">${bookingExtras({ ...b, deposit: null }, s)}</div>
        </div>
        <p class="hint" style="text-align:center">احضر قبل موعدك بـ ١٠ دقائق. يمكنك الإلغاء من "مواعيدي".</p>
      </section>
      <div class="action-bar"><div class="action-inner">
        <button type="button" class="btn ghost" data-act="home">حجز جديد</button>
        <button type="button" class="btn" data-act="mine">مواعيدي</button>
      </div></div>`;
  }

  function bookingStatus(b) {
    if (b.status === "cancelled") return ["cancelled", b.cancelledBy === "salon" ? "ألغاه الصالون" : "ملغى"];
    if (b.status === "noshow") return ["noshow", "لم يحضر"];
    if (b.status === "completed") return ["past", "مكتمل"];
    const end = parseISO(b.date); end.setMinutes(toMin(b.time) + b.minutes);
    return end < new Date() ? ["past", "منتهٍ"] : ["upcoming", "قادم"];
  }

  /* "كيف كانت زيارتك؟" بثلاث درجات للصالون وللمختص */
  function rateBox(b, s) {
    const V = Store.VERDICTS;
    if (b.feedback) {
      return `<div class="rated"><span>تقييمك للصالون: <b>${V[b.feedback.salon]}</b></span><span>لـ${esc(b.staffName)}: <b>${V[b.feedback.staff]}</b></span>${b.feedback.note ? `<span class="hint">"${esc(b.feedback.note)}"</span>` : ""}</div>`;
    }
    const r = state.rate && state.rate.code === b.code ? state.rate : { code: b.code, salon: null, staff: null, note: "" };
    const row = (key, label) => `<div class="verdict-row"><span>${label}</span><div class="verdicts" role="radiogroup" aria-label="${label}">
      ${[["very", I.fVery], ["ok", I.fOk], ["no", I.fNo]].map(([v, ic]) => `<button type="button" role="radio" class="verdict v-${v}" data-act="rate" data-v="${b.code}|${key}|${v}" aria-checked="${r[key] === v}">${ic}<span>${V[v]}</span></button>`).join("")}
    </div></div>`;
    return `<div class="rate-box">
      <b>كيف كانت زيارتك؟</b>
      ${row("salon", esc(s.name))}
      ${row("staff", esc(b.staffName))}
      <input type="text" class="rate-note" data-rate-note="${b.code}" placeholder="ملاحظة للصالون (اختياري)" value="${esc(r.note)}">
      <button type="button" class="btn" data-act="rate-send" data-v="${b.code}" ${r.salon && r.staff ? "" : "disabled"}>إرسال التقييم</button>
    </div>`;
  }

  /* نص تأكيد الإلغاء حسب المهلة والعربون */
  function cancelPrompt(b) {
    const hours = b.policy ? b.policy.cancelHours : Store.cancelHours(Store.salon(b.salonId));
    const dep = b.deposit && b.deposit.status === "paid" ? b.deposit.amount : 0;
    if (Store.isLateCancel(b)) {
      return dep ? `فات وقت الإلغاء المجاني (${hoursText(hours)} قبل الموعد)، وسيحتفظ الصالون بالعربون <b class="num">${money(dep)}</b>. هل تريد الإلغاء؟`
        : `فات وقت الإلغاء المجاني (${hoursText(hours)} قبل الموعد)، وسيُسجَّل الإلغاء متأخراً. هل تريد الإلغاء؟`;
    }
    return dep ? `الإلغاء مجاني الآن، ويُعاد لك العربون <b class="num">${money(dep)}</b>. هل تريد إلغاء هذا الموعد؟` : "هل تريد إلغاء هذا الموعد؟";
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
        ${b.status === "completed" ? rateBox(b, s) : ""}
        ${cls === "upcoming" ? bookingExtras(b, s) : ""}
        ${b.status === "cancelled" && b.deposit ? `<p class="policy-line">العربون: ${esc(Store.DEPOSIT_STATES[b.deposit.status] || "")}</p>` : ""}
        ${cls === "upcoming" ? (asking
          ? `<div class="confirm-box"><p>${cancelPrompt(b)}</p><div class="booking-actions">
               <button type="button" class="btn danger" data-act="cancel-yes" data-v="${b.code}">نعم، ألغِ الموعد</button>
               <button type="button" class="btn ghost" data-act="cancel-no">تراجع</button></div></div>`
          : `<div class="booking-actions"><button type="button" class="btn ghost" data-act="cancel-ask" data-v="${b.code}">إلغاء الموعد</button>
               <button type="button" class="btn ghost" data-act="chat" data-v="${b.salonId}|${b.code}">${I.chat} تواصل</button></div>`)
          : `<div class="booking-actions"><button type="button" class="btn ghost" data-act="rebook" data-v="${b.salonId}">احجز مجدداً</button>
               <button type="button" class="btn ghost" data-act="chat" data-v="${b.salonId}|${b.code}">${I.chat} تواصل</button></div>`}
      </article>`;
    }).join("");
    return `<section class="screen">
        ${topbar()}
        <div class="hello"><h1>مواعيدي</h1></div>
        ${queueMineHtml()}
        ${chatsHtml()}
        ${ordersHtml()}
        ${list.length ? `<div class="bookings">${items}</div>`
          : sessionPhone()
            ? `<div class="empty">${I.cal}<p>لا توجد مواعيد بعد. ستظهر حجوزاتك هنا، ومنها ما يحجزه لك الصالون بالاتصال.</p><button type="button" class="btn" style="flex:none;padding-inline:28px" data-act="home">احجز موعدك الأول</button></div>`
            : `<div class="empty">${I.cal}<p>سجّل دخولك برقم جوالك لتظهر مواعيدك، ومنها ما حجزه لك الصالون بالاتصال.</p><button type="button" class="btn" style="flex:none;padding-inline:28px" data-act="profile">تسجيل الدخول</button></div>`}
      </section>${tabbar("mine")}`;
  }

  function chatsHtml() {
    if (!sessionPhone()) return "";
    const ts = Store.threadsOfCustomer(sessionPhone()).filter((t) => !SALON || t.salonId === SALON.id);
    if (!ts.length) return "";
    return `<div class="block"><h2 class="section-title">المحادثات</h2>${ts.map((t) => {
      const s = Store.salon(t.salonId); const last = t.messages[t.messages.length - 1]; const u = Store.unread(t, "customer");
      return `<button type="button" class="thread-row" data-act="chat" data-v="${t.salonId}|">
        <span class="monogram sm" style="--salon-color:${s.brand.primary};--salon-accent:${s.brand.accent}" aria-hidden="true">${esc(initials(s.name))}</span>
        <span class="thread-main"><b>${esc(s.name)}</b><span class="hint">${last.from === "customer" ? "أنت: " : ""}${esc(last.text)}</span></span>
        ${u ? `<span class="badge-inline num">${u}</span>` : ""}</button>`;
    }).join("")}</div>`;
  }
  function ordersHtml() {
    if (!sessionPhone()) return "";
    const os = Store.orders().filter((o) => o.customer.phone === sessionPhone() && (!SALON || o.salonId === SALON.id)).reverse();
    if (!os.length) return "";
    return `<div class="block"><h2 class="section-title">طلبات المنتجات</h2>${os.map((o) => {
      const s = Store.salon(o.salonId);
      return `<article class="booking"><div class="booking-head"><div><h3>${esc(s.name)}</h3>
        <p class="hint">${o.items.map((x) => `${esc(x.name)} × ${x.qty}`).join("، ")}</p></div>
        <span class="status ${o.status === "ready" ? "upcoming" : o.status === "cancelled" ? "cancelled" : "past"}">${Store.ORDER_STATES[o.status]}</span></div>
        <div class="meta"><span>رقم الطلب <b class="num" dir="ltr">${o.id}</b></span><span class="num">${money(o.total)}</span>${o.bookingCode ? `<span>مع موعدك</span>` : ""}</div></article>`;
    }).join("")}</div>`;
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
        <p class="verified-row"><span class="num" dir="ltr">${esc(p.phone)}</span><span class="ok-tag">رقم مؤكَّد ✓</span></p>
        <p class="hint">لتغيير الرقم سجّل الخروج وادخل بالرقم الجديد.</p>
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
        <div class="row"><span>الجوال</span><span><span class="num" dir="ltr">${esc(p.phone)}</span> <span class="ok-tag">✓</span></span></div>
        <div class="row"><span>البريد</span><span dir="ltr">${p.email ? esc(p.email) : '<span class="hint">—</span>'}</span></div>
        <div class="row"><span>الصوالين المفضلة</span><span>${prefLabel}</span></div>
        <div class="row"><span>عضو منذ</span><span>${since}</span></div>
      </div>
      <div class="booking-actions"><button type="button" class="btn ghost" data-act="edit-profile">تعديل البيانات</button><button type="button" class="btn ghost" data-act="logout">تسجيل الخروج</button></div>`;

    return `<section class="screen">
        ${topbar()}
        <div class="profile-head">
          <span class="avatar lg" aria-hidden="true">${p.name ? esc(p.name.charAt(0)) : I.user}</span>
          <div><h1>${p.name ? esc(p.name) : "حسابي"}</h1><p class="hint">${p.name ? `نقاط الولاء: <b class="num">${st.points}</b>` : (sessionPhone() ? "أضف اسمك ليعرفك الصالون." : "سجّل دخولك لتظهر مواعيدك ونقاطك.")}</p></div>
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

        <div class="block"><h2 class="section-title">بياناتي</h2>${sessionPhone() ? info : authBlock("سجّل الدخول برقم جوالك", false)}</div>

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
        <div class="panel-links">
          <span>لأصحاب الصوالين:</span>
          <a href="dashboard.html${SALON ? `?s=${SALON.id}` : ""}">لوحة الصالون</a>
          ${SALON ? "" : `<a href="admin.html">إدارة عناياتي</a>`}
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
    const brandOf = { book: () => salon(), done: () => salon(), salon: () => Store.salon(state.openSalon), chat: () => state.chat && Store.salon(state.chat.salonId), cart: () => Store.salon(state.cart.salonId), queue: () => state.qjoin && Store.salon(state.qjoin.salonId) };
    applyBrand(SALON || (brandOf[state.view] ? brandOf[state.view]() : null));
    $app.innerHTML = { splash: viewSplash, home: viewHome, book: viewBook, done: viewDone, mine: viewMine, profile: viewProfile,
      salon: () => viewSalonHome(Store.salon(state.openSalon), true), chat: viewChat, cart: viewCart, queue: viewQueueJoin }[state.view]();
    if (state.view === "chat") {
      const box = document.getElementById("messages"); if (box) box.scrollTop = box.scrollHeight;
      window.scrollTo(0, document.body.scrollHeight);
      if (state.chat && state.chat.focus) { const i = document.getElementById("chat-input"); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && state.view === "splash") meta.setAttribute("content", SALON ? SALON.brand.primary : "#0E4F4A");
  }
  function go(view) {
    if (view !== state.view) state.prev = state.view;
    state.view = view; state.cancelAsk = null; state.editProfile = false; state.clearAsk = false; state.calOpen = null; state.qLeave = null;
    render(); window.scrollTo(0, 0);
  }

  function startBooking(id, serviceId) {
    if (!Store.isLive(Store.salon(id))) { toast("الحجز في هذا الصالون متوقف مؤقتاً"); return; }
    const p = loadProfile();
    Object.assign(state, { salonId: id, step: 0, services: serviceId ? [serviceId] : [], staffId: null, date: null, time: null, payment: null, cust: { name: p.name || "", phone: sessionPhone() }, auth: { ...newAuth(), name: p.name || "" } });
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
    const dep = depositNow(s);
    if (dep.required && (!state.payment || state.payment === "cash")) { toast("اختر طريقة دفع العربون"); return; }
    state.paying = true; render();
    const charge = dep.required ? Payments.chargeDeposit({ amount: dep.amount, method: state.payment }) : new Promise((r) => setTimeout(() => r(null), 600));
    charge.then((paid) => {
      if (dep.required && (!paid || !paid.ok)) { state.paying = false; render(); toast("لم يتم دفع العربون. حاول مرة أخرى."); return; }
      const b = {
        code: makeCode(), salonId: s.id, staffId: person.id, staffName: person.name,
        services: state.services.slice(), serviceNames: chosenServices().map((x) => x.name),
        date: state.date, time: state.time, minutes: totalMin(), total: totalPrice(),
        payment: state.payment, status: "confirmed", createdAt: new Date().toISOString(),
        customer: { name: state.cust.name.trim(), phone: sessionPhone() },
        policy: { cancelHours: Store.cancelHours(s) },
        deposit: paid ? { amount: dep.amount, status: "paid", ref: paid.ref, method: paid.method, reason: dep.reason, at: paid.at } : null
      };
      if (paid) b.payment = "cash"; /* العربون مدفوع، والباقي في الصالون */
      Store.addBooking(b);
      Store.upsertCustomer({ phone: b.customer.phone, name: b.customer.name, via: "app", salonId: s.id });
      const p = loadProfile();
      if (!p.name) saveProfile({ ...p, name: b.customer.name });
      state.paying = false; state.lastBooking = b;
      go("done");
    });
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
      case "salon": state.bookFrom = state.view; startBooking(v); break;
      case "open-salon": state.openSalon = v; go("salon"); break;
      case "chat": { const [sid, code] = v.split("|"); state.chat = { salonId: sid, bookingCode: code || null, draft: "", from: state.view, focus: false }; go("chat"); break; }
      case "chat-quick": sendChat(v); break;
      case "cart-add": case "cart-dec": {
        const cur = state.view === "cart" ? Store.salon(state.cart.salonId) : (SALON || Store.salon(state.openSalon));
        const pr = cur.products.find((x) => x.id === v);
        if (state.cart.salonId !== cur.id) state.cart = { salonId: cur.id, items: {}, note: "", booking: "" };
        const n = (state.cart.items[v] || 0) + (el.dataset.act === "cart-add" ? 1 : -1);
        if (n <= 0) delete state.cart.items[v]; else if (pr && pr.inStock) state.cart.items[v] = Math.min(n, 20);
        render(); break;
      }
      case "cart-open": go("cart"); break;
      case "order": {
        const s2 = Store.salon(state.cart.salonId);
        const items = Object.entries(state.cart.items).map(([id, n]) => { const pr = s2.products.find((x) => x.id === id); return pr && pr.inStock ? { id, name: pr.name, price: pr.price, qty: n } : null; }).filter(Boolean);
        if (!items.length) { toast("السلة فارغة"); break; }
        const p = loadProfile();
        const o = Store.addOrder({ id: "OR-" + makeCode().slice(3, 8), salonId: s2.id, customer: { name: p.name || state.cust.name || "", phone: sessionPhone() },
          items, total: items.reduce((a, x) => a + x.price * x.qty, 0), bookingCode: state.cart.booking || null, note: state.cart.note.trim(), status: "new", createdAt: new Date().toISOString() });
        Store.upsertCustomer({ phone: sessionPhone(), name: o.customer.name, via: "app", salonId: s2.id });
        state.cart = { salonId: null, items: {}, note: "", booking: "" };
        toast(`وصل طلبك ${o.id} للصالون، وستجد حالته في "مواعيدي"`); go("mine"); break;
      }
      case "rebook": startBooking(v); break;
      case "salon-svc": { const cur = SALON || Store.salon(state.openSalon); state.bookFrom = state.view; if (Store.isLive(cur)) startBooking(cur.id, v); else toast("الحجز متوقف مؤقتاً"); break; }
      case "home": go("home"); break;
      case "mine": go("mine"); break;
      case "profile": go("profile"); break;
      case "enter": enterApp(); break;
      case "toggle-theme": setTheme(isDark() ? "light" : "dark"); render(); break;
      case "theme": setTheme(v); render(); break;
      case "edit-profile": state.editProfile = true; render(); { const f = document.getElementById("pf-name"); if (f) f.focus(); } break;
      case "edit-cancel": state.editProfile = false; render(); break;
      case "near":
        if (state.sortNear && state.here) { state.sortNear = false; render(); }
        else if (state.here && Date.now() - (state.here.at || 0) < 10 * 60000) { state.sortNear = true; render(); }
        else locate(() => { state.sortNear = true; });
        break;
      case "near-one": locate(); break;
      case "rate": {
        const [code, key, val] = v.split("|");
        if (!state.rate || state.rate.code !== code) state.rate = { code, salon: null, staff: null, note: "" };
        state.rate[key] = val; render(); break;
      }
      case "rate-send": {
        const r = state.rate;
        if (!r || r.code !== v || !r.salon || !r.staff) return;
        Store.rateBooking(v, { salon: r.salon, staff: r.staff, note: r.note.trim() });
        state.rate = null; render(); toast("شكراً! وصل تقييمك للصالون"); break;
      }
      case "auth-send": authSend(); render(); document.getElementById(state.auth.sent ? "au-code" : "au-phone")?.focus(); break;
      case "auth-verify": if (authVerify()) render(); else { render(); document.getElementById("au-code")?.focus(); } break;
      case "auth-reset": state.auth = { ...newAuth(), phone: state.auth.phone, name: state.auth.name }; render(); break;
      case "logout": { const p = loadProfile(); saveProfile({ ...p, verified: false }); state.editProfile = false; render(); toast("سُجّل خروجك"); break; }
      case "clear-ask": state.clearAsk = true; render(); break;
      case "clear-no": state.clearAsk = false; render(); break;
      case "clear-yes":
        saveBookings([]); saveProfile({ name: "", phone: "", email: "", pref: "all", since: new Date().toISOString() });
        state.clearAsk = false; render(); toast("تم حذف بياناتك من هذا الجهاز"); break;
      case "back":
        if (state.view === "salon") { go("home"); break; }
        if (state.view === "chat") { go(state.chat.from && state.chat.from !== "chat" ? state.chat.from : "home"); break; }
        if (state.view === "cart") { go(SALON ? "home" : "salon"); break; }
        if (state.view === "queue") { go(state.qjoin && state.qjoin.from === "salon" ? "salon" : "home"); break; }
        if (state.step > 0) { state.step--; render(); window.scrollTo(0, 0); } else go(state.bookFrom === "salon" ? "salon" : "home");
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
      case "cancel-yes": {
        const bk = loadBookings().find((x) => x.code === v);
        const r = Store.cancelBooking(v, "customer");
        if (r.refunded && bk && bk.deposit) Payments.refundDeposit({ ref: bk.deposit.ref, amount: r.refunded });
        state.cancelAsk = null; render();
        toast(r.forfeited ? `أُلغي الموعد، واحتفظ الصالون بالعربون ${money(r.forfeited)}` : r.refunded ? `أُلغي الموعد، وأُعيد لك العربون ${money(r.refunded)}` : r.late ? "أُلغي الموعد (إلغاء متأخر)" : "تم إلغاء الموعد");
        break;
      }
      case "cal": state.calOpen = state.calOpen === v ? null : v; render(); break;
      case "ics": downloadIcs(v); break;
      case "queue-start": state.qjoin = { salonId: v, service: null, from: state.view }; go("queue"); break;
      case "queue-svc": state.qjoin.service = v; render(); break;
      case "queue-join": {
        const qs = Store.salon(state.qjoin.salonId);
        const name = (state.cust.name || loadProfile().name || "").trim();
        if (name.length < 2) { toast("اكتب اسمك"); document.getElementById("qj-name")?.focus(); break; }
        const r = Store.joinQueue(qs.id, { name, phone: sessionPhone(), remote: true, serviceIds: state.qjoin.service ? [state.qjoin.service] : [] });
        const msg = { full: "الدور ممتلئ حالياً. جرّب بعد قليل.", closed: "الصالون مغلق الآن. الدور متاح في ساعات العمل.", exists: "لديك دور قائم في هذا الصالون.", disabled: "الصالون لا يستقبل بالدور حالياً.", "remote-off": "حجز الدور عن بُعد غير متاح في هذا الصالون." }[r.error];
        if (msg) { toast(msg); break; }
        const p = loadProfile(); if (!p.name) saveProfile({ ...p, name });
        Store.upsertCustomer({ phone: sessionPhone(), name, via: "app", salonId: qs.id });
        toast(`دورك ${r.entry.number}. سنرسل لك رسالة عندما يقترب دورك.`); state.qjoin = null; go("mine"); break;
      }
      case "queue-leave-ask": state.qLeave = v; render(); break;
      case "queue-leave-no": state.qLeave = null; render(); break;
      case "queue-leave": Store.queueAction(v, "leave"); state.qLeave = null; render(); toast("خرجت من الدور"); break;
    }
  });

  /* بيانات العميل في خطوة الدفع */
  $app.addEventListener("input", (e) => {
    if (e.target.dataset && e.target.dataset.chat && state.chat) { state.chat.draft = e.target.value; return; }
    if (e.target.dataset && e.target.dataset.cart) { state.cart[e.target.dataset.cart] = e.target.value; return; }
    if (e.target.dataset && e.target.dataset.rateNote) {
      const code = e.target.dataset.rateNote;
      if (!state.rate || state.rate.code !== code) state.rate = { code, salon: null, staff: null, note: "" };
      state.rate.note = e.target.value; return;
    }
    const ak = e.target.dataset && e.target.dataset.auth;
    if (ak) { state.auth[ak] = e.target.value; if (ak === "name") state.cust.name = e.target.value; return; }
    const k = e.target.dataset && e.target.dataset.cust;
    if (!k) return;
    state.cust[k] = e.target.value;
    const btn = $app.querySelector('[data-act="next"]');
    if (btn) btn.disabled = !canNext();

  });

  $app.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || !e.target.dataset || !e.target.dataset.auth) return;
    e.preventDefault();
    $app.querySelector(state.auth.sent ? '[data-act="auth-verify"]' : '[data-act="auth-send"]')?.click();
  });

  $app.addEventListener("change", (e) => { if (e.target.dataset && e.target.dataset.cart) state.cart[e.target.dataset.cart] = e.target.value; });

  /* حفظ بيانات الحساب */
  $app.addEventListener("submit", (e) => {
    if (e.target.id === "chat-form") { e.preventDefault(); sendChat(document.getElementById("chat-input").value); return; }
    if (e.target.id !== "profile-form") return;
    e.preventDefault();
    const f = e.target;
    const p = loadProfile();
    saveProfile({ ...p, name: f.name.value.trim(), email: f.email.value.trim(), pref: f.pref.value });
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
    if (SALON.assets) {
      set('link[rel="manifest"]', "href", `manifests/${SALON.id}.webmanifest`);
      set('link[rel="apple-touch-icon"]', "href", `icons/salons/${SALON.id}-180.png`);
      set('link[rel="icon"]', "href", `icons/salons/${SALON.id}-192.png`);
      set('link[rel="icon"]', "type", "image/png");
    }
    set('meta[name="apple-mobile-web-app-title"]', "content", SALON.name);
    set('meta[name="description"]', "content", `${SALON.name}: ${SALON.slogan}. احجز موعدك بخطوات بسيطة.`);
  }
  Store.onChange(() => {
    DATA.salons = Store.salons();
    if (SALON) Object.assign(SALON, Store.salon(SALON.id) || {});
    if (state.view === "chat" && state.chat) { const i = document.getElementById("chat-input"); state.chat.focus = !!(i && document.activeElement === i); }
    if (state.view !== "splash" && state.view !== "book" && state.view !== "cart") render();
  });
  /* تحديث العدّاد وترتيب الدور كل 30 ثانية (دون مقاطعة الكتابة) */
  setInterval(() => {
    if (document.hidden) return;
    const a = document.activeElement;
    if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
    if (["done", "mine", "salon"].includes(state.view) || (state.view === "home" && SALON)) render();
  }, 30000);
  state.here = getItem(HERE_KEY, null);
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
