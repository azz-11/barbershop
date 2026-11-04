/* عناياتي — طبقة البيانات
   كل الواجهات (تطبيق العميل، لوحة الصالون، لوحة الإدارة) تقرأ وتكتب من هنا فقط.
   حالياً: الحفظ في متصفح الجهاز (localStorage).
   لاحقاً: تُستبدل هذه الدوال باتصال بقاعدة بيانات حقيقية، دون تغيير الواجهات.

   البنية:
   salons[]   : كل صالون ببياناته الخاصة (الخدمات، الفريق، الساعات، الهوية، الاشتراك)
   bookings[] : كل حجز مربوط بصالونه عبر salonId
   billing    : أسعار الاشتراك والفترة التجريبية وبيانات التحويل البنكي
   customers[]: حسابات العملاء، مفتاحها رقم الجوال المؤكَّد برمز تحقق.
                يُنشأ الحساب من التطبيق، أو من لوحة الصالون عند الحجز الهاتفي.
   otps       : رموز التحقق المؤقتة (في النظام الحقيقي تُرسل SMS ولا تُحفظ إلا مشفّرة على الخادم)

   نموذج العمل: كل صالون يشترك شهرياً أو سنوياً، ويحصل على:
   تطبيقه الخاص (رابطه، هويته، أيقونته، QR) + لوحة الإدارة + الظهور في منصة عناياتي.
   إذا انتهى الاشتراك (بعد فترة السماح) يتوقف الحجز ويختفي من المنصة تلقائياً. */
window.Store = (function () {
  "use strict";
  const KEY = "enayati.db.v1";
  const OLD_BOOKINGS_KEY = "enayati.bookings.v1";
  const DAY = 864e5;
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const addDays = (iso, n) => new Date(new Date(iso).getTime() + n * DAY).toISOString();
  let mem = null;

  const DEFAULT_BILLING = {
    monthly: 199,          // ر.س شهرياً
    yearly: 1990,          // ر.س سنوياً (شهران مجاناً)
    trialDays: 14,
    graceDays: 3,          // أيام سماح بعد الانتهاء قبل الإيقاف
    bank: "البنك: (يُضاف لاحقاً)\nالآيبان: SA00 0000 0000 0000 0000 0000\nاسم المستفيد: عناياتي"
  };
  const PLAN_NAMES = { trial: "تجربة مجانية", monthly: "الباقة الشهرية", yearly: "الباقة السنوية" };

  /* اشتراكات تجريبية للصوالين النموذجية حتى تظهر كل الحالات */
  const DEMO_SUBS = {
    sanad: { plan: "monthly", left: 20, paid: 2 },
    qass: { plan: "monthly", left: 3, paid: 3 },
    maha: { plan: "yearly", left: 240, paid: 1 },
    lulu: { plan: "trial", left: 9 },
    asrar: { plan: "trial", left: 14 }
  };

  function makeSub(id, createdAt, billing) {
    const now = new Date().toISOString();
    const demo = DEMO_SUBS[id];
    if (!demo) return { plan: "trial", startedAt: createdAt || now, endsAt: addDays(createdAt || now, billing.trialDays), payments: [], requests: [] };
    const endsAt = addDays(now, demo.left);
    const period = demo.plan === "yearly" ? 365 : 30;
    const payments = Array.from({ length: demo.paid || 0 }, (_, i) => ({
      id: `p-${id}-${i}`, plan: demo.plan, amount: billing[demo.plan], method: "تحويل بنكي",
      at: addDays(endsAt, -period * (demo.paid - i))
    }));
    return { plan: demo.plan, startedAt: payments[0] ? payments[0].at : addDays(endsAt, -billing.trialDays), endsAt, payments, requests: [] };
  }

  /* يكمّل أي بيانات قديمة بالحقول الجديدة (ترقية تلقائية) */
  function normalize(d) {
    d.billing = { ...DEFAULT_BILLING, ...(d.billing || {}) };
    d.customers = d.customers || [];
    d.otps = d.otps || {};
    d.salons.forEach((s) => {
      if (!s.subscription) s.subscription = makeSub(s.id, s.createdAt, d.billing);
      s.subscription.payments = s.subscription.payments || [];
      s.subscription.requests = s.subscription.requests || [];
    });
    return d;
  }

  function seed() {
    const now = new Date().toISOString();
    const salons = clone(window.ENAYATI_DATA.salons).map((s) => ({
      status: "active",        // active | suspended (إيقاف يدوي من الإدارة)
      unlisted: false,
      assets: true,            // لها أيقونة وملف تثبيت جاهز
      password: "1234",        // تجريبي فقط
      closedDays: [],          // أرقام أيام الأسبوع المغلقة: 0 الأحد … 6 السبت
      createdAt: now,
      ...s
    }));
    let bookings = [];
    try { bookings = JSON.parse(localStorage.getItem(OLD_BOOKINGS_KEY)) || []; } catch (e) { /* لا شيء */ }
    return normalize({ version: 1, salons, bookings });
  }

  let cacheRaw = null, cacheData = null;
  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw && raw === cacheRaw) return cacheData;
      const d = JSON.parse(raw);
      if (d && d.version === 1) {
        const needs = !d.billing || !d.customers || d.salons.some((s) => !s.subscription);
        normalize(d);
        if (needs) { write(d); return d; }
        cacheRaw = raw; cacheData = d; return d;
      }
    } catch (e) { /* نكمل بالبيانات الأولية */ }
    if (mem) return mem;
    const d = seed(); write(d); return d;
  }
  function write(d) {
    mem = d;
    try { const raw = JSON.stringify(d); localStorage.setItem(KEY, raw); cacheRaw = raw; cacheData = d; } catch (e) { /* ذاكرة فقط */ }
  }
  function mutate(fn) { const d = read(); fn(d); write(d); return d; }
  const findSalon = (d, id) => d.salons.find((s) => s.id === id);

  /* حالة اشتراك الصالون كما تُعرض وتُطبّق */
  function subState(s, now) {
    const d = read();
    const sub = s.subscription || makeSub(s.id, s.createdAt, d.billing);
    const days = Math.ceil((new Date(sub.endsAt).getTime() - (now || Date.now())) / DAY);
    const base = { days, plan: sub.plan, planName: PLAN_NAMES[sub.plan], endsAt: sub.endsAt, pending: sub.requests.length > 0 };
    if (s.status === "suspended") return { ...base, code: "suspended", label: "موقوف من الإدارة", live: false };
    if (days < -d.billing.graceDays) return { ...base, code: "expired", label: "الاشتراك منتهٍ", live: false };
    if (days < 0) return { ...base, code: "grace", label: "انتهى · فترة سماح", live: true };
    if (sub.plan === "trial") return { ...base, code: "trial", label: `تجربة · ${daysText(days)}`, live: true };
    if (days <= 5) return { ...base, code: "expiring", label: `ينتهي خلال ${daysText(days)}`, live: true };
    return { ...base, code: "active", label: "مشترك", live: true };
  }
  function daysText(n) {
    n = Math.max(0, n);
    if (n === 0) return "اليوم";
    if (n === 1) return "يوم واحد";
    if (n === 2) return "يومين";
    if (n <= 10) return `${n} أيام`;
    return `${n} يوماً`;
  }

  return {
    PLAN_NAMES, daysText,

    /* الصوالين */
    salons: () => read().salons,
    salon: (id) => read().salons.find((s) => s.id === id) || null,
    saveSalon(salon) {
      mutate((d) => {
        if (!salon.subscription) salon.subscription = makeSub(salon.id, salon.createdAt, d.billing);
        const i = d.salons.findIndex((s) => s.id === salon.id);
        if (i >= 0) d.salons[i] = salon; else d.salons.push(salon);
      });
      return salon;
    },
    removeSalon(id) { mutate((d) => { d.salons = d.salons.filter((s) => s.id !== id); }); },

    /* الاشتراكات */
    billing: () => read().billing,
    saveBilling(b) { mutate((d) => { d.billing = { ...d.billing, ...b }; }); },
    subState,
    isLive: (s) => !!s && subState(s).live,
    /* تسجيل دفعة: يمدد الاشتراك من تاريخ انتهائه أو من اليوم (أيهما أبعد) */
    recordPayment(salonId, { plan, method, ref, requestId }) {
      mutate((d) => {
        const s = findSalon(d, salonId); const sub = s.subscription;
        const from = Math.max(Date.now(), new Date(sub.endsAt).getTime());
        const end = new Date(from); end.setMonth(end.getMonth() + (plan === "yearly" ? 12 : 1));
        sub.payments.push({ id: "p-" + Date.now().toString(36), plan, amount: d.billing[plan], method, ref: ref || "", at: new Date().toISOString() });
        sub.plan = plan; sub.endsAt = end.toISOString();
        sub.requests = sub.requests.filter((r) => r.id !== requestId);
        if (s.status === "suspended" && s.suspendedFor === "billing") { s.status = "active"; delete s.suspendedFor; }
      });
    },
    /* طلب تجديد من صاحب الصالون (بعد التحويل البنكي) */
    requestRenewal(salonId, { plan, note }) {
      mutate((d) => {
        const s = findSalon(d, salonId);
        s.subscription.requests = [{ id: "r-" + Date.now().toString(36), plan, amount: d.billing[plan], note: note || "", at: new Date().toISOString() }];
      });
    },
    rejectRequest(salonId, requestId) {
      mutate((d) => { const s = findSalon(d, salonId); s.subscription.requests = s.subscription.requests.filter((r) => r.id !== requestId); });
    },

    /* العملاء */
    customer: (phone) => read().customers.find((c) => c.phone === phone) || null,
    customers: () => read().customers,
    /* ينشئ الحساب أو يحدّثه. via: "app" من التطبيق، أو "salon" عند تسجيله من الصالون */
    upsertCustomer({ phone, name, via, salonId }) {
      let out;
      mutate((d) => {
        let c = d.customers.find((x) => x.phone === phone);
        if (!c) { c = { phone, name: name || "", verified: true, createdAt: new Date().toISOString(), createdVia: via, createdBy: salonId || null, salons: [] }; d.customers.push(c); }
        if (name && !c.name) c.name = name;
        if (salonId && !c.salons.includes(salonId)) c.salons.push(salonId);
        out = { ...c };
      });
      return out;
    },

    /* رموز التحقق: 4 أرقام، صالحة 5 دقائق، 5 محاولات، وإعادة الإرسال بعد 30 ثانية.
       purpose يربط الرمز بغرضه: "login" لدخول التطبيق، أو "salon:<id>" لتسجيل العميل عند صالون محدد،
       فلا يصلح رمز الصالون للدخول إلى حساب العميل. */
    sendOtp(phone, purpose) {
      const d = read(); const prev = d.otps[phone];
      if (prev && prev.purpose === purpose && Date.now() - prev.sentAt < 30000) {
        return { ok: false, wait: Math.ceil((30000 - (Date.now() - prev.sentAt)) / 1000) };
      }
      const code = String(Math.floor(1000 + Math.random() * 9000));
      mutate((x) => { x.otps[phone] = { code, purpose, sentAt: Date.now(), expiresAt: Date.now() + 5 * 60000, tries: 0 }; });
      return { ok: true, code }; /* code يُعاد هنا للمحاكاة فقط، ولا يُعاد أبداً في النظام الحقيقي */
    },
    verifyOtp(phone, purpose, code) {
      const o = read().otps[phone];
      if (!o || o.purpose !== purpose) return "missing";
      if (Date.now() > o.expiresAt) return "expired";
      if (o.tries >= 5) return "locked";
      if (String(code).trim() !== o.code) { const tries = o.tries + 1; mutate((x) => { x.otps[phone].tries = tries; }); return tries >= 5 ? "locked" : "wrong"; }
      mutate((x) => { delete x.otps[phone]; });
      return "ok";
    },

    /* الأوقات المتاحة لصالون في يوم معيّن، لمدة معيّنة، ولمختص أو "any" */
    freeSlots(salon, date, duration, staffId) {
      const bookings = read().bookings.filter((b) => b.salonId === salon.id && b.date === date && b.status !== "cancelled");
      const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
      const pad = (n) => String(n).padStart(2, "0");
      const busy = (sid, start) => bookings.some((b) => b.staffId === sid && start < toMin(b.time) + b.minutes && start + duration > toMin(b.time));
      const pool = staffId && staffId !== "any" ? salon.staff.filter((p) => p.id === staffId) : salon.staff;
      const now = new Date();
      const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` === date;
      const nowMin = now.getHours() * 60 + now.getMinutes() + 15;
      const out = [];
      for (let m = salon.hours.open * 60; m + duration <= salon.hours.close * 60; m += 30) {
        if (today && m < nowMin) continue;
        const free = pool.find((p) => !busy(p.id, m));
        if (free) out.push({ time: `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`, staff: free });
      }
      return out;
    },

    /* الحجوزات */
    bookings: (salonId) => read().bookings.filter((b) => !salonId || b.salonId === salonId),
    setBookings(list) { mutate((d) => { d.bookings = list; }); },
    addBooking(b) { mutate((d) => { d.bookings.push(b); }); return b; },
    updateBooking(code, patch) {
      mutate((d) => { d.bookings = d.bookings.map((b) => (b.code === code ? { ...b, ...patch } : b)); });
    },

    /* إعادة البيانات التجريبية */
    reset() { cacheRaw = null; try { localStorage.removeItem(KEY); localStorage.removeItem(OLD_BOOKINGS_KEY); } catch (e) { /* لا شيء */ } mem = null; write(seed()); },

    /* تحديث تلقائي عند تغيّر البيانات من نافذة أخرى (مثلاً لوحة الصالون مفتوحة بجانب التطبيق) */
    onChange(cb) { window.addEventListener("storage", (e) => { if (e.key === KEY) { mem = null; cb(); } }); }
  };
})();
