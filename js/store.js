/* عناياتي — طبقة البيانات
   كل الواجهات (تطبيق العميل، لوحة الصالون، لوحة الإدارة) تقرأ وتكتب من هنا فقط.
   حالياً: الحفظ في متصفح الجهاز (localStorage).
   لاحقاً: تُستبدل هذه الدوال باتصال بقاعدة بيانات حقيقية، دون تغيير الواجهات.

   البنية:
   salons[]   : كل صالون ببياناته الخاصة (الخدمات، الفريق، الساعات، الهوية، الحالة)
   bookings[] : كل حجز مربوط بصالونه عبر salonId */
window.Store = (function () {
  "use strict";
  const KEY = "enayati.db.v1";
  const OLD_BOOKINGS_KEY = "enayati.bookings.v1";
  const clone = (x) => JSON.parse(JSON.stringify(x));
  let mem = null;

  function seed() {
    const now = new Date().toISOString();
    const salons = clone(window.ENAYATI_DATA.salons).map((s) => ({
      status: "active",        // active | suspended
      unlisted: false,
      assets: true,            // لها أيقونة وملف تثبيت جاهز
      password: "1234",        // تجريبي فقط
      closedDays: [],          // أرقام أيام الأسبوع المغلقة: 0 الأحد … 6 السبت
      createdAt: now,
      ...s
    }));
    let bookings = [];
    try { bookings = JSON.parse(localStorage.getItem(OLD_BOOKINGS_KEY)) || []; } catch (e) { /* لا شيء */ }
    return { version: 1, salons, bookings };
  }

  let cacheRaw = null, cacheData = null;
  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw && raw === cacheRaw) return cacheData;
      const d = JSON.parse(raw);
      if (d && d.version === 1) { cacheRaw = raw; cacheData = d; return d; }
    } catch (e) { /* نكمل بالبيانات الأولية */ }
    if (mem) return mem;
    const d = seed(); write(d); return d;
  }
  function write(d) {
    mem = d;
    try { const raw = JSON.stringify(d); localStorage.setItem(KEY, raw); cacheRaw = raw; cacheData = d; } catch (e) { /* ذاكرة فقط */ }
  }
  function mutate(fn) { const d = read(); fn(d); write(d); return d; }

  return {
    /* الصوالين */
    salons: () => read().salons,
    salon: (id) => read().salons.find((s) => s.id === id) || null,
    saveSalon(salon) {
      mutate((d) => {
        const i = d.salons.findIndex((s) => s.id === salon.id);
        if (i >= 0) d.salons[i] = salon; else d.salons.push(salon);
      });
      return salon;
    },
    removeSalon(id) { mutate((d) => { d.salons = d.salons.filter((s) => s.id !== id); }); },

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
