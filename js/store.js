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
   threads    : المحادثات بين العميل والصالون، مفتاحها "salonId|phone"
   orders[]   : طلبات منتجات الصالون (استلام ودفع في الصالون)
   reliability: سجل الالتزام لكل رقم جوال عند كل صالون، مفتاحه "salonId|phone":
                { shows: الحضور، noShows: الغياب، lateCancels: الإلغاءات المتأخرة }
   queue[]    : الدور (بدون موعد) لليوم، لكل صالون أرقامه A-01، A-02 …
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
  /* العربون وسياسة الإلغاء (لكل صالون) */
  const DEFAULT_DEPOSIT = {
    mode: "none",            // none بدون عربون · smart عربون ذكي · all لكل الحجوزات
    type: "fixed",           // fixed مبلغ ثابت · percent نسبة من الإجمالي
    amount: 30,
    cancelHours: 3,          // مهلة الإلغاء المجاني بالساعات
    rules: {
      noShows: { on: true, min: 2 },                    // غاب العميل هذا العدد أو أكثر
      total: { on: false, min: 200 },                   // إجمالي الحجز هذا المبلغ أو أكثر
      peak: { on: false, days: [4, 5], from: 18, to: 22 } // أيام وساعات الذروة
    }
  };
  /* الدور بدون موعد (لكل صالون) */
  const DEFAULT_QUEUE = { enabled: false, remote: true, max: 10 };
  /* إحداثيات الصوالين النموذجية القديمة في الرياض، لنقلها إلى جدة مرة واحدة دون المساس بما عدّله أصحابها */
  const OLD_DEMO_COORDS = { sanad: [24.8235, 46.642], qass: [24.878, 46.656], maha: [24.804, 46.6], lulu: [24.735, 46.765] };

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

  /* دمج إعدادات محفوظة مع القيم الافتراضية (لكل مستوى) */
  function withDefaults(def, val) {
    if (Array.isArray(def)) return Array.isArray(val) ? val : clone(def);
    if (def && typeof def === "object") {
      const out = {}; const v = val && typeof val === "object" ? val : {};
      Object.keys(def).forEach((k) => { out[k] = withDefaults(def[k], v[k]); });
      Object.keys(v).forEach((k) => { if (!(k in out)) out[k] = v[k]; });
      return out;
    }
    return val === undefined || val === null ? def : val;
  }
  /* يبني سجل الالتزام من الحجوزات القديمة (مرة واحدة عند الترقية) */
  function buildReliability(bookings) {
    const r = {};
    bookings.forEach((b) => {
      if (!b.customer || !b.customer.phone) return;
      const k = b.salonId + "|" + b.customer.phone;
      const x = r[k] || (r[k] = { shows: 0, noShows: 0, lateCancels: 0 });
      if (b.status === "completed") x.shows += 1;
      if (b.status === "noshow") x.noShows += 1;
      if (b.status === "cancelled" && b.lateCancel) x.lateCancels += 1;
    });
    return r;
  }

  /* يكمّل أي بيانات قديمة بالحقول الجديدة (ترقية تلقائية) */
  function normalize(d) {
    d.billing = { ...DEFAULT_BILLING, ...(d.billing || {}) };
    d.customers = d.customers || [];
    /* ترقية: الموقع والأرقام التجريبية من البيانات الأولية، وإزالة النجوم القديمة */
    const base = window.ENAYATI_DATA.salons;
    d.salons.forEach((s) => {
      if (!s.contact) s.contact = { phone: "", whatsapp: "", call: true, wa: true, chat: true };
      const src = base.find((x) => x.id === s.id);
      delete s.rating; delete s.reviews;
      if (!src) { if (!s.products) { s.products = []; s.productsEnabled = false; } return; }
      if (!s.location && src.location) s.location = src.location;
      if (!s.seed && src.seed) s.seed = src.seed;
      if (!s.products) { s.products = src.products ? JSON.parse(JSON.stringify(src.products)) : []; s.productsEnabled = !!src.productsEnabled; }
      s.staff.forEach((m) => { const sm = src.staff.find((x) => x.id === m.id); if (sm && m.seedCuts == null && sm.seedCuts != null) m.seedCuts = sm.seedCuts; });
    });
    d.otps = d.otps || {};
    d.queue = d.queue || [];
    if (!d.reliability) d.reliability = buildReliability(d.bookings || []);
    d.salons.forEach((s) => {
      const src = base.find((x) => x.id === s.id) || {};
      /* نقل الصوالين النموذجية من الرياض إلى جدة إن لم يغيّر أصحابها موقعها */
      const old = OLD_DEMO_COORDS[s.id];
      if (old && s.location && Math.abs(s.location.lat - old[0]) < 1e-4 && Math.abs(s.location.lng - old[1]) < 1e-4 && src.location) {
        s.location = clone(src.location); s.area = src.area; s.address = src.address;
      }
      s.deposit = withDefaults(DEFAULT_DEPOSIT, s.deposit || src.deposit);
      s.queue = withDefaults(DEFAULT_QUEUE, s.queue || src.queue);
    });
    d.threads = d.threads || {};
    d.orders = d.orders || [];
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
        const needs = !d.billing || !d.customers || !d.threads || !d.orders || !d.queue || !d.reliability
          || d.salons.some((s) => !s.subscription || "rating" in s || !s.contact || !s.deposit || !s.queue || !s.deposit.rules
            || (OLD_DEMO_COORDS[s.id] && s.location && Math.abs(s.location.lat - OLD_DEMO_COORDS[s.id][0]) < 1e-4));
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
  /* ---------- أدوات الوقت ---------- */
  const pad2 = (n) => String(n).padStart(2, "0");
  const todayISO = (t) => { const n = t ? new Date(t) : new Date(); return `${n.getFullYear()}-${pad2(n.getMonth() + 1)}-${pad2(n.getDate())}`; };
  const hm = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const startOf = (b) => { const [y, mo, da] = b.date.split("-").map(Number); const [h, mi] = b.time.split(":").map(Number); return new Date(y, mo - 1, da, h, mi); };
  const nowMin = (t) => { const n = t ? new Date(t) : new Date(); return n.getHours() * 60 + n.getMinutes(); };

  /* هل المختص مشغول في [start, start+dur) بحجز أو بدور جارٍ؟ (المصدر الوحيد للتعارض) */
  /* exceptCode: يُستثنى حجز معيّن (عند تغيير موعده لا يتعارض مع نفسه) */
  function staffBusy(d, salonId, staffId, date, start, dur, exceptCode) {
    const byBooking = d.bookings.some((b) => b.code !== exceptCode && b.salonId === salonId && b.staffId === staffId && b.date === date && b.status !== "cancelled" && b.status !== "noshow"
      && start < hm(b.time) + b.minutes && start + dur > hm(b.time));
    if (byBooking) return true;
    return d.queue.some((q) => q.salonId === salonId && q.staffId === staffId && q.status === "serving" && q.date === date
      && start < q.startMin + q.minutes && start + dur > q.startMin);
  }

  /* ---------- تقديم الموعد وتأخيره ---------- */
  const RESCHEDULE_MIN_HOURS = 2; /* يُسمح بالتغيير حتى ساعتين قبل الموعد الحالي */
  /* هل يصلح نقل الحجز b إلى (date, time) مع المختص staffId؟ */
  function canMoveTo(d, b, date, time, staffId) {
    const s = d.salons.find((x) => x.id === b.salonId);
    if (!s || !s.staff.some((p) => p.id === staffId)) return false;
    if ((s.closedDays || []).includes(new Date(date + "T12:00:00").getDay())) return false;
    const m = hm(time), dur = Math.max(b.minutes, 30);
    if (m % 30 || m < s.hours.open * 60 || m + dur > s.hours.close * 60) return false;
    if (date < todayISO() || (date === todayISO() && m < nowMin() + 30)) return false;
    if (date === b.date && time === b.time && staffId === b.staffId) return false; /* نفس الموعد */
    return !staffBusy(d, s.id, staffId, date, m, dur, b.code);
  }
  /* الأوقات المتاحة للنقل في يوم معيّن: لكل وقت أول مختص متاح (المختص الحالي أولاً) */
  function rescheduleSlots(d, b, date, sameStaff) {
    const s = d.salons.find((x) => x.id === b.salonId);
    if (!s) return [];
    const pool = sameStaff ? s.staff.filter((p) => p.id === b.staffId)
      : [...s.staff.filter((p) => p.id === b.staffId), ...s.staff.filter((p) => p.id !== b.staffId)];
    const out = [];
    for (let m = s.hours.open * 60; m < s.hours.close * 60; m += 30) {
      const time = `${pad2(Math.floor(m / 60) % 24)}:${pad2(m % 60)}`;
      const who = pool.find((p) => canMoveTo(d, b, date, time, p.id));
      if (who) out.push({ time, staff: { id: who.id, name: who.name } });
    }
    return out;
  }

  /* ---------- العربون ---------- */
  function depositAmount(dep, total) {
    const a = dep.type === "percent" ? Math.round((total * Number(dep.amount || 0)) / 100) : Number(dep.amount || 0);
    return Math.max(0, Math.min(a, total));
  }

  /* ---------- الدور ---------- */
  const queueToday = (d, salonId) => d.queue.filter((q) => q.salonId === salonId && q.date === todayISO()).sort((a, b) => a.seq - b.seq);
  const waitingOf = (d, salonId) => queueToday(d, salonId).filter((q) => q.status === "waiting");
  /* رسالة المحاكاة عندما يقترب دور صاحب الدور عن بُعد */
  function queueNotify(d, salonId) {
    const sent = [];
    waitingOf(d, salonId).forEach((q, i) => {
      if (!q.remote || !q.phone || q.noticeAt || i > 1) return;
      q.notice = i === 0 ? "دورك التالي، توجّه للصالون الآن." : "دورك بعد شخص واحد، توجّه للصالون.";
      q.noticeAt = new Date().toISOString();
      sent.push({ name: q.name, number: q.number, text: q.notice });
    });
    return sent;
  }
  function bumpRel(d, salonId, phone, key) {
    if (!phone) return;
    const k = salonId + "|" + phone;
    const x = d.reliability[k] || (d.reliability[k] = { shows: 0, noShows: 0, lateCancels: 0 });
    x[key] += 1;
  }

  /* نسبة الرضا = (راضٍ جداً + راضٍ) ÷ كل التقييمات */
  function satisfaction(r) {
    const total = r.very + r.ok + r.no;
    return { ratings: r, rated: total, pct: total ? Math.round(((r.very + r.ok) / total) * 100) : null };
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
        salon.deposit = withDefaults(DEFAULT_DEPOSIT, salon.deposit);
        salon.queue = withDefaults(DEFAULT_QUEUE, salon.queue);
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
      const d = read();
      const pad = (n) => String(n).padStart(2, "0");
      const busy = (sid, start) => staffBusy(d, salon.id, sid, date, start, duration);
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

    /* ---------- الزيارات والرضا ----------
       الزيارة = حجز سجّله الصالون "مكتمل".
       الرضا ثلاث درجات بعد كل زيارة: very (راضٍ جداً) · ok (راضٍ) · no (غير راضٍ)
       ويقيّم العميل الصالون والمختص كلٌّ على حدة. */
    VERDICTS: { very: "راضٍ جداً", ok: "راضٍ", no: "غير راضٍ" },
    rateBooking(code, { salon, staff, note }) {
      mutate((d) => { const b = d.bookings.find((x) => x.code === code); if (b && b.status === "completed" && !b.feedback) b.feedback = { salon, staff, note: note || "", at: new Date().toISOString() }; });
    },
    salonStats(s) {
      const done = read().bookings.filter((b) => b.salonId === s.id && b.status === "completed");
      const r = { very: 0, ok: 0, no: 0, ...((s.seed && s.seed.ratings) || {}) };
      done.forEach((b) => { if (b.feedback && r[b.feedback.salon] != null) r[b.feedback.salon] += 1; });
      return { visits: ((s.seed && s.seed.visits) || 0) + done.length, ...satisfaction(r) };
    },
    staffStats(s, staffId) {
      const m = s.staff.find((x) => x.id === staffId) || {};
      const done = read().bookings.filter((b) => b.salonId === s.id && b.staffId === staffId && b.status === "completed");
      const r = { very: 0, ok: 0, no: 0 };
      /* الأرقام التجريبية للمختص تتبع نسب صالونه */
      if (m.seedCuts && s.seed && s.seed.ratings) { const t = s.seed.ratings, n = t.very + t.ok + t.no; ["very", "ok", "no"].forEach((k) => { r[k] = Math.round((t[k] / n) * m.seedCuts * 0.3); }); }
      done.forEach((b) => { if (b.feedback && r[b.feedback.staff] != null) r[b.feedback.staff] += 1; });
      return { cuts: (m.seedCuts || 0) + done.length, ...satisfaction(r) };
    },
    customerVisits(phone, salonId) {
      return read().bookings.filter((b) => b.customer && b.customer.phone === phone && b.salonId === salonId && b.status === "completed").length;
    },

    /* المسافة بالكيلومتر بين نقطتين (معادلة هافرساين) */
    distanceKm(a, b) {
      if (!a || !b) return null;
      const R = 6371, rad = (x) => (x * Math.PI) / 180;
      const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(h));
    },

    /* ---------- المحادثات ----------
       محادثة واحدة لكل عميل مع كل صالون. يرد عليها أي فرد من فريق الصالون من اللوحة. */
    thread: (salonId, phone) => read().threads[salonId + "|" + phone] || null,
    threadsOf: (salonId) => Object.entries(read().threads).filter(([k]) => k.startsWith(salonId + "|"))
      .map(([k, t]) => ({ phone: k.split("|")[1], ...t })).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")),
    threadsOfCustomer: (phone) => Object.entries(read().threads).filter(([k]) => k.endsWith("|" + phone))
      .map(([k, t]) => ({ salonId: k.split("|")[0], ...t })),
    sendMessage(salonId, phone, { from, text, name, bookingCode }) {
      mutate((d) => {
        const k = salonId + "|" + phone;
        const t = d.threads[k] || (d.threads[k] = { name: name || "", messages: [], readCustomer: 0, readSalon: 0 });
        if (name && !t.name) t.name = name;
        const at = new Date().toISOString();
        t.messages.push({ from, text, at, bookingCode: bookingCode || null });
        t.updatedAt = at;
        if (from === "customer") t.readCustomer = t.messages.length; else t.readSalon = t.messages.length;
      });
    },
    markRead(salonId, phone, side) {
      mutate((d) => { const t = d.threads[salonId + "|" + phone]; if (t) t[side === "salon" ? "readSalon" : "readCustomer"] = t.messages.length; });
    },
    unread(t, side) { return t ? Math.max(0, t.messages.length - (side === "salon" ? t.readSalon : t.readCustomer)) : 0; },

    /* ---------- طلبات المنتجات ---------- */
    orders: (salonId) => read().orders.filter((o) => !salonId || o.salonId === salonId),
    addOrder(o) { mutate((d) => { d.orders.push(o); }); return o; },
    updateOrder(id, patch) { mutate((d) => { d.orders = d.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)); }); },
    ORDER_STATES: { new: "طلب جديد", ready: "جاهز للاستلام", done: "تم الاستلام", cancelled: "ملغى" },

    /* هل المختص مشغول في هذا الوقت؟ (حجز أو دور جارٍ) */
    staffBusy: (salonId, staffId, date, start, dur, exceptCode) => staffBusy(read(), salonId, staffId, date, start, dur, exceptCode),

    /* ---------- تقديم الموعد وتأخيره ---------- */
    RESCHEDULE_MIN_HOURS,
    /* هل يمكن تغيير الموعد الآن؟ (مؤكَّد، وباقٍ عليه ساعتان على الأقل) */
    canReschedule(b, t) { return !!b && b.status === "confirmed" && startOf(b).getTime() - (t || Date.now()) >= RESCHEDULE_MIN_HOURS * 3600e3; },
    /* الأوقات المتاحة لنقل الموعد إلى يوم معيّن. sameStaff: نفس المختص فقط، وإلا أي مختص (المختص الحالي أولاً) */
    rescheduleSlots(code, date, sameStaff) {
      const d = read(); const b = d.bookings.find((x) => x.code === code);
      return b ? rescheduleSlots(d, b, date, sameStaff) : [];
    },
    /* ينقل الموعد بعد التحقق من المهلة ومن أن الوقت ما زال متاحاً. العربون وسياسة الإلغاء يبقيان كما هما */
    rescheduleBooking(code, { date, time, staffId }) {
      let res = { error: "invalid" };
      mutate((d) => {
        const b = d.bookings.find((x) => x.code === code);
        if (!b) return;
        if (!this.canReschedule(b)) { res = { error: "too-late" }; return; }
        if (!staffId || !canMoveTo(d, b, date, time, staffId)) { res = { error: "taken" }; return; }
        const s = d.salons.find((x) => x.id === b.salonId);
        const staff = s.staff.find((p) => p.id === staffId);
        const from = { date: b.date, time: b.time, staffId: b.staffId, staffName: b.staffName };
        b.rescheduled = [...(b.rescheduled || []), { from, at: new Date().toISOString() }];
        Object.assign(b, { date, time, staffId: staff.id, staffName: staff.name });
        res = { ok: true, from, booking: clone(b) };
      });
      return res;
    },

    /* ---------- سجل الالتزام ---------- */
    reliability(salonId, phone) {
      const x = phone && read().reliability[salonId + "|" + phone];
      return { shows: 0, noShows: 0, lateCancels: 0, ...(x || {}) };
    },

    /* ---------- العربون وسياسة الإلغاء ----------
       يعيد { required, amount, reason }. السبب يُعرض للعميل بصياغة عامة غير جارحة،
       ولا يُذكر له أبداً أن العربون بسبب غيابه. */
    depositFor(salon, { phone, date, time, total }) {
      const dep = salon.deposit || DEFAULT_DEPOSIT;
      const none = { required: false, amount: 0, reason: "" };
      if (!total || dep.mode === "none") return none;
      const amount = depositAmount(dep, total);
      if (!amount) return none;
      if (dep.mode === "all") return { required: true, amount, reason: "حسب سياسة الصالون" };
      const r = dep.rules;
      if (r.peak.on && date && time) {
        const day = new Date(date + "T12:00:00").getDay(), h = hm(time) / 60;
        if (r.peak.days.includes(day) && h >= r.peak.from && h < r.peak.to) return { required: true, amount, reason: "لأن الموعد في وقت ذروة" };
      }
      if (r.total.on && total >= r.total.min) return { required: true, amount, reason: "حسب سياسة الصالون للحجوزات الكبيرة" };
      if (r.noShows.on && phone && this.reliability(salon.id, phone).noShows >= r.noShows.min) return { required: true, amount, reason: "حسب سياسة الصالون" };
      return none;
    },
    cancelHours: (salon) => ((salon && salon.deposit) || DEFAULT_DEPOSIT).cancelHours,
    /* هل فات وقت الإلغاء المجاني لهذا الحجز؟ */
    isLateCancel(b, t) {
      const hours = b.policy && b.policy.cancelHours != null ? b.policy.cancelHours : this.cancelHours(this.salon(b.salonId));
      return startOf(b).getTime() - (t || Date.now()) < hours * 3600e3;
    },
    /* إلغاء حجز. by: "customer" أو "salon". الإلغاء المتأخر من العميل يُسجَّل ويخسر به العربون */
    cancelBooking(code, by) {
      let out = { late: false, forfeited: 0, refunded: 0 };
      const late = by === "customer" && this.isLateCancel(read().bookings.find((x) => x.code === code) || { date: todayISO(), time: "00:00" });
      mutate((d) => {
        const b = d.bookings.find((x) => x.code === code);
        if (!b || b.status !== "confirmed") return;
        b.status = "cancelled"; b.cancelledBy = by; b.cancelledAt = new Date().toISOString(); b.lateCancel = late;
        if (late) bumpRel(d, b.salonId, b.customer && b.customer.phone, "lateCancels");
        if (b.deposit && b.deposit.status === "paid") {
          b.deposit.status = late ? "forfeited" : "refunded";
          out = { late, forfeited: late ? b.deposit.amount : 0, refunded: late ? 0 : b.deposit.amount };
        } else out.late = late;
      });
      return out;
    },
    /* نتيجة الموعد من لوحة الصالون: completed حضر، noshow لم يحضر (يحتفظ الصالون بالعربون) */
    setOutcome(code, outcome) {
      mutate((d) => {
        const b = d.bookings.find((x) => x.code === code);
        if (!b || (b.status !== "confirmed")) return;
        b.status = outcome;
        bumpRel(d, b.salonId, b.customer && b.customer.phone, outcome === "completed" ? "shows" : "noShows");
        if (b.deposit && b.deposit.status === "paid") b.deposit.status = outcome === "completed" ? "applied" : "kept";
      });
    },
    DEPOSIT_STATES: { paid: "مدفوع", applied: "خُصم من الفاتورة", kept: "احتفظ به الصالون", forfeited: "احتفظ به الصالون (إلغاء متأخر)", refunded: "أُعيد للعميل" },

    /* ---------- الدور (بدون موعد) ---------- */
    queueToday: (salonId) => queueToday(read(), salonId),
    queueWaiting: (salonId) => waitingOf(read(), salonId),
    queueOf: (phone) => read().queue.filter((q) => q.phone === phone && q.date === todayISO() && (q.status === "waiting" || q.status === "serving")),
    /* عدد المختصين المتاحين الآن: نخصم من لديه حجز في الساعة القادمة (والحد الأدنى واحد) */
    availableStaff(salon, t) {
      const d = read(); const date = todayISO(t), m = nowMin(t);
      const free = salon.staff.filter((p) => !d.bookings.some((b) => b.salonId === salon.id && b.staffId === p.id && b.date === date
        && b.status === "confirmed" && hm(b.time) < m + 60 && hm(b.time) + b.minutes > m));
      return Math.max(1, free.length);
    },
    /* الانتظار المتوقع بالدقائق: مدد خدمات من قبله (والمتبقي من الجاري) ÷ المختصين المتاحين */
    queueEstimate(salon, beforeSeq, t) {
      const d = read(); const m = nowMin(t);
      const list = queueToday(d, salon.id);
      const waiting = list.filter((q) => q.status === "waiting" && (beforeSeq == null || q.seq < beforeSeq));
      const serving = list.filter((q) => q.status === "serving");
      const staff = this.availableStaff(salon, t);
      /* إذا كان عدد من قبله أقل من المختصين الفارغين الآن فلا انتظار تقريباً */
      const idle = Math.max(0, staff - serving.length);
      if (waiting.length < idle) return { waiting: waiting.length, minutes: 0, staff };
      const load = waiting.reduce((a, q) => a + q.minutes, 0) + serving.reduce((a, q) => a + Math.max(0, q.startMin + q.minutes - m), 0);
      return { waiting: waiting.length, minutes: Math.ceil(load / staff / 5) * 5, staff };
    },
    /* الانضمام للدور. remote: من التطبيق (بالجوال المؤكَّد)، أو حاضر يضيفه الصالون بالاسم */
    joinQueue(salonId, { name, phone, remote, serviceIds }) {
      const s = this.salon(salonId);
      if (!s || !s.queue.enabled) return { error: "disabled" };
      if (remote && !s.queue.remote) return { error: "remote-off" };
      const m = nowMin();
      if (m < s.hours.open * 60 || m >= s.hours.close * 60) return { error: "closed" };
      let entry = null, err = null;
      mutate((d) => {
        const list = queueToday(d, salonId);
        if (list.filter((q) => q.status === "waiting").length >= s.queue.max) { err = "full"; return; }
        if (phone && list.some((q) => q.phone === phone && (q.status === "waiting" || q.status === "serving"))) { err = "exists"; return; }
        const svc = s.services.filter((x) => (serviceIds || []).includes(x.id));
        const seq = list.length + 1;
        entry = {
          id: "q-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), salonId, date: todayISO(), seq, number: "A-" + pad2(seq),
          name: name || "عميل", phone: phone || null, remote: !!remote,
          services: svc.map((x) => x.id), serviceNames: svc.map((x) => x.name),
          minutes: svc.length ? svc.reduce((a, x) => a + x.min, 0) : (s.services[0] ? s.services[0].min : 30),
          status: "waiting", createdAt: new Date().toISOString()
        };
        d.queue.push(entry);
        queueNotify(d, salonId);
        entry = clone(d.queue[d.queue.length - 1]);
      });
      return err ? { error: err } : { ok: true, entry };
    },
    /* إدارة الدور: start ابدأ · done تم · skip تخطّى (غياب إن كان عن بُعد) · leave خروج العميل */
    queueAction(id, action, staffId) {
      let res = { ok: false };
      mutate((d) => {
        const q = d.queue.find((x) => x.id === id);
        if (!q) return;
        const s = d.salons.find((x) => x.id === q.salonId);
        if (action === "start" && q.status === "waiting") {
          const m = nowMin();
          const pool = staffId ? s.staff.filter((p) => p.id === staffId) : s.staff;
          const who = pool.find((p) => !staffBusy(d, s.id, p.id, q.date, m, q.minutes));
          if (!who) { res = { ok: false, error: "no-staff" }; return; }
          Object.assign(q, { status: "serving", staffId: who.id, staffName: who.name, startMin: m, startedAt: new Date().toISOString() });
          res = { ok: true, staffName: who.name };
        } else if (action === "done" && q.status === "serving") {
          Object.assign(q, { status: "done", doneAt: new Date().toISOString() });
          bumpRel(d, q.salonId, q.phone, "shows");
          res = { ok: true };
        } else if (action === "skip" && q.status === "waiting") {
          q.status = "skipped";
          if (q.remote) bumpRel(d, q.salonId, q.phone, "noShows");
          res = { ok: true };
        } else if (action === "leave" && q.status === "waiting") {
          q.status = "left"; res = { ok: true };
        } else return;
        res.notified = queueNotify(d, q.salonId);
      });
      return res;
    },
    QUEUE_STATES: { waiting: "ينتظر", serving: "يُخدم الآن", done: "تم", skipped: "تخطّى", left: "خرج من الدور" },

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
