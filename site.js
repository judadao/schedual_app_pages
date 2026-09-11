const ua = navigator.userAgent.toLowerCase()
const platform = /iphone|ipad|ipod/.test(ua) ? 'ios'
  : /android/.test(ua) ? 'android'
    : /macintosh|mac os x/.test(ua) ? 'macos'
      : /windows/.test(ua) ? 'windows'
        : 'linux'

const content = {
  windows: ['Windows', '使用 Edge 或 Chrome 安裝到開始功能表與桌面。', '在網址列右側按「安裝」圖示。', '⊞'],
  macos: ['macOS', '使用 Chrome 或 Safari，把 Rosterly 加到 Dock。', '在瀏覽器選單選擇「安裝」或「加入 Dock」。', '●'],
  android: ['Android', '使用 Chrome 加到主畫面，之後可全螢幕開啟。', '在 Chrome 選單選擇「安裝應用程式」。', '◆'],
  ios: ['iPhone / iPad', '使用 Safari 加到主畫面，之後可全螢幕開啟。', '按分享按鈕，再選擇「加入主畫面」。', '●'],
  linux: ['Linux', '使用 Chrome 或 Edge 安裝成桌面應用程式。', '在網址列右側按「安裝」圖示。', '◇'],
}
const [title, copy, instruction, icon] = content[platform]
document.querySelector('[data-os-title]').textContent = `${title} 完整版`
document.querySelector('[data-os-copy]').textContent = copy
document.querySelector('[data-install-instruction]').textContent = instruction
document.querySelector('[data-os-icon]').textContent = icon

fetch('../releases/manifest.json', { cache: 'no-store' }).then(response => response.json()).then(release => {
  document.querySelector('[data-version]').textContent = `目前版本 v${release.version} · 完整 PWA` 
  const target = release.platforms?.[platform]?.url || release.fullPwa?.url
  if (target) document.querySelector('[data-install-link]').href = target
}).catch(() => { document.querySelector('[data-version]').textContent = '版本資訊暫時無法讀取，仍可開啟完整 PWA。' })
