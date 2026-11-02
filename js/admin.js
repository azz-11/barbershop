/* عناياتي — لوحة إدارة المنصة (لصاحب عناياتي)
   إضافة الصوالين، إيقافها وتفعيلها، إخفاؤها من القائمة، ومتابعة أرقامها. */
(function () {
  "use strict";
  const { esc, money, initials, bookingState, I } = UI;
  const SESSION = "enayati.admin";
  const ADMIN_PASS = "admin"; /* تجريبي فقط: يُستبدل بتسجيل دخول حقيقي مع قاعدة البيانات */
  const $app = document.getElementById("app");
  const state = { authed: false, adding: false, ask: null, loginError: "", addError: "" };
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
    const active = salons.filter((s) => s.status === "active").length;
    const totalBookings = all.reduce((a, x) => a + x.st.total, 0);
    const totalValue = all.reduce((a, x) => a + x.st.value, 0);

    const cards = all.map(({ s, st }) => {
      const asking = state.ask === s.id;
      return `<article class="admin-salon" style="--salon-color:${esc(s.brand.primary)};--salon-accent:${esc(s.brand.accent)}">
        <div class="admin-salon-head">
          <span class="monogram sm" aria-hidden="true">${esc(initials(s.name))}</span>
          <div class="admin-row-main"><b>${esc(s.name)}</b><span class="hint" dir="ltr">?s=${esc(s.id)}</span></div>
          <div class="pills">
            <span class="status ${s.status === "active" ? "upcoming" : "cancelled"}">${s.status === "active" ? "نشط" : "موقوف"}</span>
            ${s.unlisted ? `<span class="status past">مخفي</span>` : ""}
          </div>
        </div>
        <div class="mini-stats">
          <span><b class="num">${st.total}</b> حجز</span>
          <span><b class="num">${st.upcoming}</b> قادم</span>
          <span><b class="num">${st.done}</b> مكتمل</span>
          <span><b class="num">${money(st.value)}</b></span>
          <span><b class="num">${s.services.length}</b> خدمة · <b class="num">${s.staff.length}</b> ${s.type === "men" ? "حلاق" : "مختصة"}</span>
        </div>
        <div class="booking-actions wrap">
          <a class="btn ghost" href="${esc(link(s.id))}" target="_blank" rel="noopener">صفحة الصالون</a>
          <a class="btn ghost" href="dashboard.html?s=${esc(s.id)}" target="_blank" rel="noopener">لوحته</a>
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
          <div class="stat"><b class="num">${salons.length}</b><span>صالون</span></div>
          <div class="stat"><b class="num">${active}</b><span>نشط</span></div>
          <div class="stat"><b class="num">${totalBookings}</b><span>حجز</span></div>
          <div class="stat"><b class="num">${totalValue.toLocaleString("en-US")}</b><span>ر.س قيمة الحجوزات</span></div>
        </div>
        ${state.adding ? addForm() : `<button type="button" class="btn wide add-btn" data-act="add">${I.plus} إضافة صالون</button>`}
        <div class="admin-list">${cards}</div>
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
      UI.toast("أُنشئ الصالون. أرسل لصاحبه رابط لوحته وكلمة المرور ليضيف خدماته وفريقه.");
    }
  });

  Store.onChange(render);
  render();
})();
