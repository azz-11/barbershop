/* يولّد لكل صالون في js/data.js:
   - icons/salons/<id>-192.png و -512.png و -180.png  (أيقونة التطبيق عند التثبيت)
   - manifests/<id>.webmanifest                        (اسم الصالون عند التثبيت)
   - qr/<id>.svg                                       (رمز QR لرابط الصالون)
   - qr/<id>-card.png                                  (بطاقة طاولة للطباعة A6 بدقة 300dpi)
   التشغيل:  cd tools && npm install && npm run salons
   يحتاج Playwright مثبتاً (موجود في بيئة التطوير). */
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const BASE_URL = process.env.ENAYATI_URL || "https://azz-11.github.io/barbershop/";
global.window = {};
require(path.join(ROOT, "js/data.js"));
const { salons } = global.window.ENAYATI_DATA;

const FONT = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@500;700&display=swap">';
const initials = (name) => name.replace(/^(صالون|ستوديو|ال)\s*/, "").trim().charAt(0);
const mk = (d) => fs.mkdirSync(path.join(ROOT, d), { recursive: true });

function iconHtml(s, size) {
  return `<!doctype html><html dir="rtl"><head><meta charset="utf-8">${FONT}<style>
    html,body{margin:0;width:${size}px;height:${size}px}
    body{background:${s.brand.primary};position:relative;font-family:"IBM Plex Sans Arabic",sans-serif;overflow:hidden}
    .band{position:absolute;inset:auto 0 0;height:16%;background:${s.brand.accent}}
    .l{position:absolute;inset:0 0 10% 0;display:grid;place-items:center;color:#fff;font-weight:700;font-size:${size * 0.5}px;line-height:1}
  </style></head><body><div class="l">${initials(s.name)}</div><div class="band"></div></body></html>`;
}

function cardHtml(s, qrSvg, url) {
  /* A6 عمودي: 105×148 مم = 1240×1748 بكسل عند 300dpi */
  return `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8">${FONT}<style>
    html,body{margin:0;width:1240px;height:1748px}
    body{background:${s.brand.primary};color:#fff;font-family:"IBM Plex Sans Arabic",sans-serif;display:flex;flex-direction:column;align-items:center;text-align:center;position:relative;overflow:hidden}
    .mono{margin-top:150px;width:200px;height:200px;border-radius:56px;display:grid;place-items:center;font-size:110px;font-weight:700;background:rgba(255,255,255,.14);box-shadow:inset 0 -18px 0 0 ${s.brand.accent}}
    h1{margin:48px 0 0;font-size:112px;line-height:1.1}
    .slogan{margin:18px 0 0;font-size:52px;color:${s.brand.accent};font-weight:500}
    .qr{margin-top:70px;background:#fff;border-radius:48px;padding:44px;width:560px;height:560px}
    .qr svg{width:100%;height:100%;display:block}
    .cta{margin:56px 0 0;font-size:66px;font-weight:700}
    .url{margin:14px 0 0;font-size:30px;opacity:.75;direction:ltr}
    .band{position:absolute;inset:auto 0 0;height:120px;background:${s.brand.accent};display:grid;place-items:center;font-size:32px;color:${s.brand.primary};font-weight:700}
  </style></head><body>
    <div class="mono">${initials(s.name)}</div>
    <h1>${s.name}</h1>
    <p class="slogan">${s.slogan}</p>
    <div class="qr">${qrSvg}</div>
    <p class="cta">امسح الرمز واحجز موعدك</p>
    <p class="url">${url.replace(/^https:\/\//, "")}</p>
    <div class="band">يعمل بواسطة عناياتي</div>
  </body></html>`;
}

(async () => {
  ["icons/salons", "manifests", "qr"].forEach(mk);
  const browser = await chromium.launch();
  for (const s of salons) {
    const url = `${BASE_URL}?s=${s.id}`;

    for (const size of [192, 512, 180]) {
      const page = await browser.newPage({ viewport: { width: size, height: size } });
      await page.setContent(iconHtml(s, size), { waitUntil: "networkidle" });
      await page.screenshot({ path: path.join(ROOT, `icons/salons/${s.id}-${size}.png`) });
      await page.close();
    }

    const manifest = {
      name: s.name, short_name: s.name, description: `${s.slogan}. احجز موعدك في ${s.name}.`,
      lang: "ar", dir: "rtl", id: `../?s=${s.id}`, start_url: `../?s=${s.id}`, scope: "../",
      display: "standalone", orientation: "portrait", background_color: s.brand.primary, theme_color: s.brand.primary,
      icons: [
        { src: `../icons/salons/${s.id}-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
        { src: `../icons/salons/${s.id}-512.png`, sizes: "512x512", type: "image/png", purpose: "any maskable" }
      ]
    };
    fs.writeFileSync(path.join(ROOT, `manifests/${s.id}.webmanifest`), JSON.stringify(manifest, null, 2) + "\n");

    const qrSvg = await QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#111111", light: "#ffffff" } });
    fs.writeFileSync(path.join(ROOT, `qr/${s.id}.svg`), qrSvg);

    const page = await browser.newPage({ viewport: { width: 1240, height: 1748 } });
    await page.setContent(cardHtml(s, qrSvg, url), { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(ROOT, `qr/${s.id}-card.png`) });
    await page.close();
    console.log("✓", s.name, url);
  }
  await browser.close();
})();
