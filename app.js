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

function isCurrentUserAdmin() {
  return Boolean(
    currentMember &&
    (currentMember.is_admin || currentMember.idno === '3330100466968' || currentMember.idno === '3330700073550')
  );
}

function handleAdminMenuClick() {
  if (isCurrentUserAdmin()) {
    openOtpModal();
  } else {
    alert('เมนูนี้สำหรับผู้ดูแลระบบ (Admin) เท่านั้น');
  }
}

function populateMemberHeader() {
  if (!currentMember) return;
  const officeName = currentMember.office_name || 'องค์การบริหารส่วนจังหวัดศรีสะเกษ';
  document.getElementById('userFullName').textContent = currentMember.nname || '-';
  document.getElementById('userPosition').textContent = currentMember.nposit || '-';
  document.getElementById('userOffice').textContent = officeName;

  const admTop = document.getElementById('adminMenuTop');
  if (admTop) {
    if (isCurrentUserAdmin()) {
      admTop.innerHTML = '[ <a href="javascript:void(0)" onclick="openOtpModal()" style="color:#1e40af; font-weight:bold;">🛡️ Admin: ค้นหา/ดูรหัส OTP สมาชิก</a> ]';
    } else {
      admTop.innerHTML = '[ <a href="javascript:void(0)" onclick="handleAdminMenuClick()">Admin</a> ]';
    }
  }

  document.getElementById('chpFullName').textContent = currentMember.nname || '-';
  document.getElementById('chpPosition').textContent = currentMember.nposit || '-';
  document.getElementById('chpOffice').textContent = officeName;
  const chpPhoneEl = document.getElementById('chpPhone');
  const chpEmailEl = document.getElementById('chpEmail');
  if (chpPhoneEl) chpPhoneEl.value = (currentMember.mbphone && currentMember.mbphone !== '0') ? currentMember.mbphone : '';
  if (chpEmailEl) chpEmailEl.value = currentMember.email || '';
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

// ============================================================================
// ตัวนับเวลาถอยหลัง 5 นาที (300 วินาที) สำหรับรหัส OTP และแถบแจ้งเตือน SMS
// ============================================================================
let otpTimerInterval = null;
let chpTimerInterval = null;

function formatSeconds(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s} นาที`;
}

function startOtpCountdown(elementId, isModal) {
  let remaining = 300; // 5 นาที (300 วินาที)
  if (isModal && otpTimerInterval) clearInterval(otpTimerInterval);
  if (!isModal && chpTimerInterval) clearInterval(chpTimerInterval);

  const updateLabel = () => {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (remaining <= 0) {
      el.textContent = 'หมดอายุแล้ว (กรุณากดส่งรหัส OTP อีกครั้ง)';
      el.style.color = '#dc2626';
      if (isModal && otpTimerInterval) clearInterval(otpTimerInterval);
      if (!isModal && chpTimerInterval) clearInterval(chpTimerInterval);
      return;
    }
    el.textContent = formatSeconds(remaining);
    remaining--;
  };

  updateLabel();
  const id = setInterval(updateLabel, 1000);
  if (isModal) otpTimerInterval = id;
  else chpTimerInterval = id;
}

function showSmsNotification(maskedPhone, otpCode, refCode) {
  const banner = document.getElementById('smsPushBanner');
  if (!banner) return;
  // แสดง Popup รหัส OTP เฉพาะเมื่อล็อกอินด้วยสิทธิ์ Admin เท่านั้น สมาชิกทั่วไปจะไม่แสดงให้เห็น
  if (!isCurrentUserAdmin() || !otpCode) {
    banner.style.display = 'none';
    return;
  }
  document.getElementById('smsBannerPhone').textContent = maskedPhone || '-';
  document.getElementById('smsBannerOtp').textContent = otpCode || '------';
  document.getElementById('smsBannerRef').textContent = refCode || '----';
  banner.style.display = 'block';
}

function hideSmsNotification() {
  const banner = document.getElementById('smsPushBanner');
  if (banner) banner.style.display = 'none';
}

// ============================================================================
// ระบบเปลี่ยนรหัสผ่านเมื่อล็อกอินแล้ว (ยืนยัน OTP ผ่านเบอร์โทรศัพท์ หรือ อีเมล ที่ลงทะเบียนไว้)
// ============================================================================
let chpCurrentRef = '';

async function requestChpOtp(channel = 'phone') {
  if (!currentMember) return;
  const chpPhone = document.getElementById('chpPhone') ? document.getElementById('chpPhone').value.trim() : '';
  const chpEmail = document.getElementById('chpEmail') ? document.getElementById('chpEmail').value.trim() : '';

  if (channel === 'email') {
    if (!chpEmail || !chpEmail.includes('@')) {
      alert('กรุณากรอกอีเมล (Email) ที่ลงทะเบียนไว้ เช่น name@gmail.com ก่อนกดขอรหัส OTP ทางอีเมล');
      return;
    }
  } else {
    if (!chpPhone || chpPhone.replace(/[^0-9]/g, '').length < 9) {
      alert('กรุณากรอกหมายเลขโทรศัพท์ที่ลงทะเบียนไว้ (10 หลัก) ก่อนกดขอรหัส OTP ทางเบอร์โทรศัพท์');
      return;
    }
  }

  const btn = channel === 'email' ? document.getElementById('btnChpReqEmailOtp') : document.getElementById('btnChpReqOtp');
  const origText = btn ? btn.textContent : '';
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'กำลังส่ง OTP...';
  }

  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'request_otp',
        idno: currentMember.idno,
        channel: channel,
        phone: chpPhone,
        email: chpEmail,
        contact: channel === 'email' ? chpEmail : chpPhone,
        logged_in: true,
        is_admin: isCurrentUserAdmin()
      })
    });
    const data = await res.json();
    if (!data.success) {
      alert(data.message || 'ไม่สามารถขอรหัส OTP ได้');
      return;
    }

    chpCurrentRef = data.ref_code;
    const targetDisp = data.masked_target || (channel === 'email' ? (data.masked_email || chpEmail) : (data.masked_phone || chpPhone));
    document.getElementById('chpMaskedPhone').textContent = targetDisp;
    document.getElementById('chpRefCode').textContent = data.ref_code || '-';
    document.getElementById('chpOtpCode').value = '';
    document.getElementById('chpOtpInfoRow').style.display = '';
    const chpOtpVal = data.fallback_otp || data.demo_otp || '';
    if (document.getElementById('chpFallbackOtpBox')) {
      document.getElementById('chpFallbackOtpCode').textContent = chpOtpVal || '------';
      if (!data.sms_sent || isCurrentUserAdmin()) {
        document.getElementById('chpFallbackOtpBox').style.display = chpOtpVal ? 'block' : 'none';
        if (document.getElementById('btnRevealChpOtp')) document.getElementById('btnRevealChpOtp').style.display = 'none';
      } else {
        document.getElementById('chpFallbackOtpBox').style.display = 'none';
        if (document.getElementById('btnRevealChpOtp')) document.getElementById('btnRevealChpOtp').style.display = chpOtpVal ? 'inline-block' : 'none';
      }
    }
    startOtpCountdown('chpTimerText', false);
    showSmsNotification(targetDisp, data.demo_otp, data.ref_code);
    document.getElementById('chpOtpCode').focus();
  } catch (err) {
    alert('เกิดข้อผิดพลาด: ' + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = origText || (channel === 'email' ? '📧 ขอรหัส OTP (อีเมล)' : '📲 ขอรหัส OTP (เบอร์โทร)');
    }
  }
}

function revealChpFallbackOtp() {
  if (document.getElementById('chpFallbackOtpBox')) {
    document.getElementById('chpFallbackOtpBox').style.display = 'block';
  }
  if (document.getElementById('btnRevealChpOtp')) {
    document.getElementById('btnRevealChpOtp').style.display = 'none';
  }
}

function fillChpFallbackOtp() {
  const code = document.getElementById('chpFallbackOtpCode') ? document.getElementById('chpFallbackOtpCode').textContent.trim() : '';
  if (code && code !== '------') {
    document.getElementById('chpOtpCode').value = code;
  }
}

async function handleChangePassword(e) {
  e.preventDefault();
  if (!currentMember) return;

  const p1 = document.getElementById('newPwd1').value.trim();
  const p2 = document.getElementById('newPwd2').value.trim();
  const chpPhone = document.getElementById('chpPhone') ? document.getElementById('chpPhone').value.trim() : '';
  const chpEmail = document.getElementById('chpEmail') ? document.getElementById('chpEmail').value.trim() : '';
  const chpOtpCode = document.getElementById('chpOtpCode') ? document.getElementById('chpOtpCode').value.trim() : '';

  if (!chpOtpCode || chpOtpCode.length !== 6) {
    alert('กรุณากดปุ่ม "📲 ขอรหัส OTP" และกรอกรหัสยืนยัน OTP 6 หลักก่อนเปลี่ยนรหัสผ่าน');
    return;
  }
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
        new_password: p1,
        otp_code: chpOtpCode,
        ref_code: chpCurrentRef,
        mbphone: chpPhone,
        email: chpEmail
      })
    });
    const data = await res.json();
    if (data.success) {
      if (chpTimerInterval) clearInterval(chpTimerInterval);
      hideSmsNotification();
      currentMember.mbphone = chpPhone;
      currentMember.email = chpEmail;
      alert(data.message || 'ยืนยันรหัส OTP และเปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
      document.getElementById('newPwd1').value = '';
      document.getElementById('newPwd2').value = '';
      document.getElementById('chpOtpCode').value = '';
      document.getElementById('chpOtpInfoRow').style.display = 'none';
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
// ระบบยืนยัน OTP ผ่านหมายเลขโทรศัพท์ หรือ อีเมล ที่ลงทะเบียนไว้เพื่อแก้ไขรหัสผ่าน
// ============================================================================
let otpCurrentRef = '';
let otpCurrentIdno = '';
let otpVerifiedPhone = '';
let otpSelectedChannel = 'phone';

function setOtpChannel(channel) {
  otpSelectedChannel = channel === 'email' ? 'email' : 'phone';
  const tabPhone = document.getElementById('tabOtpPhone');
  const tabEmail = document.getElementById('tabOtpEmail');
  const label = document.getElementById('otpContactLabel');
  const input = document.getElementById('otpContactInput');
  const btn = document.getElementById('btnReqOtp');

  if (otpSelectedChannel === 'email') {
    if (tabEmail) {
      tabEmail.style.background = '#0d9488';
      tabEmail.style.color = '#ffffff';
      tabEmail.style.border = '2px solid #0d9488';
    }
    if (tabPhone) {
      tabPhone.style.background = '#f8fafc';
      tabPhone.style.color = '#334155';
      tabPhone.style.border = '1px solid #cbd5e1';
    }
    if (label) {
      label.textContent = 'กรอกอีเมล (Email) ที่ลงทะเบียนไว้ในระบบ:';
      label.style.color = '#0f766e';
    }
    if (input) {
      input.placeholder = 'กรอกอีเมลที่ลงทะเบียนไว้ เช่น name@gmail.com';
      input.style.borderColor = '#0d9488';
      input.style.background = '#f0fdfa';
      input.value = '';
      input.focus();
    }
    if (btn) {
      btn.style.background = '#0d9488';
      btn.textContent = '📧 ยืนยันอีเมลและขอรหัส OTP';
    }
  } else {
    if (tabPhone) {
      tabPhone.style.background = '#2563eb';
      tabPhone.style.color = '#ffffff';
      tabPhone.style.border = '2px solid #2563eb';
    }
    if (tabEmail) {
      tabEmail.style.background = '#f8fafc';
      tabEmail.style.color = '#334155';
      tabEmail.style.border = '1px solid #cbd5e1';
    }
    if (label) {
      label.textContent = 'กรอกหมายเลขโทรศัพท์มือถือที่ลงทะเบียนไว้ (10 หลัก):';
      label.style.color = '#1e40af';
    }
    if (input) {
      input.placeholder = 'กรอกเบอร์โทรศัพท์ที่ลงทะเบียนไว้ เช่น 0652424982';
      input.style.borderColor = '#2563eb';
      input.style.background = '#eff6ff';
      input.value = '';
      input.focus();
    }
    if (btn) {
      btn.style.background = '#2563eb';
      btn.textContent = '📲 ยืนยันหมายเลขโทรศัพท์และขอรหัส OTP';
    }
  }
}

function openOtpModal(defaultChannel = 'phone') {
  resetOtpModal();
  setOtpChannel(defaultChannel);
  const typedId = document.getElementById('usnm').value.trim();
  if (typedId.length === 13) {
    document.getElementById('otpIdno').value = typedId;
  }
  document.getElementById('otpModal').style.display = 'flex';
}

function closeOtpModal() {
  if (otpTimerInterval) clearInterval(otpTimerInterval);
  hideSmsNotification();
  document.getElementById('otpModal').style.display = 'none';
}

function resetOtpModal() {
  if (otpTimerInterval) clearInterval(otpTimerInterval);
  hideSmsNotification();
  document.getElementById('otpStep1').style.display = 'block';
  document.getElementById('otpStep2').style.display = 'none';
  document.getElementById('otpInputCode').value = '';
  document.getElementById('otpNewPassword').value = '';
  if (document.getElementById('otpNewPasswordConfirm')) {
    document.getElementById('otpNewPasswordConfirm').value = '';
  }
}

async function requestOtpCode() {
  const idno = document.getElementById('otpIdno').value.trim();
  const rawContact = document.getElementById('otpContactInput') ? document.getElementById('otpContactInput').value.trim() : '';
  if (idno.length !== 13) {
    alert('กรุณากรอกเลขประจำตัวประชาชน 13 หลักให้ครบถ้วน');
    return;
  }

  // ถ้าระบุ @ ในช่องกรอก ให้สลับเป็นโหมดยืนยันด้วยอีเมลอัตโนมัติ
  const activeChannel = rawContact.includes('@') ? 'email' : otpSelectedChannel;

  if (activeChannel === 'email') {
    if (!rawContact || !rawContact.includes('@')) {
      alert('กรุณากรอกอีเมล (Email) ที่ลงทะเบียนไว้ในระบบ เช่น name@gmail.com เพื่อยืนยันตัวตน');
      return;
    }
  } else {
    if (!rawContact || rawContact.replace(/[^0-9]/g, '').length < 9) {
      alert('กรุณากรอกหมายเลขโทรศัพท์มือถือที่ลงทะเบียนไว้ (10 หลัก) เพื่อยืนยันตัวตน');
      return;
    }
  }

  const btn = document.getElementById('btnReqOtp');
  btn.disabled = true;
  btn.textContent = activeChannel === 'email'
    ? 'กำลังตรวจสอบอีเมลและสร้างรหัส OTP...'
    : 'กำลังตรวจสอบเบอร์โทรศัพท์และส่งรหัส OTP...';

  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'request_otp',
        idno,
        channel: activeChannel,
        contact: rawContact,
        phone: activeChannel === 'phone' ? rawContact : '',
        email: activeChannel === 'email' ? rawContact : '',
        is_admin: isCurrentUserAdmin()
      })
    });
    const data = await res.json();
    if (!data.success) {
      alert(data.message || 'ไม่สามารถยืนยันข้อมูลได้');
      return;
    }

    otpCurrentIdno = idno;
    otpCurrentRef = data.ref_code;
    otpVerifiedPhone = data.mbphone || (activeChannel === 'phone' ? rawContact.replace(/[^0-9]/g, '') : '');
    const targetDisplay = data.masked_target || (activeChannel === 'email' ? data.masked_email : data.masked_phone) || '-';

    document.getElementById('otpMemName').textContent = data.member_name || '-';
    document.getElementById('otpMemPos').textContent = data.member_position || '-';
    if (document.getElementById('otpChannelText')) {
      document.getElementById('otpChannelText').textContent = activeChannel === 'email' ? 'อีเมล' : 'หมายเลขโทรศัพท์';
    }
    document.getElementById('otpMaskedPhone').textContent = targetDisplay;
    if (document.getElementById('otpEditPhone')) {
      document.getElementById('otpEditPhone').value = otpVerifiedPhone;
    }
    if (document.getElementById('otpEditEmail')) {
      document.getElementById('otpEditEmail').value = data.email || (activeChannel === 'email' ? rawContact : '');
    }
    document.getElementById('otpRefCode').textContent = data.ref_code || '-';
    document.getElementById('otpInputCode').value = '';
    document.getElementById('otpNewPassword').value = '';
    if (document.getElementById('otpNewPasswordConfirm')) {
      document.getElementById('otpNewPasswordConfirm').value = '';
    }
    const modalOtpVal = data.fallback_otp || data.demo_otp || '';
    if (document.getElementById('otpFallbackBox')) {
      document.getElementById('otpFallbackPhone').textContent = targetDisplay;
      document.getElementById('otpFallbackCode').textContent = modalOtpVal || '------';
      if (document.getElementById('otpFallbackNote')) {
        if (activeChannel === 'email') {
          document.getElementById('otpFallbackNote').textContent = !data.sms_sent
            ? '* ยังไม่ได้ผูกระบบส่งอีเมล (Email Gateway) เข้ากับ Gmail จึงแสดงรหัส OTP ด้านบน (ผู้ดูแลระบบสามารถกดปุ่มด้านล่างเพื่อผูก Gmail ส่งเข้ากล่องจดหมายจริงได้ฟรี)'
            : '* ส่งรหัส OTP เข้ากล่องจดหมายอีเมลเรียบร้อยแล้ว';
        } else {
          document.getElementById('otpFallbackNote').textContent = !data.sms_sent
            ? '* โควตาส่ง SMS ฟรีรายวันเต็มชั่วคราว ระบบจึงแสดงรหัส OTP 6 หลักสำหรับเบอร์ที่ยืนยันถูกต้องแล้วด้านบน สามารถกดปุ่ม "📋 คลิกนำไปกรอก" ได้ทันที'
            : '* รหัส OTP 6 หลักสำหรับหมายเลขโทรศัพท์ที่ยืนยันตรงกับฐานข้อมูลแล้ว';
        }
      }
      if (document.getElementById('emailSetupBtnWrap')) {
        document.getElementById('emailSetupBtnWrap').style.display = (activeChannel === 'email' && !data.sms_sent) ? 'block' : 'none';
      }
      if (!data.sms_sent || isCurrentUserAdmin()) {
        document.getElementById('otpFallbackBox').style.display = modalOtpVal ? 'block' : 'none';
        if (document.getElementById('otpRevealBtnWrap')) document.getElementById('otpRevealBtnWrap').style.display = 'none';
      } else {
        document.getElementById('otpFallbackBox').style.display = 'none';
        if (document.getElementById('otpRevealBtnWrap')) document.getElementById('otpRevealBtnWrap').style.display = modalOtpVal ? 'block' : 'none';
      }
    }

    document.getElementById('otpStep1').style.display = 'none';
    document.getElementById('otpStep2').style.display = 'block';
    startOtpCountdown('otpTimerText', true);
    showSmsNotification(targetDisplay, data.demo_otp, data.ref_code);
    document.getElementById('otpInputCode').focus();
  } catch (err) {
    alert('เกิดข้อผิดพลาด: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = otpSelectedChannel === 'email'
      ? '📧 ยืนยันอีเมลและขอรหัส OTP'
      : '📲 ยืนยันหมายเลขโทรศัพท์และขอรหัส OTP';
  }
}

function revealModalFallbackOtp() {
  if (document.getElementById('otpFallbackBox')) {
    document.getElementById('otpFallbackBox').style.display = 'block';
  }
  if (document.getElementById('otpRevealBtnWrap')) {
    document.getElementById('otpRevealBtnWrap').style.display = 'none';
  }
}

function fillModalFallbackOtp() {
  const code = document.getElementById('otpFallbackCode') ? document.getElementById('otpFallbackCode').textContent.trim() : '';
  if (code && code !== '------') {
    document.getElementById('otpInputCode').value = code;
  }
}

function usePhoneAsOtpPassword() {
  if (otpVerifiedPhone) {
    document.getElementById('otpNewPassword').value = otpVerifiedPhone;
    if (document.getElementById('otpNewPasswordConfirm')) {
      document.getElementById('otpNewPasswordConfirm').value = otpVerifiedPhone;
    }
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
  if (document.getElementById('otpNewPasswordConfirm')) {
    document.getElementById('otpNewPasswordConfirm').value = pwd;
  }
}

async function submitOtpReset() {
  const otpCode = document.getElementById('otpInputCode').value.trim();
  const newPass = document.getElementById('otpNewPassword').value.trim();
  const confirmPass = document.getElementById('otpNewPasswordConfirm') ? document.getElementById('otpNewPasswordConfirm').value.trim() : newPass;
  const editPhone = document.getElementById('otpEditPhone') ? document.getElementById('otpEditPhone').value.trim() : '';
  const editEmail = document.getElementById('otpEditEmail') ? document.getElementById('otpEditEmail').value.trim() : '';

  if (!otpCode || otpCode.length !== 6) {
    alert('กรุณากรอกรหัสยืนยัน OTP 6 หลัก');
    return;
  }
  if (!newPass || newPass.length < 4) {
    alert('กรุณากำหนดรหัสผ่านใหม่อย่างน้อย 4 ตัวอักษร');
    return;
  }
  if (newPass !== confirmPass) {
    alert('รหัสผ่านใหม่และยืนยันรหัสผ่านใหม่ไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
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
        new_password: newPass,
        mbphone: editPhone,
        email: editEmail
      })
    });
    const data = await res.json();
    if (!data.success) {
      alert(data.message || 'ไม่สามารถตั้งรหัสผ่านใหม่ได้');
      return;
    }

    alert(`✅ ยืนยันตัวตนด้วยรหัส OTP และตั้งรหัสผ่านใหม่สำเร็จ!\n\nเลขประชาชน: ${otpCurrentIdno}\nรหัสผ่านใหม่: ${newPass}\n\nระบบได้กรอกรหัสผ่านใหม่ในช่องเข้าสู่ระบบให้เรียบร้อยแล้ว`);
    document.getElementById('usnm').value = otpCurrentIdno;
    document.getElementById('pswd').value = newPass;
    closeOtpModal();
  } catch (err) {
    alert('เกิดข้อผิดพลาด: ' + err.message);
  } finally {
    btn.disabled = false;
  }
}

// ============================================================================
// ตั้งค่าระบบส่งรหัส OTP เข้าอีเมลจริง (Gmail / Google Apps Script / Brevo)
// ============================================================================
async function openEmailConfigModal() {
  const modal = document.getElementById('emailConfigModal');
  if (!modal) return;
  modal.style.display = 'flex';
  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_email_config' })
    });
    const data = await res.json();
    if (data && data.success) {
      document.getElementById('emCfgProvider').value = data.provider || 'gas';
      document.getElementById('emCfgApiKey').value = data.api_key || '';
      document.getElementById('emCfgApiSecret').value = data.api_secret || '';
      onEmCfgProviderChange();
    }
  } catch (e) {}
}

function closeEmailConfigModal() {
  const modal = document.getElementById('emailConfigModal');
  if (modal) modal.style.display = 'none';
}

function onEmCfgProviderChange() {
  const p = document.getElementById('emCfgProvider').value;
  const gasHelp = document.getElementById('emCfgGasHelp');
  const keyLabel = document.getElementById('emCfgKeyLabel');
  const keyInput = document.getElementById('emCfgApiKey');
  const secWrap = document.getElementById('emCfgSecretWrap');
  const secLabel = document.getElementById('emCfgSecretLabel');
  const secInput = document.getElementById('emCfgApiSecret');

  if (p === 'gas') {
    if (gasHelp) gasHelp.style.display = 'block';
    if (keyLabel) keyLabel.textContent = 'Web App URL (จาก Google Apps Script):';
    if (keyInput) keyInput.placeholder = 'เช่น https://script.google.com/macros/s/AKfycb.../exec';
    if (secWrap) secWrap.style.display = 'none';
  } else if (p === 'gmail') {
    if (gasHelp) gasHelp.style.display = 'none';
    if (keyLabel) keyLabel.textContent = 'อีเมล Gmail ผู้ส่ง (เช่น tnt203ssk@gmail.com):';
    if (keyInput) keyInput.placeholder = 'เช่น tnt203ssk@gmail.com';
    if (secWrap) secWrap.style.display = 'block';
    if (secLabel) secLabel.textContent = 'รหัสผ่านแอป Gmail 16 หลัก (App Password):';
    if (secInput) secInput.placeholder = 'กรอก App Password 16 หลักของบัญชี Gmail';
  } else {
    if (gasHelp) gasHelp.style.display = 'none';
    if (keyLabel) keyLabel.textContent = 'Brevo API Key (xkeysib-...):';
    if (keyInput) keyInput.placeholder = 'กรอก xkeysib-... จาก Brevo';
    if (secWrap) secWrap.style.display = 'block';
    if (secLabel) secLabel.textContent = 'อีเมลผู้ส่งที่ยืนยันใน Brevo (Sender Email):';
    if (secInput) secInput.placeholder = 'เช่น tnt203ssk@gmail.com';
  }
}

function copyGasEmailCode() {
  const gasCode = `function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  MailApp.sendEmail({
    to: data.to,
    subject: data.subject,
    htmlBody: data.htmlBody || data.message,
    name: "ระบบสลิปเงินเดือน อบจ.ศรีสะเกษ"
  });
  return ContentService.createTextOutput(JSON.stringify({ status: "ok" })).setMimeType(ContentService.MimeType.JSON);
}`;
  navigator.clipboard.writeText(gasCode).then(() => {
    alert('✅ คัดลอกโค้ด Google Apps Script เรียบร้อยแล้ว!\n\nขั้นตอนถัดไป:\n1. กดปุ่ม "🚀 เปิดหน้า Google Apps Script"\n2. กด "โครงการใหม่ (New Project)" แล้ววางโค้ดนี้ทับทั้งหมด\n3. กดปุ่ม "ทำให้ใช้งานได้ (Deploy)" -> "การทำให้ใช้งานได้รายการใหม่"\n4. เลือกประเภท "เว็บแอป (Web app)" และตั้งค่าผู้มีสิทธิ์เข้าถึงเป็น "ทุกคน (Anyone)"\n5. คัดลอก Web App URL มาวางในช่องด้านล่างได้เลยครับ');
  });
}

async function saveEmailGatewayConfig() {
  const provider = document.getElementById('emCfgProvider').value;
  const apiKey = document.getElementById('emCfgApiKey').value.trim();
  const apiSecret = document.getElementById('emCfgApiSecret').value.trim();
  const testEmail = document.getElementById('emCfgTestEmail').value.trim();

  if (!apiKey) {
    alert('กรุณากรอกข้อมูล Web App URL หรือ อีเมล Gmail / API Key ก่อนกดบันทึก');
    return;
  }

  const btn = document.getElementById('btnSaveEmCfg');
  btn.disabled = true;
  btn.textContent = 'กำลังบันทึกและทดสอบส่งอีเมล...';

  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_email_config',
        provider,
        api_key: apiKey,
        api_secret: apiSecret,
        sender: 'GmailOTP',
        test_email: testEmail
      })
    });
    const data = await res.json();
    if (data.success) {
      alert('✅ ' + data.message);
      if (data.test_sent !== false) {
        closeEmailConfigModal();
      }
    } else {
      alert(data.message || 'ไม่สามารถบันทึกตั้งค่าได้');
    }
  } catch (err) {
    alert('เกิดข้อผิดพลาด: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '💾 บันทึกตั้งค่าและส่งอีเมล OTP ทดสอบ';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadLoginStats();
});
