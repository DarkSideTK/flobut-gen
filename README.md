# FloBut — Floating Button Lottie Generator & Player

Floating button Lottie animation generator & player. Create carousel-style floating button animations from PSD/PNG files — no After Effects needed.

> PSD veya PNG dosyalarından, After Effects kullanmadan carousel tarzı floating button Lottie animasyonları üretir.

🌐 **[Live Demo / Canlı Demo](https://darksidetk.github.io/flobut-gen)**

---

## 🇬🇧 English

### What is FloBut?

FloBut automatically creates **floating button animations** used in mobile apps and websites. It has two modes:

- **Generator** — Upload PSD or PNG files, configure layer settings, generate Lottie JSON with one click.
- **Player** — Preview generated or existing Lottie JSON files, adjust speed, scrub frame by frame.

### Quick Start

1. Open `index.html` in your browser (or visit the [live demo](https://darksidetk.github.io/flobut-gen))
2. Drag & drop PSD or image files into the left panel
3. Reorder layers and set animation options for each
4. Click **"Lottie Oluştur"** (Generate Lottie)
5. Preview the animation, then click **"İndir"** (Download) to save the JSON

### ⚠️ PSD Preparation Rules (CRITICAL)

Follow these rules before uploading your PSD to FloBut. Otherwise layers won't be detected correctly or the animation will break.

#### 1. Rasterize All Layers

Every layer **must be rasterized**. The following types are **not accepted**:

- Smart Objects
- Group layers (Folders)
- Adjustment Layers
- Layers with live Layer Styles/Effects

**How to:** Right-click the layer in Photoshop → **"Rasterize Layer"**. Rasterize all effects and groups one by one.

#### 2. Layer Naming Convention

Layers must be named according to their **animation order**:

| Layer Name | Type | Description |
|------------|------|-------------|
| `bg` | Background | Static background image |
| `bg_1` | Background 1 | First background (if multiple) |
| `bg_2` | Background 2 | Second background |
| `bg_3` | Background 3 | Third background |
| `icon_1` | Main Icon | First icon in carousel order |
| `icon_2` | Main Icon | Second icon in carousel order |
| `text_1` | Text | Text/label layer |

**Important:** Layers containing `bg` in the name are automatically detected as **Background** type. Layers containing `text` are detected as **Text** type.

#### 3. Layer Visibility

- All layers must have **visibility turned ON** (eye icon visible)
- **Hidden layers are not imported** and won't appear in the animation
- You can hide unwanted layers from within FloBut instead of deleting them

#### 4. PSD Canvas Size

- Canvas size is flexible — FloBut automatically scales to a **500×500px** workspace
- For best results, use a **square (1:1) canvas** (e.g., 1000×1000px)

### Animation Types

| Animation | Description |
|-----------|-------------|
| **Bounce Pop-in** | Layer scales from 0% to 110%, bounces, settles at 100% (8 frames) |
| **Bounce + Rotate 720°** | Pop-in with 720° rotation (ideal for backgrounds) |
| **None** | Layer remains static |

### Timing Options

| Entry | Description |
|-------|-------------|
| **Wait for Turn** | Enters at a specific frame based on carousel order |
| **Start at Frame 0** | Appears immediately when animation starts |

| Exit | Description |
|------|-------------|
| **Shrink on Next** | Scales down and disappears when the next layer enters |
| **Stay Until End** | Remains visible until the animation ends |

### Features

- Automatic layer detection from PSD files
- Drag & drop layer reordering
- Per-layer animation and timing settings
- Glow effect (Screen blend + Gaussian Blur for backgrounds)
- Heartbeat controller (pulse effect — 90-100% scale every 10 frames)
- Real-time Lottie preview
- JSON export (Lottie Player compatible)
- Built-in Lottie Player (speed control, loop, timeline scrub)
- Dark theme UI

---

## 🇹🇷 Türkçe

### FloBut Nedir?

FloBut, mobil uygulamalarda ve web sitelerinde kullanılan **floating button animasyonlarını** otomatik olarak oluşturur. İki ana modu vardır:

- **Generator** — PSD veya PNG dosyalarını yükle, katman ayarlarını yap, tek tıkla Lottie JSON üret.
- **Player** — Üretilen veya mevcut Lottie JSON dosyalarını önizle, hız ayarla, kare kare incele.

### Hızlı Başlangıç

1. `index.html` dosyasını tarayıcıda aç (veya [canlı demo](https://darksidetk.github.io/flobut-gen) adresini ziyaret et)
2. Sol panele PSD veya görsel dosyalarını sürükle-bırak
3. Katmanları sırala, her biri için animasyon ayarını yap
4. **"Lottie Oluştur"** butonuna bas
5. Önizlemeyi kontrol et, **"İndir"** ile JSON dosyasını kaydet

### ⚠️ PSD Hazırlama Kuralları (ÇOK ÖNEMLİ)

PSD dosyanızı FloBut'a yüklemeden önce aşağıdaki kurallara mutlaka uyun. Aksi halde katmanlar doğru algılanmaz veya animasyon bozuk çıkar.

#### 1. Tüm Katmanları Rasterize Edin

Her katman **rasterize** edilmiş olmalıdır. Şu türler kabul **edilmez**:

- Akıllı Nesne (Smart Object)
- Grup katmanı (Group/Folder)
- Ayarlama katmanı (Adjustment Layer)
- Efekt katmanı (Layer Style olarak bırakılanlar)

**Nasıl yapılır:** Photoshop'ta katmana sağ tıklayın → **"Rasterize Layer"** seçin. Tüm efektleri ve grupları tek tek rasterize edin.

#### 2. Katman İsimlendirme Kuralları

Katmanlar, animasyonda görünecek **sıraya göre** isimlendirilmelidir:

| Katman Adı | Tip | Açıklama |
|------------|-----|----------|
| `bg` | Arka Plan | Sabit duran arka plan görseli |
| `bg_1` | Arka Plan 1 | Birden fazla arka plan varsa sırayla |
| `bg_2` | Arka Plan 2 | İkinci arka plan |
| `bg_3` | Arka Plan 3 | Üçüncü arka plan |
| `icon_1` | Ana İkon | İlk sırada görünecek ikon |
| `icon_2` | Ana İkon | İkinci sırada görünecek ikon |
| `text_1` | Metin | Metin/etiket katmanı |

**Önemli:** İsimlendirmede `bg` kelimesi geçen katmanlar otomatik olarak **Arka Plan** tipinde algılanır. `text` kelimesi geçenler **Metin** tipinde algılanır.

#### 3. Katman Görünürlüğü

- Tüm katmanların **görünürlüğü açık** (göz ikonu açık) olmalıdır
- **Gizli katmanlar içe aktarılmaz** ve animasyonda yer almaz
- Kullanmak istemediğiniz katmanları silmek yerine FloBut içinden gizleyebilirsiniz

#### 4. PSD Boyutu

- Canvas boyutu serbesttir, FloBut otomatik olarak **500×500px** çalışma alanına ölçekler
- En iyi sonuç için **kare (1:1) canvas** kullanın (örn: 1000×1000px)

### Animasyon Tipleri

| Animasyon | Açıklama |
|-----------|----------|
| **Bounce Pop-in** | Katman 0'dan büyüyerek gelir, hafif seker ve durur (8 frame) |
| **Bounce + Rotate 720°** | Pop-in + 720 derece dönüş (arka planlar için ideal) |
| **Animasyon Yok** | Katman statik olarak durur |

### Zamanlama Seçenekleri

| Giriş | Açıklama |
|-------|----------|
| **Sıranı Bekle** | Carousel sırasına göre belirli frame'de girer |
| **0. Frame'de Çık** | Animasyon başlar başlamaz görünür |

| Çıkış | Açıklama |
|-------|----------|
| **Sonrakine Geçerken Küçül** | Sıradaki katman geldiğinde küçülerek kaybolur |
| **Animasyon Sonuna Kadar Kal** | Animasyon bitene kadar ekranda kalır |

### Özellikler

- PSD dosyasından otomatik katman algılama
- Sürükle-bırak ile katman sıralama
- Katman bazlı animasyon ve zamanlama ayarları
- Glow efekti (arka plan katmanları için Screen blend + Gaussian blur)
- Heartbeat controller (nabız efekti — 10 frame aralıkla 90-100% scale)
- Gerçek zamanlı Lottie önizleme
- JSON export (Lottie Player uyumlu)
- Dahili Lottie Player (hız kontrolü, loop, timeline scrub)
- Karanlık tema arayüz

---

## Tech Stack / Teknoloji

| Component / Bileşen | Technology / Teknoloji |
|----------------------|------------------------|
| Animation Render | [Lottie Web (bodymovin)](https://github.com/airbnb/lottie-web) v5.12.2 |
| PSD Parsing | [ag-psd](https://github.com/nicktomlin/ag-psd) v17.0.1 |
| UI | Vanilla HTML / CSS / JS |
| Icons | Font Awesome 6 |

## File Structure / Dosya Yapısı

```
flobut-gen/
├── index.html                 → Main page / Ana sayfa
├── app.min.js                 → App logic / Uygulama mantığı
├── lottie-generator.min.js    → Lottie JSON engine / Lottie üretim motoru
├── style.min.css              → Dark theme styles / Arayüz stilleri
└── README.md                  → This file / Bu dosya
```

---

## License / Lisans

© Türkay Karakurt

## Contact / İletişim

GitHub: [@DarkSideTK](https://github.com/DarkSideTK)
