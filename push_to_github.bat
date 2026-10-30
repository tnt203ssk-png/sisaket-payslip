@echo off
chcp 65001 >nul
title อัปโหลดเว็บไซต์ระบบแจ้งเงินเดือน (sisaket-payslip) ขึ้น GitHub
cd /d "%~dp0"

echo ============================================================================
echo   ระบบอัปโหลดโค้ดเว็บไซต์แจ้งเงินเดือนออนไลน์ (sisaket-payslip) ขึ้น GitHub
echo ============================================================================
echo.

git init
git branch -M main
git add .
git commit -m "Initial commit: Sisaket PAO PaySlip online system"
git remote remove origin 2>nul
git remote add origin https://github.com/tnt203ssk-png/sisaket-payslip.git

echo.
echo กำลังส่งไฟล์ขึ้น GitHub (https://github.com/tnt203ssk-png/sisaket-payslip.git)...
git push -u origin main --force

echo.
echo ============================================================================
echo   ดำเนินการเสร็จสิ้น! (หากขึ้นข้อความ main -> main แสดงว่าอัปโหลดสำเร็จแล้ว)
echo ============================================================================
pause
