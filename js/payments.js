/* عناياتي — الدفع
   كل عمليات الدفع تمر من هنا فقط. حالياً محاكاة لا تخصم أي مبلغ.
   للربط مع بوابة ميسّر (Moyasar) لاحقاً: استبدل جسم chargeDeposit بطلب إنشاء عملية دفع
   (Apple Pay أو مدى) وانتظر نتيجتها، وأعد نفس الشكل { ok, ref, method, amount, at }.
   ولا تحفظ هذه الدالة أي بيانات: حفظ نتيجة الدفع على الحجز مسؤولية store.js. */
window.Payments = (function () {
  "use strict";
  const ref = (p) => p + "-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();

  return {
    /* تحصيل العربون عند الحجز. method: "applepay" أو "mada" */
    chargeDeposit({ amount, method }) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ ok: true, ref: ref("DEP"), method, amount, at: new Date().toISOString() }), 900);
      });
    },
    /* إعادة العربون عند الإلغاء في المهلة المجانية أو إلغاء الصالون */
    refundDeposit({ ref: original, amount }) {
      return Promise.resolve({ ok: true, ref: ref("REF"), original, amount, at: new Date().toISOString() });
    }
  };
})();
