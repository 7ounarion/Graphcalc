import type { AppContext, Feature, Theme } from './types';
import { defaultState } from '../state/state';
import type { AppState } from '../state/state';
import { serialize, parseFile } from '../state/file';
import { encodeState, decodeState } from '../state/url';
import { button } from './panel';
import { installButton } from '../pwa/client';

export function mountApp(root: HTMLElement, features: Feature[]): () => void {
  let state = defaultState(), theme: Theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  let manualTheme = false;
  try { const saved = localStorage.getItem('graphcalc-theme'); if (saved === 'light' || saved === 'dark') { theme = saved; manualTheme = true; } } catch { /* Yerel depolama kapalı olabilir. */ }
  let pending = 0, toastTimer = 0, cleanup: (() => void) | undefined;
  const listeners = new Set<(state: AppState) => void>(), themeListeners = new Set<(theme: Theme) => void>();
  root.innerHTML = '<div class="app-shell"><header class="topbar"><a class="brand" href="#/det2d"><img class="brand-mark" src="./favicon.svg" alt=""><span>GraphCalc</span></a><span class="topbar-caption">Analitik geometri, görünür.</span><div class="app-actions"></div></header><aside class="sidebar"><div class="sidebar-caption">ÇALIŞMA ALANI</div><nav aria-label="Araçlar"></nav><div class="sidebar-footer">Keşfet. Değiştir. Anla.<span>Çevrimdışı geometri laboratuvarı</span></div></aside><main class="workspace" id="main-content"></main></div><div class="toast" role="status" aria-live="polite" hidden></div>';
  const main = root.querySelector<HTMLElement>('main')!, toastElement = root.querySelector<HTMLElement>('.toast')!;
  const notify = () => { if (!pending) pending = requestAnimationFrame(() => { pending = 0; listeners.forEach(listener => listener(ctx.state)); }); };
  const ctx: AppContext = {
    get state() { return structuredClone(state); },
    update(mutator) { const draft = structuredClone(state); mutator(draft); state = draft; notify(); },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    get theme() { return theme; },
    onThemeChange(listener) { themeListeners.add(listener); return () => themeListeners.delete(listener); },
    toast(message,kind = 'info') { clearTimeout(toastTimer); toastElement.textContent = message; toastElement.dataset.kind = kind; toastElement.hidden = false; toastTimer = window.setTimeout(() => { toastElement.hidden = true; },4500); },
  };
  const nav = root.querySelector('nav')!, links = new Map<string,HTMLAnchorElement>();
  const compactNav = document.createElement('select');
  compactNav.className = 'compact-nav'; compactNav.setAttribute('aria-label', 'Araç seç');
  for (const feature of features) {
    const option = document.createElement('option'); option.value = feature.id; option.textContent = feature.title; compactNav.append(option);
  }
  compactNav.addEventListener('change', () => { location.hash = `#/${compactNav.value}`; });
  root.querySelector('.topbar')!.append(compactNav);
  for (const group of [...new Set(features.map(feature => feature.group))]) {
    const heading = document.createElement('h2'); heading.textContent = group; nav.append(heading);
    for (const feature of features.filter(f => f.group === group)) {
      const link = document.createElement('a'); link.href = `#/${feature.id}`; link.textContent = feature.title; links.set(feature.id,link); nav.append(link);
    }
  }
  const save = () => {
    const url = URL.createObjectURL(new Blob([serialize(state)],{type:'application/json'}));
    const a = document.createElement('a'); a.href = url; a.download = 'calisma.graphcalc'; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000); ctx.toast('Çalışma dosyası indirildi.');
  };
  const fileInput = document.createElement('input'); fileInput.type = 'file'; fileInput.accept = '.graphcalc,.json,application/json'; fileInput.hidden = true; root.append(fileInput);
  fileInput.addEventListener('change',() => {
    const file = fileInput.files?.[0]; if (!file) return;
    void file.text().then(text => {
      const parsed = parseFile(text);
      if (!parsed.ok) { ctx.toast(parsed.error,'error'); return; }
      state = parsed.state; remount(); ctx.toast('Çalışma dosyası açıldı.');
    }).catch(() => ctx.toast('Dosya okunamadı.','error')).finally(() => { fileInput.value = ''; });
  });
  const actions = root.querySelector('.app-actions')!;
  actions.append(button('Kaydet',save),button('Aç',() => fileInput.click()),button('Paylaş',() => {
    const url = new URL(location.href); url.hash = encodeState(state);
    if (!navigator.clipboard) { ctx.toast('Bağlantı kopyalanamadı. Tarayıcı izinlerini kontrol edin.','error'); return; }
    void navigator.clipboard.writeText(url.href).then(() => ctx.toast('Paylaşım bağlantısı kopyalandı.')).catch(() => ctx.toast('Bağlantı kopyalanamadı. Tarayıcı izinlerini kontrol edin.','error'));
  }));
  const install = button('Uygulamayı yükle', () => {});
  const cleanupInstall = installButton(install); actions.append(install);
  const updated = () => ctx.toast('GraphCalc güncellendi. Yeni sürüm için sayfayı yenileyin.');
  window.addEventListener('graphcalc-updated', updated);
  function setTheme(next: Theme) {
    theme = next; document.documentElement.dataset.theme = theme;
    themeButton.textContent = theme === 'dark' ? '☀ Açık tema' : '☾ Koyu tema'; themeButton.setAttribute('aria-pressed',String(theme === 'dark'));
    themeListeners.forEach(listener => listener(theme));
  }
  const themeButton = button('Tema',() => { manualTheme = true; setTheme(theme === 'dark' ? 'light' : 'dark'); try { localStorage.setItem('graphcalc-theme',theme); } catch { /* Tema bu oturumda korunur. */ } }); actions.append(themeButton); setTheme(theme);
  const media = matchMedia('(prefers-color-scheme: dark)');
  const systemTheme = () => { if (!manualTheme) setTheme(media.matches ? 'dark' : 'light'); }; media.addEventListener('change',systemTheme);
  let active: Feature | undefined;
  function remount() { cleanup?.(); main.replaceChildren(); if (active) cleanup = active.mount(main,ctx); }
  function route() {
    if (location.hash.startsWith('#s=')) {
      const shared = decodeState(location.hash);
      if (shared.ok) { state = shared.state; ctx.toast('Paylaşılan çalışma yüklendi.'); } else ctx.toast(shared.error,'error');
      history.replaceState(null,'',`${location.pathname}${location.search}#/${features[0]?.id ?? ''}`);
    }
    const segments = location.hash.slice(2).split('/');
    const id = segments[0], feature = features.find(f => f.id === id) ?? features[0];
    if (!feature) return;
    if (!id || feature.id !== id) history.replaceState(null,'',`#/${feature.id}`);
    if (active === feature) return;
    active = feature; document.title = `${feature.title} — GraphCalc`;
    compactNav.value = feature.id;
    links.forEach((link,key) => { if (key === feature.id) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current'); });
    remount();
  }
  const keydown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
      if (e.key.toLowerCase() === 'o') { e.preventDefault(); fileInput.click(); }
    }
    if (e.key === 'F11') {
      e.preventDefault(); const operation = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
      void operation.catch(() => ctx.toast('Tam ekran bu tarayıcıda kullanılamıyor.'));
    }
    if (e.key === 'Escape' && document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  };
  window.addEventListener('hashchange',route); window.addEventListener('keydown',keydown); route();
  return () => { cleanupInstall(); window.removeEventListener('graphcalc-updated', updated); cleanup?.(); cancelAnimationFrame(pending); clearTimeout(toastTimer); window.removeEventListener('hashchange',route); window.removeEventListener('keydown',keydown); media.removeEventListener('change',systemTheme); root.replaceChildren(); };
}
