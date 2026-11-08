import 'katex/dist/katex.min.css';
import './style.css';
import { mountApp } from './ui/app';
import { FEATURES } from './features/registry';
mountApp(document.querySelector<HTMLElement>('#app')!,FEATURES);

import { registerServiceWorker } from './pwa/client';
registerServiceWorker();
