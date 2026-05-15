# 🎰 ระบบจัดการหวย (Lottery Management System) — Desktop Edition

Desktop app บริหารจัดการการขายหวยแบบครบวงจร — บันทึกขาย, ตรวจรางวัล, จัดการลูกค้า, สำรองข้อมูล
ทำงานแบบ **Offline 100%** บน **Windows + macOS** ไม่ต้องใช้อินเทอร์เน็ต ไม่ต้อง login

**Stack:** Electron · Next.js 14 (App Router) · TypeScript · SQLite (better-sqlite3) · Tailwind CSS · shadcn/ui

**Supported Platforms:**
| OS | Output | สถานะ |
|---|---|---|
| 🪟 Windows 10/11 | `.exe` (NSIS installer + portable) | ✅ Supported |
| 🍎 macOS 11+ (Intel + Apple Silicon) | `.dmg` (universal) | ✅ Supported |
| 🐧 Linux | `.AppImage` / `.deb` | ⚙️ Optional |

---

## 📑 สารบัญ

1. [Quick Start](#-quick-start)
2. [ฟีเจอร์ทั้งหมด](#-ฟีเจอร์ทั้งหมด)
3. [คู่มือการใช้งานแต่ละหน้า](#-คู่มือการใช้งานแต่ละหน้า)
4. [Database Schema](#-database-schema)
5. [โครงสร้างโปรเจ็ค](#-โครงสร้างโปรเจ็ค)
6. [Build เป็น .exe](#-build-เป็น-exe)
7. [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

### สำหรับผู้ใช้งาน (End User)

**🪟 Windows:**
1. ดาวน์โหลด `LotteryApp-Setup-x.x.x.exe` (installer) หรือ `LotteryApp-x.x.x-portable.exe`
2. ดับเบิลคลิกเพื่อติดตั้ง / รันได้เลย
3. เปิดแอป → ใช้งานได้ทันที (ไม่ต้อง login)
4. ข้อมูลถูกเก็บไว้ที่ `%APPDATA%\LotteryApp\lottery.db`

**🍎 macOS:**
1. ดาวน์โหลด `LotteryApp-x.x.x.dmg`
2. เปิดไฟล์ .dmg แล้วลาก LotteryApp ไปที่ Applications
3. เปิดแอปจาก Launchpad — ครั้งแรกถ้าติด Gatekeeper ให้ **คลิกขวา → Open** (เพราะยังไม่ได้ code-sign)
4. ข้อมูลถูกเก็บไว้ที่ `~/Library/Application Support/LotteryApp/lottery.db`

### สำหรับ Developer
```bash
cd lotteryTH
npm install
npm run dev          # รัน Electron + Next.js dev mode (ทำงานเหมือนกันทั้ง Win/Mac)
```

**ไม่ต้องตั้งค่า environment variables** — ใช้ SQLite local ทั้งหมด ฐานข้อมูลจะถูกสร้างอัตโนมัติเมื่อรันครั้งแรก

---

## ✨ ฟีเจอร์ทั้งหมด

### 💻 Desktop Native — Cross Platform
- ทำงาน **Offline 100%** — ไม่ต้องต่อเน็ต
- **Single user** — ไม่ต้อง login ไม่ต้องสมัคร เปิดแล้วใช้ได้เลย
- รองรับ **Windows 10/11** และ **macOS 11+** (Intel + Apple Silicon ทั้งคู่)
- ข้อมูลเก็บใน SQLite local file ที่เครื่อง (path ปรับตาม OS อัตโนมัติผ่าน `app.getPath('userData')`)
- **Auto-save** ทุกครั้งที่กดบันทึก — ไม่มีโอกาสข้อมูลหาย

### 🎯 ประเภทเลข (Bet Types) — 4 แบบ
| ประเภท | คำอธิบาย | อัตราจ่าย (default) |
|---|---|---|
| 🔼 **2 ตัวบน** | จับคู่ 2 หลักท้าย รางวัลที่ 1 | × 70 |
| 🔽 **2 ตัวล่าง** | จับคู่ 2 หลักล่าง | × 70 |
| 🎯 **3 ตัวบน** | ตรงเป๊ะ 3 หลัก | × 500 |
| 🎲 **3 ตัวโต๊ด** | ตัวเลขเดียวกัน สลับตำแหน่งได้ | × 100 |

อัตราจ่ายและ % หัก กำหนดเองได้ในหน้า ตั้งค่า (แยกตามงวด)

### 🔄 เลขกลับ (Reverse)
- ติ๊ก "กลับด้วย" ตอนบันทึก → ระบบบันทึก 2 รายการ (เลขปกติ + เลขกลับ)
- ใช้ได้กับ 2 ตัวบน / 2 ตัวล่าง (3 ตัวโต๊ดครอบคลุม permutation อยู่แล้ว)
- เลขกลับมี badge **🔄 กลับ** สีม่วงในตารางทุกที่
- Skip ถ้าเลขเป็น palindrome (11, 22, 33...) — ไม่ duplicate

### 🗂️ Multi-round
- สร้าง/ลบ/เปลี่ยนงวดได้ตลอด (เช่น "16 พ.ค. 2569", "1 มิ.ย. 2569")
- ข้อมูลแยกตามงวด — เปลี่ยนงวดได้จาก dropdown มุมขวาบน
- งวดที่ออกผลแล้วจะมี badge **🏆 ผลออกแล้ว**

### 👥 ระบบลูกค้า (Customer Management)
- CRUD ลูกค้า: ชื่อ, เบอร์โทร, หมายเหตุ
- ดู **จำนวนรายการ** + **ยอดซื้อรวม** ของแต่ละคน
- ค้นหาด้วยชื่อหรือเบอร์
- Combobox ตอนบันทึกขาย — autocomplete + สร้างลูกค้าใหม่ inline
- รายการขายผูกกับ customer_id → ลบลูกค้าก็ไม่กระทบ ticket (set null)

### 🌓 Dark / Light / System mode
- ปุ่ม toggle ใน sidebar — กดวน 3 โหมด: ☀️ Light / 🌙 Dark / 🖥️ System
- จำค่าใน `localStorage` (`ui-theme`)
- ป้องกัน FOUC ด้วย inline script ก่อน React hydrate

### 📱 Responsive Design
- ปรับ layout ตามขนาดหน้าต่าง Electron
- Table columns ซ่อนบางคอลัมน์เมื่อหน้าต่างเล็ก
- Form fields stack เป็นแนวตั้งเมื่อหน้าต่างเล็ก
- Stats cards 2×2 → 1×4 ตามขนาด

### ⏳ Loading Indicators
- **Top progress bar** เด้งเวลาเปลี่ยนหน้า
- **Skeleton loaders** ตอนรอ query SQLite
- **Button spinner** ตอนกำลังบันทึก/ค้นหา

### 💾 Backup / Restore
- Export ทั้งหมดเป็น JSON (rounds + customers + tickets)
- Save dialog เลือกที่เก็บได้เอง (ใช้ Electron native dialog)
- Import กลับ — 2 โหมด: **เพิ่มเข้าไป** หรือ **แทนที่ทั้งหมด** (ต้องพิมพ์ REPLACE ยืนยัน)
- Smart ID remapping — รักษาความสัมพันธ์ ticket ↔ round ↔ customer
- Transaction-based — ถ้า fail กลางคันจะ rollback ทั้งหมด

---

## 📖 คู่มือการใช้งานแต่ละหน้า

### 📝 บันทึกการขาย (`/sales`)

**Input ที่ต้องกรอก:**
- **ประเภท** — กดปุ่มเลือก 1 ใน 4 ประเภท
- **กลับด้วย** (checkbox) — ติ๊กเมื่อต้องการบันทึกเลขกลับด้วย (เฉพาะ 2 ตัว)
- **เลข** — กรอก 2 หลัก (00-99) หรือ 3 หลัก (000-999) แล้วแต่ประเภท
- **ราคา** (บาท)
- **ลูกค้า** (ไม่บังคับ) — combobox: คลิก ➜ ค้นหาในรายการเดิม หรือพิมพ์ชื่อใหม่ + กด Enter เพื่อสร้าง
- **หมายเหตุ** (ไม่บังคับ)

**Shortcut keys:**
- ใส่เลข → กด **Enter** → ใส่ราคา → **Enter** อีกครั้ง = บันทึกเร็ว
- ปุ่ม ✕ ข้าง customer = ล้างลูกค้า (เลือกใหม่)
- ลูกค้าจะค้างไว้หลังกดบันทึก — กดบันทึกรัวๆ ให้คนเดียวได้

**3 ตัวโต๊ด:**
- ระบบ sort ตัวเลขก่อนเก็บ — เช่น `321` → เก็บเป็น `123`
- ตอนตรวจรางวัล จะตรวจกับทุก permutation อัตโนมัติ

**รายการล่าสุด:**
- โชว์ 10 รายการล่าสุดของงวดปัจจุบัน
- มีปุ่มลบ (ถังขยะ) ทีละรายการ

---

### 🔍 ค้นหาเลข (`/search`)

ใช้ดูว่าเลขใดในงวดนี้ขายไปเท่าไหร่แล้ว

**ตัวเลือก:**
- **ประเภท** — เลือก "ทุกประเภท" หรือเฉพาะประเภทเดียว
- **เลข** — กรอกเลข **หรือเว้นว่าง** เพื่อดูทั้งหมดตามประเภท

**ผลที่ได้:**
- **จำนวนรายการ** — มีกี่ ticket
- **ยอดรวม** — รวมราคาทั้งหมด (บาท)
- **แยกตามประเภท** — แตกย่อยเป็น 2 บน / 2 ล่าง / 3 บน / 3 โต๊ด
- **รายการทั้งหมด** — ตารางทุก ticket ที่ match

**เคล็ดลับ:** เลือก "ทุกประเภท" + เว้น "เลข" ว่าง → กดค้นหา = ดูทุกรายการในงวด

---

### 📊 รายงานยอด (`/report`)

สรุปยอดขายของงวดปัจจุบัน

**Stats 4 ใบ:**
- จำนวนรายการ
- ยอดขายรวม (บาท)
- หัก % (default 30%)
- ยอดหลังหัก

**สรุปแยกตามประเภท:**
- จำนวน + ยอดรวม + สัดส่วน % ของแต่ละประเภท

**Top 10 เลขขายดี:**
- เรียงจากเลขที่มียอดรวมสูงสุด
- ใช้ดูว่าเลขไหนเสี่ยง (ขายเยอะ)

---

### 🏆 ตรวจรางวัล (`/result`)

**กรอกผลรางวัล:**
- 2 ตัวบน · 2 ตัวล่าง · 3 ตัวบน · 3 ตัวบน #2 (ถ้ามี 2 ชุด)
- กด **บันทึก + คำนวณ** → ระบบคำนวณยอดที่ต้องจ่าย + กำไรขาดทุนทันที

**Stats 6 ใบ:**
- ยอดขายรวม
- หัก %
- ยอดหลังหัก
- **ต้องจ่ายเลขถูก** (สีแดง)
- รายการที่ถูก (จำนวน)
- **กำไร/ขาดทุน** (สีเขียวถ้ากำไร, แดงถ้าขาดทุน)

**ตารางรายการที่ถูกรางวัล:**
- เวลา · ประเภท · เลข (badge สีทอง) · ราคา · เงินรางวัล · ลูกค้า · หมายเหตุ
- แสดง 🔄 กลับ ถ้าเป็นเลขกลับ

**สูตรคำนวณ:**
```
ยอดหลังหัก = ยอดขายรวม × (100 - deduct%) / 100
เงินรางวัล = ราคา × อัตราจ่ายของประเภท
กำไร = ยอดหลังหัก - ต้องจ่ายเลขถูก
```

---

### 📜 ประวัติ (`/history`)

**ฟิลเตอร์:**
- กรองประเภท (button group)
- ค้นหาผู้ซื้อ (text - search ใน buyer_name)

**ตาราง:**
- ทุกรายการในงวดปัจจุบัน
- แสดงชื่อลูกค้า (จาก join) ก่อน fallback เป็น buyer_name
- ปุ่มลบทีละรายการ

**Export CSV:**
- กดปุ่ม **📥 Export CSV** → เปิด Electron save dialog เลือกที่เก็บ → บันทึก `lottery_<งวด>.csv`
- รองรับภาษาไทย (UTF-8 BOM) เปิดด้วย Excel ได้เลย
- คอลัมน์: เวลา · ประเภท · เลข · ราคา · ลูกค้า · หมายเหตุ
- ประเภทมีต่อท้าย "(กลับ)" ถ้าเป็นเลขกลับ

---

### 👥 ลูกค้า (`/customers`)

**ปุ่ม "เพิ่มลูกค้า"** — เปิด dialog
- **ชื่อ** (จำเป็น)
- **เบอร์โทร** (ไม่บังคับ)
- **หมายเหตุ** (ไม่บังคับ) — เช่น "ชอบเลขท้าย 9"

**ตารางลูกค้า:**
- ชื่อ + ไอคอน 👤
- เบอร์
- **จำนวนรายการ** — คำนวณจาก tickets ทั้งหมดของลูกค้านี้ (รวมทุกงวด)
- **ยอดซื้อรวม** — รวมราคา tickets ทั้งหมด (บาท)
- หมายเหตุ
- ปุ่ม ✏️ แก้ไข / 🗑️ ลบ

**ค้นหา:** ค้นหาด้วยชื่อหรือเบอร์ — มี icon 🔍 ใน input

**การลบลูกค้า:**
- รายการขายที่ผูกไว้จะกลายเป็นไม่มีลูกค้า (`customer_id = NULL`) — ไม่ลบ ticket

---

### 💾 สำรองข้อมูล (`/backup`)

**Stats:** จำนวน งวด / ลูกค้า / รายการขาย

**📤 Export**
- เปิด Electron save dialog ให้เลือกที่เก็บ
- บันทึกไฟล์ `lottery-backup-YYYY-MM-DD-HH-MM-SS.json`
- เนื้อหา: version, exported_at, rounds[], customers[], tickets[]

**📥 Import** — เปิด Electron open dialog เลือกไฟล์ JSON แล้ว preview ก่อน
- **➕ เพิ่มเข้าไป (merge)** — ปลอดภัย เก็บของเดิม + เพิ่ม
- **⚠️ แทนที่ทั้งหมด (replace)** — ลบของเดิมก่อน import ใหม่ ต้องพิมพ์ `REPLACE` ยืนยัน

ระบบ remap IDs อัตโนมัติ — ความสัมพันธ์ ticket → round → customer ไม่หลุด
ใช้ SQLite transaction — ถ้า fail กลางคันจะ rollback คืนสภาพเดิม

---

### ⚙️ ตั้งค่า (`/settings`)

ตั้งค่าระดับ "งวด" (แยกค่าต่อแต่ละงวด):

**ข้อมูลงวด:**
- ชื่องวด

**อัตราจ่าย (บาทต่อบาท):**
- 2 ตัวบน — default 70
- 2 ตัวล่าง — default 70
- 3 ตัวบน — default 500
- 3 ตัวโต๊ด — default 100

**หัก %** — default 30

**⚠️ Danger Zone:** ลบงวดและข้อมูลทั้งหมดในงวดนี้ (ไม่กู้คืน)

---

## 🗄️ Database Schema (SQLite)

ไฟล์ฐานข้อมูลจะถูกสร้างอัตโนมัติเมื่อเปิดแอปครั้งแรก ผ่าน migration script
Path เปลี่ยนตาม OS (ใช้ `app.getPath('userData')` ของ Electron):

| OS | Path |
|---|---|
| 🪟 Windows | `%APPDATA%\LotteryApp\lottery.db` |
| 🍎 macOS | `~/Library/Application Support/LotteryApp/lottery.db` |
| 🐧 Linux | `~/.config/LotteryApp/lottery.db` |

### `rounds`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| name | TEXT NOT NULL | ชื่องวด |
| draw_date | TEXT | ISO date string |
| status | TEXT | open / closed / drawn |
| rate_2_top / 2_bottom / 3_top / 3_tod | REAL | อัตราจ่าย |
| deduct_percent | REAL | % หัก default 30 |
| win_2_top / 2_bottom / 3_top / 3_top2 | TEXT | เลขที่ออก |
| created_at / updated_at | TEXT | ISO timestamp |

### `customers`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| name | TEXT NOT NULL | |
| phone | TEXT | |
| note | TEXT | |
| created_at / updated_at | TEXT | |

### `tickets`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| round_id | INTEGER NOT NULL | FK → rounds(id) ON DELETE CASCADE |
| customer_id | INTEGER | FK → customers(id) ON DELETE SET NULL |
| number | TEXT NOT NULL | (โต๊ด เก็บแบบ sorted) |
| bet_type | TEXT NOT NULL | CHECK: 2_top/2_bottom/3_top/3_tod |
| price | REAL NOT NULL | > 0 |
| buyer_name | TEXT | ชื่อตอนพิมพ์ (fallback) |
| note | TEXT | |
| is_reverse | INTEGER | 0/1 DEFAULT 0 |
| created_at | TEXT | |

### Indexes
- `idx_tickets_round` ON `tickets(round_id)`
- `idx_tickets_customer` ON `tickets(customer_id)`
- `idx_tickets_number` ON `tickets(number, bet_type)`

### Triggers
- `set_updated_at_rounds` — อัพเดต `updated_at` ทุก UPDATE บน rounds
- `set_updated_at_customers` — เช่นกันสำหรับ customers

> ❌ **ไม่มี** `profiles`, `auth.users`, `owner_id`, RLS — เพราะเป็น single user offline

---

## 📁 โครงสร้างโปรเจ็ค

```
lotteryTH/
├── electron/
│   ├── main.ts                          # Electron main process — สร้าง window + IPC
│   ├── preload.ts                       # contextBridge — expose API ให้ renderer
│   ├── db/
│   │   ├── connection.ts                # better-sqlite3 client (singleton)
│   │   ├── schema.sql                   # CREATE TABLE statements
│   │   ├── migrations.ts                # Migration runner
│   │   └── queries/
│   │       ├── rounds.ts                # CRUD rounds
│   │       ├── customers.ts             # CRUD customers
│   │       └── tickets.ts               # CRUD tickets + aggregations
│   └── handlers/
│       ├── rounds.ipc.ts                # ipcMain handlers
│       ├── customers.ipc.ts
│       ├── tickets.ipc.ts
│       └── backup.ipc.ts                # Export/Import + file dialog
│
├── src/
│   ├── app/
│   │   ├── (app)/                       # Route group (ไม่มี auth guard แล้ว)
│   │   │   ├── layout.tsx               # → AppShell (sidebar + header)
│   │   │   ├── loading.tsx              # Route-level skeleton
│   │   │   ├── sales/page.tsx           # 📝 บันทึกการขาย
│   │   │   ├── search/page.tsx          # 🔍 ค้นหาเลข
│   │   │   ├── report/page.tsx          # 📊 รายงานยอด
│   │   │   ├── result/page.tsx          # 🏆 ตรวจรางวัล
│   │   │   ├── history/page.tsx         # 📜 ประวัติ + CSV export
│   │   │   ├── customers/page.tsx       # 👥 จัดการลูกค้า
│   │   │   ├── backup/page.tsx          # 💾 Export/Import JSON
│   │   │   └── settings/page.tsx        # ⚙️ ตั้งค่างวด
│   │   ├── layout.tsx                   # Root layout + ThemeProvider + Toaster
│   │   ├── globals.css                  # Tailwind + theme tokens
│   │   └── page.tsx                     # Redirect → /sales (ไม่มี login)
│   │
│   ├── components/                      # (เหมือนเดิม — ลบ login form)
│   │   ├── ui/                          # shadcn primitives
│   │   ├── app-shell.tsx
│   │   ├── sidebar.tsx                  # ลบเมนู Sign out ออก
│   │   ├── round-selector.tsx
│   │   ├── bet-type-buttons.tsx
│   │   ├── customer-combobox.tsx
│   │   ├── ticket-badge.tsx
│   │   ├── ticket-number.tsx
│   │   ├── no-round.tsx
│   │   ├── theme-provider.tsx
│   │   ├── theme-toggle.tsx
│   │   ├── navigation-progress.tsx
│   │   └── table-skeleton.tsx
│   │
│   ├── hooks/
│   │   └── use-current-round.ts
│   │
│   ├── lib/
│   │   ├── db-client.ts                 # ⭐ ใหม่ — เรียก window.api.* (IPC bridge)
│   │   ├── lottery.ts                   # Business logic (เหมือนเดิม)
│   │   ├── constants.ts
│   │   ├── format.ts
│   │   └── utils.ts
│   │
│   └── types/
│       ├── database.ts                  # Typed SQLite rows
│       └── electron-api.d.ts            # ⭐ ใหม่ — typing สำหรับ window.api
│
├── build/                               # Electron-builder assets
│   ├── icon.ico                         # Windows icon (256×256)
│   ├── icon.icns                        # macOS icon (1024×1024)
│   └── icon.png                         # Linux icon (512×512)
├── dist/                                # Output ของ electron-builder (.exe / .dmg / .AppImage)
├── electron-builder.yml                 # Build config (Win + Mac + Linux)
├── components.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.mjs                      # output: 'export' สำหรับ Electron
├── postcss.config.mjs
└── package.json
```

---

## 📦 Build (Windows + macOS)

### Dev Mode (ทำงานเหมือนกันทั้ง 2 OS)
```bash
npm run dev          # รัน Next.js dev server + Electron พร้อมกัน
```

### Production Build
```bash
npm run build              # Build Next.js static + Electron main
npm run dist               # Build ของ OS ปัจจุบัน (ทั้ง win + mac ถ้า config ครบ)
npm run dist:win           # บังคับ build เฉพาะ Windows
npm run dist:mac           # บังคับ build เฉพาะ macOS (ต้องรันบน Mac เท่านั้น)
```

### ผลลัพธ์ใน `dist/`

**🪟 Windows:**
- `LotteryApp-Setup-x.x.x.exe` — installer (NSIS, ติดตั้งแบบปกติ)
- `LotteryApp-x.x.x-portable.exe` — portable (ไม่ต้องติดตั้ง คัดลอกไปใช้ได้เลย)

**🍎 macOS:**
- `LotteryApp-x.x.x.dmg` — disk image (Universal: Intel + Apple Silicon)
- `LotteryApp-x.x.x-mac.zip` — zip archive สำหรับ auto-update

### ⚠️ ข้อจำกัด Cross-Platform Build
| จาก → ไป | Windows .exe | macOS .dmg | Linux .AppImage |
|---|---|---|---|
| 🪟 Windows | ✅ | ❌ | ⚠️ ผ่าน WSL/Docker |
| 🍎 macOS | ✅ | ✅ | ✅ |
| 🐧 Linux | ✅ ผ่าน wine | ❌ | ✅ |

> 💡 **แนะนำ:** ถ้าจะแจกทั้ง 2 OS ให้ใช้ **GitHub Actions** (มี runner ทั้ง Windows + macOS ฟรี) — push tag แล้วได้ทั้ง .exe และ .dmg พร้อมกัน

### electron-builder.yml (ตัวอย่าง — รองรับ Win + Mac)
```yaml
appId: com.chinnakrit.lotteryapp
productName: LotteryApp
directories:
  output: dist
files:
  - out/**/*           # Next.js export
  - electron/**/*.js   # Compiled electron
  - package.json

# Windows
win:
  target:
    - nsis
    - portable
  icon: build/icon.ico
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true

# macOS
mac:
  target:
    - target: dmg
      arch: [x64, arm64]   # Universal binary
  icon: build/icon.icns
  category: public.app-category.finance
  hardenedRuntime: true    # จำเป็นถ้าจะ notarize
  gatekeeperAssess: false
dmg:
  contents:
    - { x: 130, y: 220 }
    - { x: 410, y: 220, type: link, path: /Applications }
```

### 🔐 macOS Code Signing (ถ้าจะแจกแบบไม่ติด Gatekeeper)
ถ้าไม่ sign — user จะติด "App is damaged or can't be opened" ต้อง **คลิกขวา → Open** ครั้งแรก
ถ้าต้องการแจกแบบติดตั้งได้ปกติ ต้องมี:
- Apple Developer account ($99/ปี)
- Set env: `CSC_LINK` (.p12 cert) + `CSC_KEY_PASSWORD`
- Set env สำหรับ notarize: `APPLE_ID` + `APPLE_APP_SPECIFIC_PASSWORD` + `APPLE_TEAM_ID`

---

## 🧪 Scripts

```bash
npm run dev            # Dev — Next.js + Electron พร้อมกัน (concurrently)
npm run build:next     # Next.js static export → out/
npm run build:electron # tsc compile electron/ → dist-electron/
npm run build          # build:next + build:electron
npm run dist           # electron-builder — build ของ OS ปัจจุบัน
npm run dist:win       # บังคับ build .exe (Windows)
npm run dist:mac       # บังคับ build .dmg (macOS — ต้องรันบน Mac)
npm run dist:all       # build ทั้ง Win + Mac (ต้องรันบน Mac)
npm run rebuild        # rebuild native modules (better-sqlite3) ตาม Electron ABI
npm run lint           # ESLint
npm run typecheck      # TypeScript strict check
```

---

## 🛠️ Tech Stack

| Layer | เทคโนโลยี |
|---|---|
| Desktop Shell | Electron 30+ |
| Framework (Renderer) | Next.js 14 (static export) |
| Language | TypeScript (strict) |
| Database | SQLite ผ่าน `better-sqlite3` (synchronous, fast) |
| IPC | Electron `contextBridge` + `ipcMain/ipcRenderer` |
| Styling | Tailwind CSS + custom theme tokens |
| Components | shadcn/ui (Radix UI primitives) |
| Icons | lucide-react |
| Toast | sonner |
| Validation | zod |
| Packager | electron-builder (Win: nsis + portable, Mac: dmg universal, Linux: AppImage) |

---

## 🔧 Business Logic (`src/lib/lottery.ts`) — เหมือนเดิม

```typescript
normalizeNumber(number, betType)   // 3_tod → sort digits
validateNumber(number, betType)    // เช็คจำนวนหลัก + ตัวเลข
calculatePrize(ticket, round)      // คำนวณเงินรางวัลของ ticket
summarizeRound(tickets, round)     // สรุปยอด/กำไร/ขาดทุนทั้งงวด
isRoundDrawn(round)                // เช็คว่ามีการกรอกผลรางวัลแล้วหรือยัง
```

---

## 🔌 IPC Bridge — Renderer ↔ Main

Renderer (React) เรียกผ่าน `window.api.*` ซึ่ง expose มาจาก `electron/preload.ts`:

```typescript
// ตัวอย่าง — src/lib/db-client.ts
export const db = {
  rounds: {
    list: () => window.api.rounds.list(),
    create: (data) => window.api.rounds.create(data),
    update: (id, data) => window.api.rounds.update(id, data),
    delete: (id) => window.api.rounds.delete(id),
  },
  customers: { /* ... */ },
  tickets: { /* ... */ },
  backup: {
    export: () => window.api.backup.export(),  // เปิด save dialog
    import: (mode) => window.api.backup.import(mode),  // เปิด open dialog
  },
}
```

ฝั่ง main process ใช้ `better-sqlite3` (synchronous → เร็วและไม่ต้องจัดการ async lock)

---

## 🐛 Troubleshooting

| ปัญหา | สาเหตุ | แก้ |
|---|---|---|
| เปิดแอปแล้วจอขาว | renderer โหลด path ผิด | เช็ค `mainWindow.loadFile('out/index.html')` |
| `Error: better-sqlite3 not built for Electron` | native module ผิด ABI | `npm run rebuild` หรือ `electron-rebuild -f -w better-sqlite3` |
| ข้อมูลหายหลังอัพเดต | path `userData` เปลี่ยน | ตรวจ `app.getPath('userData')` + run migration |
| Build .exe ไม่ผ่าน — "icon required" | ไม่มี `build/icon.ico` | ใส่ไฟล์ .ico (256×256) ใน `build/` |
| Build .dmg ไม่ผ่าน — "icon must be .icns" | macOS ต้องใช้ .icns | แปลง .png → .icns ด้วย `iconutil` หรือ online tool |
| 🍎 "LotteryApp is damaged and can't be opened" | macOS Gatekeeper (ยังไม่ sign) | คลิกขวา → Open ครั้งแรก หรือ `xattr -cr /Applications/LotteryApp.app` |
| 🍎 "App can't be opened because Apple cannot check" | ไม่ได้ notarize | เปิด System Settings → Privacy & Security → "Open Anyway" |
| 🪟 Windows Defender block | binary ไม่ได้ sign | คลิก "More info" → "Run anyway" หรือซื้อ code-sign cert |
| ลูกค้าหายตอน import | ID mapping fail | ตรวจ JSON version + ลอง replace mode |
| แอปช้าเมื่อมี ticket > 10,000 | ไม่มี index | รัน `CREATE INDEX` ตาม schema ข้างบน |

---

## 🔒 Security Notes (Electron)

- เปิด `contextIsolation: true` + `nodeIntegration: false` ใน BrowserWindow
- Renderer เข้าถึง DB ผ่าน IPC bridge เท่านั้น — ไม่เปิด `require` ใน renderer
- ไม่ load remote URL — ใช้ `loadFile()` เท่านั้น
- Disable DevTools ใน production build (หรือซ่อนด้วย `Ctrl+Shift+I` disabled)

---

## 📄 License

MIT — ใช้/แก้/แจกได้ตามสบาย

---

## 🙏 Credits

สร้างด้วย ❤️ โดย [chinnakrit.mek@gmail.com](mailto:chinnakrit.mek@gmail.com)

Powered by Claude (Anthropic) + Electron + Next.js + SQLite

Cross-platform: 🪟 Windows · 🍎 macOS · 🐧 Linux
