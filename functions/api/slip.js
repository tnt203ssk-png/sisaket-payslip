import net from 'node:net';

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

    // 2. Member Login
    if (action === 'login') {
      const idno = String(body.idno || body.usnm || '').trim();
      const pass = String(body.password || body.pswd || '').trim();
      if (!idno || !pass) {
        db.close();
        return new Response(JSON.stringify({ success: false, message: 'กรุณากรอกเลขประจำตัวประชาชน 13 หลัก และรหัสผ่าน' }), { headers: corsHeaders });
      }

      const qMember = await db.query(`
        SELECT m.noman, m.nname, m.nobank, m.idno, m.nposit, m.noffice, m.passc, m.cbank,
               COALESCE(m.mbphone, '') AS mbphone, COALESCE(m.email, '') AS email, m.chn,
               COALESCE(o.noffice, 'องค์การบริหารส่วนจังหวัดศรีสะเกษ') AS office_name,
               COALESCE(b.namebank, 'ธนาคารกรุงไทย จำกัด(มหาชน)') AS bank_name,
               COALESCE(b.sakhabank, 'สาขาศรีสะเกษ') AS bank_branch
        FROM tbmain m
        LEFT JOIN tboffice o ON m.noffice = o.coff
        LEFT JOIN tbbank b ON LPAD(TRIM(m.cbank), 4, '0') = LPAD(TRIM(b.cbank), 4, '0')
        WHERE m.idno = ${sqlEsc(idno)} AND m.passc = ${sqlEsc(pass)}
        LIMIT 1;
      `);

      if (qMember.rows.length === 0) {
        db.close();
        return new Response(JSON.stringify({ success: false, message: 'เลขประจำตัวประชาชน หรือ รหัสผ่าน ไม่ถูกต้อง!' }), { headers: corsHeaders });
      }

      const member = qMember.rows[0];

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

      const qDetail = await db.query(`
        SELECT d.*, COALESCE(mt.nmonth, '') AS month_name,
               m.nname, m.nposit, m.noffice, m.cbank,
               COALESCE(o.noffice, 'องค์การบริหารส่วนจังหวัดศรีสะเกษ') AS office_name,
               COALESCE(b.namebank, 'ธนาคารกรุงไทย จำกัด(มหาชน)') AS bank_name,
               COALESCE(b.sakhabank, 'สาขาศรีสะเกษ') AS bank_branch
        FROM tbdetail d
        LEFT JOIN tbmonth mt ON d.mm = mt.mm
        LEFT JOIN tbmain m ON d.idno = m.idno
        LEFT JOIN tboffice o ON m.noffice = o.coff
        LEFT JOIN tbbank b ON LPAD(TRIM(m.cbank), 4, '0') = LPAD(TRIM(b.cbank), 4, '0')
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

    // 4. Change Password & Update Phone/Email (logged-in user)
    if (action === 'change_password') {
      const idno = String(body.idno || '').trim();
      const newPass = String(body.new_password || '').trim();
      const mbphone = body.mbphone !== undefined ? String(body.mbphone).trim() : null;
      const email = body.email !== undefined ? String(body.email).trim() : null;

      if (!idno || !newPass || newPass.length < 4) {
        db.close();
        return new Response(JSON.stringify({ success: false, message: 'กรุณากำหนดรหัสผ่านใหม่อย่างน้อย 4 ตัวอักษร' }), { headers: corsHeaders });
      }

      let extraSet = '';
      if (mbphone !== null) extraSet += `, mbphone = ${sqlEsc(mbphone)}`;
      if (email !== null) extraSet += `, email = ${sqlEsc(email)}`;

      await db.query(`UPDATE tbmain SET passc = ${sqlEsc(newPass)}, dayup = NOW(), chn = 1${extraSet} WHERE idno = ${sqlEsc(idno)};`);
      if (mbphone !== null || email !== null) {
        let pSet = [];
        if (mbphone !== null) pSet.push(`mbphone = ${sqlEsc(mbphone)}`);
        if (email !== null) pSet.push(`email = ${sqlEsc(email)}`);
        await db.query(`UPDATE person SET ${pSet.join(', ')} WHERE idno = ${sqlEsc(idno)};`);
      }
      db.close();
      return new Response(JSON.stringify({
        success: true,
        message: 'บันทึกเปลี่ยนรหัสผ่านและข้อมูลติดต่อ (เบอร์โทรศัพท์/อีเมล) เรียบร้อยแล้ว!'
      }), { headers: corsHeaders });
    }

    // 5. Request OTP for Forgot Password
    if (action === 'request_otp') {
      const idno = String(body.idno || '').trim();
      const contact = String(body.contact || '').trim();
      if (!idno || idno.length !== 13) {
        db.close();
        return new Response(JSON.stringify({ success: false, message: 'กรุณากรอกเลขประจำตัวประชาชน 13 หลักให้ถูกต้อง' }), { headers: corsHeaders });
      }

      const qMem = await db.query(`SELECT noman, nname, nobank, idno, nposit, COALESCE(mbphone, '') AS mbphone, COALESCE(email, '') AS email FROM tbmain WHERE idno = ${sqlEsc(idno)} LIMIT 1;`);
      if (qMem.rows.length === 0) {
        db.close();
        return new Response(JSON.stringify({ success: false, message: 'ไม่พบเลขประจำตัวประชาชนนี้ในระบบทะเบียนสมาชิก tbmain' }), { headers: corsHeaders });
      }

      const member = qMem.rows[0];
      const phone = String(member.mbphone || '').trim();
      const email = String(member.email || '').trim();
      const hasPhone = phone.length >= 9 && phone !== '0';
      const hasEmail = email.includes('@');

      // If user also typed a phone/email in Step 1 and the DB had none (or matched), we can pre-fill it
      const otpCode = String(Math.floor(100000 + Math.random() * 900000));
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let refCode = '';
      for (let i = 0; i < 4; i++) refCode += chars[Math.floor(Math.random() * chars.length)];

      const savePhone = hasPhone ? phone : (contact && !contact.includes('@') ? contact : '0000000000');
      await db.query(`
        INSERT INTO tb_otp (idno, mbphone, otp_code, ref_code, created_at, expires_at, is_used)
        VALUES (${sqlEsc(idno)}, ${sqlEsc(savePhone)}, ${sqlEsc(otpCode)}, ${sqlEsc(refCode)}, NOW(), DATE_ADD(NOW(), INTERVAL 5 MINUTE), 0);
      `);

      let maskedPhone = 'ยังไม่ได้ระบุเบอร์โทรศัพท์';
      if (hasPhone) {
        const clean = phone.replace(/[^0-9]/g, '');
        if (clean.length === 10) maskedPhone = clean.slice(0, 3) + '-xxx-' + clean.slice(6);
        else maskedPhone = clean.slice(0, 2) + 'x-xxx-' + clean.slice(-4);
      }

      let maskedEmail = 'ยังไม่ได้ระบุอีเมล';
      if (hasEmail) {
        const parts = email.split('@');
        const namePart = parts[0];
        const domPart = parts[1] || '';
        maskedEmail = (namePart.length > 2 ? namePart.slice(0, 2) + '***' : namePart + '***') + '@' + domPart;
      }

      db.close();
      return new Response(JSON.stringify({
        success: true,
        message: 'สร้างรหัส OTP สำหรับยืนยันตัวตนเรียบร้อยแล้ว (อายุ 5 นาที)',
        ref_code: refCode,
        masked_phone: maskedPhone,
        masked_email: maskedEmail,
        has_phone: hasPhone,
        has_email: hasEmail,
        mbphone: hasPhone ? phone : (contact && !contact.includes('@') ? contact : ''),
        email: hasEmail ? email : (contact && contact.includes('@') ? contact : ''),
        member_name: member.nname,
        member_position: member.nposit,
        demo_otp: otpCode
      }), { headers: corsHeaders });
    }

    // 6. Verify OTP & Reset Password (6 digits + 3 English letters + 1 special char = 10 chars)
    if (action === 'reset_password_otp') {
      const idno = String(body.idno || '').trim();
      const otpCode = String(body.otp_code || '').trim();
      const refCode = String(body.ref_code || '').trim();
      const newPass = String(body.new_password || '').trim();
      const mbphone = String(body.mbphone || '').trim();
      const email = String(body.email || '').trim();

      const digitCount = (newPass.match(/[0-9]/g) || []).length;
      const letterCount = (newPass.match(/[a-zA-Z]/g) || []).length;
      const specialCount = (newPass.match(/[^a-zA-Z0-9]/g) || []).length;

      if (newPass.length !== 10 || digitCount !== 6 || letterCount !== 3 || specialCount !== 1) {
        db.close();
        return new Response(JSON.stringify({
          success: false,
          message: `รหัสผ่านต้องมี 10 ตัวอักษร ประกอบด้วย ตัวเลข 6 ตัว (มี ${digitCount}), ภาษาอังกฤษ 3 ตัว (มี ${letterCount}), อักขระพิเศษ 1 ตัว (มี ${specialCount})`
        }), { headers: corsHeaders });
      }

      const qOtp = await db.query(`
        SELECT id FROM tb_otp
        WHERE idno = ${sqlEsc(idno)} AND otp_code = ${sqlEsc(otpCode)} AND ref_code = ${sqlEsc(refCode)} AND is_used = 0
        ORDER BY id DESC LIMIT 1;
      `);

      if (qOtp.rows.length === 0) {
        db.close();
        return new Response(JSON.stringify({ success: false, message: 'รหัส OTP ไม่ถูกต้องหรือถูกใช้งานไปแล้ว' }), { headers: corsHeaders });
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
        message: 'ตั้งรหัสผ่านใหม่และอัปเดตข้อมูลเบอร์โทรศัพท์/อีเมลสำเร็จเรียบร้อยแล้ว! สามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที',
        new_password: newPass
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
