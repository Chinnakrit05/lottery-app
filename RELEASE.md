# 🚀 Release & Auto-Update Guide

ระบบ auto-update ทำงานเฉพาะ **Windows** ผ่าน **GitHub Releases**

## 📋 ตั้งค่าครั้งแรก (One-time setup)

### 1. สร้าง GitHub repo

```bash
cd /Users/devcat/Documents/lotteryApp
git init
git add .
git commit -m "Initial commit"
```

ไปที่ https://github.com/new → สร้าง repo ใหม่ (ชื่ออะไรก็ได้ เช่น `lottery-app`)

จากนั้น push code ขึ้น:
```bash
git remote add origin https://github.com/YOUR_USERNAME/lottery-app.git
git branch -M main
git push -u origin main
```

> 💡 **Public หรือ Private?** Public ฟรี ใช้ได้เลย Private ก็ใช้ auto-update ได้แต่ต้องใช้ token

### 2. แก้ `electron-builder.yml` ใส่ชื่อจริง

เปิด `electron-builder.yml` แก้บรรทัด:
```yaml
publish:
  - provider: github
    owner: YOUR_GITHUB_USERNAME   # ← ใส่ username จริง
    repo: lottery-app             # ← ใส่ชื่อ repo จริง
```

### 3. สร้าง GitHub Personal Access Token (PAT)

1. ไป https://github.com/settings/tokens → **Generate new token (classic)**
2. ตั้งชื่อ: `lottery-app-publish`
3. Scope: ✅ **`repo`** (full control of private repos — ครอบคลุม releases)
4. Expiration: เลือก 1 year หรือ no expiration
5. กด Generate → **คัดลอก token เก็บไว้** (เห็นได้ครั้งเดียว!)

ตัวอย่าง token: `ghp_abc123xyz...`

---

## 📦 ปล่อยเวอร์ชั่นใหม่ (ทุกครั้งที่อัพเดท)

### Step 1: Bump version

แก้ใน `package.json`:
```json
{
  "version": "1.0.1"   // จาก 1.0.0 → 1.0.1
}
```

> 💡 ใช้ semver: `1.0.0` → `1.0.1` (patch) → `1.1.0` (minor) → `2.0.0` (major)

### Step 2: Set GitHub Token

```bash
# macOS / Linux
export GH_TOKEN="ghp_abc123xyz..."

# Windows (PowerShell)
$env:GH_TOKEN="ghp_abc123xyz..."
```

### Step 3: Build + Publish

```bash
npm run publish:win
```

จะใช้เวลา ~5-8 นาที — ทำสิ่งต่อไปนี้:
1. ✅ Build Next.js + Electron
2. ✅ Compile native modules
3. ✅ สร้าง `.exe` + `latest.yml` ใน `dist/`
4. ✅ สร้าง GitHub Release (เป็น draft หรือ published ตาม config)
5. ✅ Upload `.exe` + `latest.yml` ขึ้น Release

### Step 4: Publish Release (ถ้าตั้ง draft)

ถ้า `releaseType: release` ใน config — published อัตโนมัติ ✅
ถ้า `releaseType: draft` — ไปที่ https://github.com/YOUR_USERNAME/lottery-app/releases → กด **Publish release**

### Step 5: ผู้ใช้งานเดิมจะได้รับ auto-update

- เปิดแอปครั้งถัดไป → แอป check GitHub API → พบ v1.0.1
- ดาวน์โหลด background → แสดง toast "พร้อมติดตั้ง v1.0.1"
- คลิก **Restart + ติดตั้ง** → แอปปิด → ติดตั้ง → เปิดเวอร์ชั่นใหม่

---

## 🎬 ตัวอย่าง Workflow ที่ใช้บ่อย

```bash
# 1. แก้โค้ด feature ใหม่
git add . && git commit -m "feat: add feature X"
git push

# 2. Bump version
npm version patch   # 1.0.0 → 1.0.1 (auto update package.json + git tag)

# 3. Publish
export GH_TOKEN="ghp_xxx"
npm run publish:win

# 4. Push tag
git push --tags

# เสร็จ! ผู้ใช้จะได้ update อัตโนมัติภายในไม่กี่นาที
```

---

## 🤖 Auto-publish ด้วย GitHub Actions (Optional)

ถ้าไม่อยาก build เองทุกครั้ง → push tag แล้วให้ GitHub server build ให้ — สร้างไฟล์ `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run publish:win
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

ใช้แบบนี้:
```bash
npm version patch
git push --follow-tags
# GitHub Action จะ build + publish ให้อัตโนมัติ
```

---

## 🐛 Troubleshooting

| ปัญหา | สาเหตุ | แก้ |
|---|---|---|
| `GH_TOKEN is not set` | ลืม export token | `export GH_TOKEN="ghp_..."` |
| `404 Not Found` ตอน publish | repo/owner ใน config ผิด | เช็ค `electron-builder.yml` |
| ผู้ใช้ไม่ได้ update | yaml ใน release ขาด | เช็คว่ามี `latest.yml` ใน release assets |
| แอปบอก "error" ตอน check | network / private repo | Private repo ต้อง token-protected feed |
| ดาวน์โหลดช้า | GitHub server ช้าในไทย | ใช้ CDN หรือเปลี่ยนไป S3 |

---

## 🍎 ทำไม macOS ไม่ทำงาน?

macOS auto-update ต้องการ:
1. ✅ Apple Developer ID Certificate ($99/ปี)
2. ✅ Code-sign ทุก binary ในแอป
3. ✅ Notarize ผ่าน Apple servers

ถ้าไม่ครบ 3 ข้อนี้ — auto-update **พังเงียบๆ** ไม่ error แต่ไม่ติดตั้ง

ทางเลือกสำหรับ Mac ตอนนี้:
- ผู้ใช้ Mac ดาวน์โหลด .dmg ใหม่จาก GitHub Release เอง
- หรือใส่ป้อปอัพในแอป "มีเวอร์ชั่นใหม่ → คลิกดาวน์โหลด" (ไม่ใช่ auto-install)
