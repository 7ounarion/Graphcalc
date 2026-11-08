// Araç sayfaları ile uygulama kabuğu arasındaki ortak arayüz.
import type { AppState } from '../state/state';

export type Theme = 'light' | 'dark';

export interface AppContext {
  /** Güncel durumun salt okunur görüntüsü. */
  readonly state: AppState;
  /** Durumu değiştirir; aboneler bir sonraki animasyon karesinde tek kez bilgilendirilir. */
  update(mutator: (draft: AppState) => void): void;
  /** Durum değişimlerine abone olur; dönüş aboneliği kaldırır. */
  subscribe(listener: (state: AppState) => void): () => void;
  readonly theme: Theme;
  onThemeChange(listener: (theme: Theme) => void): () => void;
  /** Kısa Türkçe bildirim (ör. "Dosya kaydedildi"). */
  toast(message: string, kind?: 'info' | 'error'): void;
}

export type FeatureGroup = 'Determinant' | 'Dönüşümler' | 'Konikler' | 'Fonksiyonlar' | 'Öğren';

export interface Feature {
  id: string;            // URL'de kullanılır: #/det2d
  title: string;         // ör. "Determinant · 2D"
  group: FeatureGroup;
  /** Sayfayı host içine kurar; dönen fonksiyon tüm dinleyicileri, animasyonları ve WebGL kaynaklarını temizler. */
  mount(host: HTMLElement, ctx: AppContext): () => void;
}
