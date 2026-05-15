# 🚀 Setup & Run

## 1. Install dependencies

```bash
cd /Users/devcat/Documents/lotteryApp
npm install
```

> **Note:** `npm install` จะ trigger `postinstall` → `electron-builder install-app-deps` ซึ่งจะ rebuild `better-sqlite3` ให้ตรงกับ Electron ABI อัตโนมัติ
> ถ้าติดปัญหา native module ให้รันเพิ่ม:
> ```bash
> npm run rebuild
> ```

## 2. Dev mode (รัน Next.js + Electron พร้อมกัน)

```bash
npm run dev
```

จะเปิดหน้าต่าง Electron ที่โหลด `http://localhost:3000` พร้อม DevTools

ฐานข้อมูล SQLite ถูกสร้างที่:
- 🪟 Windows: `%APPDATA%\LotteryApp\lottery.db`
- 🍎 macOS: `~/Library/Application Support/LotteryApp/lottery.db`

## 3. Build production

```bash
npm run build                # build Next.js + Electron
npm run start                # ทดสอบ production build (ก่อน package)
```

## 4. Build installer / .exe / .dmg

```bash
# Build เฉพาะ OS ปัจจุบัน
npm run dist

# บังคับ build Windows
npm run dist:win

# บังคับ build macOS (ต้องรันบน Mac)
npm run dist:mac
```

ผลลัพธ์อยู่ใน `dist/`:
- `LotteryApp-1.0.0-x64.exe` (NSIS installer)
- `LotteryApp-1.0.0-portable.exe`
- `LotteryApp-1.0.0-x64.dmg` / `LotteryApp-1.0.0-arm64.dmg`

## 5. Icon files (ก่อน build production)

ใส่ไฟล์ไอคอนใน `build/`:
- `build/icon.ico` — Windows (256×256)
- `build/icon.icns` — macOS (1024×1024)
- `build/icon.png` — Linux (512×512)

ถ้ายังไม่มีไอคอน, electron-builder จะใช้ icon default ของ Electron ไปก่อน (warning เฉยๆ)

## 6. Workflow แนะนำสำหรับ dev

1. เปิด terminal → `npm run dev`
2. แอป Electron เปิดขึ้นมา → กด + มุมขวาบนสร้างงวดใหม่
3. ไปหน้า "บันทึกการขาย" → ทดลองใส่เลข
4. แก้โค้ดใน `src/` หรือ `electron/` → save → reload อัตโนมัติ
   - Next.js (renderer): hot reload ทันที
   - Electron main process: ต้อง restart `npm run dev` (Ctrl+C แล้วรันใหม่)

## Troubleshooting เร็วๆ

| อาการ | แก้ |
|---|---|
| `Error: better-sqlite3 was compiled against...` | `npm run rebuild` |
| Electron เปิดมาจอดำ | รอ 2-3 วินาทีให้ Next.js dev server start ก่อน, หรือดู console |
| Import path `@/` ไม่ทำงาน | ตรวจ `tsconfig.json` ว่ามี `"paths": { "@/*": ["./src/*"] }` |
| DB file ตำแหน่งไหน? | console log จะ print path ตอน startup |
