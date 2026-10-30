# ระบบแจ้งเงินเดือนออนไลน์ องค์การบริหารส่วนจังหวัดศรีสะเกษ (PaySlip Online)
**เชื่อมต่อฐานข้อมูล MySQL เซิร์ฟเวอร์ `183.88.214.9` (ฐานข้อมูล `slip`) ผ่านระบบ GitHub และ Cloudflare Pages**

---

## 1. โครงสร้างระบบ (System Architecture)
โปรเจกต์นี้จำลองหน้าตาและการทำงานของระบบแจ้งเงินเดือนเดิม (`http://183.88.214.9/webserv/slip/frmin.php`) มาไว้บน **GitHub** และ **Cloudflare Pages** แบบ 100% โดยข้อมูลทั้งหมดเชื่อมตรงกับฐานข้อมูล MySQL บนเครื่องเซิร์ฟเวอร์ **`183.88.214.9:3306`** (ฐานข้อมูล `slip`):

1. **หน้าเข้าสู่ระบบ (`index.html` / `frmin.php`)**:
   - ใช้เลขประจำตัวประชาชน 13 หลัก (`idno`) และรหัสผ่าน (`passc`) ตรวจสอบจากตาราง `tbmain`
   - แสดงสถิติจำนวนผู้ที่เปลี่ยนรหัสผ่านและจำนวนผู้มีสิทธิ์ทั้งหมดแบบ Real-time (เช่น `628 คน จำนวนผู้มีสิทธิ์ 751 คน`)
   - มีปุ่ม **🔑 ลืมรหัสผ่าน? (รีเซ็ตรหัสผ่านด้วย OTP)** ที่กำหนดกฎรหัสผ่าน 10 ตัวอักษร (ตัวเลข 6 ตัว + อักษรภาษาอังกฤษ 3 ตัว + อักขระพิเศษ 1 ตัว) และอัปเดตลงตาราง `tbmain` ทันที
2. **หน้ารายการเดือนเงินเดือน (`inchk.php` / `allmonth.php`)**:
   - แสดงชื่อ-สกุล ตำแหน่ง และหน่วยงาน พร้อมตาราง DataTables แสดงรายการเดือนย้อนหลังทั้งหมดจากตาราง `tbdetail`
   - มีเมนู **เปลี่ยนรหัสผ่าน** และ **ออกจากระบบ**
3. **หน้าใบรับรองการจ่ายเงินเดือนและเงินอื่น (`viewmmCivil.php`)**:
   - แสดงรายการรับ 12 รายการ (`money1`..`money12`), รายการหัก 14 รายการ (`exp1`..`exp13` พร้อมชื่อรายการหัก `lab7`..`lab13`), รวมรับ (`sumget`), รวมหัก (`sumpay`), รับสุทธิ (`sumnet`) พร้อมคำอ่านภาษาไทย และลายเซ็นผู้อำนวยการสำนักคลัง
   - รองรับการสั่งพิมพ์ใบแจ้งเงินเดือนออกทางเครื่องพิมพ์หรือบันทึกเป็น PDF ได้ทันที
4. **Cloudflare Pages Functions (`functions/api/slip.js`)**:
   - Serverless Backend ที่รันบน Cloudflare Edge (เปิดโหมด `nodejs_compat`) เชื่อมต่อผ่าน TCP Socket ไปยัง MySQL `183.88.214.9:3306` โดยตรง ไม่ต้องติดตั้งไลบรารีภายนอก

---

## 2. วิธีนำขึ้นระบบ Cloudflare Pages เชื่อมต่อกับ GitHub (เหมือนเว็บศูนย์ยืม-คืน)

1. เข้าสู่ระบบที่ **[https://dash.cloudflare.com](https://dash.cloudflare.com)**
2. ไปที่เมนู **Workers & Pages** -> คลิกปุ่ม **Create application** -> เลือกแท็บ **Pages** -> คลิก **Connect to Git**
3. เลือกบัญชี GitHub **`tnt203ssk-png`** และเลือก Repository **`sisaket-payslip`**
4. ตั้งค่าการ Build ดังนี้:
   - **Project name**: `sisaket-payslip` (จะได้ลิงก์ `https://sisaket-payslip.pages.dev`)
   - **Production branch**: `main`
   - **Build command**: *(เว้นว่างไว้)*
   - **Build output directory**: `.` (หรือ `/`)
5. คลิก **Save and Deploy**
6. **เปิดใช้งาน `nodejs_compat` สำหรับเชื่อมต่อ MySQL `183.88.214.9`**:
   - यदिใช้ไฟล์ `wrangler.json` ในโปรเจกต์ ระบบจะอ่านค่า `"compatibility_flags": ["nodejs_compat"]` ให้อัตโนมัติ
   - หรือตรวจสอบได้ที่เมนู **Settings** -> **Functions** -> **Compatibility flags** -> เพิ่ม `nodejs_compat` ทั้งใน Production และ Preview

---

## 3. วิธีรันทดสอบบนเครื่องคอมพิวเตอร์ (Local Web Server)
ดับเบิลคลิกหรือรันคำสั่ง PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File "D:\งานหน้าจอส่งไล0966\sisaket-payslip\start_server.ps1"
```
ระบบจะจำลองเซิร์ฟเวอร์ที่ `http://localhost:8085/index.html` และเชื่อมต่อไปยังฐานข้อมูลจริง `183.88.214.9` ทันที
