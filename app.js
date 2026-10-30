// ============================================================================
// ระบบแจ้งเงินเดือนออนไลน์ องค์การบริหารส่วนจังหวัดศรีสะเกษ (PaySlip Web App)
// เชื่อมต่อฐานข้อมูล MySQL 183.88.214.9 (ฐานข้อมูล slip) ผ่าน /api/slip
// ============================================================================

const API_ENDPOINT = '/api/slip';
let currentMember = null;
let currentMonths = [];
let dataTableInstance = null;

const THAI_MONTHS = {
  1: 'มกราคม', 2: 'กุมภาพันธ์', 3: 'มีนาคม', 4: 'เมษายน',
  5: 'พฤษภาคม', 6: 'มิถุนายน', 7: 'กรกฎาคม', 8: 'สิงหาคม',
  9: 'กันยายน', 10: 'ตุลาคม', 11: 'พฤศจิกายน', 12: 'ธันวาคม'
};

// โหลดสถิติจำนวนผู้มีสิทธิ์จากฐานข้อมูล 183.88.214.9
async function loadLoginStats() {
  try {
    const res = await fetch(`${API_ENDPOINT}?action=stats`);
    const data = await res.json();
    if (data && data.success) {
      document.getElementById('statTotal').textContent = data.total_members;
      document.getElementById('statChanged').textContent = data.changed_members;
      const badge = document.getElementById('dbStatusBadge');
      if (badge) {
        badge.textContent = `🟢 เชื่อมต่อฐานข้อมูล 183.88.214.9 สำเร็จ (สมาชิกทั้งหมด ${data.total_members} คน)`;
      }
    }
  } catch (err) {
    console.warn('Stats fetch error:', err);
  }
}

// สลับหน้าจอแสดงผล (SPA View Router)
function showView(viewId) {
  ['view-login', 'view-months', 'view-slip', 'view-chpass'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = id === viewId ? 'block' : 'none';
  });
  window.scrollTo(0, 0);
}

// เข้าสู่ระบบ
async function handleLogin(e) {
  e.preventDefault();
  const idno = document.getElementById('usnm').value.trim();
  const password = document.getElementById('pswd').value.trim();
  const errEl = document.getElementById('loginErrorMsg');
  const btn = document.getElementById('btnLoginSubmit');

  errEl.style.display = 'none';
  btn.disabled = true;
  btn.value = 'กำลังตรวจสอบ...';

  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', idno, password })
    });
    const data = await res.json();

    if (!data.success) {
      errEl.textContent = data.message || 'เลขประจำตัวประชาชน หรือ รหัสผ่าน ไม่ถูกต้อง!';
      errEl.style.display = 'block';
      return;
    }

    currentMember = data.member;
    currentMonths = data.months || [];
    sessionStorage.setItem('SISAKET_SLIP_USER', JSON.stringify({ idno, password }));

    populateMemberHeader();
    renderMonthsTable();
    showView('view-months');
  } catch (err) {
    errEl.textContent = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ฐานข้อมูลได้: ' + err.message;
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.value = 'ตกลง';
  }
}

function populateMemberHeader() {
  if (!currentMember) return;
  const officeName = currentMember.office_name || 'องค์การบริหารส่วนจังหวัดศรีสะเกษ';
  document.getElementById('userFullName').textContent = currentMember.nname || '-';
  document.getElementById('userPosition').textContent = currentMember.nposit || '-';
  document.getElementById('userOffice').textContent = officeName;

  document.getElementById('chpFullName').textContent = currentMember.nname || '-';
  document.getElementById('chpPosition').textContent = currentMember.nposit || '-';
  document.getElementById('chpOffice').textContent = officeName;
}

function renderMonthsTable() {
  if (dataTableInstance) {
    dataTableInstance.destroy();
    dataTableInstance = null;
  }

  const tbody = document.getElementById('monthsTableBody');
  tbody.innerHTML = '';

  currentMonths.forEach((m, index) => {
    const mmNum = Number(m.mm);
    const mName = m.month_name || THAI_MONTHS[mmNum] || m.mm;
    const label = `${mName} ${m.yy}`;
    const daypay = m.daypay && m.daypay !== '0' ? m.daypay : '';
    const notes = m.notes && m.notes.trim() !== '' ? m.notes : '-';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td align="center">${index + 1}</td>
      <td align="left">&nbsp;&nbsp;<font face="ms sans serif" size="3"><a href="javascript:void(0)" onclick="openSlipDetail(${m.nauto})">${label}</a></font></td>
      <td align="center"><font face="ms sans serif" size="3">${daypay}</font></td>
      <td align="center"><font face="ms sans serif" size="3">${notes}</font></td>
    `;
    tbody.appendChild(tr);
  });

  if (window.jQuery && window.jQuery.fn && window.jQuery.fn.DataTable) {
    dataTableInstance = window.jQuery('#tbmoney').DataTable({
      pageLength: 10,
      ordering: true,
      order: [[0, 'asc']]
    });
  }
}

function fmtMoney(val) {
  const num = parseFloat(String(val || '0').replace(/,/g, ''));
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// แปลงตัวเลขเป็นตัวอักษรภาษาไทย (บาทถ้วน / สตางค์)
function thaiBahtText(amountInput) {
  let num = parseFloat(String(amountInput || '0').replace(/,/g, ''));
  if (isNaN(num) || num <= 0) return 'ศูนย์บาทถ้วน';

  const txtNum = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const txtDigit = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  function convertInt(nStr) {
    let res = '';
    const len = nStr.length;
    for (let i = 0; i < len; i++) {
      const d = parseInt(nStr.charAt(i), 10);
      const pos = len - i - 1;
      if (d !== 0) {
        if (pos % 6 === 0 && pos > 0) {
          if (d === 1 && i > 0) res += 'เอ็ด';
          else res += txtNum[d];
          res += 'ล้าน';
        } else {
          const p = pos % 6;
          if (p === 0 && d === 1 && len > 1 && nStr.charAt(i - 1) !== '0') {
            res += 'เอ็ด';
          } else if (p === 1 && d === 2) {
            res += 'ยี่สิบ';
          } else if (p === 1 && d === 1) {
            res += 'สิบ';
          } else {
            res += txtNum[d] + txtDigit[p];
          }
        }
      } else if (pos % 6 === 0 && pos > 0) {
        res += 'ล้าน';
      }
    }
    return res;
  }

  const fixed = num.toFixed(2).split('.');
  const bahtStr = fixed[0];
  const satangStr = fixed[1];

  let result = '';
  if (parseInt(bahtStr, 10) > 0) {
    result += convertInt(bahtStr) + 'บาท';
  }
  if (parseInt(satangStr, 10) > 0) {
    result += convertInt(String(parseInt(satangStr, 10))) + 'สตางค์';
  } else {
    result += 'ถ้วน';
  }
  return result;
}

// เปิดดูใบรับรองการจ่ายเงินเดือนและเงินอื่น (viewmmCivil.php)
async function openSlipDetail(nauto) {
  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'slip_detail',
        nauto,
        idno: currentMember ? currentMember.idno : ''
      })
    });
    const data = await res.json();
    if (!data.success || !data.slip) {
      alert(data.message || 'ไม่พบข้อมูลสลิปเงินเดือน');
      return;
    }

    const s = data.slip;
    const mmNum = Number(s.mm);
    const mName = s.month_name || THAI_MONTHS[mmNum] || s.mm;

    document.getElementById('slipMonthYear').innerHTML = `${mName}&nbsp;ปี พ.ศ.${s.yy}`;
    document.getElementById('slipDayPay').textContent = s.daypay && s.daypay !== '0' ? s.daypay : '';
    document.getElementById('slipFullName').textContent = s.nname || (currentMember && currentMember.nname) || '-';

    const bankFull = `${s.bank_name || 'ธนาคารกรุงไทย จำกัด(มหาชน)'} ${s.bank_branch || 'สาขาศรีสะเกษ'}`;
    document.getElementById('slipBankName').textContent = bankFull;
    document.getElementById('slipOfficeName').textContent = s.office_name || 'องค์การบริหารส่วนจังหวัดศรีสะเกษ';
    document.getElementById('slipBankNo').textContent = s.nobank || '-';

    for (let i = 1; i <= 12; i++) {
      const mEl = document.getElementById('m' + i);
      if (mEl) mEl.textContent = fmtMoney(s['money' + i]);
    }

    for (let i = 1; i <= 13; i++) {
      const eEl = document.getElementById('e' + i);
      if (eEl) eEl.textContent = fmtMoney(s['exp' + i]);
    }

    const defaultLabs = {
      7: 'ธ.อ.ส.',
      8: 'ภาษีหัก ณ ที่จ่าย/ประกันสังคม',
      9: 'สหกรณ์ฯ อุบลฯ/สุรินทร์/อำนาจฯ/มุกฯ/สรรพสิทธิ์',
      10: 'สหกรณ์ฯ ร้อยเอ็ด/กาฬสินธุ์/ขอนแก่น',
      11: 'สหกรณ์ฯ รพช/อบจ ศก./พมจ./ตราด',
      12: 'สหกรณ์/ตราด/สกลนคร/ยโสธร',
      13: ''
    };
    for (let k = 7; k <= 13; k++) {
      const lEl = document.getElementById('lab' + k);
      if (lEl) {
        const customLab = s['lab' + k];
        lEl.textContent = customLab && customLab.trim() !== '' ? customLab : defaultLabs[k];
      }
    }

    document.getElementById('slipSumGet').textContent = fmtMoney(s.sumget);
    document.getElementById('slipSumPay').textContent = fmtMoney(s.sumpay);
    document.getElementById('slipSumNet').textContent = fmtMoney(s.sumnet);
    document.getElementById('slipSumNetThai').textContent = thaiBahtText(s.sumnet);

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    document.getElementById('slipPrintTimestamp').textContent =
      `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} เวลา ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} น.`;

    showView('view-slip');
  } catch (err) {
    alert('เกิดข้อผิดพลาดในการดึงข้อมูลสลิป: ' + err.message);
  }
}

// เปลี่ยนรหัสผ่าน
async function handleChangePassword(e) {
  e.preventDefault();
  if (!currentMember) return;

  const p1 = document.getElementById('newPwd1').value.trim();
  const p2 = document.getElementById('newPwd2').value.trim();

  if (p1 !== p2) {
    alert('รหัสผ่านใหม่ทั้ง 2 ช่องไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
    return;
  }
  if (p1.length < 4) {
    alert('กรุณากำหนดรหัสผ่านความยาวอย่างน้อย 4 ตัวอักษร');
    return;
  }

  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'change_password',
        idno: currentMember.idno,
        new_password: p1
      })
    });
    const data = await res.json();
    if (data.success) {
      alert(data.message || 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
      document.getElementById('newPwd1').value = '';
      document.getElementById('newPwd2').value = '';
      showView('view-months');
    } else {
      alert(data.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
    }
  } catch (err) {
    alert('เกิดข้อผิดพลาด: ' + err.message);
  }
}

function handleLogout() {
  currentMember = null;
  currentMonths = [];
  sessionStorage.removeItem('SISAKET_SLIP_USER');
  document.getElementById('pswd').value = '';
  showView('view-login');
  loadLoginStats();
}

// ============================================================================
// ระบบค้นหาและรีเซ็ตรหัสผ่านด้วย OTP (กรณีลืมรหัสผ่าน)
// ============================================================================
let otpCurrentRef = '';
let otpCurrentIdno = '';

function openOtpModal() {
  resetOtpModal();
  const typedId = document.getElementById('usnm').value.trim();
  if (typedId.length === 13) {
    document.getElementById('otpIdno').value = typedId;
  }
  document.getElementById('otpModal').style.display = 'flex';
}

function closeOtpModal() {
  document.getElementById('otpModal').style.display = 'none';
}

function resetOtpModal() {
  document.getElementById('otpStep1').style.display = 'block';
  document.getElementById('otpStep2').style.display = 'none';
  document.getElementById('otpInputCode').value = '';
  document.getElementById('otpNewPassword').value = '';
  validateOtpPasswordRule();
}

async function requestOtpCode() {
  const idno = document.getElementById('otpIdno').value.trim();
  if (idno.length !== 13) {
    alert('กรุณากรอกเลขประจำตัวประชาชน 13 หลักให้ครบถ้วน');
    return;
  }

  const btn = document.getElementById('btnReqOtp');
  btn.disabled = true;
  btn.textContent = 'กำลังค้นหาข้อมูลสมาชิก...';

  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request_otp', idno })
    });
    const data = await res.json();
    if (!data.success) {
      alert(data.message || 'ไม่พบข้อมูลสมาชิก');
      return;
    }

    otpCurrentIdno = idno;
    otpCurrentRef = data.ref_code;

    document.getElementById('otpMemName').textContent = data.member_name || '-';
    document.getElementById('otpMemPos').textContent = data.member_position || '-';
    document.getElementById('otpMaskedPhone').textContent = data.masked_phone || '-';
    document.getElementById('otpRefCode').textContent = data.ref_code || '-';
    document.getElementById('otpDemoCode').textContent = data.demo_otp || '-';
    document.getElementById('otpInputCode').value = data.demo_otp || '';

    autoGenPassword();
    document.getElementById('otpStep1').style.display = 'none';
    document.getElementById('otpStep2').style.display = 'block';
  } catch (err) {
    alert('เกิดข้อผิดพลาด: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '📲 ค้นหาสมาชิกและขอรหัส OTP';
  }
}

function autoGenPassword() {
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowers = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '0123456789';
  const specials = '@#$!&';

  const l1 = uppers[Math.floor(Math.random() * uppers.length)];
  const l2 = lowers[Math.floor(Math.random() * lowers.length)];
  const l3 = lowers[Math.floor(Math.random() * lowers.length)];
  let d6 = '';
  for (let i = 0; i < 6; i++) d6 += digits[Math.floor(Math.random() * digits.length)];
  const sp = specials[Math.floor(Math.random() * specials.length)];

  const pwd = `${l1}${l2}${l3}${d6}${sp}`;
  document.getElementById('otpNewPassword').value = pwd;
  validateOtpPasswordRule();
}

function validateOtpPasswordRule() {
  const pwd = document.getElementById('otpNewPassword').value;
  const dCount = (pwd.match(/[0-9]/g) || []).length;
  const lCount = (pwd.match(/[a-zA-Z]/g) || []).length;
  const sCount = (pwd.match(/[^a-zA-Z0-9]/g) || []).length;
  const len = pwd.length;

  const setBadge = (id, text, ok) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className = 'rule-badge' + (ok ? ' valid' : '');
  };

  setBadge('ruleDigit', `ตัวเลขอารบิก 6 ตัว (${dCount}/6)`, dCount === 6);
  setBadge('ruleLetter', `อักษรอังกฤษ 3 ตัว (${lCount}/3)`, lCount === 3);
  setBadge('ruleSpec', `อักขระพิเศษ 1 ตัว (${sCount}/1)`, sCount === 1);
  setBadge('ruleLen', `รวม 10 ตัว (${len}/10)`, len === 10);
}

async function submitOtpReset() {
  const otpCode = document.getElementById('otpInputCode').value.trim();
  const newPass = document.getElementById('otpNewPassword').value.trim();

  if (!otpCode) {
    alert('กรุณากรอกรหัส OTP 6 หลัก');
    return;
  }

  const btn = document.getElementById('btnSubmitOtpReset');
  btn.disabled = true;

  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reset_password_otp',
        idno: otpCurrentIdno,
        otp_code: otpCode,
        ref_code: otpCurrentRef,
        new_password: newPass
      })
    });
    const data = await res.json();
    if (!data.success) {
      alert(data.message || 'ไม่สามารถตั้งรหัสผ่านใหม่ได้');
      return;
    }

    alert(`✅ ตั้งรหัสผ่านใหม่สำเร็จ!\n\nเลขประชาชน: ${otpCurrentIdno}\nรหัสผ่านใหม่: ${newPass}\n\nระบบได้กรอกรหัสผ่านใหม่ในช่องเข้าสู่ระบบให้เรียบร้อยแล้ว`);
    document.getElementById('usnm').value = otpCurrentIdno;
    document.getElementById('pswd').value = newPass;
    closeOtpModal();
  } catch (err) {
    alert('เกิดข้อผิดพลาด: ' + err.message);
  } finally {
    btn.disabled = false;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadLoginStats();
});
