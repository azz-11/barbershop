/* عناياتي — لوحة إدارة المنصة (لصاحب عناياتي)
   إضافة الصوالين، إيقافها وتفعيلها، إخفاؤها من القائمة، ومتابعة أرقامها. */
(function () {
  "use strict";
  const { esc, money, initials, bookingState, I } = UI;
  const SESSION = "enayati.admin";
  const ADMIN_PASS = "admin"; /* تجريبي فقط: يُستبدل بتسجيل دخول حقيقي مع قاعدة البيانات */
  const $app = document.getElementById("app");
  const state = { authed: false, adding: false, ask: null, loginError: "", addError: "", pay: null, billingOpen: false };
  const { fmtDate } = UI;
  const shortDate = (iso) => fmtDate(iso.slice(0, 10), { day: "numeric", month: "short", year: "numeric" });
  try { state.authed = sessionStorage.getItem(SESSION) === "1"; } catch (e) { /* لا شيء */ }

  const link = (id) => new URL(`./?s=${id}`, location.href).href;

  function salonStats(s) {
    const list = Store.bookings(s.id);
    const valid = list.filter((b) => b.status !== "cancelled" && b.status !== "noshow");
    return {
      total: list.length,
      done: list.filter((b) => b.status === "completed").length,
      upcoming: list.filter((b) => bookingState(b)[0] === "upcoming").length,
      value: valid.reduce((a, b) => a + b.total, 0)
    };
  }

  function viewLogin() {
    return `<section class="screen login">
      <header class="topbar"><div class="logo"><span class="logo-mark">ع</span>إدارة عناياتي</div>${UI.themeBtn()}</header>
      <div class="hello"><h1>إدارة المنصة</h1><p>الصوالين المشتركة، حالتها، وأرقامها.</p></div>
      <form class="card form" id="login-form" novalidate>
        <label for="ad-pass">كلمة مرور الإدارة</label>
        <input id="ad-pass" name="pass" type="password" autocomplete="current-password">
        ${state.loginError ? `<p class="field-error">${esc(state.loginError)}</p>` : ""}
        <button type="submit" class="btn" style="margin-top:12px">دخول</button>
      </form>
      <p class="demo-note">نسخة تجريبية: كلمة المرور <b dir="ltr">admin</b></p>
      <a class="powered" href="./">العودة إلى تطبيق العملاء</a>
    </section>`;
  }

  function addForm() {
    return `<form class="card form" id="add-form" novalidate>
      <b>صالون جديد</b>
      <label for="nw-name">اسم الصالون</label>
      <input id="nw-name" name="name" required placeholder="مثال: صالون الريم">
      <label for="nw-id">معرّف الرابط (حروف إنجليزية صغيرة وأرقام)</label>
      <input id="nw-id" name="sid" required dir="ltr" pattern="[a-z0-9-]{2,20}" placeholder="alreem">
      <p class="hint" id="nw-preview" dir="ltr">${esc(link("…"))}</p>
      <label for="nw-type">النوع</label>
      <select id="nw-type" name="type"><option value="men">رجالي</option><option value="women">نسائي</option></select>
      <div class="two">
        <div><label for="nw-primary">اللون الأساسي</label><input id="nw-primary" name="primary" type="color" value="#1F3A5F"></div>
        <div><label for="nw-accent">اللون الثانوي</label><input id="nw-accent" name="accent" type="color" value="#C9A227"></div>
      </div>
      <label for="nw-pass">كلمة مرور صاحب الصالون</label>
      <input id="nw-pass" name="pass" required minlength="4" value="1234">
      <label class="day-check inline"><input type="checkbox" name="unlisted"><span>مخفي من قائمة المنصة (تجربة)</span></label>
      ${state.addError ? `<p class="field-error">${esc(state.addError)}</p>` : ""}
      <div class="booking-actions"><button type="submit" class="btn">إنشاء الصالون</button><button type="button" class="btn ghost" data-act="add-cancel">إلغاء</button></div>
    </form>`;
  }

  function viewMain() {
    const salons = Store.salons();
    const all = salons.map((s) => ({ s, st: salonStats(s) }));
    const billing = Store.billing();
    const subs = salons.map((s) => ({ s, sub: Store.subState(s) }));
    const live = subs.filter((x) => x.sub.live).length;
    const mrr = subs.filter((x) => x.sub.live && x.sub.plan !== "trial")
      .reduce((a, x) => a + (x.sub.plan === "yearly" ? billing.yearly / 12 : billing.monthly), 0);
    const requests = salons.flatMap((s) => s.subscription.requests.map((r) => ({ s, r })));
    const soon = subs.filter((x) => ["expiring", "grace", "expired"].includes(x.sub.code) || (x.sub.code === "trial" && x.sub.days <= 5)).length;

    const cards = all.map(({ s, st }) => {
      const asking = state.ask === s.id;
      const sub = Store.subState(s);
      return `<article class="admin-salon" style="--salon-color:${esc(s.brand.primary)};--salon-accent:${esc(s.brand.accent)}">
        <div class="admin-salon-head">
          <span class="monogram sm" aria-hidden="true">${esc(initials(s.name))}</span>
          <div class="admin-row-main"><b>${esc(s.name)}</b><span class="hint" dir="ltr">?s=${esc(s.id)}</span></div>
          <div class="pills">
            <span class="status sub-${sub.code}">${esc(sub.label)}</span>
            ${s.unlisted ? `<span class="status past">مخفي</span>` : ""}
          </div>
        </div>
        <div class="mini-stats">
          ${(() => { const ss = Store.salonStats(s); return `<span>رضا <b class="num">${ss.pct != null ? ss.pct + "٪" : "—"}</b></span><span><b class="num">${ss.visits.toLocaleString("en-US")}</b> زيارة</span>`; })()}
          <span><b class="num">${st.total}</b> حجز</span>
          <span><b class="num">${st.upcoming}</b> قادم</span>
          <span><b class="num">${st.done}</b> مكتمل</span>
          <span><b class="num">${money(st.value)}</b></span>
          <span><b class="num">${s.services.length}</b> خدمة · <b class="num">${s.staff.length}</b> ${s.type === "men" ? "حلاق" : "مختصة"}</span>
        </div>
        <div class="sub-line">
          <span>${esc(sub.planName)} · ${sub.days >= 0 ? "ينتهي" : "انتهى"} ${shortDate(sub.endsAt)}</span>
          <span>المدفوع: <b class="num">${money(s.subscription.payments.reduce((a, p) => a + p.amount, 0))}</b></span>
        </div>
        ${state.pay === s.id ? `<form class="form pay-form" id="pay-form" data-id="${esc(s.id)}" novalidate>
            <b>تسجيل دفعة اشتراك</b>
            <div class="two">
              <div><label for="pf-plan">الباقة</label><select id="pf-plan" name="plan">
                <option value="monthly">شهرية · ${money(Store.billing().monthly)}</option>
                <option value="yearly" ${sub.plan === "yearly" ? "selected" : ""}>سنوية · ${money(Store.billing().yearly)}</option></select></div>
              <div><label for="pf-method">طريقة الدفع</label><select id="pf-method" name="method">
                <option>تحويل بنكي</option><option>نقداً</option><option>بطاقة</option></select></div>
            </div>
            <label for="pf-ref">رقم العملية (اختياري)</label><input id="pf-ref" name="ref">
            <p class="hint">يُمدَّد الاشتراك من تاريخ انتهائه، أو من اليوم إن كان منتهياً.</p>
            <div class="booking-actions"><button type="submit" class="btn">تسجيل وتمديد</button><button type="button" class="btn ghost" data-act="pay" data-v="">إلغاء</button></div>
          </form>` : ""}
        <div class="booking-actions wrap">
          <a class="btn ghost" href="${esc(link(s.id))}" target="_blank" rel="noopener">صفحة الصالون</a>
          <a class="btn ghost" href="dashboard.html?s=${esc(s.id)}" target="_blank" rel="noopener">لوحته</a>
          <button type="button" class="btn" data-act="pay" data-v="${esc(s.id)}">تسجيل دفعة</button>
          <button type="button" class="btn ghost" data-act="toggle-list" data-v="${esc(s.id)}">${s.unlisted ? "إظهار في القائمة" : "إخفاء من القائمة"}</button>
          ${s.status === "active"
            ? (asking
              ? `<div class="confirm-box full"><p>إيقاف ${esc(s.name)}؟ لن يستطيع العملاء الحجز حتى تعيد تفعيله.</p><div class="booking-actions">
                   <button type="button" class="btn danger" data-act="suspend" data-v="${esc(s.id)}">نعم، أوقف</button><button type="button" class="btn ghost" data-act="ask" data-v="">تراجع</button></div></div>`
              : `<button type="button" class="btn danger" data-act="ask" data-v="${esc(s.id)}">إيقاف</button>`)
            : `<button type="button" class="btn" data-act="activate" data-v="${esc(s.id)}">تفعيل</button>`}
        </div>
      </article>`;
    }).join("");

    return `<section class="screen">
        <header class="topbar"><div class="logo"><span class="logo-mark">ع</span>إدارة عناياتي</div>
          <div class="top-actions">${UI.themeBtn()}<button type="button" class="icon-btn" data-act="logout" aria-label="خروج">${I.out}</button></div></header>
        <div class="stats">
          <div class="stat"><b class="num">${live}/${salons.length}</b><span>صالون فعّال</span></div>
          <div class="stat"><b class="num">${Math.round(mrr).toLocaleString("en-US")}</b><span>ر.س دخل شهري</span></div>
          <div class="stat"><b class="num">${requests.length}</b><span>طلب تجديد</span></div>
          <div class="stat"><b class="num">${soon}</b><span>يحتاج متابعة</span></div>
        </div>
        ${requests.length ? `<div class="block">
          <h2 class="section-title">طلبات التجديد</h2>
          ${requests.map(({ s, r }) => `<div class="card sub-card pending">
            <div class="sub-head"><div><b>${esc(s.name)}</b><span class="hint">${esc(Store.PLAN_NAMES[r.plan])} · <span class="num">${money(r.amount)}</span> · ${shortDate(r.at)}</span></div></div>
            ${r.note ? `<p class="hint">ملاحظة التحويل: ${esc(r.note)}</p>` : ""}
            <div class="booking-actions"><button type="button" class="btn" data-act="approve" data-v="${esc(s.id)}|${esc(r.id)}">تأكيد الاستلام وتفعيل</button>
            <button type="button" class="btn ghost" data-act="reject" data-v="${esc(s.id)}|${esc(r.id)}">رفض</button></div>
          </div>`).join("")}
        </div>` : ""}
        ${state.adding ? addForm() : `<button type="button" class="btn wide add-btn" data-act="add">${I.plus} إضافة صالون</button>`}
        <div class="admin-list">${cards}</div>
        <div class="block">
          <div class="block-head"><h2 class="section-title">أسعار الاشتراك</h2><button type="button" class="link" data-act="billing">${state.billingOpen ? "إغلاق" : "تعديل"}</button></div>
          ${state.billingOpen ? `<form class="card form" id="billing-form" novalidate>
              <div class="two">
                <div><label for="bl-m">الشهري (ر.س)</label><input id="bl-m" name="monthly" type="number" min="0" inputmode="numeric" value="${billing.monthly}"></div>
                <div><label for="bl-y">السنوي (ر.س)</label><input id="bl-y" name="yearly" type="number" min="0" inputmode="numeric" value="${billing.yearly}"></div>
              </div>
              <div class="two">
                <div><label for="bl-t">أيام التجربة المجانية</label><input id="bl-t" name="trial" type="number" min="0" inputmode="numeric" value="${billing.trialDays}"></div>
                <div><label for="bl-g">أيام السماح بعد الانتهاء</label><input id="bl-g" name="grace" type="number" min="0" inputmode="numeric" value="${billing.graceDays}"></div>
              </div>
              <label for="bl-bank">بيانات التحويل البنكي (تظهر للصوالين)</label>
              <textarea id="bl-bank" name="bank" rows="3">${esc(billing.bank)}</textarea>
              <button type="submit" class="btn" style="margin-top:12px">حفظ</button>
            </form>` : `<div class="card"><div class="row"><span>الباقة الشهرية</span><span class="num">${money(billing.monthly)}</span></div>
              <div class="row"><span>الباقة السنوية</span><span class="num">${money(billing.yearly)}</span></div>
              <div class="row"><span>التجربة المجانية</span><span>${Store.daysText(billing.trialDays)}</span></div>
              <div class="row"><span>فترة السماح</span><span>${Store.daysText(billing.graceDays)}</span></div></div>`}
        </div>
        <div class="block">
          ${state.ask === "reset"
            ? `<div class="confirm-box"><p>ستُحذف كل الصوالين المضافة والحجوزات من هذا الجهاز، وتعود البيانات التجريبية. متأكد؟</p><div class="booking-actions">
                 <button type="button" class="btn danger" data-act="reset">نعم، أعِد البيانات</button><button type="button" class="btn ghost" data-act="ask" data-v="">تراجع</button></div></div>`
            : `<button type="button" class="btn ghost wide" data-act="ask" data-v="reset">إعادة البيانات التجريبية</button>`}
        </div>
      </section>`;
  }

  function render() { UI.applyBrand(null, null); $app.innerHTML = state.authed ? viewMain() : viewLogin(); }
  function setSalon(id, patch, msg) { const s = Store.salon(id); Store.saveSalon({ ...s, ...patch }); state.ask = null; render(); UI.toast(msg); }

  $app.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el) return;
    const v = el.dataset.v;
    switch (el.dataset.act) {
      case "toggle-theme": UI.toggleTheme(); render(); break;
      case "logout": try { sessionStorage.removeItem(SESSION); } catch (er) { /* لا شيء */ } state.authed = false; render(); break;
      case "add": state.adding = true; state.addError = ""; render(); document.getElementById("nw-name")?.focus(); break;
      case "add-cancel": state.adding = false; render(); break;
      case "ask": state.ask = v || null; render(); break;
      case "suspend": setSalon(v, { status: "suspended" }, "تم إيقاف الصالون"); break;
      case "activate": setSalon(v, { status: "active" }, "تم تفعيل الصالون"); break;
      case "toggle-list": { const s = Store.salon(v); setSalon(v, { unlisted: !s.unlisted }, s.unlisted ? "يظهر الآن في قائمة المنصة" : "أُخفي من قائمة المنصة"); break; }
      case "pay": state.pay = v || null; render(); break;
      case "billing": state.billingOpen = !state.billingOpen; render(); break;
      case "approve": { const [sid, rid] = v.split("|"); const r = Store.salon(sid).subscription.requests.find((x) => x.id === rid);
        Store.recordPayment(sid, { plan: r.plan, method: "تحويل بنكي", ref: r.note, requestId: rid }); render(); UI.toast("فُعّل الاشتراك"); break; }
      case "reject": { const [sid, rid] = v.split("|"); Store.rejectRequest(sid, rid); render(); UI.toast("رُفض الطلب"); break; }
      case "reset": Store.reset(); state.ask = null; render(); UI.toast("عادت البيانات التجريبية"); break;
    }
  });

  $app.addEventListener("input", (e) => {
    if (e.target.id === "nw-id") {
      e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
      document.getElementById("nw-preview").textContent = link(e.target.value || "…");
    }
  });

  $app.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    if (f.id === "login-form") {
      if (f.pass.value !== ADMIN_PASS) { state.loginError = "كلمة المرور غير صحيحة."; render(); return; }
      state.authed = true; state.loginError = "";
      try { sessionStorage.setItem(SESSION, "1"); } catch (er) { /* لا شيء */ }
      render(); return;
    }
    if (f.id === "pay-form") {
      Store.recordPayment(f.dataset.id, { plan: f.plan.value, method: f.method.value, ref: f.ref.value.trim() });
      state.pay = null; render(); UI.toast("سُجّلت الدفعة ومُدّد الاشتراك"); return;
    }
    if (f.id === "billing-form") {
      const n = (x) => Math.max(0, Math.round(Number(x) || 0));
      Store.saveBilling({ monthly: n(f.monthly.value), yearly: n(f.yearly.value), trialDays: n(f.trial.value), graceDays: n(f.grace.value), bank: f.bank.value.trim() });
      state.billingOpen = false; render(); UI.toast("حُفظت أسعار الاشتراك"); return;
    }
    if (f.id === "add-form") {
      const name = f.name.value.trim(), id = f.sid.value.trim();
      const fail = (m) => { state.addError = m; render(); const nf = document.getElementById("add-form"); nf.name.value = name; nf.sid.value = id; };
      if (!name) return fail("اكتب اسم الصالون.");
      if (!/^[a-z0-9-]{2,20}$/.test(id)) return fail("المعرّف من 2 إلى 20 حرفاً إنجليزياً صغيراً أو رقماً.");
      if (Store.salon(id)) return fail("هذا المعرّف مستخدم لصالون آخر. اختر غيره.");
      if (f.pass.value.length < 4) return fail("كلمة المرور 4 أحرف على الأقل.");
      Store.saveSalon({
        id, name, type: f.type.value, status: "active", unlisted: f.unlisted.checked, assets: false,
        password: f.pass.value, tagline: "", slogan: "", about: "", area: "", address: "",
        brand: { primary: f.primary.value, accent: f.accent.value },
        hours: { open: 10, close: 22 }, closedDays: [], services: [], staff: [], createdAt: new Date().toISOString()
      });
      state.adding = false; state.addError = ""; render();
      UI.toast(`أُنشئ الصالون بتجربة مجانية ${Store.daysText(Store.billing().trialDays)}. أرسل لصاحبه رابط لوحته وكلمة المرور.`);
    }
  });

  Store.onChange(render);
  render();
})();
