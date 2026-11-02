/* عناياتي — لوحة صاحب الصالون
   يدخل صاحب الصالون ويدير بيانات صالونه فقط: الحجوزات، الخدمات، الفريق، الإعدادات. */
(function () {
  "use strict";
  const { esc, money, fromMin, toMin, fmtTime, hourLabel, isoDate, fmtDate, initials, DAYS, bookingState, I } = UI;
  const SESSION = "enayati.owner";
  const $app = document.getElementById("app");

  const state = {
    salonId: null, tab: "bookings", filter: "today",
    edit: null,         // معرّف الخدمة أو المختص قيد التعديل، أو "new"
    ask: null,          // تأكيد حذف أو إلغاء
    loginError: ""
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
        <p class="hint">${b.serviceNames.map(esc).join("، ")} · ${esc(b.staffName)} · <span class="num">${money(b.total)}</span> · ${b.payment === "cash" ? "دفع في الصالون" : "مدفوع"}</p>
        ${actions}
      </article>`;
    }).join("");

    return `<section class="screen">
        ${header(s)}
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
            <div class="admin-row-main"><b>${esc(m.name)}</b><span class="hint">${esc(m.role || "")}${m.years ? ` · <span class="num">${m.years}</span> سنة` : ""} · حجوزات اليوم: <span class="num">${n}</span></span></div>
            <div class="row-actions"><button type="button" class="link" data-act="edit" data-v="${esc(m.id)}">تعديل</button><button type="button" class="link danger-text" data-act="ask" data-v="st:${esc(m.id)}">إزالة</button></div>
          </div>`;
    }).join("");
    return `<section class="screen">
        ${header(s)}
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
    $app.innerHTML = { bookings: viewBookings, services: viewServices, team: viewTeam, settings: viewSettings }[state.tab](s);
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
      case "copy": UI.copy(document.getElementById("share-link").value, document.getElementById("share-link")); break;
      case "b-done": Store.updateBooking(v, { status: "completed" }); state.ask = null; render(); UI.toast("سُجّل الحضور"); break;
      case "b-noshow": Store.updateBooking(v, { status: "noshow" }); state.ask = null; render(); UI.toast("سُجّل عدم الحضور"); break;
      case "b-cancel": Store.updateBooking(v, { status: "cancelled", cancelledBy: "salon" }); state.ask = null; render(); UI.toast("تم إلغاء الحجز"); break;
      case "svc-del": update((s) => { s.services = s.services.filter((x) => x.id !== v); }, "تم حذف الخدمة"); break;
      case "st-del": update((s) => { s.staff = s.staff.filter((x) => x.id !== v); }, "تمت الإزالة من الفريق"); break;
    }
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
      if (f.pass.value && f.pass.value.length < 4) { err.textContent = "كلمة المرور 4 أحرف على الأقل."; err.hidden = false; return; }
      update((s) => {
        Object.assign(s, {
          name: f.name.value.trim(), slogan: f.slogan.value.trim(), tagline: f.tagline.value.trim(),
          type: f.type.value, area: f.area.value.trim(), address: f.address.value.trim(), about: f.about.value.trim(),
          brand: { primary: f.primary.value, accent: f.accent.value },
          hours: { open, close },
          closedDays: [...f.querySelectorAll('input[name="closed"]:checked')].map((x) => Number(x.value))
        });
        if (f.pass.value) s.password = f.pass.value;
      }, "حُفظت الإعدادات، وظهرت للعملاء");
    }
  });

  Store.onChange(render);
  render();
})();
