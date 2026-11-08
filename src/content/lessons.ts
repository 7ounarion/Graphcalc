import type { Lesson } from './types';

// Exact source fragments keep the approved prose intact while rendering its math.
export const LESSON_INLINE_FORMULAS: readonly (readonly [string, string])[] = [
  ['A = [[2, 1], [0, 3]]', String.raw`A=\begin{bmatrix}2&1\\0&3\end{bmatrix}`],
  ['A = [[−1, 0], [0, 1]]', String.raw`A=\begin{bmatrix}-1&0\\0&1\end{bmatrix}`],
  ['A=[[-1,0],[0,1]]', String.raw`A=\begin{bmatrix}-1&0\\0&1\end{bmatrix}`],
  ['det A = 2·3 − 1·0 = 6', String.raw`\det A=2\cdot3-1\cdot0=6`],
  ['a11=−1, a12=0, a21=0, a22=1', String.raw`a_{11}=-1,\ a_{12}=0,\ a_{21}=0,\ a_{22}=1`],
  ['|det(B−A, C−A)| / 2', String.raw`\frac{|\det(B-A,C-A)|}{2}`],
  ['|det A|', String.raw`|\det A|`],
  ['det A < 0', String.raw`\det A<0`],
  ['det A = −1', String.raw`\det A=-1`],
  ['det A ≠ 0', String.raw`\det A\ne0`],
  ['det A = 0', String.raw`\det A=0`],
  ['det = 0', String.raw`\det=0`],
  ['det = 1', String.raw`\det=1`],
  ['P=(1,2)', String.raw`P=(1,2)`],
  ['(3,−1)', String.raw`(3,-1)`],
  ['P′=(4,1)', String.raw`P'=(4,1)`],
  ['(x,y) → (−y,x)', String.raw`(x,y)\to(-y,x)`],
  ['(2,1) → (−1,2)', String.raw`(2,1)\to(-1,2)`],
  ['P′ = C + Rθ(P−C)', String.raw`P'=C+R_\theta(P-C)`],
  ['C=(1,1)', String.raw`C=(1,1)`],
  ['P=(1,0)', String.raw`P=(1,0)`],
  ['(2,1)', String.raw`(2,1)`],
  ['(1,2)', String.raw`(1,2)`],
  ['(2,0)', String.raw`(2,0)`],
  ['(0,3)', String.raw`(0,3)`],
  ['90°', String.raw`90^\circ`],
  ['θ', String.raw`\theta`],
  ['2×2', String.raw`2\times2`],
  ['3×3', String.raw`3\times3`],
  ['y=f(x)', String.raw`y=f(x)`],
  ['x²+y²=9', String.raw`x^2+y^2=9`],
  ['y=x²', String.raw`y=x^2`],
  ['x=3cos t, y=3sin t', String.raw`x=3\cos t,\ y=3\sin t`],
  ['(x−2)²+(y+1)²=9', String.raw`(x-2)^2+(y+1)^2=9`],
  ['(2,−1)', String.raw`(2,-1)`],
  ['r=3', String.raw`r=3`],
  ['a=b', String.raw`a=b`],
  ['a>b', String.raw`a>b`],
  ['c=√(a²−b²)', String.raw`c=\sqrt{a^2-b^2}`],
  ['(h,k+p)', String.raw`(h,k+p)`],
  ['(h,k)', String.raw`(h,k)`],
  ['y=k−p', String.raw`y=k-p`],
  ['p>0', String.raw`p>0`],
  ['p<0', String.raw`p<0`],
  ['x²=4y', String.raw`x^2=4y`],
  ['(0,1)', String.raw`(0,1)`],
  ['y−k=±(b/a)(x−h)', String.raw`y-k=\pm\frac{b}{a}(x-h)`],
];

export const LESSONS: Lesson[] = [
  {
    "id": "determinant",
    "title": "Determinant",
    "blocks": [
      {
        "kind": "text",
        "text": "NEDEN KULLANIYORUZ?"
      },
      {
        "kind": "text",
        "text": "Bir matrisin sadece sayılar tablosu olmadığını düşün: A, her vektörü yeni bir vektöre götüren bir dönüşüm olabilir. Determinant, bu dönüşümün alanı veya hacmi kaç kat değiştirdiğini ve yönelimi koruyup korumadığını tek sayıyla anlatır."
      },
      {
        "kind": "text",
        "text": "TEMEL FİKİR"
      },
      {
        "kind": "text",
        "text": "2D'de sütun vektörlerinin oluşturduğu paralelkenarın alanı |det A|, 3D'de paralelyüzlünün hacmi |det A|'dır. İşaret ölçünün yönünü değil, bazın yönelimini anlatır. det A < 0 ise yönelim tersine döner; alan/hacim negatif olmaz."
      },
      {
        "kind": "text",
        "text": "ÖRNEK"
      },
      {
        "kind": "text",
        "text": "A = [[2, 1], [0, 3]] için det A = 2·3 − 1·0 = 6. Birim kare alanı 6 olan bir paralelkenara dönüşür. A = [[−1, 0], [0, 1]] için det A = −1: alan aynı kalır, yönelim tersine döner."
      },
      {
        "kind": "text",
        "text": "NE ZAMAN İŞE YARAR?"
      },
      {
        "kind": "text",
        "text": "• İki düzlem vektörünün bağımsız olup olmadığını kontrol ederken: det = 0 ise bağımlıdırlar."
      },
      {
        "kind": "text",
        "text": "• Kare bir doğrusal denklem sisteminde tek çözüm olup olmadığını incelerken: det A ≠ 0 ise A tersinirdir ve her sağ taraf için tek çözüm vardır. det A = 0 ise hiç çözüm veya sonsuz çözüm olabilir."
      },
      {
        "kind": "text",
        "text": "• Üç noktadan oluşan üçgenin alanında: |det(B−A, C−A)| / 2."
      },
      {
        "kind": "text",
        "text": "• Daha sonra çok değişkenli analizde değişken dönüşümlerinin yerel alan/hacim etkisini anlamada."
      },
      {
        "kind": "text",
        "text": "YAYGIN KARIŞIKLIK"
      },
      {
        "kind": "pitfall",
        "text": "det = 0 demek her noktanın orijine gitmesi demek değildir; dönüşüm bir boyutu kaybedebilir. Ayrıca det = 1 tek başına dönme anlamına gelmez: kayma dönüşümleri de alanı koruyabilir."
      },
      {
        "kind": "text",
        "text": "DENE"
      },
      {
        "kind": "text",
        "text": "Determinant ekranında a11=−1, a12=0, a21=0, a22=1 yap; yani A=[[-1,0],[0,1]]. Dönüşüm t kaydırıcısıyla birim karenin yansımasını incele."
      }
    ]
  },
  {
    "id": "oteleme-ve-donme",
    "title": "Öteleme ve dönme",
    "blocks": [
      {
        "kind": "text",
        "text": "NEDEN KULLANIYORUZ?"
      },
      {
        "kind": "text",
        "text": "Bir şeklin konumunu veya baktığı yönü değiştirmek isteriz. Öteleme şekli taşır, dönme bir merkez etrafında çevirir. İkisi de uzaklıkları ve alanı korur; koordinatlarla hareketi hesaplayabilmemizi sağlar."
      },
      {
        "kind": "text",
        "text": "ÖTELEME"
      },
      {
        "kind": "formula",
        "text": "T(x,y) = (x+dx, y+dy)."
      },
      {
        "kind": "text",
        "text": "Örneğin P=(1,2), öteleme vektörü (3,−1) ise P′=(4,1). Bütün noktalar aynı vektör kadar hareket eder. Şekil büyümez, eğilmez, aynalanmaz."
      },
      {
        "kind": "text",
        "text": "DÖNME"
      },
      {
        "kind": "text",
        "text": "Orijin etrafında pozitif θ açısı, saat yönünün tersidir:"
      },
      {
        "kind": "formula",
        "text": "x' = x\\cos\\theta - y\\sin\\theta"
      },
      {
        "kind": "formula",
        "text": "y' = x\\sin\\theta + y\\cos\\theta"
      },
      {
        "kind": "text",
        "text": "90° için (x,y) → (−y,x). Örneğin (2,1) → (−1,2)."
      },
      {
        "kind": "formula",
        "text": "R_\\theta = \\begin{pmatrix}\\cos\\theta & -\\sin\\theta \\\\ \\sin\\theta & \\cos\\theta\\end{pmatrix}"
      },
      {
        "kind": "text",
        "text": "ve"
      },
      {
        "kind": "formula",
        "text": "\\det R_\\theta = 1."
      },
      {
        "kind": "text",
        "text": "Uygulamadaki açı derece cinsindendir; sin/cos hesabı içeride radyana çevrilir."
      },
      {
        "kind": "text",
        "text": "BAŞKA BİR MERKEZ"
      },
      {
        "kind": "text",
        "text": "C etrafında dönme: P′ = C + Rθ(P−C). Önce merkezi orijine taşı, döndür, sonra geri taşı. Örneğin C=(1,1) çevresinde (2,1)'i 90° döndürürsen (1,2) elde edersin."
      },
      {
        "kind": "text",
        "text": "İŞLEM SIRASI NEDEN ÖNEMLİ?"
      },
      {
        "kind": "example",
        "text": "P=(1,0) için önce 90° dönme, sonra (2,0) öteleme sonucu (2,1)'dir. Önce öteleme, sonra orijin etrafında dönme sonucu (0,3)'tür. Aynı iki işlem, farklı sıralarda farklı sonuç verebilir."
      },
      {
        "kind": "text",
        "text": "NE ZAMAN İŞE YARAR?"
      },
      {
        "kind": "text",
        "text": "• Bir çemberi, elipsi veya başka bir eğriyi istediğin konuma yerleştirirken."
      },
      {
        "kind": "text",
        "text": "• Koordinat eksenlerini uygun seçerek bir problemi sadeleştirirken. Buradaki grafikler şeklin sabit eksenler içindeki hareketini gösterir; eksen döndürme hesabında işaret ilişkisi ayrıca ele alınır."
      },
      {
        "kind": "text",
        "text": "• Bilgisayar grafikleri, oyunlar, robot kolları ve harita koordinatlarında."
      },
      {
        "kind": "text",
        "text": "ÖNEMLİ AYRIM"
      },
      {
        "kind": "text",
        "text": "Sıfırdan farklı öteleme, 2×2 bir doğrusal dönüşüm değildir; çünkü orijini sabit tutmaz. Ötelemeyi de matrislerle birleştirmek için 3×3 homojen koordinatlar kullanılabilir. Uzunluk/alan korunması yine geçerlidir."
      }
    ]
  },
  {
    "id": "egriler",
    "title": "Eğriler",
    "blocks": [
      {
        "kind": "text",
        "text": "EĞRİ NEDİR?"
      },
      {
        "kind": "text",
        "text": "Bu derste eğriyi, düzlemde bir doğru veya çember gibi bir boyutlu bir geometrik iz olarak düşünebilirsin. Tek bir nokta genel olarak eğri sayılmaz; bir denklem özel durumda tek noktaya indirgenirse buna yozlaşmış durum denebilir. Eğri her zaman y=f(x) biçiminde yazılamaz: x²+y²=9 çemberinde aynı x için iki farklı y olabilir."
      },
      {
        "kind": "text",
        "text": "ÜÇ ANLATIM BİÇİMİ"
      },
      {
        "kind": "text",
        "text": "Açık: y=x². Örtük: x²+y²=9. Parametrik: x=3cos t, y=3sin t. Aynı geometrik şekil birden çok biçimde anlatılabilir. Parametrik anlatım bir noktayı t değişirken izleyerek çizim yapmayı kolaylaştırır."
      },
      {
        "kind": "text",
        "text": "ÇEMBER"
      },
      {
        "kind": "formula",
        "text": "(x-h)^2+(y-k)^2=r^2."
      },
      {
        "kind": "text",
        "text": "Merkez (h,k), yarıçap r. Merkeze uzaklığı sabit noktalar kümesidir. Örnek: (x−2)²+(y+1)²=9 için merkez (2,−1), r=3."
      },
      {
        "kind": "text",
        "text": "ELİPS"
      },
      {
        "kind": "formula",
        "text": "\\frac{(x-h)^2}{a^2}+\\frac{(y-k)^2}{b^2}=1, \\quad a,b>0."
      },
      {
        "kind": "text",
        "text": "Eksenlere paralel bu biçimde yatay yarı eksen a, düşey yarı eksen b'dir. İki odağa uzaklıkların toplamı sabittir. a=b olursa çember elde edilir. Eğer a>b ise odaklar merkezden yatay doğrultuda c=√(a²−b²) kadar uzaktadır."
      },
      {
        "kind": "text",
        "text": "PARABOL"
      },
      {
        "kind": "formula",
        "text": "(x-h)^2=4p(y-k), \\quad p\\ne 0."
      },
      {
        "kind": "text",
        "text": "Tepe (h,k), odak (h,k+p), doğrultman y=k−p. Odağa ve doğrultmana uzaklıkları eşit noktaların kümesidir. p>0 yukarı, p<0 aşağı açılır. Örnek: x²=4y için odak (0,1)."
      },
      {
        "kind": "text",
        "text": "HİPERBOL"
      },
      {
        "kind": "formula",
        "text": "\\frac{(x-h)^2}{a^2}-\\frac{(y-k)^2}{b^2}=1."
      },
      {
        "kind": "text",
        "text": "İki ayrı kol vardır. İki odağa uzaklıkların farkının mutlak değeri sabittir. Eksenlere paralel bu biçimde asimptotlar y−k=±(b/a)(x−h)'dir. Kolları birbirine çizgiyle bağlamak matematiksel olarak yanlıştır."
      },
      {
        "kind": "text",
        "text": "NE ZAMAN KULLANIRIZ?"
      },
      {
        "kind": "text",
        "text": "Uzaklık koşullarını denkleme çevirmede, yörüngeleri modellemede, optikte odak özelliklerini anlamada ve geometrik tasarımda. Örneğin ideal parabolik yansıtıcı, eksenine paralel ışınları odağında toplar."
      },
      {
        "kind": "text",
        "text": "DÖNÜŞÜMLERLE BAĞLANTI"
      },
      {
        "kind": "text",
        "text": "Öteleme merkezi veya tepeyi taşır. Dönme eğrinin doğrultusunu değiştirir; çemberi kendi merkezi etrafında döndürmek görünümünü değiştirmez. Konikler ekranında kesikli eğri başlangıç, renkli eğri dönmüş ve ötelenmiş hâlidir. Parametreyi değiştirince eğrinin kendisi de değişir; bu hareketten farklıdır."
      }
    ]
  }
];
