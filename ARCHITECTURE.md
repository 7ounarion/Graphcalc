# Mimari

GraphCalc, TypeScript ve Vite ile geliştirilen tek sayfalı bir uygulamadır. 2D grafikler Canvas ile, 3D sahneler three.js ile çizilir; matematik formülleri KaTeX ile gösterilir. Yazı tipleri ve çalışma zamanı bağımlılıkları derlemeye dahildir.

## Katmanlar

- `core`: DOM'dan bağımsız matematik, BigInt tabanlı kesir aritmetiği, ifade derleme ve örnekleme.
- `state`: çalışma durumu, varsayılanlar, dosya doğrulama ve paylaşım bağlantıları.
- `content`: Türkçe dersler ve soru verileri.
- `render`: 2D görünüm ve 3D sahne; hesaplamalarda çekirdeği kullanır.
- `ui`: gezinme, sayısal girişler, matris alanları ve ortak bileşenler.
- `features`: araçları ve öğrenme sayfalarını bir araya getirir. Sayfalar `FEATURES` kaydından açılır; 3D araçlar gerektiğinde yüklenir.

Bağımlılıklar araçlardan ortak katmanlara, çizim ve durum katmanlarından çekirdeğe yönelir. Çekirdek arayüzü ve çizim katmanını bilmez.

## Veri akışı

Sayısal giriş doğrulandıktan sonra çalışma durumuna uygulanır. Aboneler bir sonraki animasyon karesinde bilgilendirilir; grafik ve parametre alanları güncel durumu kullanır. Geçersiz giriş mevcut grafiği değiştirmez. Her sayfanın temizleme fonksiyonu gezinme sırasında dinleyicileri, animasyonları ve çizim kaynaklarını serbest bırakır.

Matris hücreleri kesin kesirleri korumak için metin olarak tutulur. Determinant kesir aritmetiğiyle hesaplanırken grafikler sayısal koordinatlar kullanır. Fonksiyon ifadeleri `eval` yerine izin verilen işlemlerle derlenir ve sonlu bir aralıkta örneklenir.

## Dosya biçimi

`.graphcalc` dosyaları `format: "graphcalc"` ve `version: 2` alanları olan JSON verisidir. Sayısal sürüm alanı 1 olan eski dosyalar da içe aktarılır. Dosya yüklenirken bütün durum doğrulanır; hatalı dosya mevcut çalışmayı değiştirmez. Kamera, geçici animasyon durumu ve soru yanıtları dosyaya eklenmez.

Paylaşım bağlantısı, çalışma durumunu URL'nin `#s=` bölümünde sıkıştırılmamış base64url JSON olarak taşır. Açılışta dosyalarla aynı doğrulama uygulanır.

## Paketleme

`npm run build`, statik bir web sunucusunda sunulabilecek `dist/` çıktısını üretir. Göreli kaynak yolları alt dizinde barındırmayı destekler. PWA katmanı derlenen kaynakları servis çalışanıyla önbelleğe alır ve destekleyen tarayıcılarda uygulama kurulumunu sağlar.

Masaüstü sürümü aynı web arayüzünü Tauri ve Windows WebView2 üzerinden çalıştırır. `npm run desktop:build` masaüstü paketini oluşturur. Matematik ve araç kodu web, PWA ve masaüstü sürümlerinde ortaktır.
