import type { AppState } from './state';
import { serialize, parseFile } from './file';
import type { FileResult } from './file';
export function encodeState(state: AppState): string {
  const bytes = new TextEncoder().encode(serialize(state));
  let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte);
  return '#s='+btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
export function decodeState(hash: string): FileResult {
  try {
    if (!hash.startsWith('#s=') || !/^[A-Za-z0-9_-]+$/.test(hash.slice(3))) throw new Error();
    const value = hash.slice(3).replace(/-/g,'+').replace(/_/g,'/');
    const binary = atob(value+'='.repeat((4-value.length%4)%4));
    const bytes = Uint8Array.from(binary,c => c.charCodeAt(0));
    return parseFile(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  } catch { return {ok:false,error:'Geçersiz paylaşım bağlantısı.'}; }
}
