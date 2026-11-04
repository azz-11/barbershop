/* عناياتي — لوحة صاحب الصالون
   يدخل صاحب الصالون ويدير بيانات صالونه فقط: الحجوزات، الخدمات، الفريق، الإعدادات. */
(function () {
  "use strict";
  const yrs = (n) => (n === 1 ? "سنة" : n === 2 ? "سنتان" : n <= 10 ? `<span class="num">${n}</span> سنوات` : `<span class="num">${n}</span> سنة`);
  const { esc, money, fromMin, toMin, fmtTime, hourLabel, isoDate, fmtDate, initials, DAYS, bookingState, I } = UI;
  const SESSION = "enayati.owner";
  const $app = document.getElementById("app");

  const state = {
    salonId: null, tab: "bookings", filter: "today",
    edit: null,         // معرّف الخدمة أو المختص قيد التعديل، أو "new"
    ask: null,          // تأكيد حذف أو إلغاء
    loginError: "",
    nb: null            // الحجز الهاتفي الجاري
  };
  try { state.salonId = sessionStorage.getItem(SESSION); } catch (e) { /* لا شيء */ }
  const qs = new URLSearchParams(location.search).get("s");

  const salon = () => Store.salon(state.salonId);
  const uid = (prefix) => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const salonLink = (s) => new URL(`./?s=${s.id}`, location.href).href;

  /* ---------- الدخول ---------- */
  function viewLogin() {
    const list = Store.salons();
    const pre = qs || state.salonId || list[0]?.id;
    return `<section class="screen login">
      <header class="topbar"><div class="logo"><span class="logo-mark">${esc("ع")}</span>عناياتي للأعمال</div>${UI.themeBtn()}</header>
      <div class="hello"><h1>لوحة الصالون</h1><p>أدِر حجوزاتك وخدماتك وفريقك من مكان واحد.</p></div>
      <form class="card form" id="login-form" novalidate>
        <label for="lg-salon">الصالون</label>
        <select id="lg-salon" name="salon">${list.map((s) => `<option value="${esc(s.id)}" ${s.id === pre ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select>
        <label for="lg-pass">كلمة المرور</label>
        <input id="lg-pass" name="pass" type="password" autocomplete="current-password" placeholder="••••">
        ${state.loginError ? `<p class="field-error">${esc(state.loginError)}</p>` : ""}
        <button type="submit" class="btn" style="margin-top:12px">دخول</button>
      </form>
      <p class="demo-note">نسخة تجريبية: كلمة مرور كل صالون <b class="num">1234</b>، ويمكن تغييرها من الإعدادات.</p>
      <a class="powered" href="./">العودة إلى تطبيق العملاء</a>
    </section>`;
  }

  /* ---------- الرأس والتبويبات ---------- */
  function header(s) {
    return `<header class="topbar">
      <div class="logo"><span class="logo-mark salon-mark">${esc(initials(s.name))}</span><span class="logo-text">${esc(s.name)}</span></div>
      <div class="top-actions">${UI.themeBtn()}<button type="button" class="icon-btn" data-act="logout" aria-label="خروج">${I.out}</button></div>
    </header>`;
  }
  function tabs() {
    const t = (id, icon, label) => `<button type="button" class="tab" data-act="tab" data-v="${id}" ${state.tab === id ? 'aria-current="page"' : ""}>${icon}${label}</button>`;
    return `<nav class="tabbar" aria-label="أقسام اللوحة"><div class="tabbar-inner tabs-4">
      ${t("bookings", I.cal, "الحجوزات")}${t("services", I.list, "الخدمات")}${t("team", I.team, "الفريق")}${t("settings", I.gear, "الإعدادات")}
    </div></nav>`;
  }

  /* ---------- الاشتراك ---------- */
  function subBanner(s) {
    const st = Store.subState(s);
    const msg = {
      trial: `أنت في الفترة التجريبية المجانية، وتنتهي خلال ${Store.daysText(st.days)}. اشترك ليستمر الحجز بدون انقطاع.`,
      expiring: `اشتراكك ينتهي خلال ${Store.daysText(st.days)}. جدّده الآن ليستمر الحجز.`,
      grace: "انتهى اشتراكك، والحجز ما زال يعمل خلال فترة السماح. جدّد قبل أن يتوقف.",
      expired: "انتهى اشتراكك، فتوقف الحجز واختفى صالونك من منصة عناياتي. جدّد لإعادة التفعيل.",
      suspended: "حساب صالونك موقوف من إدارة عناياتي. تواصل معنا."
    }[st.code];
    if (!msg) return "";
    const tone = st.code === "expired" || st.code === "suspended" ? "bad" : st.code === "trial" ? "info" : "warn";
    return `<div class="sub-banner ${tone}"><p>${msg}</p>${st.code !== "suspended" ? `<button type="button" class="btn" data-act="go-sub">${st.pending ? "عرض طلب التجديد" : "إدارة الاشتراك"}</button>` : ""}</div>`;
  }

  function subCard(s) {
    const st = Store.subState(s);
    const b = Store.billing();
    const sub = s.subscription;
    const req = sub.requests[0];
    const chosen = state.plan || (sub.plan === "yearly" ? "yearly" : "monthly");
    const plan = (id, title, note) => `
      <button type="button" role="radio" class="option with-check" data-act="plan" data-v="${id}" aria-checked="${chosen === id}">
        <span class="check" style="border-radius:50%">${I.check}</span>
        <span class="title">${title}</span>
        <span class="price num">${money(b[id])}</span>
        <span class="sub">${note}</span>
      </button>`;
    const history = sub.payments.slice().reverse().map((p) => `
      <div class="row"><span>${fmtDate(p.at.slice(0, 10), { day: "numeric", month: "short", year: "numeric" })} · ${esc(Store.PLAN_NAMES[p.plan])}</span><span class="num">${money(p.amount)}</span></div>`).join("");
    return `<section class="block" id="subscription">
      <h2 class="section-title">اشتراكي</h2>
      <div class="card sub-card">
        <div class="sub-head">
          <div><b>${esc(st.planName)}</b><span class="hint">${st.days >= 0 ? `ينتهي ${fmtDate(st.endsAt.slice(0, 10), { day: "numeric", month: "long", year: "numeric" })}` : `انتهى ${fmtDate(st.endsAt.slice(0, 10), { day: "numeric", month: "long" })}`}</span></div>
          <span class="status sub-${st.code}">${esc(st.label)}</span>
        </div>
        <ul class="perks">
          <li>تطبيق خاص باسم صالونك وهويته، ورابط حجز وبطاقة QR</li>
          <li>لوحة إدارة الحجوزات والخدمات والفريق</li>
          <li>الظهور في منصة عناياتي لعملاء جدد</li>
        </ul>
      </div>
      ${req ? `<div class="card sub-card pending">
          <b>طلب التجديد قيد المراجعة</b>
          <p class="hint">${esc(Store.PLAN_NAMES[req.plan])} · <span class="num">${money(req.amount)}</span> · أُرسل ${fmtDate(req.at.slice(0, 10), { day: "numeric", month: "long" })}</p>
          <p class="hint">يُفعَّل اشتراكك بعد أن تتأكد إدارة عناياتي من التحويل.</p>
        </div>` : `<form class="card form" id="renew-form" novalidate>
          <b>${st.plan === "trial" ? "اشترك الآن" : "جدّد اشتراكك"}</b>
          <div class="options" role="radiogroup" aria-label="الباقة">
            ${plan("monthly", "الباقة الشهرية", "تُجدَّد كل شهر")}
            ${plan("yearly", "الباقة السنوية", `توفّر ${money(b.monthly * 12 - b.yearly)} في السنة`)}
          </div>
          <label>حوّل المبلغ إلى الحساب التالي</label>
          <pre class="bank num" dir="auto">${esc(b.bank)}</pre>
          <label for="rn-note">اسم المحوِّل أو رقم العملية</label>
          <input id="rn-note" name="note" placeholder="يساعدنا على مطابقة التحويل">
          <button type="submit" class="btn" style="margin-top:12px">أرسلت التحويل، فعّلوا اشتراكي</button>
          <p class="demo-note">الدفع الإلكتروني المباشر يُضاف لاحقاً عبر بوابة دفع.</p>
        </form>`}
      ${history ? `<div class="card"><div class="row"><span><b>سجل المدفوعات</b></span><span></span></div>${history}</div>` : ""}
    </section>`;
  }

  /* ---------- الحجز الهاتفي وتسجيل العميل ----------
     ١) الحلاق يكتب رقم العميل واسمه  ٢) تصل للعميل رسالة برمز  ٣) العميل يقرأ الرمز للحلاق
     ٤) يُنشأ حساب العميل برقم مؤكَّد  ٥) يكمل الحلاق الحجز، وتصل للعميل رسالة بالموعد */
  const normPhone = (v) => String(v || "").replace(/[\s-]/g, "").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
  const validPhone = (v) => /^05\d{8}$/.test(normPhone(v));
  const newNb = () => ({ step: "phone", phone: "", name: "", existing: null, sms: null, error: "", services: [], staffId: "any", date: null, time: null, booking: null });

  function smsBox(text) {
    return `<div class="sms-sim" role="note">
      <div class="sms-head"><span>رسالة نصية · عناياتي</span><span class="sms-tag">محاكاة: تصل لجوال العميل</span></div>
      <p>${esc(text)}</p>
    </div>`;
  }

  function nbDays(s) {
    const out = []; const base = new Date(); base.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14; i++) { const d = new Date(base); d.setDate(base.getDate() + i); if (!(s.closedDays || []).includes(d.getDay())) out.push(isoDate(d)); }
    return out;
  }

  function viewNewBooking(s) {
    const nb = state.nb;
    const steps = ["رقم العميل", "رمز التحقق", "تفاصيل الحجز"];
    const at = { phone: 0, otp: 1, details: 2, done: 3 }[nb.step];
    const bar = `<ol class="steps three" aria-label="خطوات الحجز الهاتفي">${steps.map((l, i) =>
      `<li class="${i < at ? "done" : i === at ? "current" : ""}">${l}</li>`).join("")}</ol>`;
    const err = nb.error ? `<p class="field-error">${esc(nb.error)}</p>` : "";
    let body = "";

    if (nb.step === "phone") {
      body = `<form class="card form" id="nb-phone-form" novalidate>
        <b>من المتصل؟</b>
        <p class="hint">اكتب رقم جوال العميل. إن كان مسجّلاً يظهر اسمه مباشرة، وإن كان جديداً نرسل له رمز تحقق لإنشاء حسابه.</p>
        <label for="nb-phone">رقم الجوال</label>
        <input id="nb-phone" name="phone" type="tel" inputmode="tel" dir="ltr" autocomplete="off" value="${esc(nb.phone)}" placeholder="05XXXXXXXX">
        <label for="nb-name">اسم العميل (للعميل الجديد)</label>
        <input id="nb-name" name="name" autocomplete="off" value="${esc(nb.name)}" placeholder="مثال: فهد العتيبي">
        ${err}
        <button type="submit" class="btn" style="margin-top:12px">متابعة</button>
      </form>`;
    } else if (nb.step === "otp") {
      body = `${smsBox(nb.sms)}
      <form class="card form" id="nb-otp-form" novalidate>
        <b>اطلب من العميل قراءة الرمز</b>
        <p class="hint">أُرسل رمز من 4 أرقام إلى <span class="num" dir="ltr">${esc(nb.phone)}</span>. صالح 5 دقائق.</p>
        <label for="nb-code">رمز التحقق</label>
        <input id="nb-code" name="code" class="otp-input num" inputmode="numeric" autocomplete="one-time-code" maxlength="4" dir="ltr" placeholder="••••">
        ${err}
        <button type="submit" class="btn" style="margin-top:12px">تأكيد وإنشاء الحساب</button>
        <div class="row-actions"><button type="button" class="link" data-act="nb-resend">إعادة إرسال الرمز</button><button type="button" class="link" data-act="nb-back">تغيير الرقم</button></div>
      </form>`;
    } else if (nb.step === "details") {
      const days = nbDays(s);
      if (!nb.date || !days.includes(nb.date)) nb.date = days[0] || null;
      const chosen = s.services.filter((x) => nb.services.includes(x.id));
      const dur = Math.max(30, chosen.reduce((a, x) => a + x.min, 0));
      const total = chosen.reduce((a, x) => a + x.price, 0);
      const slots = nb.date && chosen.length ? Store.freeSlots(s, nb.date, dur, nb.staffId) : [];
      if (nb.time && !slots.some((x) => x.time === nb.time)) nb.time = null;
      const c = nb.existing;
      body = `<div class="cust-chip"><span class="avatar" aria-hidden="true">${esc((c?.name || nb.name || "؟").charAt(0))}</span>
          <div><b>${esc(c?.name || nb.name)}</b><span class="num" dir="ltr">${esc(nb.phone)}</span></div>
          <span class="status sub-active">${c && nb.wasExisting ? "عميل مسجّل" : "حساب جديد مؤكَّد"} ✓</span></div>
        <form class="card form" id="nb-book-form" novalidate>
          <b>الخدمات</b>
          ${[...new Set(s.services.map((x) => x.group || ""))].map((g) => `${g ? `<span class="group-title">${esc(g)}</span>` : ""}
            <div class="svc-checks">${s.services.filter((x) => (x.group || "") === g).map((x) => `<label class="day-check"><input type="checkbox" name="svc" value="${esc(x.id)}" ${nb.services.includes(x.id) ? "checked" : ""}><span>${esc(x.name)} · <span class="num">${x.price}</span></span></label>`).join("")}</div>`).join("")}
          <div class="two">
            <div><label for="nb-staff">${s.type === "men" ? "الحلاق" : "المختصة"}</label>
              <select id="nb-staff" name="staff"><option value="any">أي متاح</option>${s.staff.map((m) => `<option value="${esc(m.id)}" ${nb.staffId === m.id ? "selected" : ""}>${esc(m.name)}</option>`).join("")}</select></div>
            <div><label for="nb-date">اليوم</label>
              <select id="nb-date" name="date">${days.map((d) => `<option value="${d}" ${nb.date === d ? "selected" : ""}>${fmtDate(d, { weekday: "short", day: "numeric", month: "short" })}</option>`).join("")}</select></div>
          </div>
          <label for="nb-time">الوقت</label>
          ${!chosen.length ? `<p class="hint">اختر خدمة أولاً لتظهر الأوقات المتاحة.</p>`
            : slots.length ? `<select id="nb-time" name="time"><option value="">اختر وقتاً</option>${slots.map((x) => `<option value="${x.time}" ${nb.time === x.time ? "selected" : ""}>${fmtTime(x.time)} · ${esc(x.staff.name)}</option>`).join("")}</select>`
            : `<p class="hint">لا توجد أوقات متاحة في هذا اليوم. جرّب يوماً آخر أو "أي متاح".</p>`}
          <div class="row total"><span>الإجمالي · <span class="num">${dur}</span> دقيقة</span><span class="num">${money(total)}</span></div>
          ${err}
          <button type="submit" class="btn" ${chosen.length && nb.time ? "" : "disabled"}>تأكيد الحجز</button>
        </form>`;
    } else {
      const b = nb.booking;
      body = `<div class="card sub-card done-card">
          <b>تم الحجز ✓</b>
          <div class="row"><span>العميل</span><span>${esc(b.customer.name)}</span></div>
          <div class="row"><span>الموعد</span><span>${fmtDate(b.date)} · <span class="num">${fmtTime(b.time)}</span></span></div>
          <div class="row"><span>الخدمات</span><span>${b.serviceNames.map(esc).join("، ")}</span></div>
          <div class="row"><span>${s.type === "men" ? "الحلاق" : "المختصة"}</span><span>${esc(b.staffName)}</span></div>
          <div class="row total"><span>الإجمالي</span><span class="num">${money(b.total)}</span></div>
        </div>
        ${smsBox(nb.sms)}
        <div class="booking-actions"><button type="button" class="btn" data-act="nb-start">حجز لعميل آخر</button><button type="button" class="btn ghost" data-act="nb-close">العودة للحجوزات</button></div>`;
    }
    return `<section class="screen">
        ${header(s)}
        <div class="block-head"><h1 class="page-title">حجز هاتفي</h1>${nb.step !== "done" ? `<button type="button" class="link" data-act="nb-close">إلغاء</button>` : ""}</div>
        ${nb.step !== "done" ? bar : ""}
        ${body}
      </section>${tabs()}`;
  }

  function nbSendCode(s) {
    const nb = state.nb;
    const r = Store.sendOtp(nb.phone, "salon:" + s.id);
    if (!r.ok) { nb.error = `انتظر ${r.wait} ثانية قبل إعادة الإرسال.`; return false; }
    nb.sms = `عناياتي: رمز تسجيلك في ${s.name} هو ${r.code}. أعطِ هذا الرمز للحلاق ليكمل حجزك. الرمز صالح 5 دقائق، ولا يصلح للدخول إلى حسابك.`;
    nb.error = ""; return true;
  }

  /* ملخص رضا العملاء عن الصالون */
  function satCard(s) {
    const st = Store.salonStats(s); const r = st.ratings;
    const bar = (k, label) => { const w = st.rated ? Math.round((r[k] / st.rated) * 100) : 0;
      return `<div class="sat-bar"><span>${label}</span><div class="bar"><span class="b-${k}" style="width:${w}%"></span></div><span class="num">${r[k]}</span></div>`; };
    return `<div class="card sub-card">
      <div class="sub-head"><div><b>رضا العملاء</b><span class="hint"><span class="num">${st.visits.toLocaleString("en-US")}</span> زيارة · <span class="num">${st.rated}</span> تقييم</span></div>
        <span class="sat-big num">${st.pct != null ? st.pct + "٪" : "—"}</span></div>
      ${bar("very", "راضٍ جداً")}${bar("ok", "راضٍ")}${bar("no", "غير راضٍ")}
      <p class="hint">يقيّم العميل الصالون والمختص بعد كل زيارة تسجّلها "مكتملة".</p>
    </div>`;
  }

  /* ---------- الحجوزات ---------- */
  function viewBookings(s) {
    const today = isoDate(new Date());
    const all = Store.bookings(s.id).slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const active = (b) => b.status !== "cancelled";
    const todays = all.filter((b) => b.date === today && active(b));
    const upcoming = all.filter((b) => b.date > today && active(b));
    const past = all.filter((b) => b.date < today).reverse();
    const list = { today: todays, upcoming, past }[state.filter];
    const expected = todays.filter((b) => b.status !== "noshow").reduce((a, b) => a + b.total, 0);
    const needs = all.filter((b) => bookingState(b)[0] === "past").length;

    const chip = (id, label, n) => `<button type="button" data-act="filter" data-v="${id}" aria-pressed="${state.filter === id}">${label} <span class="num">(${n})</span></button>`;
    const items = list.map((b) => {
      const [cls, txt] = bookingState(b);
      const asking = state.ask === "cancel:" + b.code;
      const actions = cls === "cancelled" || cls === "completed" || cls === "noshow" ? "" : asking
        ? `<div class="confirm-box"><p>إلغاء حجز ${esc(b.customer?.name || "العميل")}؟</p><div class="booking-actions">
             <button type="button" class="btn danger" data-act="b-cancel" data-v="${b.code}">نعم، ألغِ</button>
             <button type="button" class="btn ghost" data-act="ask" data-v="">تراجع</button></div></div>`
        : `<div class="booking-actions">
             <button type="button" class="btn" data-act="b-done" data-v="${b.code}">تم</button>
             <button type="button" class="btn ghost" data-act="b-noshow" data-v="${b.code}">لم يحضر</button>
             <button type="button" class="btn ghost" data-act="ask" data-v="cancel:${b.code}">إلغاء</button></div>`;
      return `<article class="booking">
        <div class="booking-head">
          <div class="when-big"><b class="num">${fmtTime(b.time)}</b><span>${state.filter === "today" ? "اليوم" : fmtDate(b.date, { weekday: "short", day: "numeric", month: "short" })}</span></div>
          <span class="status ${cls}">${txt}</span>
        </div>
        <div class="cust">
          <b>${esc(b.customer?.name || "عميل")}</b>
          ${b.customer?.phone ? `<span class="num" dir="ltr">${esc(b.customer.phone)}</span>` : ""}
        </div>
        <p class="hint">${b.source === "phone" ? '<span class="src-tag">حجز هاتفي</span> ' : ""}${b.serviceNames.map(esc).join("، ")} · ${esc(b.staffName)} · <span class="num">${money(b.total)}</span> · ${b.payment === "cash" ? "دفع في الصالون" : "مدفوع"}</p>
        ${b.feedback ? `<div class="fb fb-${b.feedback.salon}"><span>تقييم العميل: الصالون <b>${Store.VERDICTS[b.feedback.salon]}</b> · ${esc(b.staffName)} <b>${Store.VERDICTS[b.feedback.staff]}</b></span>${b.feedback.note ? `<span>"${esc(b.feedback.note)}"</span>` : ""}</div>` : ""}
        ${actions}
      </article>`;
    }).join("");

    return `<section class="screen">
        ${header(s)}
        ${subBanner(s)}
        ${Store.isLive(s) ? `<button type="button" class="btn wide add-btn" data-act="nb-start">${I.plus} حجز هاتفي لعميل</button>` : ""}
        <div class="stats three">
          <div class="stat"><b class="num">${todays.length}</b><span>حجوزات اليوم</span></div>
          <div class="stat"><b class="num">${upcoming.length}</b><span>القادمة</span></div>
          <div class="stat"><b class="num">${expected.toLocaleString("en-US")}</b><span>دخل اليوم المتوقع</span></div>
        </div>
        ${needs ? `<p class="notice">لديك <b class="num">${needs}</b> ${needs === 1 ? "حجز سابق" : "حجوزات سابقة"} بانتظار تأكيد الحضور (تبويب "السابقة").</p>` : ""}
        <div class="segments" role="group" aria-label="عرض الحجوزات">${chip("today", "اليوم", todays.length)}${chip("upcoming", "القادمة", upcoming.length)}${chip("past", "السابقة", past.length)}</div>
        ${list.length ? `<div class="bookings">${items}</div>` : `<div class="empty">${I.cal}<p>${{ today: "لا توجد حجوزات اليوم.", upcoming: "لا توجد حجوزات قادمة.", past: "لا توجد حجوزات سابقة." }[state.filter]}</p></div>`}
        <div class="card share">
          <b>رابط حجز صالونك</b>
          <p class="hint">شاركه مع عملائك في إنستقرام وواتساب، أو اطبعه كرمز QR.</p>
          <div class="copy-row"><input id="share-link" type="text" readonly dir="ltr" value="${esc(salonLink(s))}"><button type="button" class="btn" data-act="copy">نسخ</button></div>
          <a class="btn ghost wide map-link" href="${esc(salonLink(s))}" target="_blank" rel="noopener">افتح صفحة الصالون</a>
        </div>
      </section>${tabs()}`;
  }

  /* ---------- الخدمات ---------- */
  function serviceForm(sv) {
    const groups = [...new Set(salon().services.map((x) => x.group).filter(Boolean))];
    return `<form class="card form" id="service-form" data-id="${sv ? esc(sv.id) : "new"}" novalidate>
      <b>${sv ? "تعديل الخدمة" : "خدمة جديدة"}</b>
      <label for="sv-name">اسم الخدمة</label>
      <input id="sv-name" name="name" required value="${esc(sv?.name || "")}" placeholder="مثال: حلاقة شعر">
      <div class="two">
        <div><label for="sv-price">السعر (ر.س)</label><input id="sv-price" name="price" type="number" inputmode="numeric" min="0" step="1" required value="${sv ? sv.price : ""}"></div>
        <div><label for="sv-min">المدة (دقيقة)</label><input id="sv-min" name="min" type="number" inputmode="numeric" min="5" step="5" required value="${sv ? sv.min : 30}"></div>
      </div>
      <label for="sv-group">القسم في قائمة الأسعار (اختياري)</label>
      <input id="sv-group" name="group" list="sv-groups" value="${esc(sv?.group || "")}" placeholder="مثال: الحلاقة">
      <datalist id="sv-groups">${groups.map((g) => `<option value="${esc(g)}">`).join("")}</datalist>
      <label for="sv-desc">وصف قصير (اختياري)</label>
      <input id="sv-desc" name="desc" value="${esc(sv?.desc || "")}">
      <p class="field-error" id="sv-err" hidden>اكتب اسم الخدمة وسعرها ومدتها.</p>
      <div class="booking-actions"><button type="submit" class="btn">حفظ</button><button type="button" class="btn ghost" data-act="edit" data-v="">إلغاء</button></div>
    </form>`;
  }

  function viewServices(s) {
    const rows = s.services.map((sv) => state.edit === sv.id ? serviceForm(sv) : state.ask === "svc:" + sv.id
      ? `<div class="confirm-box"><p>حذف "${esc(sv.name)}"؟ لن تظهر للعملاء بعد الآن.</p><div class="booking-actions">
           <button type="button" class="btn danger" data-act="svc-del" data-v="${esc(sv.id)}">نعم، احذف</button><button type="button" class="btn ghost" data-act="ask" data-v="">تراجع</button></div></div>`
      : `<div class="admin-row">
          <div class="admin-row-main"><b>${esc(sv.name)}</b><span class="hint">${sv.group ? esc(sv.group) + " · " : ""}<span class="num">${sv.min}</span> دقيقة</span></div>
          <b class="num">${money(sv.price)}</b>
          <div class="row-actions"><button type="button" class="link" data-act="edit" data-v="${esc(sv.id)}">تعديل</button><button type="button" class="link danger-text" data-act="ask" data-v="svc:${esc(sv.id)}">حذف</button></div>
        </div>`).join("");
    return `<section class="screen">
        ${header(s)}
        <div class="block-head"><h1 class="page-title">الخدمات والأسعار</h1><span class="hint num">${s.services.length} خدمة</span></div>
        ${state.edit === "new" ? serviceForm(null) : `<button type="button" class="btn wide add-btn" data-act="edit" data-v="new">${I.plus} إضافة خدمة</button>`}
        <div class="admin-list">${rows || `<div class="empty"><p>لا توجد خدمات بعد. أضف أول خدمة ليتمكن العملاء من الحجز.</p></div>`}</div>
      </section>${tabs()}`;
  }

  /* ---------- الفريق ---------- */
  function staffForm(m) {
    return `<form class="card form" id="staff-form" data-id="${m ? esc(m.id) : "new"}" novalidate>
      <b>${m ? "تعديل البيانات" : "إضافة للفريق"}</b>
      <label for="st-name">الاسم</label>
      <input id="st-name" name="name" required value="${esc(m?.name || "")}">
      <div class="two">
        <div><label for="st-role">المسمى</label><input id="st-role" name="role" value="${esc(m?.role || (salon().type === "men" ? "حلاق" : "مختصة"))}"></div>
        <div><label for="st-years">سنوات الخبرة (اختياري)</label><input id="st-years" name="years" type="number" inputmode="numeric" min="0" value="${m?.years || ""}"></div>
      </div>
      <p class="field-error" id="st-err" hidden>اكتب الاسم.</p>
      <div class="booking-actions"><button type="submit" class="btn">حفظ</button><button type="button" class="btn ghost" data-act="edit" data-v="">إلغاء</button></div>
    </form>`;
  }

  function viewTeam(s) {
    const today = isoDate(new Date());
    const rows = s.staff.map((m) => {
      const n = Store.bookings(s.id).filter((b) => b.staffId === m.id && b.date === today && b.status !== "cancelled").length;
      return state.edit === m.id ? staffForm(m) : state.ask === "st:" + m.id
        ? `<div class="confirm-box"><p>إزالة ${esc(m.name)} من الفريق؟ حجوزاته السابقة تبقى في السجل.</p><div class="booking-actions">
             <button type="button" class="btn danger" data-act="st-del" data-v="${esc(m.id)}">نعم، أزل</button><button type="button" class="btn ghost" data-act="ask" data-v="">تراجع</button></div></div>`
        : `<div class="admin-row">
            <span class="avatar" aria-hidden="true">${esc(m.name.charAt(0))}</span>
            <div class="admin-row-main"><b>${esc(m.name)}</b><span class="hint">${esc(m.role || "")}${m.years ? ` · ${yrs(m.years)}` : ""} · حجوزات اليوم: <span class="num">${n}</span></span>
              <span class="hint">${(() => { const st = Store.staffStats(s, m.id); return `<b class="num">${st.cuts.toLocaleString("en-US")}</b> ${s.type === "men" ? "حلاقة" : "خدمة"} مكتملة${st.pct != null ? ` · رضا <b class="num">${st.pct}٪</b> من <span class="num">${st.rated}</span> تقييم` : " · لا تقييمات بعد"}`; })()}</span></div>
            <div class="row-actions"><button type="button" class="link" data-act="edit" data-v="${esc(m.id)}">تعديل</button><button type="button" class="link danger-text" data-act="ask" data-v="st:${esc(m.id)}">إزالة</button></div>
          </div>`;
    }).join("");
    return `<section class="screen">
        ${header(s)}
        ${satCard(s)}
        <div class="block-head"><h1 class="page-title">${s.type === "men" ? "فريق الحلاقين" : "فريق المختصات"}</h1><span class="hint num">${s.staff.length}</span></div>
        ${state.edit === "new" ? staffForm(null) : `<button type="button" class="btn wide add-btn" data-act="edit" data-v="new">${I.plus} إضافة ${s.type === "men" ? "حلاق" : "مختصة"}</button>`}
        <div class="admin-list">${rows || `<div class="empty"><p>أضف فريقك ليختار العملاء من يخدمهم.</p></div>`}</div>
      </section>${tabs()}`;
  }

  /* ---------- الإعدادات ---------- */
  function viewSettings(s) {
    const hours = (sel, name, from, to) => `<select id="${name}" name="${name}">${Array.from({ length: to - from + 1 }, (_, i) => from + i)
      .map((h) => `<option value="${h}" ${h === sel ? "selected" : ""}>${h === 24 ? "12:00 ص" : hourLabel(h)}</option>`).join("")}</select>`;
    return `<section class="screen">
        ${header(s)}
        ${subCard(s)}
        <h1 class="page-title">إعدادات الصالون</h1>
        <form class="card form" id="settings-form" novalidate>
          <b>الهوية</b>
          <label for="se-name">اسم الصالون</label><input id="se-name" name="name" required value="${esc(s.name)}">
          <label for="se-slogan">العبارة (تظهر في الواجهة الترحيبية)</label><input id="se-slogan" name="slogan" value="${esc(s.slogan || "")}">
          <label for="se-tagline">وصف مختصر (يظهر في قائمة المنصة)</label><input id="se-tagline" name="tagline" value="${esc(s.tagline || "")}">
          <div class="two">
            <div><label for="se-primary">اللون الأساسي</label><input id="se-primary" name="primary" type="color" value="${esc(s.brand.primary)}"></div>
            <div><label for="se-accent">اللون الثانوي</label><input id="se-accent" name="accent" type="color" value="${esc(s.brand.accent)}"></div>
          </div>
          <div class="brand-preview" id="brand-preview" style="--p:${esc(s.brand.primary)};--a:${esc(s.brand.accent)}"><span>${esc(initials(s.name))}</span>معاينة الهوية</div>

          <b class="form-sep">الموقع والنبذة</b>
          <label for="se-type">نوع الصالون</label>
          <select id="se-type" name="type"><option value="men" ${s.type === "men" ? "selected" : ""}>رجالي</option><option value="women" ${s.type === "women" ? "selected" : ""}>نسائي</option></select>
          <label for="se-area">الحي</label><input id="se-area" name="area" value="${esc(s.area || "")}">
          <label for="se-address">العنوان الكامل</label><input id="se-address" name="address" value="${esc(s.address || "")}">
          <label>الموقع على الخريطة (لحساب المسافة للعملاء)</label>
          <div class="two">
            <div><input id="se-lat" name="lat" inputmode="decimal" dir="ltr" placeholder="خط العرض 24.71" value="${s.location ? s.location.lat : ""}" aria-label="خط العرض"></div>
            <div><input id="se-lng" name="lng" inputmode="decimal" dir="ltr" placeholder="خط الطول 46.67" value="${s.location ? s.location.lng : ""}" aria-label="خط الطول"></div>
          </div>
          <button type="button" class="btn ghost" data-act="here" style="margin-top:6px">استخدم موقعي الحالي (وأنا في الصالون)</button>
          ${s.location ? `<a class="hint" href="https://www.google.com/maps/search/?api=1&query=${s.location.lat},${s.location.lng}" target="_blank" rel="noopener">تحقق من الموقع على الخرائط</a>` : ""}
          <label for="se-about">نبذة عن الصالون</label><textarea id="se-about" name="about" rows="3">${esc(s.about || "")}</textarea>

          <b class="form-sep">ساعات العمل</b>
          <div class="two">
            <div><label for="se-open">يفتح</label>${hours(s.hours.open, "se-open", 0, 23)}</div>
            <div><label for="se-close">يغلق</label>${hours(s.hours.close, "se-close", 1, 24)}</div>
          </div>
          <fieldset class="days-pick"><legend>أيام الإغلاق</legend>
            ${DAYS.map((d, i) => `<label class="day-check"><input type="checkbox" name="closed" value="${i}" ${(s.closedDays || []).includes(i) ? "checked" : ""}><span>${d}</span></label>`).join("")}
          </fieldset>

          <b class="form-sep">الدخول</b>
          <label for="se-pass">كلمة مرور جديدة (اتركها فارغة لعدم التغيير)</label>
          <input id="se-pass" name="pass" type="password" autocomplete="new-password" minlength="4">
          <p class="field-error" id="se-err" hidden></p>
          <button type="submit" class="btn" style="margin-top:12px">حفظ الإعدادات</button>
        </form>
      </section>${tabs()}`;
  }

  /* ---------- العرض ---------- */
  function render() {
    const s = state.salonId && salon();
    if (!s) { state.salonId = null; UI.applyBrand(null, null); $app.innerHTML = viewLogin(); return; }
    UI.applyBrand(s.brand.primary, s.brand.accent);
    document.title = `لوحة ${s.name}`;
    $app.innerHTML = state.tab === "bookings" && state.nb ? viewNewBooking(s)
      : { bookings: viewBookings, services: viewServices, team: viewTeam, settings: viewSettings }[state.tab](s);
  }
  function update(fn, msg) { const s = JSON.parse(JSON.stringify(salon())); fn(s); Store.saveSalon(s); state.edit = null; state.ask = null; render(); if (msg) UI.toast(msg); }

  $app.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el) return;
    const v = el.dataset.v;
    switch (el.dataset.act) {
      case "toggle-theme": UI.toggleTheme(); render(); break;
      case "logout": try { sessionStorage.removeItem(SESSION); } catch (er) { /* لا شيء */ } state.salonId = null; render(); break;
      case "tab": state.tab = v; state.edit = null; state.ask = null; render(); window.scrollTo(0, 0); break;
      case "filter": state.filter = v; state.ask = null; render(); break;
      case "ask": state.ask = v || null; render(); break;
      case "edit": state.edit = v || null; state.ask = null; render(); { const f = $app.querySelector("form input"); if (f && v) f.focus(); } break;
      case "go-sub": state.tab = "settings"; state.edit = null; render(); document.getElementById("subscription")?.scrollIntoView({ block: "start" }); break;
      case "plan": state.plan = v; render(); document.getElementById("renew-form")?.scrollIntoView({ block: "nearest" }); break;
      case "nb-start": state.nb = newNb(); render(); window.scrollTo(0, 0); document.getElementById("nb-phone")?.focus(); break;
      case "nb-close": state.nb = null; render(); break;
      case "nb-back": state.nb.step = "phone"; state.nb.error = ""; render(); break;
      case "nb-resend": nbSendCode(salon()); render(); break;
      case "here":
        if (!("geolocation" in navigator)) { UI.toast("الجهاز لا يدعم تحديد الموقع"); break; }
        navigator.geolocation.getCurrentPosition((pos) => {
          document.getElementById("se-lat").value = pos.coords.latitude.toFixed(5);
          document.getElementById("se-lng").value = pos.coords.longitude.toFixed(5);
          UI.toast("حُدد الموقع. اضغط \"حفظ الإعدادات\" لاعتماده");
        }, () => UI.toast("لم نتمكن من تحديد الموقع. اسمح للمتصفح بالوصول إليه."), { timeout: 10000 });
        break;
      case "copy": UI.copy(document.getElementById("share-link").value, document.getElementById("share-link")); break;
      case "b-done": Store.updateBooking(v, { status: "completed" }); state.ask = null; render(); UI.toast("سُجّل الحضور"); break;
      case "b-noshow": Store.updateBooking(v, { status: "noshow" }); state.ask = null; render(); UI.toast("سُجّل عدم الحضور"); break;
      case "b-cancel": Store.updateBooking(v, { status: "cancelled", cancelledBy: "salon" }); state.ask = null; render(); UI.toast("تم إلغاء الحجز"); break;
      case "svc-del": update((s) => { s.services = s.services.filter((x) => x.id !== v); }, "تم حذف الخدمة"); break;
      case "st-del": update((s) => { s.staff = s.staff.filter((x) => x.id !== v); }, "تمت الإزالة من الفريق"); break;
    }
  });

  /* تغيّر خيارات الحجز الهاتفي */
  $app.addEventListener("change", (e) => {
    const f = e.target.form;
    if (!f || f.id !== "nb-book-form" || !state.nb) return;
    const nb = state.nb;
    nb.services = [...f.querySelectorAll('input[name="svc"]:checked')].map((x) => x.value);
    nb.staffId = f.staff.value; nb.date = f.date.value; nb.time = f.time ? f.time.value : null;
    nb.error = ""; render();
  });

  $app.addEventListener("input", (e) => {
    if (e.target.name === "primary" || e.target.name === "accent") {
      const p = document.getElementById("brand-preview");
      p.style.setProperty(e.target.name === "primary" ? "--p" : "--a", e.target.value);
    }
  });

  $app.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    if (f.id === "login-form") {
      const s = Store.salon(f.salon.value);
      if (!s || f.pass.value !== s.password) { state.loginError = "كلمة المرور غير صحيحة. جرّب مرة أخرى."; render(); document.getElementById("lg-pass")?.focus(); return; }
      state.loginError = ""; state.salonId = s.id; state.tab = "bookings";
      try { sessionStorage.setItem(SESSION, s.id); } catch (er) { /* لا شيء */ }
      render(); return;
    }
    if (f.id === "nb-phone-form") {
      const nb = state.nb; const s = salon();
      nb.phone = normPhone(f.phone.value); nb.name = f.name.value.trim();
      if (!validPhone(nb.phone)) { nb.error = "اكتب رقم جوال سعودي من 10 أرقام يبدأ بـ 05."; render(); return; }
      const c = Store.customer(nb.phone);
      if (c) { nb.existing = c; nb.wasExisting = true; nb.name = c.name || nb.name; nb.step = "details"; nb.error = ""; render(); UI.toast(`عميل مسجّل: ${c.name || nb.phone}`); return; }
      if (nb.name.length < 2) { nb.error = "عميل جديد: اكتب اسمه لإنشاء حسابه."; render(); return; }
      if (nbSendCode(s)) nb.step = "otp";
      render(); document.getElementById("nb-code")?.focus(); return;
    }
    if (f.id === "nb-otp-form") {
      const nb = state.nb; const s = salon();
      const res = Store.verifyOtp(nb.phone, "salon:" + s.id, f.code.value);
      const msg = { wrong: "الرمز غير صحيح. تأكد من العميل وأعد كتابته.", expired: "انتهت صلاحية الرمز. أعد إرساله.", locked: "محاولات كثيرة خاطئة. أعد إرسال رمز جديد.", missing: "أعد إرسال الرمز." }[res];
      if (msg) { nb.error = msg; render(); document.getElementById("nb-code")?.focus(); return; }
      nb.existing = Store.upsertCustomer({ phone: nb.phone, name: nb.name, via: "salon", salonId: s.id });
      nb.wasExisting = false; nb.step = "details"; nb.error = ""; render(); UI.toast("أُنشئ حساب العميل برقم مؤكَّد"); return;
    }
    if (f.id === "nb-book-form") {
      const nb = state.nb; const s = salon();
      const chosen = s.services.filter((x) => nb.services.includes(x.id));
      const dur = Math.max(30, chosen.reduce((a, x) => a + x.min, 0));
      const slot = Store.freeSlots(s, nb.date, dur, nb.staffId).find((x) => x.time === nb.time);
      if (!chosen.length || !slot) { nb.error = "هذا الوقت لم يعد متاحاً. اختر وقتاً آخر."; nb.time = null; render(); return; }
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const code = "EN-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      const name = nb.existing?.name || nb.name;
      const b = Store.addBooking({
        code, salonId: s.id, staffId: slot.staff.id, staffName: slot.staff.name,
        services: chosen.map((x) => x.id), serviceNames: chosen.map((x) => x.name),
        date: nb.date, time: nb.time, minutes: chosen.reduce((a, x) => a + x.min, 0), total: chosen.reduce((a, x) => a + x.price, 0),
        payment: "cash", status: "confirmed", source: "phone", createdAt: new Date().toISOString(),
        customer: { name, phone: nb.phone }
      });
      Store.upsertCustomer({ phone: nb.phone, name, via: "salon", salonId: s.id });
      nb.booking = b; nb.step = "done";
      nb.sms = `عناياتي: تم حجز موعدك في ${s.name} يوم ${fmtDate(b.date, { weekday: "long", day: "numeric", month: "long" })} الساعة ${fmtTime(b.time)} مع ${b.staffName}. رقم الحجز ${b.code}. حمّل تطبيق عناياتي وادخل برقم جوالك لتجد حسابك ومواعيدك.`;
      render(); window.scrollTo(0, 0); return;
    }
    if (f.id === "renew-form") {
      const sub = salon().subscription;
      Store.requestRenewal(state.salonId, { plan: state.plan || (sub.plan === "yearly" ? "yearly" : "monthly"), note: f.note.value.trim() });
      render(); UI.toast("وصل طلبك، وسيُفعَّل الاشتراك بعد التأكد من التحويل");
      return;
    }
    if (f.id === "service-form") {
      const name = f.name.value.trim(), price = Number(f.price.value), min = Number(f.min.value);
      if (!name || !(price >= 0) || f.price.value === "" || !(min >= 5)) { document.getElementById("sv-err").hidden = false; return; }
      const data = { name, price, min, group: f.group.value.trim() || undefined, desc: f.desc.value.trim() || undefined };
      const id = f.dataset.id;
      update((s) => {
        if (id === "new") s.services.push({ id: uid("svc-"), ...data });
        else s.services = s.services.map((x) => (x.id === id ? { ...x, ...data } : x));
      }, id === "new" ? "أُضيفت الخدمة" : "حُفظت الخدمة");
      return;
    }
    if (f.id === "staff-form") {
      const name = f.name.value.trim();
      if (!name) { document.getElementById("st-err").hidden = false; return; }
      const data = { name, role: f.role.value.trim(), years: Number(f.years.value) || undefined };
      const id = f.dataset.id;
      update((s) => {
        if (id === "new") s.staff.push({ id: uid("st-"), ...data });
        else s.staff = s.staff.map((x) => (x.id === id ? { ...x, ...data } : x));
      }, id === "new" ? "أُضيف إلى الفريق" : "حُفظت البيانات");
      return;
    }
    if (f.id === "settings-form") {
      const err = document.getElementById("se-err");
      const open = Number(f["se-open"].value), close = Number(f["se-close"].value);
      if (!f.name.value.trim()) { err.textContent = "اكتب اسم الصالون."; err.hidden = false; return; }
      if (close <= open) { err.textContent = "وقت الإغلاق يجب أن يكون بعد وقت الفتح."; err.hidden = false; return; }
      const lat = parseFloat(f.lat.value), lng = parseFloat(f.lng.value);
      const loc = f.lat.value.trim() === "" && f.lng.value.trim() === "" ? null : { lat, lng };
      if (loc && !(Math.abs(lat) <= 90 && Math.abs(lng) <= 180)) { err.textContent = "إحداثيات الموقع غير صحيحة."; err.hidden = false; return; }
      if (f.pass.value && f.pass.value.length < 4) { err.textContent = "كلمة المرور 4 أحرف على الأقل."; err.hidden = false; return; }
      update((s) => {
        Object.assign(s, {
          name: f.name.value.trim(), slogan: f.slogan.value.trim(), tagline: f.tagline.value.trim(),
          type: f.type.value, area: f.area.value.trim(), address: f.address.value.trim(), about: f.about.value.trim(),
          brand: { primary: f.primary.value, accent: f.accent.value },
          hours: { open, close },
          closedDays: [...f.querySelectorAll('input[name="closed"]:checked')].map((x) => Number(x.value)),
          location: loc
        });
        if (f.pass.value) s.password = f.pass.value;
      }, "حُفظت الإعدادات، وظهرت للعملاء");
    }
  });

  Store.onChange(render);
  render();
})();
