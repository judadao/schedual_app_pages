const ua = navigator.userAgent.toLowerCase()
const platform = /iphone|ipad|ipod/.test(ua) ? 'ios'
  : /android/.test(ua) ? 'android'
    : /macintosh|mac os x/.test(ua) ? 'macos'
      : /windows/.test(ua) ? 'windows'
        : 'linux'

const content = {
  windows: ['Windows x64', '下載標準安裝程式，支援開始功能表、桌面捷徑與原地升級。', '執行下載的 EXE，依照 Windows 安裝精靈完成安裝。', '⊞'],
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
  const selected = release.platforms?.[platform]
  const target = selected?.url || release.fullPwa?.url
  const link = document.querySelector('[data-install-link]')
  document.querySelector('[data-version]').textContent = `目前版本 v${release.version} · ${selected?.kind === 'installer' ? 'Windows x64 安裝程式' : '完整 PWA'}`
  if (target) link.href = selected?.kind === 'installer' ? target : `${target}?install=1`
  if (selected?.kind === 'installer') {
    link.innerHTML = '下載 Windows 安裝檔 <span>↓</span>'
    link.setAttribute('download', '')
    document.querySelector('[data-step-one-title]').textContent = '下載安裝程式'
    document.querySelector('[data-step-one-copy]').textContent = '下載 Rosterly-Setup 安裝檔，不需要先開啟網頁工作區。'
    document.querySelector('[data-step-two-title]').textContent = '執行安裝或升級'
  }
}).catch(() => { document.querySelector('[data-version]').textContent = '版本資訊暫時無法讀取；可使用 PWA 安裝頁，或稍後重試下載。' })
