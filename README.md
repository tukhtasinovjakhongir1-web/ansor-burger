# 🍔 Ansor Burger — Telegram Mini App + bot + admin panel

Shahrixon tumani (Andijon viloyati) bo'ylab yetkazib berish, olib ketish va **kelishdan oldin buyurtma** (oldindan vaqt tanlash) xizmati.

```
ansor-burger/
├── frontend/   Next.js 15 — Mini App (mijozlar) + /admin panel + API  → Vercel
└── backend/    grammY Telegram bot (Node.js)                            → Vercel (webhook) yoki VPS (polling)
```

Ikkalasi ham bitta **Neon PostgreSQL** bazasidan foydalanadi.

## Imkoniyatlar

**Mini App (mijoz):**
- Bosh sahifa: banner-karusel, kategoriyalar, mashhur taomlar, aksiya, to'liq menyu
- Katalog: qidiruv, bo'limlar bo'yicha tez o'tish
- Savat: miqdorni o'zgartirish, bepul yetkazishgacha qolgan summa, qo'shimchalar (fri, sous, ichimlik)
- Rasmiylashtirish: 🚚 yetkazish (hudud + manzil + joylashuv), 🛍 olib ketish, 🍽 joyida (stol, kishilar soni)
- ⚡ Imkon qadar tez yoki 🗓 **oldindan vaqt tanlash** (15 daqiqalik oraliqlar, 2 kungacha, ish vaqti ichida)
- To'lov: 💵 naqd (qaytim summasi) yoki 💳 karta (karta raqami nusxa olish bilan, chek botga yuboriladi)
- Buyurtma holatini jonli kuzatish, buyurtmalar tarixi, "Takrorlash", sevimlilar
- Ish vaqtidan tashqarida faqat oldindan buyurtma qabul qilinadi

**Admin panel (`/admin`):**
- Bosh panel: bugungi buyurtmalar, tushum, o'rtacha chek, 7 kunlik grafik, top taomlar, buyurtma qabulini bir tugmada to'xtatish
- Buyurtmalar: holat bo'yicha tablar, qidiruv, davr filtri, bir bosishda keyingi holatga o'tkazish, to'lov belgisi, bekor qilish sababi, chek chop etish
- Yangi buyurtmada 🔔 ovozli signal + brauzer bildirishnomasi (har 7 soniyada tekshiradi)
- Mahsulotlar: narx, eski narx (chegirma), rasm yuklash, stop-list (mavjud emas), mashhur, tartib
- Kategoriyalar, yetkazib berish hududlari (narx, minimal buyurtma, vaqt)
- Mijozlar ro'yxati + Excel (CSV) eksport
- Sozlamalar: ish vaqti, buyurtma turlari, karta raqami, bepul yetkazish chegarasi, aksiya banneri, Telegram adminlar

**Telegram bot:**
- `/start` — chiroyli banner rasm va matn bilan kutib oladi, "Menyuni ochish" tugmasi bilan
- "Menyu" tugmasi (Mini App), buyurtmalarim, aloqa, manzil, biz haqimizda
- Telefon raqamini yuborish
- Mijoz to'lov chekini (rasm) yuborsa — adminlarga "💰 To'landi" tugmasi bilan boradi
- Adminlar: yangi buyurtma xabari va holatni tugmalar bilan o'zgartirish (✅ → 👨‍🍳 → 🚚/🛍 → 🎉), `/stats`, `/active`
- Mijozga har bir holat o'zgarishida xabar boradi

## ⚠️ Muhim

- Narxlarning ko'pi **taxminiy** (Instagramda e'lon qilinmagan). Admin paneldagi "Mahsulotlar" bo'limida `taxminiy narx` belgisi bor — haqiqiy narxni yozib saqlasangiz belgi yo'qoladi.
- Karta raqami **TEST**: `8600 1234 5678 9012`. Admin panel → Sozlamalar → To'lov bo'limida haqiqiysiga almashtiring.
- Yetkazib berish hududlari namunaviy — "Hududlar" bo'limida o'zingizning mahalla/qishloqlaringizni yozing.
- Mini App tez ochilishi uchun menyu keshlanadi. Admin paneldagi o'zgarishlar darhol ko'rinadi; bazani to'g'ridan-to'g'ri o'zgartirsangiz (masalan `npm run db:migrate`), menyu 1 daqiqa ichida yangilanadi.

## 🎨 Bannerlar va havola ko'rinishi

| Qayerda | Fayl |
|---|---|
| Sayt / Mini App havolasi yuborilganda (og:image) | `frontend/public/og/og-shop.jpg` |
| Admin panel havolasi (`/admin`) yuborilganda | `frontend/public/og/og-admin.jpg` |
| Botda `/start` bosilganda | `backend/assets/welcome.jpg` |
| Bot avatari | `backend/assets/bot-avatar.jpg` |
| BotFather "Description picture" (640×360) | `backend/assets/bot-description.jpg` |

- Bot tavsifi ("Bu bot nima qila oladi?" oynasi) va qisqa tavsif (bot havolasi ulashilganda chiqadi) bot ishga tushganda avtomatik yoziladi.
- **Bot avatarini** bir marta o'rnatish: `cd backend && npm run bot:brand` (har ishga tushirishda yangi avatar qo'shiladi — takrorlamang).
- **Description picture** faqat BotFather orqali: `/mybots` → bot → *Edit Bot* → *Edit Description Picture* → `backend/assets/bot-description.jpg`.
- Telegram havola ko'rinishini keshlaydi. Eski ko'rinish chiqsa, [@WebpageBot](https://t.me/WebpageBot) ga sayt manzilini yuboring — yangilanadi.
- O'z domeningiz bo'lsa, frontend'da `APP_URL=https://domen.uz` ni yozing (aks holda Vercel manzili ishlatiladi).

## Lokal ishga tushirish

```bash
# 1) Baza jadvallari va mahsulotlar (bir marta)
cd backend && npm install && npm run db:migrate

# 2) Sayt + admin panel: http://localhost:3000 va http://localhost:3000/admin
cd ../frontend && npm install && npm run dev

# 3) Bot (polling rejimi)
cd ../backend && npm start
```

`.env` fayllari git'ga qo'shilmaydi — namunalar: `frontend/.env.example`, `backend/.env.example`.

## Vercel'ga joylash

### 1. Frontend (Mini App + admin)
1. Vercel → **Add New Project** → `ansor-burger` reposi
2. **Root Directory:** `frontend`, Framework: **Next.js**
3. Environment Variables: `DATABASE_URL`, `BOT_TOKEN`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `NEXT_PUBLIC_BOT_USERNAME`
4. Deploy → manzil, masalan `https://ansor-burger.vercel.app`

### 2. Bot (webhook)
1. Vercel → yana **Add New Project** → shu repo
2. **Root Directory:** `backend`, Framework: **Other**
3. Environment Variables: `BOT_TOKEN`, `DATABASE_URL`, `ADMIN_PASSWORD`, `WEBAPP_URL` (1-qadamdagi manzil), `WEBHOOK_SECRET`
4. Deploy → manzil, masalan `https://ansor-burger-bot.vercel.app`
5. Kompyuteringizda `backend/.env` ga `WEBAPP_URL` va `WEBHOOK_URL=https://ansor-burger-bot.vercel.app/api/webhook` yozing, so'ng:
   ```bash
   cd backend && npm run webhook:set
   ```
   Bu webhook'ni ulaydi va botdagi **"Menyu"** tugmasini Mini App'ga bog'laydi.

### 3. Admin xabarnomalari
Telegram'da botga yozing: `/admin PAROL` (parol — `ADMIN_PASSWORD`). Shundan so'ng yangi buyurtmalar shu chatga keladi.
