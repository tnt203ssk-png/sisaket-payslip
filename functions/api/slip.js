import net from 'node:net';
import tls from 'node:tls';

// ============================================================================
// Pure JavaScript Gmail Implicit TLS (Port 465) SMTP Client for Cloudflare
// ============================================================================
async function sendGmailSmtp({ gmailUser, appPassword, toEmail, subject, htmlBody }) {
  return new Promise((resolve) => {
    let buffer = '';
    let step = 0;
    let finished = false;
    let sock = null;
    const done = (ok, msg) => {
      if (finished) return;
      finished = true;
      try { if (sock) sock.destroy(); } catch (_) {}
      resolve({ ok, msg });
    };

    const timer = setTimeout(() => done(false, 'SMTP Timeout'), 9000);
    sock = tls.connect({ host: 'smtp.gmail.com', port: 465, servername: 'smtp.gmail.com' });

    const sendLine = (line) => {
      sock.write(line + '\r\n');
    };

    const utf8ToB64 = (str) => {
      const bytes = new TextEncoder().encode(str);
      let bin = '';
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      return btoa(bin);
    };

    sock.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split('\r\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.length < 4 || line[3] === '-') continue;
        const code = parseInt(line.slice(0, 3), 10);
        if (step === 0 && code === 220) {
          step = 1;
          sendLine('EHLO sisaket-payslip.pages.dev');
        } else if (step === 1 && code === 250) {
          step = 2;
          sendLine('AUTH LOGIN');
        } else if (step === 2 && code === 334) {
          step = 3;
          sendLine(utf8ToB64(gmailUser.trim()));
        } else if (step === 3 && code === 334) {
          step = 4;
          sendLine(utf8ToB64(appPassword.replace(/\s+/g, '')));
        } else if (step === 4 && code === 235) {
          step = 5;
          sendLine(`MAIL FROM:<${gmailUser.trim()}>`);
        } else if (step === 5 && code === 250) {
          step = 6;
          sendLine(`RCPT TO:<${toEmail.trim()}>`);
        } else if (step === 6 && code === 250) {
          step = 7;
          sendLine('DATA');
        } else if (step === 7 && code === 354) {
          step = 8;
          const subjB64 = utf8ToB64(subject);
          const bodyB64 = utf8ToB64(htmlBody);
          const mime = [
            `From: =?UTF-8?B?${utf8ToB64('ระบบสลิปเงินเดือน อบจ.ศรีสะเกษ')}?= <${gmailUser.trim()}>`,
            `To: <${toEmail.trim()}>`,
            `Subject: =?UTF-8?B?${subjB64}?=`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
            '',
            bodyB64,
            '.'
          ].join('\r\n');
          sendLine(mime);
        } else if (step === 8 && code === 250) {
          step = 9;
          clearTimeout(timer);
          sendLine('QUIT');
          done(true, 'ส่งอีเมลผ่าน Gmail SMTP สำเร็จ');
        } else if (code >= 400) {
          clearTimeout(timer);
          done(false, 'SMTP Error: ' + line);
        }
      }
    });

    sock.on('error', (err) => {
      clearTimeout(timer);
      done(false, 'TLS Error: ' + (err?.message || String(err)));
    });
  });
}

async function sendOtpEmailViaGateway(db, context, { toEmail, otpCode, refCode, memberName }) {
  const subject = `รหัส OTP (${otpCode}) ยืนยันการแก้ไขรหัสผ่านสลิปเงินเดือน อบจ.ศรีสะเกษ [Ref: ${refCode}]`;
  const htmlBody = `
    <div style="font-family: Tahoma, Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
      <div style="background: #1e40af; color: #ffffff; padding: 14px 18px; font-size: 16px; font-weight: bold;">
        🔐 รหัสยืนยันตัวตน (OTP) ระบบสลิปเงินเดือนออนไลน์ อบจ.ศรีสะเกษ
      </div>
      <div style="padding: 18px; background: #ffffff; color: #1e293b; font-size: 14px; line-height: 1.6;">
        <p style="margin-top:0;">เรียน <b>${memberName || 'สมาชิกสลิปเงินเดือนออนไลน์'}</b>,</p>
        <p>ท่านได้ทำการขอรหัส OTP เพื่อยืนยันตัวตนสำหรับการตั้งรหัสผ่านใหม่ในระบบสลิปเงินเดือนออนไลน์ องค์การบริหารส่วนจังหวัดศรีสะเกษ:</p>
        <div style="background: #f0fdf4; border: 2px dashed #16a34a; border-radius: 8px; padding: 14px; text-align: center; margin: 16px 0;">
          <div style="font-size: 13px; color: #166534;">รหัสยืนยัน OTP 6 หลักของท่านคือ</div>
          <div style="font-size: 30px; font-weight: bold; color: #b91c1c; letter-spacing: 6px; margin: 6px 0;">${otpCode}</div>
          <div style="font-size: 13px; color: #475569;">รหัสอ้างอิง (Ref Code): <b>${refCode}</b> | อายุใช้งาน: <b>5 นาที</b></div>
        </div>
        <p style="font-size: 12.5px; color: #64748b; margin-bottom:0;">* กรุณานำรหัส 6 หลักนี้ไปกรอกในหน้าเว็บไซต์เพื่อกำหนดรหัสผ่านใหม่ของท่าน</p>
      </div>
    </div>
  `;

  try {
    const DEFAULT_GAS_EMAIL_URL = 'https://script.google.com/macros/s/AKfycbz-eEjLmWMEZfIiO4CVnfScsTQYsKs34xTHJaB_3gQ_Cw_KCt0-94DHaSyWAXShhlvB/exec';
    let provider = context.env?.EMAIL_PROVIDER || 'gas';
    let apiKey = context.env?.EMAIL_WEBHOOK_URL || context.env?.EMAIL_API_KEY || DEFAULT_GAS_EMAIL_URL;
    let apiSecret = context.env?.EMAIL_API_SECRET || '';
    let sender = context.env?.EMAIL_SENDER || 'GmailOTP';

    const qEmCfg = await db.query("SELECT provider, api_key, api_secret, sender FROM tb_sms_config WHERE id = 2 LIMIT 1;");
    if (qEmCfg.rows.length > 0 && qEmCfg.rows[0].api_key) {
      provider = String(qEmCfg.rows[0].provider || 'gas').trim().toLowerCase();
      apiKey = String(qEmCfg.rows[0].api_key || '').trim();
      apiSecret = String(qEmCfg.rows[0].api_secret || '').trim();
      sender = String(qEmCfg.rows[0].sender || '').trim();
    }

    if (!apiKey) {
      return { sent: false, detail: 'ยังไม่ได้ตั้งค่าระบบส่งอีเมล (Email Gateway)' };
    }

    if (provider === 'gas' || apiKey.startsWith('https://script.google.com/')) {
      const emRes = await fetch(apiKey, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          to: toEmail,
          subject: subject,
          htmlBody: htmlBody,
          message: `รหัส OTP แก้ไขรหัสผ่านสลิปเงินเดือน อบจ.ศรีสะเกษ คือ ${otpCode} (Ref: ${refCode}) อายุ 5 นาที`,
          otp_code: otpCode,
          ref_code: refCode,
          member_name: memberName
        })
      });
      if (emRes.ok) {
        return { sent: true, detail: 'ส่งอีเมลผ่าน Google Apps Script (Gmail) สำเร็จ' };
      }
      return { sent: false, detail: 'ส่งอีเมลผ่าน Google Apps Script ไม่สำเร็จ (HTTP ' + emRes.status + ')' };
    }

    if (provider === 'gmail' || (apiKey.includes('@') && apiSecret)) {
      const res = await sendGmailSmtp({
        gmailUser: apiKey,
        appPassword: apiSecret,
        toEmail,
        subject,
        htmlBody
      });
      return { sent: res.ok, detail: res.msg };
    }

    if (provider === 'brevo') {
      const emRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'ระบบสลิปเงินเดือน อบจ.ศรีสะเกษ', email: sender || apiSecret || 'noreply@sisaket-payslip.pages.dev' },
          to: [{ email: toEmail, name: memberName || toEmail }],
          subject: subject,
          htmlContent: htmlBody
        })
      });
      if (emRes.ok) {
        return { sent: true, detail: 'ส่งอีเมลผ่าน Brevo API สำเร็จ' };
      }
      return { sent: false, detail: 'ส่งอีเมลผ่าน Brevo ไม่สำเร็จ (HTTP ' + emRes.status + ')' };
    }

    // Generic Webhook fallback
    const emRes = await fetch(apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: toEmail, subject, htmlBody, otp_code: otpCode, ref_code: refCode })
    });
    return { sent: emRes.ok, detail: emRes.ok ? 'ส่งอีเมลสำเร็จ' : 'ส่งอีเมลไม่สำเร็จ (' + emRes.status + ')' };
  } catch (err) {
    return { sent: false, detail: 'เกิดข้อผิดพลาดในการส่งอีเมล: ' + (err?.message || String(err)) };
  }
}

// ============================================================================
// Pure JavaScript MySQL Wire Protocol Client for Cloudflare Pages Functions
// Connects directly to MySQL Server 183.88.214.9:3306 via TCP Socket
// ============================================================================

async function sha1(bytes) {
  const buf = await crypto.subtle.digest('SHA-1', bytes);
  return new Uint8Array(buf);
}

async function mysqlNativePasswordAuth(password, scramble) {
  if (!password) return new Uint8Array(0);
  const enc = new TextEncoder();
  const pwdBytes = enc.encode(password);
  const stage1 = await sha1(pwdBytes);
  const stage2 = await sha1(stage1);

  const combined = new Uint8Array(scramble.length + stage2.length);
  combined.set(scramble, 0);
  combined.set(stage2, scramble.length);
  const stage3 = await sha1(combined);

  const token = new Uint8Array(stage1.length);
  for (let i = 0; i < stage1.length; i++) {
    token[i] = stage1[i] ^ stage3[i];
  }
  return token;
}

class MySqlDriver {
  constructor(config) {
    this.host = config.host || '183.88.214.9';
    this.port = config.port || 3306;
    this.user = config.user || 'jojo204';
    this.password = config.password || 'jo11032518jo';
    this.database = config.database || 'slip';
    this.socket = null;
    this.buffer = new Uint8Array(0);
    this.waitResolve = null;
    this.waitReject = null;
  }

  appendBuffer(chunk) {
    const u8 = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
    const next = new Uint8Array(this.buffer.length + u8.length);
    next.set(this.buffer, 0);
    next.set(u8, this.buffer.length);
    this.buffer = next;
    if (this.waitResolve) {
      const r = this.waitResolve;
      this.waitResolve = null;
      this.waitReject = null;
      r();
    }
  }

  async ensureBytes(n) {
    while (this.buffer.length < n) {
      await new Promise((resolve, reject) => {
        this.waitResolve = resolve;
        this.waitReject = reject;
      });
    }
  }

  async readPacket() {
    await this.ensureBytes(4);
    const len = this.buffer[0] | (this.buffer[1] << 8) | (this.buffer[2] << 16);
    const seq = this.buffer[3];
    await this.ensureBytes(4 + len);
    const payload = this.buffer.slice(4, 4 + len);
    this.buffer = this.buffer.slice(4 + len);
    return { seq, payload };
  }

  writePacket(seq, payload) {
    const len = payload.length;
    const pkt = new Uint8Array(4 + len);
    pkt[0] = len & 0xff;
    pkt[1] = (len >> 8) & 0xff;
    pkt[2] = (len >> 16) & 0xff;
    pkt[3] = seq & 0xff;
    pkt.set(payload, 4);
    this.socket.write(pkt);
  }

  async connect() {
    let lastErr = null;
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        this.buffer = new Uint8Array(0);
        this.waitResolve = null;
        this.waitReject = null;
        await new Promise((resolve, reject) => {
          this.socket = net.createConnection({ host: this.host, port: this.port }, () => resolve());
          this.socket.on('data', (chunk) => this.appendBuffer(chunk));
          this.socket.on('error', (err) => {
            if (this.waitReject) this.waitReject(err);
            reject(err);
          });
          this.socket.on('end', () => {
            if (this.waitReject) this.waitReject(new Error('MySQL socket closed unexpectedly'));
          });
        });
        lastErr = null;
        break;
      } catch (connErr) {
        lastErr = connErr;
        try { if (this.socket) this.socket.destroy(); } catch (_) {}
        if (attempt < 4) {
          await new Promise((r) => setTimeout(r, 350 * attempt));
        }
      }
    }
    if (lastErr) throw lastErr;

    // 1. Read Initial Handshake Packet
    const initPkt = await this.readPacket();
    const p = initPkt.payload;
    if (p[0] === 0xff) {
      throw new Error('MySQL Handshake Error: ' + new TextDecoder().decode(p.slice(3)));
    }

    let pos = 1; // protocol version
    while (pos < p.length && p[pos] !== 0) pos++;
    pos++; // null-terminated server version
    pos += 4; // connection id

    const authData1 = p.slice(pos, pos + 8);
    pos += 8;
    pos += 1; // filler
    const capLow = p[pos] | (p[pos + 1] << 8);
    pos += 2;
    const charSet = p[pos];
    pos += 1;
    pos += 2; // status flags
    const capHigh = p[pos] | (p[pos + 1] << 8);
    pos += 2;
    const authDataLen = p[pos];
    pos += 1;
    pos += 10; // reserved

    const restLen = Math.max(13, authDataLen - 8);
    const authData2 = p.slice(pos, pos + restLen - 1);
    const scramble = new Uint8Array(authData1.length + authData2.length);
    scramble.set(authData1, 0);
    scramble.set(authData2, authData1.length);

    // 2. Build Handshake Response (Protocol 41)
    const token = await mysqlNativePasswordAuth(this.password, scramble);
    const enc = new TextEncoder();
    const userBytes = enc.encode(this.user);
    const dbBytes = enc.encode(this.database);
    const pluginBytes = enc.encode('mysql_native_password');

    // Capabilities: CLIENT_LONG_PASSWORD | CLIENT_PROTOCOL_41 | CLIENT_SECURE_CONNECTION | CLIENT_CONNECT_WITH_DB | CLIENT_PLUGIN_AUTH
    const clientFlags = 0x00000001 | 0x00000200 | 0x00008000 | 0x00000008 | 0x00080000;

    const respLen = 4 + 4 + 1 + 23 + userBytes.length + 1 + 1 + token.length + dbBytes.length + 1 + pluginBytes.length + 1;
    const resp = new Uint8Array(respLen);
    const dv = new DataView(resp.buffer);
    dv.setUint32(0, clientFlags, true);
    dv.setUint32(4, 16777215, true);
    resp[8] = 33; // utf8_general_ci (charset 33)

    let offset = 32;
    resp.set(userBytes, offset);
    offset += userBytes.length;
    resp[offset++] = 0;

    resp[offset++] = token.length;
    resp.set(token, offset);
    offset += token.length;

    resp.set(dbBytes, offset);
    offset += dbBytes.length;
    resp[offset++] = 0;

    resp.set(pluginBytes, offset);
    offset += pluginBytes.length;
    resp[offset++] = 0;

    this.writePacket(initPkt.seq + 1, resp);

    // 3. Read Auth Response
    const authRes = await this.readPacket();
    if (authRes.payload[0] === 0xff) {
      const errMsg = new TextDecoder().decode(authRes.payload.slice(9));
      throw new Error('MySQL Auth Failed: ' + errMsg);
    }

    // Set UTF8
    await this.query("SET NAMES utf8;");
  }

  static readLenEncInt(buf, offset) {
    const first = buf[offset];
    if (first < 0xfb) return { val: first, next: offset + 1 };
    if (first === 0xfb) return { val: null, next: offset + 1 };
    if (first === 0xfc) {
      return { val: buf[offset + 1] | (buf[offset + 2] << 8), next: offset + 3 };
    }
    if (first === 0xfd) {
      return {
        val: buf[offset + 1] | (buf[offset + 2] << 8) | (buf[offset + 3] << 16),
        next: offset + 4
      };
    }
    const low = buf[offset + 1] | (buf[offset + 2] << 8) | (buf[offset + 3] << 16) | (buf[offset + 4] * 0x1000000);
    return { val: low, next: offset + 9 };
  }

  static readLenEncStr(buf, offset, decoder) {
    const lenInfo = MySqlDriver.readLenEncInt(buf, offset);
    if (lenInfo.val === null) return { str: null, next: lenInfo.next };
    const slice = buf.slice(lenInfo.next, lenInfo.next + lenInfo.val);
    return { str: decoder.decode(slice), next: lenInfo.next + lenInfo.val };
  }

  async query(sql) {
    const enc = new TextEncoder();
    const dec = new TextDecoder('utf-8');
    const sqlBytes = enc.encode(sql);
    const payload = new Uint8Array(1 + sqlBytes.length);
    payload[0] = 0x03; // COM_QUERY
    payload.set(sqlBytes, 1);

    this.writePacket(0, payload);

    const firstPkt = await this.readPacket();
    const head = firstPkt.payload[0];

    if (head === 0xff) {
      const errMsg = dec.decode(firstPkt.payload.slice(9));
      throw new Error('SQL Error: ' + errMsg);
    }

    if (head === 0x00) {
      // OK Packet
      const affected = MySqlDriver.readLenEncInt(firstPkt.payload, 1);
      const insertId = MySqlDriver.readLenEncInt(firstPkt.payload, affected.next);
      return { affectedRows: affected.val, insertId: insertId.val, rows: [] };
    }

    // Result Set: Column count
    const colCountInfo = MySqlDriver.readLenEncInt(firstPkt.payload, 0);
    const colCount = colCountInfo.val;
    const columns = [];

    for (let i = 0; i < colCount; i++) {
      const colPkt = await this.readPacket();
      let off = 0;
      off = MySqlDriver.readLenEncStr(colPkt.payload, off, dec).next; // catalog
      off = MySqlDriver.readLenEncStr(colPkt.payload, off, dec).next; // schema
      off = MySqlDriver.readLenEncStr(colPkt.payload, off, dec).next; // table
      off = MySqlDriver.readLenEncStr(colPkt.payload, off, dec).next; // org_table
      const nameInfo = MySqlDriver.readLenEncStr(colPkt.payload, off, dec); // name
      columns.push(nameInfo.str);
    }

    // Read EOF packet after columns
    const eof1 = await this.readPacket();

    // Read rows until EOF (0xfe and length < 9) or ERR (0xff)
    const rows = [];
    while (true) {
      const rowPkt = await this.readPacket();
      if (rowPkt.payload[0] === 0xfe && rowPkt.payload.length < 9) {
        break;
      }
      if (rowPkt.payload[0] === 0xff) {
        const errMsg = dec.decode(rowPkt.payload.slice(9));
        throw new Error('Row Error: ' + errMsg);
      }

      let off = 0;
      const rowObj = {};
      for (let c = 0; c < colCount; c++) {
        const valInfo = MySqlDriver.readLenEncStr(rowPkt.payload, off, dec);
        rowObj[columns[c]] = valInfo.str;
        off = valInfo.next;
      }
      rows.push(rowObj);
    }

    return { rows, columns };
  }

  close() {
    try {
      if (this.socket) {
        this.writePacket(0, new Uint8Array([0x01])); // COM_QUIT
        this.socket.end();
      }
    } catch {}
  }
}

function sqlEsc(val) {
  if (val === null || val === undefined) return "''";
  return "'" + String(val).replace(/\\/g, "\\\\").replace(/'/g, "''") + "'";
}

function sqlNum(val) {
  if (val === null || val === undefined || val === '') return '0';
  const cleaned = String(val).replace(/,/g, '').trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? String(n) : '0';
}

const DATA70_CHANGE_COLS_DDL = Array.from({ length: 14 }, (_, idx) => {
  const i = idx + 1;
  return `
    change_date_${i} VARCHAR(40) DEFAULT '',
    change_pos_${i} VARCHAR(150) DEFAULT 'ยังไม่ได้ปรับเปลี่ยนตำแหน่ง',
    change_level_${i} VARCHAR(100) DEFAULT 'ยังไม่ได้ปรับระดับ'`;
}).join(',');

function normalizeSpaces(str) {
  return String(str || '').trim().replace(/\s+/g, ' ');
}

async function ensureData70Table(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS personnel_data70 (
      seq_no INT DEFAULT 0,
      sml_seq INT DEFAULT 0,
      hname VARCHAR(255) DEFAULT '',
      sml_size VARCHAR(10) DEFAULT '',
      cid VARCHAR(13) NOT NULL,
      bank_account VARCHAR(50) DEFAULT '',
      fullname VARCHAR(255) DEFAULT '',
      birth_date VARCHAR(40) DEFAULT '',
      transfer_date VARCHAR(40) DEFAULT '',
      current_position VARCHAR(150) DEFAULT '',
      current_level VARCHAR(100) DEFAULT '',
      work_group VARCHAR(100) DEFAULT '',
      position_no VARCHAR(100) DEFAULT '',
      edu_degree VARCHAR(150) DEFAULT '',
      edu_major VARCHAR(255) DEFAULT '',
      salary DECIMAL(12,2) DEFAULT 0,
      allowance DECIMAL(12,2) DEFAULT 0,
      position_allowance DECIMAL(12,2) DEFAULT 0,
      pts_allowance DECIMAL(12,2) DEFAULT 0,
      psr_allowance DECIMAL(12,2) DEFAULT 0,
      house_rent DECIMAL(12,2) DEFAULT 0,
      child_tuition DECIMAL(12,2) DEFAULT 0,
      gpf_member VARCHAR(50) DEFAULT 'ไม่มี',
      gpf_amount DECIMAL(12,2) DEFAULT 0,
      ch11_allowance DECIMAL(12,2) DEFAULT 0,
      total_income DECIMAL(12,2) DEFAULT 0,
      coop_member VARCHAR(255) DEFAULT 'ไม่ได้เป็นสมาชิกสหกรณ์',
      first_appoint_date VARCHAR(40) DEFAULT '',
      first_position VARCHAR(150) DEFAULT '',
      first_level VARCHAR(100) DEFAULT '',
      ${DATA70_CHANGE_COLS_DDL},
      phone VARCHAR(50) DEFAULT '',
      email VARCHAR(150) DEFAULT '',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (cid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
  `);

  // Auto-Migration: เพิ่มคอลัมน์ work_group ถัดจาก current_level หากตารางเดิมยังไม่มี
  const qWgCol = await db.query("SHOW COLUMNS FROM personnel_data70 LIKE 'work_group';");
  if (!qWgCol.rows || qWgCol.rows.length === 0) {
    await db.query("ALTER TABLE personnel_data70 ADD COLUMN work_group VARCHAR(100) DEFAULT '' AFTER current_level;");
  }

  // Seed default example row (นายธนโชติ ดวงตะวัน) if not exists
  await db.query(`
    INSERT IGNORE INTO personnel_data70 (
      seq_no, sml_seq, hname, sml_size, cid, bank_account, fullname, birth_date, transfer_date,
      current_position, current_level, work_group, position_no, edu_degree, edu_major,
      salary, allowance, position_allowance, pts_allowance, psr_allowance, house_rent, child_tuition,
      gpf_member, gpf_amount, ch11_allowance, total_income, coop_member,
      first_appoint_date, first_position, first_level,
      change_date_1, change_pos_1, change_level_1,
      change_date_2, change_pos_2, change_level_2,
      change_date_3, change_pos_3, change_level_3,
      change_date_4, change_pos_4, change_level_4,
      change_date_5, change_pos_5, change_level_5,
      change_date_6, change_pos_6, change_level_6,
      change_date_7, change_pos_7, change_level_7,
      change_date_8, change_pos_8, change_level_8,
      change_date_9, change_pos_9, change_level_9,
      change_date_10, change_pos_10, change_level_10,
      change_date_11, change_pos_11, change_level_11,
      change_date_12, change_pos_12, change_level_12,
      change_date_13, change_pos_13, change_level_13,
      change_date_14, change_pos_14, change_level_14,
      phone, email
    ) VALUES (
      1, 16, 'รพ.สต.บ้านหนองคู ต.จาน อ.เมืองศรีสะเกษ', 'M', '3330100466968', '3110728796', 'นายธนโชติ ดวงตะวัน', '2518-03-11', '2565-10-02',
      'นักสาธารณสุข', 'ชำนาญการ', 'ผอ.รพ.สต.', '5-5106-3617-123 (ถ)', 'ปริญญาตรี', 'ปริญญาตรี',
      61460, 3500, 0, 1000, 0, 0, 0,
      'มี', 1850, 2800, 70610, 'สหกรณ์ สสจ.ศรีสะเกษ',
      '2538-06-01', 'เจ้าพนักงานสาธารณสุขชุมชน', '2',
      '2541-06-01', 'เจ้าพนักงานสาธารณสุขชุมชน', '3',
      '2544-04-01', 'เจ้าพนักงานสาธารณสุขชุมชน', '4',
      '2546-04-01', 'เจ้าพนักงานสาธารณสุขชุมชน', '5',
      '2548-04-01', 'เจ้าพนักงานสาธารณสุขชุมชน', '6',
      '2550-05-18', 'เจ้าหน้าที่บริหารงานสาธารณสุข', '6',
      '2551-12-11', 'นักวิชาการสาธารณสุข', 'ชำนาญการ',
      '2568-01-02', 'นักสาธารณสุข', 'ชำนาญการ',
      '', 'ยังไม่ได้ปรับเปลี่ยนตำแหน่ง', 'ยังไม่ได้ปรับระดับ',
      '', 'ยังไม่ได้ปรับเปลี่ยนตำแหน่ง', 'ยังไม่ได้ปรับระดับ',
      '', 'ยังไม่ได้ปรับเปลี่ยนตำแหน่ง', 'ยังไม่ได้ปรับระดับ',
      '', 'ยังไม่ได้ปรับเปลี่ยนตำแหน่ง', 'ยังไม่ได้ปรับระดับ',
      '', 'ยังไม่ได้ปรับเปลี่ยนตำแหน่ง', 'ยังไม่ได้ปรับระดับ',
      '', 'ยังไม่ได้ปรับเปลี่ยนตำแหน่ง', 'ยังไม่ได้ปรับระดับ',
      '', 'ยังไม่ได้ปรับเปลี่ยนตำแหน่ง', 'ยังไม่ได้ปรับระดับ',
      '086-461-3387', 'tnt203ssk@gmail.com'
    );
  `);

  // อัปเดตค่าเริ่มต้นกลุ่มงานของ 3330100466968 หากยังว่างอยู่
  await db.query("UPDATE personnel_data70 SET work_group = 'ผอ.รพ.สต.' WHERE cid = '3330100466968' AND (work_group IS NULL OR work_group = '');");
}

async function checkData70Duplicates(db, cid, fullname, positionNo, originalCid, checkCidConflict) {
  const cleanCid = String(cid || '').replace(/[^0-9]/g, '').trim();
  const cleanOrigCid = String(originalCid || '').replace(/[^0-9]/g, '').trim();
  const normName = normalizeSpaces(fullname);
  const normPosNo = normalizeSpaces(positionNo);

  let duplicateCid = null;
  let duplicateName = null;
  let duplicatePosNo = null;

  const selectCols = `
    d.cid, d.fullname, d.hname, d.current_position, d.current_level, d.work_group, d.position_no,
    COALESCE(NULLIF(TRIM(d.phone), ''), COALESCE(m.mbphone, '')) AS phone,
    COALESCE(NULLIF(TRIM(d.email), ''), COALESCE(m.email, '')) AS email
  `;

  // 1. ตรวจสอบเลข 13 หลักซ้ำกัน (กรณีเพิ่มรายการใหม่ หรือเปลี่ยนเลข 13 หลักไปซ้ำกับคนที่มีอยู่แล้วในระบบ)
  if (cleanCid.length === 13 && (checkCidConflict || (cleanOrigCid && cleanOrigCid !== cleanCid))) {
    const qDupCid = await db.query(`
      SELECT ${selectCols}
      FROM personnel_data70 d
      LEFT JOIN tbmain m ON TRIM(d.cid) COLLATE utf8_general_ci = TRIM(m.idno) COLLATE utf8_general_ci
      WHERE d.cid = ${sqlEsc(cleanCid)}
      LIMIT 1;
    `);
    if (qDupCid.rows && qDupCid.rows.length > 0) {
      const existing = qDupCid.rows[0];
      const existingNormName = normalizeSpaces(existing.fullname);
      // แจ้งเตือนหากเป็นการเพิ่มใหม่ หรือชื่อ-สกุลที่กรอกไม่ตรงกับเจ้าของเลข 13 หลักเดิม
      if ((cleanOrigCid !== cleanCid) || (normName && existingNormName && normName !== existingNormName)) {
        duplicateCid = existing;
      }
    }
  }

  // 2. ตรวจสอบ ชื่อ-สกุล ซ้ำกับเลข 13 หลักอื่น
  if (normName) {
    const qDupName = await db.query(`
      SELECT ${selectCols}
      FROM personnel_data70 d
      LEFT JOIN tbmain m ON TRIM(d.cid) COLLATE utf8_general_ci = TRIM(m.idno) COLLATE utf8_general_ci
      WHERE d.cid <> ${sqlEsc(cleanCid)}
        AND TRIM(REPLACE(REPLACE(REPLACE(d.fullname, '   ', ' '), '  ', ' '), '  ', ' ')) = ${sqlEsc(normName)}
      LIMIT 1;
    `);
    if (qDupName.rows && qDupName.rows.length > 0) {
      duplicateName = qDupName.rows[0];
    }
  }

  // 3. ตรวจสอบ เลขตำแหน่งปัจจุบัน ซ้ำกับเลข 13 หลักอื่น
  if (normPosNo && normPosNo !== '-' && normPosNo !== 'ไม่มี') {
    const qDupPos = await db.query(`
      SELECT ${selectCols}
      FROM personnel_data70 d
      LEFT JOIN tbmain m ON TRIM(d.cid) COLLATE utf8_general_ci = TRIM(m.idno) COLLATE utf8_general_ci
      WHERE d.cid <> ${sqlEsc(cleanCid)}
        AND TRIM(d.position_no) = ${sqlEsc(normPosNo)}
      LIMIT 1;
    `);
    if (qDupPos.rows && qDupPos.rows.length > 0) {
      duplicatePosNo = qDupPos.rows[0];
    }
  }

  return { duplicateCid, duplicateName, duplicatePosNo };
}

// Helper จัดรูปแบบตำแหน่ง+ระดับ และแยกชื่อ รพ.สต. ตำบล อำเภอ เพื่อซิงก์ลง tbmain, person, tbdetail
function buildFullPosition(pos, lvl) {
  const p = normalizeSpaces(pos);
  const l = normalizeSpaces(lvl);
  if (!p) return l;
  if (!l || l === 'ยังไม่ได้เลื่อนระดับ' || l === 'ยังไม่ได้ปรับระดับ') return p;
  const pNorm = p.replace(/ฏิ/g, 'ฎิ');
  const lNorm = l.replace(/ฏิ/g, 'ฎิ');
  if (pNorm.endsWith(lNorm)) return p;
  return `${p} ${l}`;
}

function splitHnameParts(hname) {
  const full = normalizeSpaces(hname);
  if (!full) return { hosp1: '', tam1: '', amp1: '' };
  const m = full.match(/^(.*?)\s+(ต\.\S+|ตำบล\S+)\s+(อ\.\S+|อำเภอ\S+)$/);
  if (m) {
    return {
      hosp1: m[1].trim(),
      tam1: m[2].trim(),
      amp1: m[3].trim()
    };
  }
  return { hosp1: full, tam1: '', amp1: '' };
}

async function syncData70ToLegacyTables(db, rec, normP) {
  const cid = String(rec.cid || '').replace(/[^0-9]/g, '').trim();
  if (cid.length !== 13) return false;

  const normFullname = normalizeSpaces(rec.fullname || '');
  const fullPos = buildFullPosition(rec.current_position, rec.current_level);
  const bankAcc = String(rec.bank_account || '').trim();
  const rawEmail = String(rec.email || '').trim();
  const hname = normalizeSpaces(rec.hname || '');
  const { hosp1, tam1, amp1 } = splitHnameParts(hname);

  // 1. อัปเดตตาราง tbmain (เทียบเลข 13 หลัก idno = cid)
  const tbMainSets = [];
  if (normFullname) tbMainSets.push(`nname = ${sqlEsc(normFullname)}`);
  if (fullPos) tbMainSets.push(`nposit = ${sqlEsc(fullPos)}`);
  if (bankAcc) tbMainSets.push(`nobank = ${sqlEsc(bankAcc)}`);
  if (normP && normP.length >= 9) tbMainSets.push(`mbphone = ${sqlEsc(normP)}`);
  if (rawEmail) tbMainSets.push(`email = ${sqlEsc(rawEmail)}`);

  if (tbMainSets.length > 0) {
    await db.query(`
      UPDATE tbmain
      SET ${tbMainSets.join(', ')}
      WHERE TRIM(idno) COLLATE utf8_general_ci = ${sqlEsc(cid)} COLLATE utf8_general_ci;
    `);
  }

  // 2. อัปเดตตาราง person (ชื่อ รพ.สต. hosp1, tam1, amp1, เบอร์โทร, อีเมล)
  const personSets = [];
  if (hosp1) personSets.push(`hosp1 = ${sqlEsc(hosp1)}`);
  if (tam1) personSets.push(`tam1 = ${sqlEsc(tam1)}`);
  if (amp1) personSets.push(`amp1 = ${sqlEsc(amp1)}`);
  if (normP && normP.length >= 9) personSets.push(`mbphone = ${sqlEsc(normP)}`);
  if (rawEmail) personSets.push(`email = ${sqlEsc(rawEmail)}`);

  if (personSets.length > 0) {
    try {
      await db.query(`
        UPDATE person
        SET ${personSets.join(', ')}
        WHERE TRIM(idno) COLLATE utf8_general_ci = ${sqlEsc(cid)} COLLATE utf8_general_ci;
      `);
    } catch {}
  }

  // 3. อัปเดตเลขที่บัญชีในตาราง tbdetail ของเลข 13 หลักนั้น
  if (bankAcc) {
    try {
      await db.query(`
        UPDATE tbdetail
        SET nobank = ${sqlEsc(bankAcc)}
        WHERE TRIM(idno) COLLATE utf8_general_ci = ${sqlEsc(cid)} COLLATE utf8_general_ci;
      `);
    } catch {}
  }

  return true;
}

export async function onRequest(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8'
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const url = new URL(context.request.url);
  let body = {};
  if (context.request.method === 'POST') {
    try {
      const ct = context.request.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        body = await context.request.json();
      } else {
        const fd = await context.request.formData();
        for (const [k, v] of fd.entries()) body[k] = v;
      }
    } catch {}
  }

  const action = body.action || url.searchParams.get('action') || 'stats';
  const db = new MySqlDriver({
    host: context.env?.DB_HOST || '183.88.214.9',
    port: Number(context.env?.DB_PORT || 3306),
    user: context.env?.DB_USER || 'jojo204',
    password: context.env?.DB_PASS || 'jo11032518jo',
    database: context.env?.DB_NAME || 'slip'
  });

  try {
    await db.connect();

    // 1. Public login page stats
    if (action === 'stats') {
      const rTotal = await db.query("SELECT COUNT(*) AS cnt FROM tbmain;");
      const rChanged = await db.query("SELECT COUNT(*) AS cnt FROM tbmain WHERE chn > 0 OR passc <> '#123456#';");
      db.close();
      return new Response(JSON.stringify({
        success: true,
        total_members: Number(rTotal.rows[0]?.cnt || 751),
        changed_members: Number(rChanged.rows[0]?.cnt || 628)
      }), { headers: corsHeaders });
    }

    // 2. Member / Admin Login
    if (action === 'login') {
      let idno = String(body.idno || body.usnm || '').trim();
      const pass = String(body.password || body.pswd || '').trim();
      if (!idno || !pass) {
        db.close();
        return new Response(JSON.stringify({ success: false, message: 'กรุณากรอกเลขประจำตัวประชาชน 13 หลัก และรหัสผ่าน' }), { headers: corsHeaders });
      }

      let isAdminLogin = false;
      if (idno.toLowerCase() === 'admin' && (pass === 'admpasw' || pass === 'jo11032518jo')) {
        idno = '3330100466968';
        isAdminLogin = true;
      }

      const whereSql = isAdminLogin
        ? `m.idno = ${sqlEsc(idno)}`
        : `m.idno = ${sqlEsc(idno)} AND m.passc = ${sqlEsc(pass)}`;

      await ensureData70Table(db);

      const qMember = await db.query(`
        SELECT m.noman,
               COALESCE(NULLIF(TRIM(d70.fullname), ''), m.nname) AS nname,
               COALESCE(NULLIF(TRIM(d70.bank_account), ''), m.nobank) AS nobank,
               m.idno,
               CASE
                 WHEN d70.current_position IS NOT NULL AND TRIM(d70.current_position) <> ''
                 THEN CASE
                   WHEN d70.current_level IS NOT NULL AND TRIM(d70.current_level) <> ''
                        AND TRIM(d70.current_level) NOT IN ('ยังไม่ได้เลื่อนระดับ', 'ยังไม่ได้ปรับระดับ')
                        AND REPLACE(TRIM(d70.current_position), 'ฏิ', 'ฎิ') NOT LIKE CONCAT('%', REPLACE(TRIM(d70.current_level), 'ฏิ', 'ฎิ'))
                   THEN CONCAT(TRIM(d70.current_position), ' ', TRIM(d70.current_level))
                   ELSE TRIM(d70.current_position)
                 END
                 ELSE m.nposit
               END AS nposit,
               m.noffice, m.passc, m.cbank,
               COALESCE(NULLIF(TRIM(d70.phone), ''), COALESCE(m.mbphone, '')) AS mbphone,
               COALESCE(NULLIF(TRIM(d70.email), ''), COALESCE(m.email, '')) AS email,
               m.chn,
               COALESCE(o.noffice, 'องค์การบริหารส่วนจังหวัดศรีสะเกษ') AS office_name,
               COALESCE(b.namebank, 'ธนาคารกรุงไทย จำกัด(มหาชน)') AS bank_name,
               COALESCE(b.sakhabank, 'สาขาศรีสะเกษ') AS bank_branch,
               COALESCE(NULLIF(TRIM(d70.hname), ''), '') AS d70_hname,
               COALESCE(NULLIF(TRIM(d70.work_group), ''), '') AS work_group,
               COALESCE(NULLIF(TRIM(d70.position_no), ''), '') AS position_no,
               COALESCE(p.hosp1, '') AS hosp1,
               COALESCE(p.tam1, '') AS tam1,
               COALESCE(p.amp1, '') AS amp1
        FROM tbmain m
        LEFT JOIN tboffice o ON m.noffice = o.coff
        LEFT JOIN tbbank b ON LPAD(TRIM(m.cbank), 4, '0') = LPAD(TRIM(b.cbank), 4, '0')
        LEFT JOIN person p ON TRIM(m.idno) COLLATE utf8_general_ci = TRIM(p.idno) COLLATE utf8_general_ci
        LEFT JOIN personnel_data70 d70 ON TRIM(m.idno) COLLATE utf8_general_ci = TRIM(d70.cid) COLLATE utf8_general_ci
        WHERE ${whereSql}
        LIMIT 1;
      `);

      if (qMember.rows.length === 0) {
        db.close();
        return new Response(JSON.stringify({ success: false, message: 'เลขประจำตัวประชาชน หรือ รหัสผ่าน ไม่ถูกต้อง!' }), { headers: corsHeaders });
      }

      const member = qMember.rows[0];
      member.is_admin = Boolean(isAdminLogin || member.idno === '3330100466968' || member.idno === '3330700073550');

      // Fetch all salary months for this member from tbdetail
      const qMonths = await db.query(`
        SELECT d.nauto, d.yy, d.mm, COALESCE(mt.nmonth, '') AS month_name,
               d.daypay, d.notes, d.sumget, d.sumpay, d.sumnet
        FROM tbdetail d
        LEFT JOIN tbmonth mt ON d.mm = mt.mm
        WHERE d.idno = ${sqlEsc(idno)}
        ORDER BY CAST(d.yy AS UNSIGNED) DESC, CAST(d.mm AS UNSIGNED) DESC;
      `);

      db.close();
      return new Response(JSON.stringify({
        success: true,
        member,
        months: qMonths.rows
      }), { headers: corsHeaders });
    }

    // 3. Get Single PaySlip Detail (by nauto or yy+mm+idno)
    if (action === 'slip_detail') {
      const nauto = String(body.nauto || url.searchParams.get('nauto') || '').trim();
      const idno = String(body.idno || url.searchParams.get('idno') || '').trim();

      let whereClause = `d.nauto = ${Number(nauto) || 0}`;
      if (idno) {
        whereClause += ` AND d.idno = ${sqlEsc(idno)}`;
      }

      await ensureData70Table(db);

      const qDetail = await db.query(`
        SELECT d.*, COALESCE(mt.nmonth, '') AS month_name,
               COALESCE(NULLIF(TRIM(d70.fullname), ''), m.nname) AS nname,
               CASE
                 WHEN d70.current_position IS NOT NULL AND TRIM(d70.current_position) <> ''
                 THEN CASE
                   WHEN d70.current_level IS NOT NULL AND TRIM(d70.current_level) <> ''
                        AND TRIM(d70.current_level) NOT IN ('ยังไม่ได้เลื่อนระดับ', 'ยังไม่ได้ปรับระดับ')
                        AND REPLACE(TRIM(d70.current_position), 'ฏิ', 'ฎิ') NOT LIKE CONCAT('%', REPLACE(TRIM(d70.current_level), 'ฏิ', 'ฎิ'))
                   THEN CONCAT(TRIM(d70.current_position), ' ', TRIM(d70.current_level))
                   ELSE TRIM(d70.current_position)
                 END
                 ELSE m.nposit
               END AS nposit,
               COALESCE(NULLIF(TRIM(d70.bank_account), ''), NULLIF(TRIM(m.nobank), ''), d.nobank) AS nobank,
               m.noffice, m.cbank,
               COALESCE(o.noffice, 'องค์การบริหารส่วนจังหวัดศรีสะเกษ') AS office_name,
               COALESCE(b.namebank, 'ธนาคารกรุงไทย จำกัด(มหาชน)') AS bank_name,
               COALESCE(b.sakhabank, 'สาขาศรีสะเกษ') AS bank_branch,
               COALESCE(NULLIF(TRIM(d70.hname), ''), '') AS d70_hname,
               COALESCE(NULLIF(TRIM(d70.work_group), ''), '') AS work_group,
               COALESCE(NULLIF(TRIM(d70.position_no), ''), '') AS position_no,
               COALESCE(p.hosp1, '') AS hosp1,
               COALESCE(p.tam1, '') AS tam1,
               COALESCE(p.amp1, '') AS amp1
        FROM tbdetail d
        LEFT JOIN tbmonth mt ON d.mm = mt.mm
        LEFT JOIN tbmain m ON d.idno = m.idno
        LEFT JOIN tboffice o ON m.noffice = o.coff
        LEFT JOIN tbbank b ON LPAD(TRIM(m.cbank), 4, '0') = LPAD(TRIM(b.cbank), 4, '0')
        LEFT JOIN person p ON TRIM(d.idno) COLLATE utf8_general_ci = TRIM(p.idno) COLLATE utf8_general_ci
        LEFT JOIN personnel_data70 d70 ON TRIM(d.idno) COLLATE utf8_general_ci = TRIM(d70.cid) COLLATE utf8_general_ci
        WHERE ${whereClause}
        LIMIT 1;
      `);

      db.close();
      if (qDetail.rows.length === 0) {
        return new Response(JSON.stringify({ success: false, message: 'ไม่พบข้อมูลใบรับรองการจ่ายเงินเดือนของเดือนที่เลือก' }), { headers: corsHeaders });
      }

      return new Response(JSON.stringify({
        success: true,
        slip: qDetail.rows[0]
      }), { headers: corsHeaders });
    }

    // Helper to normalize Thai mobile phone numbers (e.g. "065-242-4982" or "652424982" -> "0652424982")
    const normPhone = (val) => {
      let d = String(val || '').trim().replace(/[^0-9]/g, '');
      if (d === '0') return '';
      if (d.length === 9 && !d.startsWith('0')) d = '0' + d;
      if (d.length === 11 && d.startsWith('66')) d = '0' + d.slice(2);
      return d;
    };

    const maskPhoneStr = (clean) => {
      if (!clean || clean.length < 9) return 'ยังไม่ได้ลงทะเบียนเบอร์โทรศัพท์';
      if (clean.length === 10) return clean.slice(0, 3) + '-xxx-' + clean.slice(6);
      return clean.slice(0, 2) + 'x-xxx-' + clean.slice(-4);
    };

    const maskEmailStr = (rawEmail) => {
      const clean = String(rawEmail || '').trim();
      if (!clean || !clean.includes('@')) return 'ยังไม่ได้ลงทะเบียนอีเมล';
      const parts = clean.split('@');
      const namePart = parts[0];
      const domPart = parts[1] || '';
      return (namePart.length > 2 ? namePart.slice(0, 2) + '***' : namePart.slice(0, 1) + '***') + '@' + domPart;
    };

    // 4. Change Password & Update Phone/Email (logged-in user - requires OTP verification via registered phone or email)
    if (action === 'change_password') {
      const idno = String(body.idno || '').trim();
      const newPass = String(body.new_password || '').trim();
      const otpCode = String(body.otp_code || '').trim();
      const refCode = String(body.ref_code || '').trim();
      const mbphone = body.mbphone !== undefined ? normPhone(body.mbphone) : null;
      const email = body.email !== undefined ? String(body.email).trim() : null;

      if (!idno || !newPass || newPass.length < 4) {
        db.close();
        return new Response(JSON.stringify({ success: false, message: 'กรุณากำหนดรหัสผ่านใหม่อย่างน้อย 4 ตัวอักษร' }), { headers: corsHeaders });
      }

      if (!otpCode) {
        db.close();
        return new Response(JSON.stringify({ success: false, message: 'กรุณากดขอรหัส OTP และกรอกรหัส OTP 6 หลักเพื่อยืนยันตัวตนผ่านหมายเลขโทรศัพท์ก่อนเปลี่ยนรหัสผ่าน' }), { headers: corsHeaders });
      }

      const qOtp = await db.query(`
        SELECT id, expires_at < NOW() AS is_expired
        FROM tb_otp
        WHERE idno = ${sqlEsc(idno)} AND otp_code = ${sqlEsc(otpCode)} AND ref_code = ${sqlEsc(refCode)} AND is_used = 0
        ORDER BY id DESC LIMIT 1;
      `);

      if (qOtp.rows.length === 0) {
        db.close();
        return new Response(JSON.stringify({ success: false, message: 'รหัส OTP 6 หลักไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' }), { headers: corsHeaders });
      }

      if (Number(qOtp.rows[0].is_expired) === 1) {
        db.close();
        return new Response(JSON.stringify({ success: false, message: 'รหัส OTP นี้หมดอายุแล้ว (เกิน 5 นาที) กรุณากดขอรหัส OTP ใหม่' }), { headers: corsHeaders });
      }

      const otpId = qOtp.rows[0].id;
      let extraSet = '';
      if (mbphone !== null && mbphone !== '') extraSet += `, mbphone = ${sqlEsc(mbphone)}`;
      if (email !== null) extraSet += `, email = ${sqlEsc(email)}`;

      await db.query(`UPDATE tbmain SET passc = ${sqlEsc(newPass)}, dayup = NOW(), chn = 1${extraSet} WHERE idno = ${sqlEsc(idno)};`);
      if ((mbphone !== null && mbphone !== '') || email !== null) {
        let pSet = [];
        if (mbphone !== null && mbphone !== '') pSet.push(`mbphone = ${sqlEsc(mbphone)}`);
        if (email !== null) pSet.push(`email = ${sqlEsc(email)}`);
        if (pSet.length > 0) {
          await db.query(`UPDATE person SET ${pSet.join(', ')} WHERE idno = ${sqlEsc(idno)};`);
        }
      }
      await db.query(`UPDATE tb_otp SET is_used = 1 WHERE id = ${Number(otpId)};`);
      db.close();
      return new Response(JSON.stringify({
        success: true,
        message: 'ยืนยันรหัส OTP และบันทึกเปลี่ยนรหัสผ่านใหม่เรียบร้อยแล้ว!'
      }), { headers: corsHeaders });
    }

    // 5. Request OTP via Registered Phone Number OR Registered Email
    if (action === 'request_otp') {
      const idno = String(body.idno || '').trim();
      const rawContact = String(body.contact || body.phone || body.email || '').trim();
      const reqChannel = String(body.channel || (rawContact.includes('@') ? 'email' : 'phone')).trim().toLowerCase();
      const inputPhone = normPhone(body.phone || (reqChannel === 'phone' ? rawContact : ''));
      const inputEmail = String(body.email || (reqChannel === 'email' ? rawContact : '')).trim().toLowerCase();
      const isLoggedIn = Boolean(body.logged_in);

      if (!idno || idno.length !== 13) {
        db.close();
        return new Response(JSON.stringify({ success: false, message: 'กรุณากรอกเลขประจำตัวประชาชน 13 หลักให้ถูกต้อง' }), { headers: corsHeaders });
      }

      const qMem = await db.query(`
        SELECT m.noman, m.nname, m.nobank, m.idno, m.nposit,
               COALESCE(NULLIF(m.mbphone, '0'), p.mbphone, '') AS mbphone,
               COALESCE(NULLIF(m.email, ''), p.email, '') AS email
        FROM tbmain m
        LEFT JOIN person p ON m.idno COLLATE utf8_general_ci = p.idno COLLATE utf8_general_ci
        WHERE m.idno = ${sqlEsc(idno)}
        LIMIT 1;
      `);
      if (qMem.rows.length === 0) {
        db.close();
        return new Response(JSON.stringify({ success: false, message: 'ไม่พบเลขประจำตัวประชาชนนี้ในระบบทะเบียนสมาชิก tbmain' }), { headers: corsHeaders });
      }

      const member = qMem.rows[0];
      const regPhone = normPhone(member.mbphone);
      const regEmail = String(member.email || '').trim();
      const hasPhone = regPhone.length >= 9;
      const hasEmail = regEmail.includes('@');
      const maskedRegPhone = maskPhoneStr(regPhone);
      const maskedRegEmail = maskEmailStr(regEmail);

      let verifyChannel = reqChannel === 'email' ? 'email' : 'phone';
      let targetPhone = regPhone;
      let targetEmail = regEmail;

      if (verifyChannel === 'email') {
        if (hasEmail) {
          if (!inputEmail || !inputEmail.includes('@')) {
            db.close();
            return new Response(JSON.stringify({
              success: false,
              message: `กรุณากรอกอีเมลที่ลงทะเบียนไว้ (${maskedRegEmail}) เพื่อยืนยันตัวตนและรับรหัส OTP`
            }), { headers: corsHeaders });
          }
          if (inputEmail !== regEmail.toLowerCase()) {
            db.close();
            return new Response(JSON.stringify({
              success: false,
              message: `อีเมลที่กรอกไม่ตรงกับอีเมลที่ลงทะเบียนไว้ในระบบ (${maskedRegEmail})`
            }), { headers: corsHeaders });
          }
          targetEmail = regEmail;
        } else {
          if (!isLoggedIn) {
            db.close();
            const phoneHint = hasPhone ? ` (ท่านสามารถเลือกยืนยันตัวตนด้วยหมายเลขโทรศัพท์ ${maskedRegPhone} แทนได้ทันที)` : '';
            return new Response(JSON.stringify({
              success: false,
              message: `ไม่พบข้อมูลอีเมลที่ลงทะเบียนไว้สำหรับเลขประชาชนนี้ในระบบ${phoneHint} หรือติดต่อผู้ดูแลระบบเพื่อเพิ่มอีเมล`
            }), { headers: corsHeaders });
          }
          if (!inputEmail || !inputEmail.includes('@')) {
            db.close();
            return new Response(JSON.stringify({
              success: false,
              message: 'กรุณากรอกอีเมลของท่านให้ถูกต้อง (เช่น name@gmail.com) เพื่อลงทะเบียนและรับรหัส OTP'
            }), { headers: corsHeaders });
          }
          targetEmail = inputEmail;
        }
      } else {
        // verifyChannel === 'phone'
        if (hasPhone) {
          if (!inputPhone) {
            db.close();
            return new Response(JSON.stringify({
              success: false,
              message: `กรุณากรอกหมายเลขโทรศัพท์ที่ลงทะเบียนไว้ (${maskedRegPhone}) เพื่อยืนยันตัวตนและรับรหัส OTP`
            }), { headers: corsHeaders });
          }
          if (inputPhone !== regPhone) {
            db.close();
            return new Response(JSON.stringify({
              success: false,
              message: `หมายเลขโทรศัพท์ที่กรอกไม่ตรงกับหมายเลขที่ลงทะเบียนไว้ในระบบ (${maskedRegPhone})`
            }), { headers: corsHeaders });
          }
          targetPhone = regPhone;
        } else {
          if (!isLoggedIn) {
            db.close();
            const emailHint = hasEmail ? ` (ท่านสามารถเลือกยืนยันตัวตนด้วยอีเมล ${maskedRegEmail} แทนได้ทันที)` : '';
            return new Response(JSON.stringify({
              success: false,
              message: `ไม่พบหมายเลขโทรศัพท์ที่ลงทะเบียนไว้สำหรับเลขประชาชนนี้${emailHint} กรุณาติดต่อผู้ดูแลระบบเพื่อเพิ่มเบอร์โทรศัพท์ในระบบก่อน`
            }), { headers: corsHeaders });
          }
          if (!inputPhone || inputPhone.length < 9) {
            db.close();
            return new Response(JSON.stringify({
              success: false,
              message: 'กรุณากรอกหมายเลขโทรศัพท์มือถือ 10 หลักของท่านเพื่อลงทะเบียนและรับรหัส OTP'
            }), { headers: corsHeaders });
          }
          targetPhone = inputPhone;
        }
      }

      const otpCode = String(Math.floor(100000 + Math.random() * 900000));
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let refCode = '';
      for (let i = 0; i < 4; i++) refCode += chars[Math.floor(Math.random() * chars.length)];

      const otpTargetRecord = verifyChannel === 'email' ? targetEmail : targetPhone;
      await db.query(`
        INSERT INTO tb_otp (idno, mbphone, otp_code, ref_code, created_at, expires_at, is_used)
        VALUES (${sqlEsc(idno)}, ${sqlEsc(otpTargetRecord)}, ${sqlEsc(otpCode)}, ${sqlEsc(refCode)}, NOW(), DATE_ADD(NOW(), INTERVAL 5 MINUTE), 0);
      `);

      // Real SMS / Email Gateway integration
      let smsSent = false;
      let smsStatusDetail = '';
      const smsMsg = `รหัส OTP แก้ไขรหัสผ่านสลิปเงินเดือน อบจ.ศรีสะเกษ คือ ${otpCode} (Ref: ${refCode}) อายุ 5 นาที`;

      if (verifyChannel === 'email') {
        // ยืนยันตัวตนผ่านอีเมล (Email Verification) - ส่งอีเมล OTP จริงผ่าน Google Apps Script / Gmail SMTP / Brevo
        const emResult = await sendOtpEmailViaGateway(db, context, {
          toEmail: targetEmail,
          otpCode,
          refCode,
          memberName: member.nname
        });
        smsSent = emResult.sent;
        smsStatusDetail = emResult.detail;
      } else {
        smsStatusDetail = 'ยังไม่ได้ตั้งค่า SMS Gateway API Key (แสดงรหัส OTP บนหน้าจอแทน)';
        try {
          let provider = context.env?.SMS_PROVIDER || 'thaibulksms';
          let apiKey = context.env?.SMS_API_KEY || '';
          let apiSecret = context.env?.SMS_API_SECRET || '';
          let sender = context.env?.SMS_SENDER || 'SmartSMS';

          const qSmsCfg = await db.query("SELECT provider, api_key, api_secret, sender FROM tb_sms_config WHERE id = 1 LIMIT 1;");
          if (qSmsCfg.rows.length > 0 && qSmsCfg.rows[0].api_key) {
            provider = String(qSmsCfg.rows[0].provider || 'thaibulksms').trim().toLowerCase();
            apiKey = String(qSmsCfg.rows[0].api_key || '').trim();
            apiSecret = String(qSmsCfg.rows[0].api_secret || '').trim();
            sender = String(qSmsCfg.rows[0].sender || 'SmartSMS').trim();
          }

          if (apiKey) {
            if (provider === 'textbee') {
              // TextBee.dev Android SMS Gateway (Free using Android phone SIM)
              // รองรับการใส่หลาย API Key / Device ID คั่นด้วยคอมม่า (,) เพื่อสลับอัตโนมัติเมื่อครบโควตา 50 ข้อความ/วัน
              const intlPhone = targetPhone.startsWith('0') ? '+66' + targetPhone.slice(1) : targetPhone;
              const keyList = apiKey.split(',').map(s => s.trim()).filter(Boolean);
              const devList = apiSecret.split(',').map(s => s.trim()).filter(Boolean);
              let lastStatus = 0;
              for (let kIdx = 0; kIdx < keyList.length; kIdx++) {
                const curKey = keyList[kIdx];
                const curDev = devList[kIdx] || devList[0] || '';
                if (!curKey || !curDev) continue;
                const smsRes = await fetch(`https://api.textbee.dev/api/v1/gateway/devices/${curDev}/send-sms`, {
                  method: 'POST',
                  headers: {
                    'x-api-key': curKey,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    recipients: [intlPhone],
                    message: smsMsg
                  })
                });
                lastStatus = smsRes.status;
                if (smsRes.ok) {
                  smsSent = true;
                  break;
                }
              }
              if (smsSent) {
                smsStatusDetail = 'ส่ง SMS ผ่านมือถือ Android Gateway (TextBee) สำเร็จ';
              } else if (lastStatus === 429) {
                smsStatusDetail = 'โควตาส่ง SMS ฟรีรายวันของ TextBee ครบ 50 ข้อความ/วันแล้ว (HTTP 429) แสดงรหัส OTP บนหน้าจอแทน';
              } else {
                smsStatusDetail = 'ส่ง SMS ผ่าน TextBee ไม่สำเร็จ (' + lastStatus + ') แสดงรหัส OTP บนหน้าจอแทน';
              }
            } else if (provider === 'smsmkt') {
              // SMSMKT Thailand
              const smsRes = await fetch('https://portal-otp.smsmkt.com/api/send-message', {
                method: 'POST',
                headers: {
                  'api_key': apiKey,
                  'secret_key': apiSecret,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  message: smsMsg,
                  phone: targetPhone,
                  sender: sender
                })
              });
              smsSent = smsRes.ok;
              smsStatusDetail = smsSent ? 'ส่ง SMS ผ่าน SMSMKT สำเร็จ' : 'ส่ง SMS ผ่าน SMSMKT ไม่สำเร็จ (' + smsRes.status + ')';
            } else {
              // Default: ThaiBulkSMS API v2
              const auth = btoa(`${apiKey}:${apiSecret}`);
              const smsRes = await fetch('https://api-v2.thaibulksms.com/sms', {
                method: 'POST',
                headers: {
                  'Authorization': `Basic ${auth}`,
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                  msisdn: targetPhone,
                  message: smsMsg,
                  sender: sender || 'SmartSMS'
                }).toString()
              });
              smsSent = smsRes.ok;
              smsStatusDetail = smsSent ? 'ส่ง SMS ผ่าน ThaiBulkSMS สำเร็จ' : 'ส่ง SMS ผ่าน ThaiBulkSMS ไม่สำเร็จ (' + smsRes.status + ')';
            }
          }
        } catch (smsErr) {
          smsStatusDetail = 'เกิดข้อผิดพลาดในการส่ง SMS: ' + (smsErr?.message || String(smsErr));
        }
      }

      const maskedEmail = maskEmailStr(targetEmail);
      const maskedPhone = maskPhoneStr(targetPhone);
      const isAdminReq = Boolean(body.is_admin);
      db.close();
      return new Response(JSON.stringify({
        success: true,
        channel: verifyChannel,
        message: verifyChannel === 'email'
          ? `ระบบได้ตรวจสอบอีเมล ${maskedEmail} และสร้างรหัส OTP 6 หลักเรียบร้อยแล้ว กรุณานำรหัสมากรอกยืนยันภายใน 5 นาที`
          : `ระบบได้สร้างรหัส OTP 6 หลัก และส่งไปยังหมายเลขโทรศัพท์ ${maskedPhone} เรียบร้อยแล้ว กรุณานำรหัสมากรอกยืนยันภายใน 5 นาที`,
        ref_code: refCode,
        masked_phone: maskedPhone,
        masked_email: maskedEmail,
        masked_target: verifyChannel === 'email' ? maskedEmail : maskedPhone,
        has_phone: hasPhone,
        has_email: hasEmail,
        mbphone: targetPhone,
        email: targetEmail,
        member_name: member.nname,
        member_position: member.nposit,
        expires_in_seconds: 300,
        sms_sent: smsSent,
        sms_status: smsStatusDetail,
        fallback_otp: otpCode,
        demo_otp: isAdminReq ? otpCode : undefined
      }), { headers: corsHeaders });
    }

    // 6. Verify OTP & Reset Password
    if (action === 'reset_password_otp') {
      const idno = String(body.idno || '').trim();
      const otpCode = String(body.otp_code || '').trim();
      const refCode = String(body.ref_code || '').trim();
      const newPass = String(body.new_password || '').trim();
      const mbphone = normPhone(body.mbphone);
      const email = String(body.email || '').trim();

      if (!newPass || newPass.length < 4) {
        db.close();
        return new Response(JSON.stringify({
          success: false,
          message: 'กรุณากำหนดรหัสผ่านใหม่อย่างน้อย 4 ตัวอักษร'
        }), { headers: corsHeaders });
      }

      const qOtp = await db.query(`
        SELECT id, expires_at < NOW() AS is_expired
        FROM tb_otp
        WHERE idno = ${sqlEsc(idno)} AND otp_code = ${sqlEsc(otpCode)} AND ref_code = ${sqlEsc(refCode)} AND is_used = 0
        ORDER BY id DESC LIMIT 1;
      `);

      if (qOtp.rows.length === 0) {
        db.close();
        return new Response(JSON.stringify({ success: false, message: 'รหัส OTP 6 หลักไม่ถูกต้อง กรุณาตรวจสอบรหัส OTP ที่ได้รับอีกครั้ง' }), { headers: corsHeaders });
      }

      if (Number(qOtp.rows[0].is_expired) === 1) {
        db.close();
        return new Response(JSON.stringify({ success: false, message: 'รหัส OTP นี้หมดอายุแล้ว (เกิน 5 นาที) กรุณากดขอรหัส OTP ใหม่' }), { headers: corsHeaders });
      }

      const otpId = qOtp.rows[0].id;
      let extraMain = '';
      if (mbphone) extraMain += `, mbphone = ${sqlEsc(mbphone)}`;
      if (email) extraMain += `, email = ${sqlEsc(email)}`;

      await db.query(`UPDATE tbmain SET passc = ${sqlEsc(newPass)}, dayup = NOW(), chn = 1${extraMain} WHERE idno = ${sqlEsc(idno)};`);
      if (mbphone || email) {
        let pUpdates = [];
        if (mbphone) pUpdates.push(`mbphone = ${sqlEsc(mbphone)}`);
        if (email) pUpdates.push(`email = ${sqlEsc(email)}`);
        await db.query(`UPDATE person SET ${pUpdates.join(', ')} WHERE idno = ${sqlEsc(idno)};`);
      }
      await db.query(`UPDATE tb_otp SET is_used = 1 WHERE id = ${Number(otpId)};`);

      db.close();
      return new Response(JSON.stringify({
        success: true,
        message: 'ยืนยันรหัส OTP และเปลี่ยนรหัสผ่านใหม่สำเร็จเรียบร้อยแล้ว!',
        new_password: newPass
      }), { headers: corsHeaders });
    }

    // 7. Get / Save Email Gateway Configuration (stored in tb_sms_config id = 2)
    if (action === 'get_email_config') {
      const qEm = await db.query("SELECT provider, api_key, api_secret, sender FROM tb_sms_config WHERE id = 2 LIMIT 1;");
      db.close();
      const row = qEm.rows.length > 0 ? qEm.rows[0] : { provider: 'gas', api_key: '', api_secret: '', sender: '' };
      return new Response(JSON.stringify({
        success: true,
        provider: row.provider || 'gas',
        api_key: row.api_key || '',
        api_secret: row.api_secret || '',
        sender: row.sender || ''
      }), { headers: corsHeaders });
    }

    if (action === 'save_email_config') {
      const provider = String(body.provider || 'gas').trim().toLowerCase();
      const apiKey = String(body.api_key || '').trim();
      const apiSecret = String(body.api_secret || '').trim();
      const sender = String(body.sender || 'GmailOTP').trim();
      const testEmail = String(body.test_email || '').trim();

      await db.query(`
        INSERT INTO tb_sms_config (id, provider, api_key, api_secret, sender, updated_at)
        VALUES (2, ${sqlEsc(provider)}, ${sqlEsc(apiKey)}, ${sqlEsc(apiSecret)}, ${sqlEsc(sender)}, NOW())
        ON DUPLICATE KEY UPDATE
          provider = VALUES(provider),
          api_key = VALUES(api_key),
          api_secret = VALUES(api_secret),
          sender = VALUES(sender),
          updated_at = NOW();
      `);

      let testRes = null;
      if (testEmail && testEmail.includes('@') && apiKey) {
        testRes = await sendOtpEmailViaGateway(db, context, {
          toEmail: testEmail,
          otpCode: '123456',
          refCode: 'TEST',
          memberName: 'ทดสอบระบบส่งอีเมล OTP'
        });
      }

      db.close();
      return new Response(JSON.stringify({
        success: true,
        message: testRes
          ? (testRes.sent
              ? `บันทึกตั้งค่าสำเร็จ และส่งอีเมลทดสอบไปยัง ${testEmail} เรียบร้อยแล้ว!`
              : `บันทึกตั้งค่าแล้ว แต่การส่งอีเมลทดสอบไม่สำเร็จ: ${testRes.detail}`)
          : 'บันทึกการตั้งค่าระบบส่งอีเมล (Email Gateway) ลงฐานข้อมูลเรียบร้อยแล้ว!',
        test_sent: testRes ? testRes.sent : undefined,
        test_detail: testRes ? testRes.detail : undefined
      }), { headers: corsHeaders });
    }

    // 8. Sync Phone & Email from table `sheet1` in database `slip` (UPDATE tbmain t SET t.mbphone = sheet1.tel2 WHERE t.idno = sheet1.cid)
    if (action === 'sync_from_sheet1') {
      const qCols = await db.query("SHOW COLUMNS FROM sheet1;");
      const colNames = qCols.rows.map(c => String(c.Field || '').toLowerCase());
      const hasEmailCol = colNames.includes('email');

      const qMatch = await db.query(`
        SELECT COUNT(*) AS cnt
        FROM tbmain t
        INNER JOIN sheet1 s ON TRIM(t.idno) COLLATE utf8_general_ci = TRIM(s.cid) COLLATE utf8_general_ci
        WHERE s.tel2 IS NOT NULL AND TRIM(s.tel2) != '';
      `);
      const matchedCount = qMatch.rows.length > 0 ? Number(qMatch.rows[0].cnt) : 0;

      const emailSetMain = hasEmailCol
        ? ", t.email = CASE WHEN s.email IS NOT NULL AND TRIM(s.email) != '' THEN TRIM(s.email) ELSE t.email END"
        : "";
      const emailSetPerson = hasEmailCol
        ? ", p.email = CASE WHEN s.email IS NOT NULL AND TRIM(s.email) != '' THEN TRIM(s.email) ELSE p.email END"
        : "";

      await db.query(`
        UPDATE tbmain t
        INNER JOIN sheet1 s ON TRIM(t.idno) COLLATE utf8_general_ci = TRIM(s.cid) COLLATE utf8_general_ci
        SET t.mbphone = TRIM(s.tel2)${emailSetMain}
        WHERE s.tel2 IS NOT NULL AND TRIM(s.tel2) != '';
      `);

      await db.query(`
        UPDATE person p
        INNER JOIN sheet1 s ON TRIM(p.idno) COLLATE utf8_general_ci = TRIM(s.cid) COLLATE utf8_general_ci
        SET p.mbphone = TRIM(s.tel2)${emailSetPerson}
        WHERE s.tel2 IS NOT NULL AND TRIM(s.tel2) != '';
      `);

      const qTotalPhone = await db.query("SELECT COUNT(*) AS cnt FROM tbmain WHERE mbphone IS NOT NULL AND TRIM(mbphone) != '' AND TRIM(mbphone) != '0';");
      const totalWithPhone = qTotalPhone.rows.length > 0 ? Number(qTotalPhone.rows[0].cnt) : 0;

      db.close();
      return new Response(JSON.stringify({
        success: true,
        matched_count: matchedCount,
        total_with_phone: totalWithPhone,
        message: `อัปเดตข้อมูลจากตาราง sheet1 ลงตาราง tbmain (และ person) สำเร็จ! พบเลข 13 หลักตรงกัน ${matchedCount} รายการ (ปัจจุบันมีเบอร์โทรใน tbmain รวม ${totalWithPhone} คน)`
      }), { headers: corsHeaders });
    }

    // 9. Batch Update Phone & Email in `tbmain` (and `person`) from Excel / CSV file by checking 13-digit ID (idno)
    if (action === 'sync_contacts_batch') {
      const items = Array.isArray(body.items) ? body.items : [];
      if (items.length === 0) {
        db.close();
        return new Response(JSON.stringify({ success: false, message: 'ไม่พบข้อมูลรายการสำหรับอัปเดต' }), { headers: corsHeaders });
      }

      // Fetch existing idno set from tbmain for fast verification
      const qAllMain = await db.query("SELECT idno FROM tbmain;");
      const existingIdnos = new Set(qAllMain.rows.map(r => String(r.idno || '').trim()));

      let matchedCount = 0;
      let updatedPhoneCount = 0;
      let updatedEmailCount = 0;
      let notFoundCount = 0;

      for (const item of items) {
        const idno = String(item.idno || '').replace(/[^0-9]/g, '').trim();
        if (idno.length !== 13) continue;

        if (!existingIdnos.has(idno)) {
          notFoundCount++;
          continue;
        }

        matchedCount++;
        const cleanPhone = normPhone(item.mbphone || '');
        const cleanEmail = String(item.email || '').trim();

        const sets = [];
        const pSets = [];
        if (cleanPhone && cleanPhone.length >= 9) {
          sets.push(`mbphone = ${sqlEsc(cleanPhone)}`);
          pSets.push(`mbphone = ${sqlEsc(cleanPhone)}`);
          updatedPhoneCount++;
        }
        if (cleanEmail && cleanEmail.includes('@')) {
          sets.push(`email = ${sqlEsc(cleanEmail)}`);
          pSets.push(`email = ${sqlEsc(cleanEmail)}`);
          updatedEmailCount++;
        }

        if (sets.length > 0) {
          await db.query(`UPDATE tbmain SET ${sets.join(', ')} WHERE idno = ${sqlEsc(idno)};`);
          await db.query(`UPDATE person SET ${pSets.join(', ')} WHERE idno = ${sqlEsc(idno)};`);
        }
      }

      db.close();
      return new Response(JSON.stringify({
        success: true,
        matched_count: matchedCount,
        updated_phone: updatedPhoneCount,
        updated_email: updatedEmailCount,
        not_found: notFoundCount,
        message: `ตรวจสอบเลข 13 หลักและอัปเดตลง tbmain สำเร็จ!\n• ตรงกับฐาน tbmain: ${matchedCount} คน\n• อัปเดตเบอร์โทรศัพท์: ${updatedPhoneCount} คน\n• อัปเดตอีเมล: ${updatedEmailCount} คน\n• ไม่พบเลข 13 หลักใน tbmain: ${notFoundCount} รายการ`
      }), { headers: corsHeaders });
    }

    // ========================================================================
    // 10. ระบบฐานข้อมูลบุคลากร (personnel_data70 - 72/73 คอลัมน์ตามชีต data70)
    // ========================================================================
    if (action === 'get_data70') {
      await ensureData70Table(db);
      const cid = String(body.cid || url.searchParams.get('cid') || '').replace(/[^0-9]/g, '').trim();
      if (cid.length !== 13) {
        db.close();
        return new Response(JSON.stringify({ success: false, message: 'กรุณาระบุเลขประจำตัวประชาชน 13 หลักให้ถูกต้อง' }), { headers: corsHeaders });
      }

      const qD70 = await db.query(`SELECT * FROM personnel_data70 WHERE cid = ${sqlEsc(cid)} LIMIT 1;`);
      const qMain = await db.query(`
        SELECT m.idno, m.nname, m.nobank, m.nposit,
               COALESCE(m.mbphone, '') AS mbphone, COALESCE(m.email, '') AS email,
               COALESCE(p.hosp1, '') AS hosp1, COALESCE(p.tam1, '') AS tam1, COALESCE(p.amp1, '') AS amp1
        FROM tbmain m
        LEFT JOIN person p ON TRIM(m.idno) COLLATE utf8_general_ci = TRIM(p.idno) COLLATE utf8_general_ci
        WHERE m.idno = ${sqlEsc(cid)}
        LIMIT 1;
      `);
      const qSlip = await db.query(`
        SELECT money1, money2, money3, money5, money8, money10, money12, exp6
        FROM tbdetail
        WHERE idno = ${sqlEsc(cid)}
        ORDER BY CAST(yy AS UNSIGNED) DESC, CAST(mm AS UNSIGNED) DESC
        LIMIT 1;
      `);

      db.close();
      return new Response(JSON.stringify({
        success: true,
        exists: qD70.rows.length > 0,
        record: qD70.rows.length > 0 ? qD70.rows[0] : null,
        fallback_member: qMain.rows.length > 0 ? qMain.rows[0] : null,
        fallback_slip: qSlip.rows.length > 0 ? qSlip.rows[0] : null
      }), { headers: corsHeaders });
    }

    if (action === 'check_data70_duplicate') {
      await ensureData70Table(db);
      const cid = String(body.cid || '').replace(/[^0-9]/g, '').trim();
      const originalCid = String(body.original_cid || '').replace(/[^0-9]/g, '').trim();
      const checkCidConflict = Boolean(body.check_cid_conflict);
      const fullname = normalizeSpaces(body.fullname || '');
      const positionNo = normalizeSpaces(body.position_no || '');

      const { duplicateCid, duplicateName, duplicatePosNo } = await checkData70Duplicates(db, cid, fullname, positionNo, originalCid, checkCidConflict);
      db.close();
      return new Response(JSON.stringify({
        success: true,
        duplicate_cid: duplicateCid,
        duplicate_name: duplicateName,
        duplicate_pos_no: duplicatePosNo
      }), { headers: corsHeaders });
    }

    if (action === 'save_data70') {
      await ensureData70Table(db);
      const rec = body.record || body || {};
      const cid = String(rec.cid || '').replace(/[^0-9]/g, '').trim();
      const originalCid = String(rec.original_cid || cid).replace(/[^0-9]/g, '').trim();
      const isNewRecord = Boolean(rec.is_new_record);
      if (cid.length !== 13) {
        db.close();
        return new Response(JSON.stringify({ success: false, message: 'เลขประจำตัวประชาชนต้องมี 13 หลัก' }), { headers: corsHeaders });
      }

      const normFullname = normalizeSpaces(rec.fullname || '');
      const normPositionNo = normalizeSpaces(rec.position_no || '');

      // ตรวจสอบ เลข 13 หลัก, ชื่อ-สกุล และ เลขตำแหน่งปัจจุบัน ห้ามซ้ำกับคนอื่น พร้อมแจ้งข้อมูลติดต่อของคู่กรณี
      const { duplicateCid, duplicateName, duplicatePosNo } = await checkData70Duplicates(db, cid, normFullname, normPositionNo, originalCid, isNewRecord);
      if (duplicateCid || duplicateName || duplicatePosNo) {
        db.close();
        const fmtOwner = (d) => `ชื่อ-สกุล: ${d.fullname || '-'} | เลข 13 หลัก: ${d.cid || '-'} | สังกัด: ${d.hname || '-'} | ตำแหน่ง: ${d.current_position || ''} ${d.current_level || ''} | เลขตำแหน่ง: ${d.position_no || '-'} | 📞 เบอร์โทรติดต่อ: ${d.phone || 'ไม่ได้ระบุ'} | อีเมล: ${d.email || '-'}`;
        const errMsgs = [];
        if (duplicateCid) {
          errMsgs.push(`⚠️ เลขประจำตัวประชาชน 13 หลัก "${cid}" ซ้ำกับข้อมูลของ:\n👉 ${fmtOwner(duplicateCid)}`);
        }
        if (duplicateName) {
          errMsgs.push(`⚠️ ชื่อ-สกุล "${normFullname}" ซ้ำกับข้อมูลของ:\n👉 ${fmtOwner(duplicateName)}`);
        }
        if (duplicatePosNo) {
          errMsgs.push(`⚠️ เลขตำแหน่งปัจจุบัน "${normPositionNo}" ซ้ำกับข้อมูลของ:\n👉 ${fmtOwner(duplicatePosNo)}`);
        }
        errMsgs.push(`\n💡 กรุณาติดต่อประสานงานระหว่างทั้ง 2 ท่านตามเบอร์โทรศัพท์ข้างต้น เพื่อตรวจสอบและแก้ไขข้อมูลไปด้วยกัน`);
        return new Response(JSON.stringify({
          success: false,
          duplicate_cid: duplicateCid,
          duplicate_name: duplicateName,
          duplicate_pos_no: duplicatePosNo,
          message: errMsgs.join('\n\n')
        }), { headers: corsHeaders });
      }

      let seqNo = Number(rec.seq_no || 0);
      if (!seqNo || seqNo <= 0) {
        const qExist = await db.query(`SELECT seq_no FROM personnel_data70 WHERE cid = ${sqlEsc(cid)} LIMIT 1;`);
        if (qExist.rows.length > 0 && Number(qExist.rows[0].seq_no) > 0) {
          seqNo = Number(qExist.rows[0].seq_no);
        } else {
          const qMax = await db.query("SELECT COALESCE(MAX(seq_no), 0) + 1 AS next_seq FROM personnel_data70;");
          seqNo = Number(qMax.rows[0]?.next_seq || 1);
        }
      }

      const smlSeq = Number(rec.sml_seq || 0) || 0;
      const salary = Number(String(rec.salary || 0).replace(/,/g, '')) || 0;
      const allowance = Number(String(rec.allowance || 0).replace(/,/g, '')) || 0;
      const posAllowance = Number(String(rec.position_allowance || 0).replace(/,/g, '')) || 0;
      const ptsAllowance = Number(String(rec.pts_allowance || 0).replace(/,/g, '')) || 0;
      const psrAllowance = Number(String(rec.psr_allowance || 0).replace(/,/g, '')) || 0;
      const houseRent = Number(String(rec.house_rent || 0).replace(/,/g, '')) || 0;
      const childTuition = Number(String(rec.child_tuition || 0).replace(/,/g, '')) || 0;
      const gpfAmount = Number(String(rec.gpf_amount || 0).replace(/,/g, '')) || 0;
      const ch11Allowance = Number(String(rec.ch11_allowance || 0).replace(/,/g, '')) || 0;
      const calcTotal = salary + allowance + posAllowance + ptsAllowance + psrAllowance + houseRent + childTuition + gpfAmount + ch11Allowance;
      const totalIncome = rec.total_income !== undefined && rec.total_income !== ''
        ? (Number(String(rec.total_income).replace(/,/g, '')) || calcTotal)
        : calcTotal;

      const changeCols = [];
      const changeVals = [];
      const changeUpds = [];
      for (let i = 1; i <= 14; i++) {
        const cDate = String(rec[`change_date_${i}`] || '').trim();
        const cPos = String(rec[`change_pos_${i}`] || 'ยังไม่ได้ปรับเปลี่ยนตำแหน่ง').trim() || 'ยังไม่ได้ปรับเปลี่ยนตำแหน่ง';
        const cLvl = String(rec[`change_level_${i}`] || 'ยังไม่ได้ปรับระดับ').trim() || 'ยังไม่ได้ปรับระดับ';
        changeCols.push(`change_date_${i}`, `change_pos_${i}`, `change_level_${i}`);
        changeVals.push(sqlEsc(cDate), sqlEsc(cPos), sqlEsc(cLvl));
        changeUpds.push(
          `change_date_${i} = VALUES(change_date_${i})`,
          `change_pos_${i} = VALUES(change_pos_${i})`,
          `change_level_${i} = VALUES(change_level_${i})`
        );
      }

      const rawPhone = String(rec.phone || '').trim();
      const rawEmail = String(rec.email || '').trim();

      await db.query(`
        INSERT INTO personnel_data70 (
          seq_no, sml_seq, hname, sml_size, cid, bank_account, fullname, birth_date, transfer_date,
          current_position, current_level, work_group, position_no, edu_degree, edu_major,
          salary, allowance, position_allowance, pts_allowance, psr_allowance, house_rent, child_tuition,
          gpf_member, gpf_amount, ch11_allowance, total_income, coop_member,
          first_appoint_date, first_position, first_level,
          ${changeCols.join(', ')},
          phone, email
        ) VALUES (
          ${seqNo},
          ${smlSeq},
          ${sqlEsc(String(rec.hname || '').trim())},
          ${sqlEsc(String(rec.sml_size || '').trim().toUpperCase())},
          ${sqlEsc(cid)},
          ${sqlEsc(String(rec.bank_account || '').trim())},
          ${sqlEsc(normFullname)},
          ${sqlEsc(String(rec.birth_date || '').trim())},
          ${sqlEsc(String(rec.transfer_date || '').trim())},
          ${sqlEsc(String(rec.current_position || '').trim())},
          ${sqlEsc(String(rec.current_level || '').trim())},
          ${sqlEsc(String(rec.work_group || '').trim())},
          ${sqlEsc(normPositionNo)},
          ${sqlEsc(String(rec.edu_degree || '').trim())},
          ${sqlEsc(String(rec.edu_major || '').trim())},
          ${sqlNum(salary)},
          ${sqlNum(allowance)},
          ${sqlNum(posAllowance)},
          ${sqlNum(ptsAllowance)},
          ${sqlNum(psrAllowance)},
          ${sqlNum(houseRent)},
          ${sqlNum(childTuition)},
          ${sqlEsc(String(rec.gpf_member || 'ไม่มี').trim())},
          ${sqlNum(gpfAmount)},
          ${sqlNum(ch11Allowance)},
          ${sqlNum(totalIncome)},
          ${sqlEsc(String(rec.coop_member || 'ไม่ได้เป็นสมาชิกสหกรณ์').trim())},
          ${sqlEsc(String(rec.first_appoint_date || '').trim())},
          ${sqlEsc(String(rec.first_position || '').trim())},
          ${sqlEsc(String(rec.first_level || '').trim())},
          ${changeVals.join(', ')},
          ${sqlEsc(rawPhone)},
          ${sqlEsc(rawEmail)}
        )
        ON DUPLICATE KEY UPDATE
          seq_no = VALUES(seq_no),
          sml_seq = VALUES(sml_seq),
          hname = VALUES(hname),
          sml_size = VALUES(sml_size),
          bank_account = VALUES(bank_account),
          fullname = VALUES(fullname),
          birth_date = VALUES(birth_date),
          transfer_date = VALUES(transfer_date),
          current_position = VALUES(current_position),
          current_level = VALUES(current_level),
          work_group = VALUES(work_group),
          position_no = VALUES(position_no),
          edu_degree = VALUES(edu_degree),
          edu_major = VALUES(edu_major),
          salary = VALUES(salary),
          allowance = VALUES(allowance),
          position_allowance = VALUES(position_allowance),
          pts_allowance = VALUES(pts_allowance),
          psr_allowance = VALUES(psr_allowance),
          house_rent = VALUES(house_rent),
          child_tuition = VALUES(child_tuition),
          gpf_member = VALUES(gpf_member),
          gpf_amount = VALUES(gpf_amount),
          ch11_allowance = VALUES(ch11_allowance),
          total_income = VALUES(total_income),
          coop_member = VALUES(coop_member),
          first_appoint_date = VALUES(first_appoint_date),
          first_position = VALUES(first_position),
          first_level = VALUES(first_level),
          ${changeUpds.join(', ')},
          phone = VALUES(phone),
          email = VALUES(email);
      `);

      // ซิงก์ข้อมูลบุคลากร (ชื่อ-สกุล, ตำแหน่ง+ระดับ, ชื่อ รพ.สต., เลขบัญชี, เบอร์โทร, อีเมล) กลับไปยัง tbmain, person, tbdetail โดยเทียบเลข 13 หลัก
      const normP = normPhone(rawPhone);
      await syncData70ToLegacyTables(db, {
        ...rec,
        cid,
        fullname: normFullname,
        position_no: normPositionNo
      }, normP);

      const syncedFullPos = buildFullPosition(rec.current_position, rec.current_level);

      db.close();
      return new Response(JSON.stringify({
        success: true,
        cid,
        seq_no: seqNo,
        total_income: totalIncome,
        synced_member: {
          idno: cid,
          nname: normFullname,
          nposit: syncedFullPos,
          d70_hname: normalizeSpaces(rec.hname || ''),
          nobank: String(rec.bank_account || '').trim(),
          mbphone: normP || rawPhone,
          email: rawEmail,
          work_group: String(rec.work_group || '').trim(),
          position_no: normPositionNo
        },
        message: 'บันทึกข้อมูลบุคลากร (data70) และซิงก์ชื่อ-สกุล ตำแหน่ง รพ.สต. เลขบัญชี เบอร์โทร/อีเมล กับตารางใบแจ้งเงินเดือน (tbmain / tbdetail) เรียบร้อยแล้ว!'
      }), { headers: corsHeaders });
    }

    if (action === 'list_data70') {
      await ensureData70Table(db);
      const hname = String(body.hname || url.searchParams.get('hname') || '').trim();
      const workGroup = String(body.work_group || url.searchParams.get('work_group') || '').trim();
      const search = String(body.search || url.searchParams.get('search') || '').trim();

      const conds = [];
      if (hname) {
        conds.push(`d.hname = ${sqlEsc(hname)}`);
      }
      if (workGroup) {
        conds.push(`d.work_group = ${sqlEsc(workGroup)}`);
      }
      if (search) {
        const sLike = sqlEsc(`%${search}%`);
        conds.push(`(d.cid LIKE ${sLike} OR d.fullname LIKE ${sLike} OR d.hname LIKE ${sLike} OR d.current_position LIKE ${sLike} OR d.work_group LIKE ${sLike} OR d.position_no LIKE ${sLike})`);
      }
      const whereSql = conds.length > 0 ? `WHERE ${conds.join(' AND ')}` : '';

      const qRows = await db.query(`
        SELECT d.*
        FROM personnel_data70 d
        ${whereSql}
        ORDER BY CASE WHEN d.seq_no > 0 THEN d.seq_no ELSE 999999 END ASC, d.sml_seq ASC, d.cid ASC;
      `);

      const qCountAll = await db.query("SELECT COUNT(*) AS cnt FROM personnel_data70;");
      const qCountMain = await db.query("SELECT COUNT(*) AS cnt FROM tbmain;");

      db.close();
      return new Response(JSON.stringify({
        success: true,
        total_data70: Number(qCountAll.rows[0]?.cnt || 0),
        total_tbmain: Number(qCountMain.rows[0]?.cnt || 0),
        rows: qRows.rows
      }), { headers: corsHeaders });
    }

    if (action === 'delete_data70') {
      await ensureData70Table(db);
      const cid = String(body.cid || '').replace(/[^0-9]/g, '').trim();
      if (cid.length !== 13) {
        db.close();
        return new Response(JSON.stringify({ success: false, message: 'เลข 13 หลักไม่ถูกต้อง' }), { headers: corsHeaders });
      }
      await db.query(`DELETE FROM personnel_data70 WHERE cid = ${sqlEsc(cid)};`);
      db.close();
      return new Response(JSON.stringify({
        success: true,
        message: `ลบข้อมูลบุคลากรเลข 13 หลัก ${cid} ออกจากตาราง personnel_data70 เรียบร้อยแล้ว`
      }), { headers: corsHeaders });
    }

    if (action === 'import_data70_batch') {
      await ensureData70Table(db);
      const items = Array.isArray(body.items) ? body.items : [];
      if (items.length === 0) {
        db.close();
        return new Response(JSON.stringify({ success: false, message: 'ไม่พบรายการข้อมูลสำหรับนำเข้า' }), { headers: corsHeaders });
      }

      // โหลดข้อมูลเดิมทั้งหมดพร้อมเบอร์โทรและอีเมล เพื่อตรวจสอบ เลข 13 หลัก, ชื่อ-สกุล และ เลขตำแหน่งปัจจุบัน ซ้ำกับคนอื่น
      const qExisting = await db.query(`
        SELECT d.cid, d.fullname, d.position_no, d.hname, d.current_position, d.current_level,
               COALESCE(NULLIF(TRIM(d.phone), ''), COALESCE(m.mbphone, '')) AS phone,
               COALESCE(NULLIF(TRIM(d.email), ''), COALESCE(m.email, '')) AS email
        FROM personnel_data70 d
        LEFT JOIN tbmain m ON TRIM(d.cid) COLLATE utf8_general_ci = TRIM(m.idno) COLLATE utf8_general_ci;
      `);
      const cidToOwnerMap = new Map();
      const nameToCidMap = new Map();
      const posNoToCidMap = new Map();
      for (const r of (qExisting.rows || [])) {
        const eCid = String(r.cid || '').trim();
        const eName = normalizeSpaces(r.fullname);
        const ePosNo = normalizeSpaces(r.position_no);
        const info = {
          cid: eCid,
          fullname: eName,
          hname: r.hname || '',
          position_no: ePosNo,
          phone: r.phone || '',
          email: r.email || ''
        };
        if (eCid) cidToOwnerMap.set(eCid, info);
        if (eName) nameToCidMap.set(eName, info);
        if (ePosNo && ePosNo !== '-' && ePosNo !== 'ไม่มี') {
          posNoToCidMap.set(ePosNo, info);
        }
      }

      let importedCount = 0;
      let syncedMainCount = 0;
      const skippedDuplicates = [];
      const seenCidsInBatch = new Map();

      for (const rec of items) {
        const cid = String(rec.cid || '').replace(/[^0-9]/g, '').trim();
        if (cid.length !== 13) continue;

        const normFullname = normalizeSpaces(rec.fullname || '');
        const normPositionNo = normalizeSpaces(rec.position_no || '');

        // 1. ตรวจสอบเลข 13 หลักซ้ำกันภายในไฟล์เดียวกันแต่คนละชื่อ
        if (seenCidsInBatch.has(cid)) {
          const prev = seenCidsInBatch.get(cid);
          skippedDuplicates.push(`ข้าม ${cid} (${normFullname}): เลข 13 หลักซ้ำกับ ${prev.fullname} (${prev.hname || '-'} | 📞 โทร: ${prev.phone || 'ไม่ระบุ'})`);
          continue;
        }

        // 2. ตรวจสอบชื่อ-สกุลซ้ำกับเลข 13 หลักอื่น
        if (normFullname && nameToCidMap.has(normFullname)) {
          const owner = nameToCidMap.get(normFullname);
          if (owner.cid !== cid) {
            skippedDuplicates.push(`ข้าม ${cid} (${normFullname}): ชื่อ-สกุลซ้ำกับ ${owner.fullname} (เลข 13 หลัก: ${owner.cid} | สังกัด: ${owner.hname || '-'} | 📞 โทร: ${owner.phone || 'ไม่ระบุ'})`);
            continue;
          }
        }

        // 3. ตรวจสอบเลขตำแหน่งปัจจุบันซ้ำกับเลข 13 หลักอื่น
        if (normPositionNo && normPositionNo !== '-' && normPositionNo !== 'ไม่มี' && posNoToCidMap.has(normPositionNo)) {
          const owner = posNoToCidMap.get(normPositionNo);
          if (owner.cid !== cid) {
            skippedDuplicates.push(`ข้าม ${cid} (${normFullname}): เลขตำแหน่ง "${normPositionNo}" ซ้ำกับ ${owner.fullname} (เลข 13 หลัก: ${owner.cid} | สังกัด: ${owner.hname || '-'} | 📞 โทร: ${owner.phone || 'ไม่ระบุ'})`);
            continue;
          }
        }

        // บันทึกลง Map สำหรับเช็กรายการถัดไปใน Batch เดียวกัน
        const curOwnerInfo = { cid, fullname: normFullname, hname: rec.hname || '', position_no: normPositionNo, phone: rec.phone || '', email: rec.email || '' };
        seenCidsInBatch.set(cid, curOwnerInfo);
        cidToOwnerMap.set(cid, curOwnerInfo);
        if (normFullname) nameToCidMap.set(normFullname, curOwnerInfo);
        if (normPositionNo && normPositionNo !== '-' && normPositionNo !== 'ไม่มี') {
          posNoToCidMap.set(normPositionNo, curOwnerInfo);
        }

        const seqNo = Number(rec.seq_no || 0) || (importedCount + 1);
        const smlSeq = Number(rec.sml_seq || 0) || 0;
        const salary = Number(String(rec.salary || 0).replace(/,/g, '')) || 0;
        const allowance = Number(String(rec.allowance || 0).replace(/,/g, '')) || 0;
        const posAllowance = Number(String(rec.position_allowance || 0).replace(/,/g, '')) || 0;
        const ptsAllowance = Number(String(rec.pts_allowance || 0).replace(/,/g, '')) || 0;
        const psrAllowance = Number(String(rec.psr_allowance || 0).replace(/,/g, '')) || 0;
        const houseRent = Number(String(rec.house_rent || 0).replace(/,/g, '')) || 0;
        const childTuition = Number(String(rec.child_tuition || 0).replace(/,/g, '')) || 0;
        const gpfAmount = Number(String(rec.gpf_amount || 0).replace(/,/g, '')) || 0;
        const ch11Allowance = Number(String(rec.ch11_allowance || 0).replace(/,/g, '')) || 0;
        const calcTotal = salary + allowance + posAllowance + ptsAllowance + psrAllowance + houseRent + childTuition + gpfAmount + ch11Allowance;
        const totalIncome = Number(String(rec.total_income || '').replace(/,/g, '')) || calcTotal;

        const changeCols = [];
        const changeVals = [];
        const changeUpds = [];
        for (let i = 1; i <= 14; i++) {
          const cDate = String(rec[`change_date_${i}`] || '').trim();
          const cPos = String(rec[`change_pos_${i}`] || 'ยังไม่ได้ปรับเปลี่ยนตำแหน่ง').trim() || 'ยังไม่ได้ปรับเปลี่ยนตำแหน่ง';
          const cLvl = String(rec[`change_level_${i}`] || 'ยังไม่ได้ปรับระดับ').trim() || 'ยังไม่ได้ปรับระดับ';
          changeCols.push(`change_date_${i}`, `change_pos_${i}`, `change_level_${i}`);
          changeVals.push(sqlEsc(cDate), sqlEsc(cPos), sqlEsc(cLvl));
          changeUpds.push(
            `change_date_${i} = VALUES(change_date_${i})`,
            `change_pos_${i} = VALUES(change_pos_${i})`,
            `change_level_${i} = VALUES(change_level_${i})`
          );
        }

        const rawPhone = String(rec.phone || '').trim();
        const rawEmail = String(rec.email || '').trim();

        await db.query(`
          INSERT INTO personnel_data70 (
            seq_no, sml_seq, hname, sml_size, cid, bank_account, fullname, birth_date, transfer_date,
            current_position, current_level, work_group, position_no, edu_degree, edu_major,
            salary, allowance, position_allowance, pts_allowance, psr_allowance, house_rent, child_tuition,
            gpf_member, gpf_amount, ch11_allowance, total_income, coop_member,
            first_appoint_date, first_position, first_level,
            ${changeCols.join(', ')},
            phone, email
          ) VALUES (
            ${seqNo},
            ${smlSeq},
            ${sqlEsc(String(rec.hname || '').trim())},
            ${sqlEsc(String(rec.sml_size || '').trim().toUpperCase())},
            ${sqlEsc(cid)},
            ${sqlEsc(String(rec.bank_account || '').trim())},
            ${sqlEsc(normFullname)},
            ${sqlEsc(String(rec.birth_date || '').trim())},
            ${sqlEsc(String(rec.transfer_date || '').trim())},
            ${sqlEsc(String(rec.current_position || '').trim())},
            ${sqlEsc(String(rec.current_level || '').trim())},
            ${sqlEsc(String(rec.work_group || '').trim())},
            ${sqlEsc(normPositionNo)},
            ${sqlEsc(String(rec.edu_degree || '').trim())},
            ${sqlEsc(String(rec.edu_major || '').trim())},
            ${sqlNum(salary)},
            ${sqlNum(allowance)},
            ${sqlNum(posAllowance)},
            ${sqlNum(ptsAllowance)},
            ${sqlNum(psrAllowance)},
            ${sqlNum(houseRent)},
            ${sqlNum(childTuition)},
            ${sqlEsc(String(rec.gpf_member || 'ไม่มี').trim())},
            ${sqlNum(gpfAmount)},
            ${sqlNum(ch11Allowance)},
            ${sqlNum(totalIncome)},
            ${sqlEsc(String(rec.coop_member || 'ไม่ได้เป็นสมาชิกสหกรณ์').trim())},
            ${sqlEsc(String(rec.first_appoint_date || '').trim())},
            ${sqlEsc(String(rec.first_position || '').trim())},
            ${sqlEsc(String(rec.first_level || '').trim())},
            ${changeVals.join(', ')},
            ${sqlEsc(rawPhone)},
            ${sqlEsc(rawEmail)}
          )
          ON DUPLICATE KEY UPDATE
            seq_no = VALUES(seq_no),
            sml_seq = VALUES(sml_seq),
            hname = VALUES(hname),
            sml_size = VALUES(sml_size),
            bank_account = VALUES(bank_account),
            fullname = VALUES(fullname),
            birth_date = VALUES(birth_date),
            transfer_date = VALUES(transfer_date),
            current_position = VALUES(current_position),
            current_level = VALUES(current_level),
            work_group = VALUES(work_group),
            position_no = VALUES(position_no),
            edu_degree = VALUES(edu_degree),
            edu_major = VALUES(edu_major),
            salary = VALUES(salary),
            allowance = VALUES(allowance),
            position_allowance = VALUES(position_allowance),
            pts_allowance = VALUES(pts_allowance),
            psr_allowance = VALUES(psr_allowance),
            house_rent = VALUES(house_rent),
            child_tuition = VALUES(child_tuition),
            gpf_member = VALUES(gpf_member),
            gpf_amount = VALUES(gpf_amount),
            ch11_allowance = VALUES(ch11_allowance),
            total_income = VALUES(total_income),
            coop_member = VALUES(coop_member),
            first_appoint_date = VALUES(first_appoint_date),
            first_position = VALUES(first_position),
            first_level = VALUES(first_level),
            ${changeUpds.join(', ')},
            phone = VALUES(phone),
            email = VALUES(email);
        `);

        importedCount++;

        const normP = normPhone(rawPhone);
        const didSync = await syncData70ToLegacyTables(db, {
          ...rec,
          cid,
          fullname: normFullname,
          position_no: normPositionNo
        }, normP);
        if (didSync) syncedMainCount++;
      }

      db.close();
      return new Response(JSON.stringify({
        success: true,
        imported_count: importedCount,
        synced_main_count: syncedMainCount,
        skipped_duplicates: skippedDuplicates,
        message: `นำเข้าข้อมูลบุคลากร (data70) สำเร็จ ${importedCount} รายการ และซิงก์ข้อมูลลงตารางใบแจ้งเงินเดือน (tbmain / person / tbdetail) ${syncedMainCount} รายการ` +
          (skippedDuplicates.length > 0 ? `\n⚠️ ข้ามรายการที่ชื่อ-สกุลหรือเลขตำแหน่งซ้ำ ${skippedDuplicates.length} รายการ` : '')
      }), { headers: corsHeaders });
    }

    if (action === 'sync_all_data70_to_tbmain') {
      await ensureData70Table(db);
      // ซิงก์ข้อมูลจาก personnel_data70 ทั้งหมดลงตาราง tbmain, person และ tbdetail โดยเทียบเลขประจำตัวประชาชน 13 หลัก (idno = cid)
      await db.query(`
        UPDATE tbmain m
        INNER JOIN personnel_data70 d ON TRIM(m.idno) COLLATE utf8_general_ci = TRIM(d.cid) COLLATE utf8_general_ci
        SET
          m.nname = CASE WHEN d.fullname IS NOT NULL AND TRIM(d.fullname) <> '' THEN TRIM(d.fullname) ELSE m.nname END,
          m.nposit = CASE
            WHEN d.current_position IS NOT NULL AND TRIM(d.current_position) <> ''
            THEN CASE
              WHEN d.current_level IS NOT NULL AND TRIM(d.current_level) <> ''
                   AND TRIM(d.current_level) NOT IN ('ยังไม่ได้เลื่อนระดับ', 'ยังไม่ได้ปรับระดับ')
                   AND REPLACE(TRIM(d.current_position), 'ฏิ', 'ฎิ') NOT LIKE CONCAT('%', REPLACE(TRIM(d.current_level), 'ฏิ', 'ฎิ'))
              THEN CONCAT(TRIM(d.current_position), ' ', TRIM(d.current_level))
              ELSE TRIM(d.current_position)
            END
            ELSE m.nposit
          END,
          m.nobank = CASE WHEN d.bank_account IS NOT NULL AND TRIM(d.bank_account) <> '' THEN TRIM(d.bank_account) ELSE m.nobank END,
          m.mbphone = CASE WHEN d.phone IS NOT NULL AND TRIM(d.phone) <> '' THEN REPLACE(REPLACE(TRIM(d.phone), '-', ''), ' ', '') ELSE m.mbphone END,
          m.email = CASE WHEN d.email IS NOT NULL AND TRIM(d.email) <> '' THEN TRIM(d.email) ELSE m.email END;
      `);

      await db.query(`
        UPDATE tbdetail dt
        INNER JOIN personnel_data70 d ON TRIM(dt.idno) COLLATE utf8_general_ci = TRIM(d.cid) COLLATE utf8_general_ci
        SET dt.nobank = TRIM(d.bank_account)
        WHERE d.bank_account IS NOT NULL AND TRIM(d.bank_account) <> '';
      `);

      const qMatched = await db.query(`
        SELECT COUNT(*) AS cnt
        FROM tbmain m
        INNER JOIN personnel_data70 d ON TRIM(m.idno) COLLATE utf8_general_ci = TRIM(d.cid) COLLATE utf8_general_ci;
      `);
      const matchedCount = Number(qMatched.rows[0]?.cnt || 0);

      db.close();
      return new Response(JSON.stringify({
        success: true,
        matched_count: matchedCount,
        message: `ซิงก์ข้อมูลจาก personnel_data70 ลงตาราง tbmain และ tbdetail (เทียบเลข 13 หลักตรงกัน) สำเร็จ จำนวน ${matchedCount} คน!`
      }), { headers: corsHeaders });
    }

    db.close();
    return new Response(JSON.stringify({ success: false, message: 'Unknown action: ' + action }), { headers: corsHeaders });
  } catch (err) {
    db.close();
    return new Response(JSON.stringify({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล 183.88.214.9: ' + (err?.message || String(err))
    }), { status: 500, headers: corsHeaders });
  }
}
