# Moto DTC Monorepo

แอปสแกนรหัสข้อผิดพลาด (DTC) สำหรับมอเตอร์ไซค์/รถไฟฟ้าที่ใช้ AI วิเคราะห์อาการเสีย

## Architecture

```
┌─────────────────┐     ┌────────────────────┐     ┌─────────────────┐
│  Flutter App    │────►│ Cloudflare Pages     │────►│ AI Service      │
│  (Mock Scanner) │     │ Functions (Telegram   │     │ (WASM/Rules)    │
│                 │     │ Bot + API)          │     │                 │
└─────────────────┘     └────────────────────┘     └─────────────────┘
```

## Folder Structure

```
moto-dtc-monorepo/
├── README.md                     # ไฟล์อธิบายโปรเจกต์
├── .gitignore                    # ไฟล์ยกเว้นการอัปโหลด
│
├── telegram-bot/                 # Backend: Cloudflare Pages Functions
│   ├── wrangler.toml             # ตั้งค่า Cloudflare + AI Binding
│   ├── package.json              # Dependencies
│   └── functions/
│       └── api.js                # API หลัก (รับ DTC จาก Telegram/Flutter)
│
└── flutter_app/                  # Frontend: Flutter Mobile App
    ├── pubspec.yaml              # ตั้งคร้าปลั๊กอิน
    └── lib/
        ├── main.dart             # จุดเริ่มต้นของแอป
        ├── services/
        │   └── api_service.dart    # เชื่อมต่อ API
        └── screens/
            └── scanner_screen.dart # หน้าจอสแกน DTC (Mock)
```

## Cloudflare Workers AI Setup

โครงการนี้ใช้ **Cloudflare Workers AI** (ฟรี 10,000 requests/วัน) ไม่ต้องใช้ WASM หรือ API key ภายนอก

### วิธีเปิดใช้งาน Workers AI:

1. ไปที่แผงควบคุม (Dashboard) ของโปรเจกต์ Cloudflare ของคุณ
2. ไปที่ **Settings > Bindings**
3. คลิก **Add > เลือก AI**
4. ที่ **Variable name** ให้พิมพ์: `AI` (ตัวพิมพ์ใหญ่ทั้งหมด)
5. กด **Save** และทำการ **Redeploy**

## Quick Start

### 1. Telegram Bot (Cloudflare Pages)

```bash
cd telegram-bot
npm install
# ตั้งค่า TELEGRAM_BOT_TOKEN ใน Dashboard หรือ Secrets
wrangler deploy
```

### 2. Flutter App

```bash
cd flutter_app
flutter pub get
# แก้ไข baseUrl ใน lib/services/api_service.dart
flutter run
```

## API Endpoints

| Endpoint | Method | Description |
|---------|--------|-------------|
| `/` | POST | รับ DTC code จาก Flutter หรือ Telegram |
| `/` | GET | Health check ตรวจสอบสถานะบริการ |

## Response Format

```json
{
  "success": true,
  "dtc": "P0171",
  "analysis": "🛠️ **[วิเคราะห์อาการเสีย]** ..."
}
```

หรือสำหรับ Telegram จะส่งข้อความ Markdown กลับมาตรง ๆ

## Environment Variables

| Variable | Description |
|---------|------------|
| `TELEGRAM_BOT_TOKEN` | Bot token จาก BotFather (GitHub Secrets) |

> **หมายเหตุ**: Workers AI ใช้ผ่าน `context.env.AI` โดยอัตโนมัติ ไม่ต้องตั้งค่าเพิ่ม

## การทำงานของระบบ

1. **ฝั่ง Flutter**: แอปสแกน DTC (Mock Data) ส่งรหัสไปยัง Cloudflare API
2. **ฝั่ง Cloudflare**: รับรหัส DTC จากทั้งสองช่องทาง ใช้ AI วิเคราะห์และส่งผลลัพธ์
3. **ฝั่ง Telegram**: แสดงผลการวิเคราะห์ในแชทโดยทันที

## GitHub Actions CI/CD

| Workflow | Trigger | รายละเอียด |
|---------|--------|-------------|
| `deploy.yml` | push ไป `main` (telegram-bot) | Auto deploy ไป Cloudflare Pages |
| `flutter.yml` | push ไป `main` (flutter_app) | Build + Test Flutter app |

### การตั้งค่า GitHub Secrets

ไปที่ **Settings → Secrets and variables → Actions** ใน GitHub แล้วเพิ่ม:

| Secret | คำอธิบาย |
|--------|----------|
| `CF_API_TOKEN` | Cloudflare API Token (สำหรับ deploy) |
| `TELEGRAM_BOT_TOKEN` | Bot Token (ใช้ใน workers) |

## License

MIT License