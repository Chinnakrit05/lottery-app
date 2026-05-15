import { BrowserWindow } from 'electron';
import { SPLASH_ICON_B64 } from './splash-icon';

const SPLASH_HTML = `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8" />
<title>LotteryApp</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 100%; height: 100%;
    background: transparent;
    font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Segoe UI", system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    user-select: none;
    overflow: hidden;
  }
  .card {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    background:
      radial-gradient(circle at 75% 20%, rgba(255,220,200,0.35), transparent 50%),
      linear-gradient(180deg, #6c82c8 0%, #9b69c8 100%);
    color: white;
    border-radius: 28px;
    border: 1px solid rgba(255,255,255,0.18);
    box-shadow: 0 20px 80px rgba(0,0,0,0.45);
    -webkit-app-region: drag;
  }
  .icon-wrap {
    width: 128px; height: 128px;
    border-radius: 28px;
    overflow: hidden;
    box-shadow: 0 14px 40px rgba(0,0,0,0.35);
    margin-bottom: 22px;
    animation: pop 700ms cubic-bezier(.2,.8,.2,1.2);
  }
  .icon-wrap img { width: 100%; height: 100%; display: block; }

  .title {
    font-size: 22px; font-weight: 700;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  .subtitle {
    font-size: 13px; opacity: 0.78;
    margin-bottom: 26px;
  }

  .dots {
    display: flex; gap: 8px;
  }
  .dot {
    width: 9px; height: 9px;
    border-radius: 50%;
    background: rgba(255,255,255,0.85);
    animation: bounce 1.2s infinite ease-in-out;
  }
  .dot:nth-child(2) { animation-delay: 0.15s; }
  .dot:nth-child(3) { animation-delay: 0.30s; }

  .footer {
    position: absolute; bottom: 18px;
    font-size: 11px; opacity: 0.55;
    letter-spacing: 0.6px;
  }

  @keyframes bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
    40%           { transform: translateY(-8px); opacity: 1; }
  }
  @keyframes pop {
    0%   { transform: scale(0.5); opacity: 0; }
    60%  { transform: scale(1.06); opacity: 1; }
    100% { transform: scale(1); }
  }
</style>
</head>
<body>
  <div class="card">
    <div class="icon-wrap">
      <img alt="LotteryApp" src="data:image/png;base64,${SPLASH_ICON_B64}" />
    </div>
    <div class="title">LotteryApp</div>
    <div class="subtitle">ระบบจัดการหวย</div>
    <div class="dots">
      <span class="dot"></span><span class="dot"></span><span class="dot"></span>
    </div>
    <div class="footer">กำลังโหลด…</div>
  </div>
</body>
</html>`;

export function createSplashWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 360,
    height: 380,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    center: true,
    show: false,
    hasShadow: false,
    backgroundColor: '#00000000',
    title: 'LotteryApp',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(SPLASH_HTML));
  win.once('ready-to-show', () => win.show());
  return win;
}
