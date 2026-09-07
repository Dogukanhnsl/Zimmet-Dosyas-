# Zimmet Defteri — Sunucu Sürümü (ücretsiz kurulum)

Bu klasör, kıyafet zimmet/teslim takip uygulamasının kendi adresinizde çalışan sürümüdür. Herkes aynı
adrese girer, bir şifre ile giriş yapar, hepsi aynı veriyi görür/günceller.

Aşağıda **tamamen ücretsiz ve kalıcı** çalışan bir kurulum anlatılıyor: **Render.com** (uygulamayı
çalıştırır) + **Supabase** (veriyi kalıcı tutar). İkisi de kredi kartı istemeden, sonsuza kadar ücretsiz
kullanılabilen planlara sahip — ama küçük sınırları var, en altta "Bilmeniz gerekenler" kısmında dürüstçe
anlattım.

---

## Neden iki ayrı servis?

- Render'ın ücretsiz planı veriyi kalıcı tutmuyor (sunucu her yeniden başladığında dosyalar silinir).
- Bu yüzden veriyi Render yerine **Supabase**'in ücretsiz veritabanında tutuyoruz. Uygulama kodu zaten
  bunu destekleyecek şekilde hazır — sadece iki bağlantı bilgisini gireceksiniz.

---

## Adım 1 — Supabase'de ücretsiz veritabanı oluşturun

1. [supabase.com](https://supabase.com) adresine gidip ücretsiz hesap açın.
2. **New Project** ile yeni bir proje oluşturun (bir veritabanı şifresi belirlemeniz istenecek —
   bir kenara not edin, tekrar lazım olmayabilir ama saklayın).
3. Proje açıldıktan sonra sol menüden **SQL Editor**'e girin, **New query** deyin.
4. Bu klasördeki `supabase-setup.sql` dosyasının içeriğini kopyalayıp yapıştırın ve **Run**'a basın.
   (Bu, verinizin tutulacağı tabloyu oluşturur.)
5. Sol menüden **Project Settings → API** bölümüne gidin. İki değeri not edin:
   - **Project URL** (örn. `https://abcdefgh.supabase.co`)
   - **service_role secret** anahtarı (uzun bir metin — bunu **kimseyle paylaşmayın**, tam yetkili bir
     anahtardır)

---

## Adım 2 — Render'da uygulamayı yayınlayın

1. Bu `zimmet-server` klasörünü bir GitHub reposuna yükleyin (GitHub web arayüzünden
   "Add file → Upload files" ile de yapılır, komut satırı gerekmez).
2. [render.com](https://render.com) adresine GitHub hesabınızla üye olun.
3. **New → Web Service** deyip yüklediğiniz repoyu seçin.
4. Kurulum ekranında:
   - **Instance Type:** Free
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. **Environment** (ortam değişkenleri) bölümüne şunları ekleyin:

   | Anahtar | Değer |
   |---|---|
   | `SUPABASE_URL` | Adım 1'de aldığınız Project URL |
   | `SUPABASE_SERVICE_KEY` | Adım 1'de aldığınız service_role anahtarı |
   | `APP_PASSWORD` | Ekibinizin gireceği şifre — **kendiniz belirleyin**, örn. `Depo2026!` |
   | `APP_SECRET` | Rastgele, uzun, kimseyle paylaşmayacağınız bir metin, örn. `k3f92jfaslkq0182` |

6. **Create Web Service** deyip deploy'un bitmesini bekleyin (birkaç dakika sürer).
7. Render size bir adres verecek (örn. `https://zimmet-defteri.onrender.com`). Bu adresi ekibinizle,
   `APP_PASSWORD` olarak belirlediğiniz şifreyle birlikte paylaşın.

**Şifreyi böyle belirliyorsunuz** — `APP_PASSWORD` ortam değişkeninin değeri neyse, giriş ekranında
sorulan şifre odur. Değiştirmek isterseniz Render'da Environment sekmesinden değeri güncelleyip
"Save, rebuild and deploy" demeniz yeterli; birkaç dakika içinde yeni şifre geçerli olur.

---

## Bilmeniz gerekenler (dürüst özet)

- **Render ücretsiz plan** 15 dakika kullanılmayınca uygulamayı "uyutur". Biri linke girdiğinde
  uyanması 30-60 saniye sürebilir — bu normal, veri kaybı olmaz (çünkü veri Supabase'de, Render'da değil).
- **Supabase ücretsiz plan**, proje 7 gün hiç kullanılmazsa duraklatılır. Ekip düzenli kullandıkça bu
  sorun olmaz. Uzun bir tatilden sonra ilk açılışta sayfa hata verirse, Supabase paneline girip projeyi
  "Resume/Restore" etmeniz yeterli — veri kaybolmaz, sadece yeniden uyandırmanız gerekir.
- Veri limiti: Supabase ücretsiz planda 500 MB'a kadar yer var — bu, on binlerce tutanak kaydı için bile
  fazlasıyla yeterli.
- Bu koruma tek bir ortak şifreye dayanıyor (kişi bazlı kullanıcı adı/şifre değil). Şirket içi kullanım
  için genelde yeterlidir; kişi bazlı giriş isterseniz ayrıca ekleyebilirim.
- **Yedek almayı unutmayın:** Supabase panelinden **Table Editor → app_state** tablosuna girip verinizi
  ara sıra dışa aktarabilir, ya da düzenli aralıklarla Durum Raporu / Geçmiş ekranlarını yazdırıp
  arşivleyebilirsiniz.

---

## Bilgisayarınızda deneme (opsiyonel)

Supabase/Render'a hiç dokunmadan, sadece kendi bilgisayarınızda denemek isterseniz:

1. [Node.js](https://nodejs.org) kurun (LTS sürüm).
2. Bu klasörde terminal açıp: `npm install` ardından `npm start`
3. Tarayıcıda `http://localhost:3000` açın. Şifre varsayılan olarak **zimmet2026**'dır.

Bu modda `SUPABASE_URL` ayarlamadığınız için veri, bilgisayarınızdaki `data/state.json` dosyasında
tutulur — sadece test amaçlıdır, ekip bunu göremez.

---

## Alternatif: Şirketinizin kendi sunucusu / IT departmanı varsa

IT ekibinize bu klasörü ve şu bilgiyi iletmeniz yeterli:
> "Node.js 18+ kurulu bir sunucuda `npm install && npm start` ile çalışır, 3000 portunu dinler
> (`PORT` ortam değişkeniyle değiştirilebilir). Kalıcı bir sunucunuz varsa Supabase şart değil —
> `data/` klasörü silinmeden kalırsa yerel dosya yeterlidir. Şifre `APP_PASSWORD`, gizli anahtar
> `APP_SECRET` ortam değişkenleriyle ayarlanır."
