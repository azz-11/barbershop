const { chromium } = require('playwright'); const { spawn } = require('child_process');
const FPS = 30, W = +process.argv[2], N = +process.argv[3];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('http://localhost:8765/index.html'); await p.evaluate(() => window.READY);
  const total = await p.evaluate(() => TL.total);
  if (W === 0) require('fs').writeFileSync('sfx.json', JSON.stringify(await p.evaluate(() => ({ sfx: SFX, tl: TL }))));
  const frames = Math.ceil(total * FPS), per = Math.ceil(frames / N), f0 = W * per, f1 = Math.min(frames, f0 + per);
  const ff = spawn('ffmpeg', ['-v','error','-y','-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-r',String(FPS),`seg${W}.mp4`], { stdio: ['pipe','inherit','inherit'] });
  for (let f = f0; f < f1; f++) {
    await p.evaluate(t => render(t), f / FPS);
    const buf = await p.screenshot({ type: 'jpeg', quality: 94 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - f0) % 300 === 0) console.log(`w${W} ${f - f0}/${f1 - f0}`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close(); console.log(`w${W} done`);
})();
