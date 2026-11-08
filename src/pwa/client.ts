interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function installButton(button: HTMLButtonElement): () => void {
  let pending: InstallPrompt | undefined;
  button.hidden = true;
  const available = (event: Event) => {
    event.preventDefault();
    pending = event as InstallPrompt;
    button.hidden = false;
  };
  const installed = () => { pending = undefined; button.hidden = true; };
  const install = async () => {
    const prompt = pending;
    if (!prompt) return;
    installed();
    try { await prompt.prompt(); await prompt.userChoice; } catch { /* Tarayıcı istemi kapatılmış olabilir. */ }
  };
  window.addEventListener('beforeinstallprompt', available);
  window.addEventListener('appinstalled', installed);
  button.addEventListener('click', install);
  return () => {
    window.removeEventListener('beforeinstallprompt', available);
    window.removeEventListener('appinstalled', installed);
    button.removeEventListener('click', install);
  };
}

export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !/^https?:$/.test(location.protocol) || '__TAURI_INTERNALS__' in window || !('serviceWorker' in navigator)) return;
  let controlled = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (controlled) window.dispatchEvent(new Event('graphcalc-updated'));
    controlled = true;
  });
  void navigator.serviceWorker.register(new URL('sw.js', document.baseURI), { scope: './' })
    .catch(() => { /* Çevrimdışı ilk açılışta sonraki ziyarette yeniden denenir. */ });
}
