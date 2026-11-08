const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('console', m => console.log('console:', m.text())); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('http://localhost:8765/index.html'); await p.evaluate(() => window.READY);
  const tl = await p.evaluate(() => window.TL);
  const which = process.argv.slice(2).map(Number);
  for (const i of which) {
    const s = tl.scenes[i - 1];
    const t = Math.min(s.voStart + s.dur + 0.3, s.end - 0.6);
    await p.evaluate(t => render(t), t);
    await p.screenshot({ path: `shots/s${String(i).padStart(2,'0')}.jpg`, quality: 70, type: 'jpeg' });
  }
  console.log('sfx', (await p.evaluate(() => SFX.length)));
  await b.close();
})();
