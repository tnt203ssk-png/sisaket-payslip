// ============================================================================
// ระบบบันทึกข้อมูลบุคลากร แก้ไขข้อมูลส่วนบุคคล และนำเข้า/ส่งออกข้อมูล (โครงสร้างชีต data70)
// สำหรับระบบแจ้งเงินเดือนออนไลน์ กองสาธารณสุข อบจ.ศรีสะเกษ
// ============================================================================

// 1. Master Data: รายชื่อ รพ.สต. ทั้ง 133 แห่ง (ผูกค่า ลำดับsml 1-133, ชื่อ รพ.สต., และขนาด S/M/L)
const DATA70_HOSPITALS = [
  { sml_seq: 1, hname: "รพ.สต.บ้านกลาง ต.โพนค้อ อ.เมืองศรีสะเกษ", short_name: "รพ.สต.บ้านกลาง", tam: "ต.โพนค้อ", amp: "อ.เมืองศรีสะเกษ", sml_size: "S", zone: "โซน1" },
  { sml_seq: 2, hname: "รพ.สต.บ้านชำเม็ง ต.เสาธงชัย อ.กันทรลักษ์", short_name: "รพ.สต.บ้านชำเม็ง", tam: "ต.เสาธงชัย", amp: "อ.กันทรลักษ์", sml_size: "S", zone: "โซน3" },
  { sml_seq: 3, hname: "รพ.สต.บ้านกุง ต.กุง อ.ศิลาลาด", short_name: "รพ.สต.บ้านกุง", tam: "ต.กุง", amp: "อ.ศิลาลาด", sml_size: "S", zone: "โซน6" },
  { sml_seq: 4, hname: "รพ.สต.บ้านอ้อมแก้ว ต.ก้านเหลือง อ.อุทุมพรพิสัย", short_name: "รพ.สต.บ้านอ้อมแก้ว", tam: "ต.ก้านเหลือง", amp: "อ.อุทุมพรพิสัย", sml_size: "S", zone: "โซน5" },
  { sml_seq: 5, hname: "รพ.สต.บ้านแต้ ต.แต้ อ.อุทุมพรพิสัย", short_name: "รพ.สต.บ้านแต้", tam: "ต.แต้", amp: "อ.อุทุมพรพิสัย", sml_size: "S", zone: "โซน5" },
  { sml_seq: 6, hname: "รพ.สต.บ้านแข้ ต.แข้ อ.อุทุมพรพิสัย", short_name: "รพ.สต.บ้านแข้", tam: "ต.แข้", amp: "อ.อุทุมพรพิสัย", sml_size: "S", zone: "โซน5" },
  { sml_seq: 7, hname: "รพ.สต.บ้านแซรไปร ต.ไพรพัฒนา อ.ภูสิงห์", short_name: "รพ.สต.บ้านแซรไปร", tam: "ต.ไพรพัฒนา", amp: "อ.ภูสิงห์", sml_size: "S", zone: "โซน4" },
  { sml_seq: 8, hname: "รพ.สต.บ้านปลาซิว ต.หนองใหญ่ อ.เมืองจันทร์", short_name: "รพ.สต.บ้านปลาซิว", tam: "ต.หนองใหญ่", amp: "อ.เมืองจันทร์", sml_size: "S", zone: "โซน6" },
  { sml_seq: 9, hname: "รพ.สต.บ้านโนนหนองหว้า ต.โดด อ.โพธิ์ศรีสุวรรณ", short_name: "รพ.สต.บ้านโนนหนองหว้า", tam: "ต.โดด", amp: "อ.โพธิ์ศรีสุวรรณ", sml_size: "S", zone: "โซน6" },
  { sml_seq: 10, hname: "รพ.สต.บ้านหนองม้า ต.หนองม้า อ.โพธิ์ศรีสุวรรณ", short_name: "รพ.สต.บ้านหนองม้า", tam: "ต.หนองม้า", amp: "อ.โพธิ์ศรีสุวรรณ", sml_size: "S", zone: "โซน6" },
  { sml_seq: 11, hname: "รพ.สต.บ้านโซงเลง ต.หนองม้า อ.โพธิ์ศรีสุวรรณ", short_name: "รพ.สต.บ้านโซงเลง", tam: "ต.หนองม้า", amp: "อ.โพธิ์ศรีสุวรรณ", sml_size: "S", zone: "โซน6" },
  { sml_seq: 12, hname: "รพ.สต.บ้านโจดม่วง ต.โจดม่วง อ.ศิลาลาด", short_name: "รพ.สต.บ้านโจดม่วง", tam: "ต.โจดม่วง", amp: "อ.ศิลาลาด", sml_size: "S", zone: "โซน6" },
  { sml_seq: 13, hname: "รพ.สต.บ้านหนองไฮ ต.หนองไฮ อ.เมืองศรีสะเกษ", short_name: "รพ.สต.บ้านหนองไฮ", tam: "ต.หนองไฮ", amp: "อ.เมืองศรีสะเกษ", sml_size: "M", zone: "โซน1" },
  { sml_seq: 14, hname: "รพ.สต.บ้านคูซอด ต.คูซอด อ.เมืองศรีสะเกษ", short_name: "รพ.สต.บ้านคูซอด", tam: "ต.คูซอด", amp: "อ.เมืองศรีสะเกษ", sml_size: "M", zone: "โซน1" },
  { sml_seq: 15, hname: "รพ.สต.บ้านแทง ต.ซำ อ.เมืองศรีสะเกษ", short_name: "รพ.สต.บ้านแทง", tam: "ต.ซำ", amp: "อ.เมืองศรีสะเกษ", sml_size: "M", zone: "โซน1" },
  { sml_seq: 16, hname: "รพ.สต.บ้านหนองคู ต.จาน อ.เมืองศรีสะเกษ", short_name: "รพ.สต.บ้านหนองคู", tam: "ต.จาน", amp: "อ.เมืองศรีสะเกษ", sml_size: "M", zone: "โซน1" },
  { sml_seq: 17, hname: "รพ.สต.ตะดอบ ต.ตะดอบ อ.เมืองศรีสะเกษ", short_name: "รพ.สต.ตะดอบ", tam: "ต.ตะดอบ", amp: "อ.เมืองศรีสะเกษ", sml_size: "M", zone: "โซน1" },
  { sml_seq: 18, hname: "รพ.สต.บ้านหนองครกใต้ ต.หนองครก อ.เมืองศรีสะเกษ", short_name: "รพ.สต.บ้านหนองครกใต้", tam: "ต.หนองครก", amp: "อ.เมืองศรีสะเกษ", sml_size: "M", zone: "โซน1" },
  { sml_seq: 19, hname: "รพ.สต.บ้านกุดโง้ง ต.โพนข่า อ.เมืองศรีสะเกษ", short_name: "รพ.สต.บ้านกุดโง้ง", tam: "ต.โพนข่า", amp: "อ.เมืองศรีสะเกษ", sml_size: "M", zone: "โซน1" },
  { sml_seq: 20, hname: "รพ.สต.บ้านสร้างเรือง ต.หญ้าปล้อง อ.เมืองศรีสะเกษ", short_name: "รพ.สต.บ้านสร้างเรือง", tam: "ต.หญ้าปล้อง", amp: "อ.เมืองศรีสะเกษ", sml_size: "M", zone: "โซน1" },
  { sml_seq: 21, hname: "รพ.สต.บ้านโนนแกด ต.ทุ่ม อ.เมืองศรีสะเกษ", short_name: "รพ.สต.บ้านโนนแกด", tam: "ต.ทุ่ม", amp: "อ.เมืองศรีสะเกษ", sml_size: "M", zone: "โซน1" },
  { sml_seq: 22, hname: "รพ.สต.บ้านหนองแก้ว ต.หนองแก้ว อ.เมืองศรีสะเกษ", short_name: "รพ.สต.บ้านหนองแก้ว", tam: "ต.หนองแก้ว", amp: "อ.เมืองศรีสะเกษ", sml_size: "M", zone: "โซน1" },
  { sml_seq: 23, hname: "รพ.สต.บ้านน้ำคำ ต.น้ำคำ อ.เมืองศรีสะเกษ", short_name: "รพ.สต.บ้านน้ำคำ", tam: "ต.น้ำคำ", amp: "อ.เมืองศรีสะเกษ", sml_size: "M", zone: "โซน1" },
  { sml_seq: 24, hname: "รพ.สต.บ้านหนองโน ต.น้ำคำ อ.เมืองศรีสะเกษ", short_name: "รพ.สต.บ้านหนองโน", tam: "ต.น้ำคำ", amp: "อ.เมืองศรีสะเกษ", sml_size: "M", zone: "โซน1" },
  { sml_seq: 25, hname: "รพ.สต.บ้านโพธิ์ ต.โพธิ์ อ.เมืองศรีสะเกษ", short_name: "รพ.สต.บ้านโพธิ์", tam: "ต.โพธิ์", amp: "อ.เมืองศรีสะเกษ", sml_size: "M", zone: "โซน1" },
  { sml_seq: 26, hname: "รพ.สต.บ้านก้านเหลือง ต.หมากเขียบ อ.เมืองศรีสะเกษ", short_name: "รพ.สต.บ้านก้านเหลือง", tam: "ต.หมากเขียบ", amp: "อ.เมืองศรีสะเกษ", sml_size: "M", zone: "โซน1" },
  { sml_seq: 27, hname: "รพ.สต.บ้านหนองไผ่ ต.หนองไผ่ อ.เมืองศรีสะเกษ", short_name: "รพ.สต.บ้านหนองไผ่", tam: "ต.หนองไผ่", amp: "อ.เมืองศรีสะเกษ", sml_size: "M", zone: "โซน1" },
  { sml_seq: 28, hname: "รพ.สต.บ้านถนนวิหาร ต.บึงมะลู อ.กันทรลักษ์", short_name: "รพ.สต.บ้านถนนวิหาร", tam: "ต.บึงมะลู", amp: "อ.กันทรลักษ์", sml_size: "M", zone: "โซน3" },
  { sml_seq: 29, hname: "รพ.สต.บ้านกุดเสลา ต.กุดเสลา อ.กันทรลักษ์", short_name: "รพ.สต.บ้านกุดเสลา", tam: "ต.กุดเสลา", amp: "อ.กันทรลักษ์", sml_size: "M", zone: "โซน3" },
  { sml_seq: 30, hname: "รพ.สต.บ้านหนองเดียงน้อย ต.เมือง อ.กันทรลักษ์", short_name: "รพ.สต.บ้านหนองเดียงน้อย", tam: "ต.เมือง", amp: "อ.กันทรลักษ์", sml_size: "M", zone: "โซน3" },
  { sml_seq: 31, hname: "รพ.สต.ละลาย ต.ละลาย อ.กันทรลักษ์", short_name: "รพ.สต.ละลาย", tam: "ต.ละลาย", amp: "อ.กันทรลักษ์", sml_size: "M", zone: "โซน3" },
  { sml_seq: 32, hname: "รพ.สต.บ้านนา ต.ภูเงิน อ.กันทรลักษ์", short_name: "รพ.สต.บ้านนา", tam: "ต.ภูเงิน", amp: "อ.กันทรลักษ์", sml_size: "M", zone: "โซน3" },
  { sml_seq: 33, hname: "รพ.สต.บ้านภูเงิน ต.ภูเงิน อ.กันทรลักษ์", short_name: "รพ.สต.บ้านภูเงิน", tam: "ต.ภูเงิน", amp: "อ.กันทรลักษ์", sml_size: "M", zone: "โซน3" },
  { sml_seq: 34, hname: "รพ.สต.บ้านท่าพระ ต.ภูเงิน อ.กันทรลักษ์", short_name: "รพ.สต.บ้านท่าพระ", tam: "ต.ภูเงิน", amp: "อ.กันทรลักษ์", sml_size: "M", zone: "โซน3" },
  { sml_seq: 35, hname: "รพ.สต.บ้านโนนสำราญ ต.โนนสำราญ อ.กันทรลักษ์", short_name: "รพ.สต.บ้านโนนสำราญ", tam: "ต.โนนสำราญ", amp: "อ.กันทรลักษ์", sml_size: "M", zone: "โซน3" },
  { sml_seq: 36, hname: "รพ.สต.บ้านเสาธงชัย ต.เสาธงชัย อ.กันทรลักษ์", short_name: "รพ.สต.บ้านเสาธงชัย", tam: "ต.เสาธงชัย", amp: "อ.กันทรลักษ์", sml_size: "M", zone: "โซน3" },
  { sml_seq: 37, hname: "สอ.เฉลิมพระเกียรติ 60 พรรษา นวมินทราชินี บ้านภูมิซรอล ต.เสาธงชัย อ.กันทรลักษ์", short_name: "สอ.เฉลิมพระเกียรติ 60 พรรษา นวมินทราชินี บ้านภูมิซรอล", tam: "ต.เสาธงชัย", amp: "อ.กันทรลักษ์", sml_size: "M", zone: "โซน3" },
  { sml_seq: 38, hname: "รพ.สต.บ้านขนุน ต.ขนุน อ.กันทรลักษ์", short_name: "รพ.สต.บ้านขนุน", tam: "ต.ขนุน", amp: "อ.กันทรลักษ์", sml_size: "M", zone: "โซน3" },
  { sml_seq: 39, hname: "รพ.สต.บ้านนาชนวน ต.ขนุน อ.กันทรลักษ์", short_name: "รพ.สต.บ้านนาชนวน", tam: "ต.ขนุน", amp: "อ.กันทรลักษ์", sml_size: "M", zone: "โซน3" },
  { sml_seq: 40, hname: "รพ.สต.บ้านหนองหิน ต.สวนกล้วย อ.กันทรลักษ์", short_name: "รพ.สต.บ้านหนองหิน", tam: "ต.สวนกล้วย", amp: "อ.กันทรลักษ์", sml_size: "M", zone: "โซน3" },
  { sml_seq: 41, hname: "รพ.สต.บ้านจำนัน ต.สวนกล้วย อ.กันทรลักษ์", short_name: "รพ.สต.บ้านจำนัน", tam: "ต.สวนกล้วย", amp: "อ.กันทรลักษ์", sml_size: "M", zone: "โซน3" },
  { sml_seq: 42, hname: "รพ.สต.บ้านทุ่งใหญ่ ต.ทุ่งใหญ่ อ.กันทรลักษ์", short_name: "รพ.สต.บ้านทุ่งใหญ่", tam: "ต.ทุ่งใหญ่", amp: "อ.กันทรลักษ์", sml_size: "M", zone: "โซน3" },
  { sml_seq: 43, hname: "รพ.สต.บ้านด่านกลาง ต.ภูผาหมอก อ.กันทรลักษ์", short_name: "รพ.สต.บ้านด่านกลาง", tam: "ต.ภูผาหมอก", amp: "อ.กันทรลักษ์", sml_size: "M", zone: "โซน3" },
  { sml_seq: 44, hname: "รพ.สต.บ้านท่าสว่าง ต.โนนสำราญ อ.กันทรลักษ์", short_name: "รพ.สต.บ้านท่าสว่าง", tam: "ต.โนนสำราญ", amp: "อ.กันทรลักษ์", sml_size: "M", zone: "โซน3" },
  { sml_seq: 45, hname: "รพ.สต.บ้านบกขี้ยาง ต.หนองหัวช้าง อ.กันทรารมย์", short_name: "รพ.สต.บ้านบกขี้ยาง", tam: "ต.หนองหัวช้าง", amp: "อ.กันทรารมย์", sml_size: "M", zone: "โซน2" },
  { sml_seq: 46, hname: "รพ.สต.บ้านหนองแวง ต.หนองแวง อ.กันทรารมย์", short_name: "รพ.สต.บ้านหนองแวง", tam: "ต.หนองแวง", amp: "อ.กันทรารมย์", sml_size: "M", zone: "โซน2" },
  { sml_seq: 47, hname: "รพ.สต.บ้านละทาย ต.ละทาย อ.กันทรารมย์", short_name: "รพ.สต.บ้านละทาย", tam: "ต.ละทาย", amp: "อ.กันทรารมย์", sml_size: "M", zone: "โซน2" },
  { sml_seq: 48, hname: "รพ.สต.บ้านหนองบัว ต.หนองบัว อ.กันทรารมย์", short_name: "รพ.สต.บ้านหนองบัว", tam: "ต.หนองบัว", amp: "อ.กันทรารมย์", sml_size: "M", zone: "โซน2" },
  { sml_seq: 49, hname: "รพ.สต.บ้านหนองทามน้อย ต.คำเนียม อ.กันทรารมย์", short_name: "รพ.สต.บ้านหนองทามน้อย", tam: "ต.คำเนียม", amp: "อ.กันทรารมย์", sml_size: "M", zone: "โซน2" },
  { sml_seq: 50, hname: "รพ.สต.บ้านผึ้ง ต.ทาม อ.กันทรารมย์", short_name: "รพ.สต.บ้านผึ้ง", tam: "ต.ทาม", amp: "อ.กันทรารมย์", sml_size: "M", zone: "โซน2" },
  { sml_seq: 51, hname: "รพ.สต.บ้านเจี่ย ต.ทาม อ.กันทรารมย์", short_name: "รพ.สต.บ้านเจี่ย", tam: "ต.ทาม", amp: "อ.กันทรารมย์", sml_size: "M", zone: "โซน2" },
  { sml_seq: 52, hname: "รพ.สต.บ้านตะเคียนบังอิง ต.ศรีสะอาด อ.ขุขันธ์", short_name: "รพ.สต.บ้านตะเคียนบังอิง", tam: "ต.ศรีสะอาด", amp: "อ.ขุขันธ์", sml_size: "M", zone: "โซน4" },
  { sml_seq: 53, hname: "รพ.สต.บ้านปรือคันตะวันออก ต.ปรือใหญ่ อ.ขุขันธ์", short_name: "รพ.สต.บ้านปรือคันตะวันออก", tam: "ต.ปรือใหญ่", amp: "อ.ขุขันธ์", sml_size: "M", zone: "โซน4" },
  { sml_seq: 54, hname: "รพ.สต.บ้านตะเคียนช่างเหล็ก ต.ตะเคียน อ.ขุขันธ์", short_name: "รพ.สต.บ้านตะเคียนช่างเหล็ก", tam: "ต.ตะเคียน", amp: "อ.ขุขันธ์", sml_size: "M", zone: "โซน4" },
  { sml_seq: 55, hname: "รพ.สต.บ้านโคกเพชร ต.โคกเพชร อ.ขุขันธ์", short_name: "รพ.สต.บ้านโคกเพชร", tam: "ต.โคกเพชร", amp: "อ.ขุขันธ์", sml_size: "M", zone: "โซน4" },
  { sml_seq: 56, hname: "รพ.สต.บ้านปราสาท ต.ปราสาท อ.ขุขันธ์", short_name: "รพ.สต.บ้านปราสาท", tam: "ต.ปราสาท", amp: "อ.ขุขันธ์", sml_size: "M", zone: "โซน4" },
  { sml_seq: 57, hname: "รพ.สต.บ้านนาก๊อก ต.ห้วยสำราญ อ.ขุขันธ์", short_name: "รพ.สต.บ้านนาก๊อก", tam: "ต.ห้วยสำราญ", amp: "อ.ขุขันธ์", sml_size: "M", zone: "โซน4" },
  { sml_seq: 58, hname: "รพ.สต.บ้านวิทย์ ต.ลมศักดิ์ อ.ขุขันธ์", short_name: "รพ.สต.บ้านวิทย์", tam: "ต.ลมศักดิ์", amp: "อ.ขุขันธ์", sml_size: "M", zone: "โซน4" },
  { sml_seq: 59, hname: "รพ.สต.บ้านนิคมซอยกลาง ต.หนองฉลอง อ.ขุขันธ์", short_name: "รพ.สต.บ้านนิคมซอยกลาง", tam: "ต.หนองฉลอง", amp: "อ.ขุขันธ์", sml_size: "M", zone: "โซน4" },
  { sml_seq: 60, hname: "รพ.สต.บ้านตานวน ต.กันทรอม อ.ขุนหาญ", short_name: "รพ.สต.บ้านตานวน", tam: "ต.กันทรอม", amp: "อ.ขุนหาญ", sml_size: "M", zone: "โซน4" },
  { sml_seq: 61, hname: "รพ.สต.บ้านภูทอง ต.ภูฝ้าย อ.ขุนหาญ", short_name: "รพ.สต.บ้านภูทอง", tam: "ต.ภูฝ้าย", amp: "อ.ขุนหาญ", sml_size: "M", zone: "โซน4" },
  { sml_seq: 62, hname: "รพ.สต.น้ำเกลี้ยง ต.น้ำเกลี้ยง อ.น้ำเกลี้ยง", short_name: "รพ.สต.น้ำเกลี้ยง", tam: "ต.น้ำเกลี้ยง", amp: "อ.น้ำเกลี้ยง", sml_size: "M", zone: "โซน2" },
  { sml_seq: 63, hname: "รพ.สต.บ้านละเอาะ ต.ละเอาะ อ.น้ำเกลี้ยง", short_name: "รพ.สต.บ้านละเอาะ", tam: "ต.ละเอาะ", amp: "อ.น้ำเกลี้ยง", sml_size: "M", zone: "โซน2" },
  { sml_seq: 64, hname: "รพ.สต.บ้านคูบ ต.คูบ อ.น้ำเกลี้ยง", short_name: "รพ.สต.บ้านคูบ", tam: "ต.คูบ", amp: "อ.น้ำเกลี้ยง", sml_size: "M", zone: "โซน2" },
  { sml_seq: 65, hname: "รพ.สต.บ้านหนองแวง ต.คูบ อ.น้ำเกลี้ยง", short_name: "รพ.สต.บ้านหนองแวง", tam: "ต.คูบ", amp: "อ.น้ำเกลี้ยง", sml_size: "M", zone: "โซน2" },
  { sml_seq: 66, hname: "รพ.สต.บ้านทุ่งรวงทอง ต.โพธิ์ อ.โนนคูณ", short_name: "รพ.สต.บ้านทุ่งรวงทอง", tam: "ต.โพธิ์", amp: "อ.โนนคูณ", sml_size: "M", zone: "โซน2" },
  { sml_seq: 67, hname: "รพ.สต.บ้านม่วง ต.เป๊าะ อ.บึงบูรพ์", short_name: "รพ.สต.บ้านม่วง", tam: "ต.เป๊าะ", amp: "อ.บึงบูรพ์", sml_size: "M", zone: "โซน6" },
  { sml_seq: 68, hname: "รพ.สต.บ้านเพ็ก ต.หนองหว้า อ.เบญจลักษ์", short_name: "รพ.สต.บ้านเพ็ก", tam: "ต.หนองหว้า", amp: "อ.เบญจลักษ์", sml_size: "M", zone: "โซน3" },
  { sml_seq: 69, hname: "รพ.สต.บ้านดอนเหลือม ต.โพธิ์ศรี อ.ปรางค์กู่", short_name: "รพ.สต.บ้านดอนเหลือม", tam: "ต.โพธิ์ศรี", amp: "อ.ปรางค์กู่", sml_size: "M", zone: "โซน4" },
  { sml_seq: 70, hname: "รพ.สต.บ้านโพธิ์ศรี ต.โนนเพ็ก อ.พยุห์", short_name: "รพ.สต.บ้านโพธิ์ศรี", tam: "ต.โนนเพ็ก", amp: "อ.พยุห์", sml_size: "M", zone: "โซน1" },
  { sml_seq: 71, hname: "รพ.สต.บ้านปลาเดิดใหญ่ ต.โดด อ.โพธิ์ศรีสุวรรณ", short_name: "รพ.สต.บ้านปลาเดิดใหญ่", tam: "ต.โดด", amp: "อ.โพธิ์ศรีสุวรรณ", sml_size: "M", zone: "โซน6" },
  { sml_seq: 72, hname: "รพ.สต.บ้านเสียว ต.เสียว อ.โพธิ์ศรีสุวรรณ", short_name: "รพ.สต.บ้านเสียว", tam: "ต.เสียว", amp: "อ.โพธิ์ศรีสุวรรณ", sml_size: "M", zone: "โซน6" },
  { sml_seq: 73, hname: "รพ.สต.บ้านผือ ต.ผือใหญ่ อ.โพธิ์ศรีสุวรรณ", short_name: "รพ.สต.บ้านผือ", tam: "ต.ผือใหญ่", amp: "อ.โพธิ์ศรีสุวรรณ", sml_size: "M", zone: "โซน6" },
  { sml_seq: 74, hname: "รพ.สต.บ้านหนองแปน ต.ผือใหญ่ อ.โพธิ์ศรีสุวรรณ", short_name: "รพ.สต.บ้านหนองแปน", tam: "ต.ผือใหญ่", amp: "อ.โพธิ์ศรีสุวรรณ", sml_size: "M", zone: "โซน6" },
  { sml_seq: 75, hname: "รพ.สต.บ้านอีเซ ต.อีเซ อ.โพธิ์ศรีสุวรรณ", short_name: "รพ.สต.บ้านอีเซ", tam: "ต.อีเซ", amp: "อ.โพธิ์ศรีสุวรรณ", sml_size: "M", zone: "โซน6" },
  { sml_seq: 76, hname: "รพ.สต.บ้านทุ่ม ต.ไพรบึง อ.ไพรบึง", short_name: "รพ.สต.บ้านทุ่ม", tam: "ต.ไพรบึง", amp: "อ.ไพรบึง", sml_size: "M", zone: "โซน4" },
  { sml_seq: 77, hname: "รพ.สต.บ้านปราสาทเยอเหนือ ต.ปราสาทเยอ อ.ไพรบึง", short_name: "รพ.สต.บ้านปราสาทเยอเหนือ", tam: "ต.ปราสาทเยอ", amp: "อ.ไพรบึง", sml_size: "M", zone: "โซน4" },
  { sml_seq: 78, hname: "รพ.สต.บ้านตาโมกข์ ต.สำโรงพลัน อ.ไพรบึง", short_name: "รพ.สต.บ้านตาโมกข์", tam: "ต.สำโรงพลัน", amp: "อ.ไพรบึง", sml_size: "M", zone: "โซน4" },
  { sml_seq: 79, hname: "รพ.สต.บ้านพะแวะ ต.สุขสวัสดิ์ อ.ไพรบึง", short_name: "รพ.สต.บ้านพะแวะ", tam: "ต.สุขสวัสดิ์", amp: "อ.ไพรบึง", sml_size: "M", zone: "โซน4" },
  { sml_seq: 80, hname: "รพ.สต.เก็บงา ต.เมืองจันทร์ อ.เมืองจันทร์", short_name: "รพ.สต.เก็บงา", tam: "ต.เมืองจันทร์", amp: "อ.เมืองจันทร์", sml_size: "M", zone: "โซน6" },
  { sml_seq: 81, hname: "รพ.สต.บ้านตาโกน ต.ตาโกน อ.เมืองจันทร์", short_name: "รพ.สต.บ้านตาโกน", tam: "ต.ตาโกน", amp: "อ.เมืองจันทร์", sml_size: "M", zone: "โซน6" },
  { sml_seq: 82, hname: "รพ.สต.ธาตุ ต.ธาตุ อ.วังหิน", short_name: "รพ.สต.ธาตุ", tam: "ต.ธาตุ", amp: "อ.วังหิน", sml_size: "M", zone: "โซน1" },
  { sml_seq: 83, hname: "รพ.สต.บ้านดวนใหญ่ ต.ดวนใหญ่ อ.วังหิน", short_name: "รพ.สต.บ้านดวนใหญ่", tam: "ต.ดวนใหญ่", amp: "อ.วังหิน", sml_size: "M", zone: "โซน1" },
  { sml_seq: 84, hname: "รพ.สต.บ่อแก้ว ต.บ่อแก้ว อ.วังหิน", short_name: "รพ.สต.บ่อแก้ว", tam: "ต.บ่อแก้ว", amp: "อ.วังหิน", sml_size: "M", zone: "โซน1" },
  { sml_seq: 85, hname: "รพ.สต.ศรีสำราญ ต.ศรีสำราญ อ.วังหิน", short_name: "รพ.สต.ศรีสำราญ", tam: "ต.ศรีสำราญ", amp: "อ.วังหิน", sml_size: "M", zone: "โซน1" },
  { sml_seq: 86, hname: "รพ.สต.ทุ่งสว่าง ต.ทุ่งสว่าง อ.วังหิน", short_name: "รพ.สต.ทุ่งสว่าง", tam: "ต.ทุ่งสว่าง", amp: "อ.วังหิน", sml_size: "M", zone: "โซน1" },
  { sml_seq: 87, hname: "รพ.สต.บ้านศรีสุข ต.สระเยาว์ อ.ศรีรัตนะ", short_name: "รพ.สต.บ้านศรีสุข", tam: "ต.สระเยาว์", amp: "อ.ศรีรัตนะ", sml_size: "M", zone: "โซน2" },
  { sml_seq: 88, hname: "รพ.สต.บ้านเสื่องข้าว ต.เสื่องข้าว อ.ศรีรัตนะ", short_name: "รพ.สต.บ้านเสื่องข้าว", tam: "ต.เสื่องข้าว", amp: "อ.ศรีรัตนะ", sml_size: "M", zone: "โซน2" },
  { sml_seq: 89, hname: "รพ.สต.บ้านคลีกลิ้ง ต.คลีกลิ้ง อ.ศิลาลาด", short_name: "รพ.สต.บ้านคลีกลิ้ง", tam: "ต.คลีกลิ้ง", amp: "อ.ศิลาลาด", sml_size: "M", zone: "โซน6" },
  { sml_seq: 90, hname: "รพ.สต.บ้านหนองบัวดง ต.หนองบัวดง อ.ศิลาลาด", short_name: "รพ.สต.บ้านหนองบัวดง", tam: "ต.หนองบัวดง", amp: "อ.ศิลาลาด", sml_size: "M", zone: "โซน6" },
  { sml_seq: 91, hname: "รพ.สต.บ้านหนองสะมอน ต.เมืองหลวง อ.ห้วยทับทัน", short_name: "รพ.สต.บ้านหนองสะมอน", tam: "ต.เมืองหลวง", amp: "อ.ห้วยทับทัน", sml_size: "M", zone: "โซน5" },
  { sml_seq: 92, hname: "รพ.สต.บ้านผักไหม ต.ผักไหม อ.ห้วยทับทัน", short_name: "รพ.สต.บ้านผักไหม", tam: "ต.ผักไหม", amp: "อ.ห้วยทับทัน", sml_size: "M", zone: "โซน5" },
  { sml_seq: 93, hname: "รพ.สต.บ้านห่องน้อย ต.ผักไหม อ.ห้วยทับทัน", short_name: "รพ.สต.บ้านห่องน้อย", tam: "ต.ผักไหม", amp: "อ.ห้วยทับทัน", sml_size: "M", zone: "โซน5" },
  { sml_seq: 94, hname: "รพ.สต.บ้านพะวร ต.จานแสนไชย อ.ห้วยทับทัน", short_name: "รพ.สต.บ้านพะวร", tam: "ต.จานแสนไชย", amp: "อ.ห้วยทับทัน", sml_size: "M", zone: "โซน5" },
  { sml_seq: 95, hname: "รพ.สต.บ้านจานแสนไชย ต.จานแสนไชย อ.ห้วยทับทัน", short_name: "รพ.สต.บ้านจานแสนไชย", tam: "ต.จานแสนไชย", amp: "อ.ห้วยทับทัน", sml_size: "M", zone: "โซน5" },
  { sml_seq: 96, hname: "รพ.สต.บ้านอี่หล่ำ ต.อี่หล่ำ อ.อุทุมพรพิสัย", short_name: "รพ.สต.บ้านอี่หล่ำ", tam: "ต.อี่หล่ำ", amp: "อ.อุทุมพรพิสัย", sml_size: "M", zone: "โซน5" },
  { sml_seq: 97, hname: "รพ.สต.บ้านก้านเหลือง ต.ก้านเหลือง อ.อุทุมพรพิสัย", short_name: "รพ.สต.บ้านก้านเหลือง", tam: "ต.ก้านเหลือง", amp: "อ.อุทุมพรพิสัย", sml_size: "M", zone: "โซน5" },
  { sml_seq: 98, hname: "รพ.สต.บ้านทุ่งไชย ต.ทุ่งไชย อ.อุทุมพรพิสัย", short_name: "รพ.สต.บ้านทุ่งไชย", tam: "ต.ทุ่งไชย", amp: "อ.อุทุมพรพิสัย", sml_size: "M", zone: "โซน5" },
  { sml_seq: 99, hname: "รพ.สต.บ้านยาง ต.สำโรง อ.อุทุมพรพิสัย", short_name: "รพ.สต.บ้านยาง", tam: "ต.สำโรง", amp: "อ.อุทุมพรพิสัย", sml_size: "M", zone: "โซน5" },
  { sml_seq: 100, hname: "รพ.สต.บ้านโนนแตน ต.แขม อ.อุทุมพรพิสัย", short_name: "รพ.สต.บ้านโนนแตน", tam: "ต.แขม", amp: "อ.อุทุมพรพิสัย", sml_size: "M", zone: "โซน5" },
  { sml_seq: 101, hname: "รพ.สต.บ้านหนองไฮ ต.หนองไฮ อ.อุทุมพรพิสัย", short_name: "รพ.สต.บ้านหนองไฮ", tam: "ต.หนองไฮ", amp: "อ.อุทุมพรพิสัย", sml_size: "M", zone: "โซน5" },
  { sml_seq: 102, hname: "รพ.สต.บ้านขะยูง ต.ขะยูง อ.อุทุมพรพิสัย", short_name: "รพ.สต.บ้านขะยูง", tam: "ต.ขะยูง", amp: "อ.อุทุมพรพิสัย", sml_size: "M", zone: "โซน5" },
  { sml_seq: 103, hname: "รพ.สต.บ้านตาเกษ ต.ตาเกษ อ.อุทุมพรพิสัย", short_name: "รพ.สต.บ้านตาเกษ", tam: "ต.ตาเกษ", amp: "อ.อุทุมพรพิสัย", sml_size: "M", zone: "โซน5" },
  { sml_seq: 104, hname: "รพ.สต.หัวช้าง ต.หัวช้าง อ.อุทุมพรพิสัย", short_name: "รพ.สต.หัวช้าง", tam: "ต.หัวช้าง", amp: "อ.อุทุมพรพิสัย", sml_size: "M", zone: "โซน5" },
  { sml_seq: 105, hname: "รพ.สต.บ้านปะอาว ต.ปะอาว อ.อุทุมพรพิสัย", short_name: "รพ.สต.บ้านปะอาว", tam: "ต.ปะอาว", amp: "อ.อุทุมพรพิสัย", sml_size: "M", zone: "โซน5" },
  { sml_seq: 106, hname: "รพ.สต.บ้านพงพรต ต.หนองห้าง อ.อุทุมพรพิสัย", short_name: "รพ.สต.บ้านพงพรต", tam: "ต.หนองห้าง", amp: "อ.อุทุมพรพิสัย", sml_size: "M", zone: "โซน5" },
  { sml_seq: 107, hname: "รพ.สต.โคกหล่าม ต.โคกหล่าม อ.อุทุมพรพิสัย", short_name: "รพ.สต.โคกหล่าม", tam: "ต.โคกหล่าม", amp: "อ.อุทุมพรพิสัย", sml_size: "M", zone: "โซน5" },
  { sml_seq: 108, hname: "รพ.สต.บ้านหนองแวง ต.โพนเขวา อ.เมืองศรีสะเกษ", short_name: "รพ.สต.บ้านหนองแวง", tam: "ต.โพนเขวา", amp: "อ.เมืองศรีสะเกษ", sml_size: "L", zone: "โซน1" },
  { sml_seq: 109, hname: "รพ.สต.บ้านผักแพว ต.ผักแพว อ.กันทรารมย์", short_name: "รพ.สต.บ้านผักแพว", tam: "ต.ผักแพว", amp: "อ.กันทรารมย์", sml_size: "L", zone: "โซน2" },
  { sml_seq: 110, hname: "รพ.สต.บ้านตาแท่น ต.บึงมะลู อ.กันทรลักษ์", short_name: "รพ.สต.บ้านตาแท่น", tam: "ต.บึงมะลู", amp: "อ.กันทรลักษ์", sml_size: "L", zone: "โซน3" },
  { sml_seq: 111, hname: "รพ.สต.บ้านกันจาน ต.ดองกำเม็ด อ.ขุขันธ์", short_name: "รพ.สต.บ้านกันจาน", tam: "ต.ดองกำเม็ด", amp: "อ.ขุขันธ์", sml_size: "L", zone: "โซน4" },
  { sml_seq: 112, hname: "รพ.สต.บ้านโพธิ์กระสังข์ ต.โพธิ์กระสังข์ อ.ขุนหาญ", short_name: "รพ.สต.บ้านโพธิ์กระสังข์", tam: "ต.โพธิ์กระสังข์", amp: "อ.ขุนหาญ", sml_size: "L", zone: "โซน4" },
  { sml_seq: 113, hname: "รพ.สต.บ้านหนองหัวหมู ต.สระกำแพงใหญ่ อ.อุทุมพรพิสัย", short_name: "รพ.สต.บ้านหนองหัวหมู", tam: "ต.สระกำแพงใหญ่", amp: "อ.อุทุมพรพิสัย", sml_size: "L", zone: "โซน5" },
  { sml_seq: 114, hname: "รพ.สต.บ้านตองปิด ต.ตองปิด อ.น้ำเกลี้ยง", short_name: "รพ.สต.บ้านตองปิด", tam: "ต.ตองปิด", amp: "อ.น้ำเกลี้ยง", sml_size: "L", zone: "โซน2" },
  { sml_seq: 115, hname: "รพ.สต.บ้านเขิน ต.เขิน อ.น้ำเกลี้ยง", short_name: "รพ.สต.บ้านเขิน", tam: "ต.เขิน", amp: "อ.น้ำเกลี้ยง", sml_size: "L", zone: "โซน2" },
  { sml_seq: 116, hname: "รพ.สต.บ้านโนนงาม ต.รุ่งระวี อ.น้ำเกลี้ยง", short_name: "รพ.สต.บ้านโนนงาม", tam: "ต.รุ่งระวี", amp: "อ.น้ำเกลี้ยง", sml_size: "L", zone: "โซน2" },
  { sml_seq: 117, hname: "รพ.สต.บ้านท่าคล้อ ต.ท่าคล้อ อ.เบญจลักษ์", short_name: "รพ.สต.บ้านท่าคล้อ", tam: "ต.ท่าคล้อ", amp: "อ.เบญจลักษ์", sml_size: "L", zone: "โซน3" },
  { sml_seq: 118, hname: "รพ.สต.บ้านเหล่าเสน ต.บก อ.โนนคูณ", short_name: "รพ.สต.บ้านเหล่าเสน", tam: "ต.บก", amp: "อ.โนนคูณ", sml_size: "M", zone: "โซน2" },
  { sml_seq: 119, hname: "รพ.สต.บ้านหัวเหล่า ต.บก อ.โนนคูณ", short_name: "รพ.สต.บ้านหัวเหล่า", tam: "ต.บก", amp: "อ.โนนคูณ", sml_size: "M", zone: "โซน2" },
  { sml_seq: 120, hname: "รพ.สต.บ้านหนองกุง ต.หนองกุง อ.โนนคูณ", short_name: "รพ.สต.บ้านหนองกุง", tam: "ต.หนองกุง", amp: "อ.โนนคูณ", sml_size: "M", zone: "โซน2" },
  { sml_seq: 121, hname: "รพ.สต.บ้านโคกสะอาด ต.หนองกุง อ.โนนคูณ", short_name: "รพ.สต.บ้านโคกสะอาด", tam: "ต.หนองกุง", amp: "อ.โนนคูณ", sml_size: "M", zone: "โซน2" },
  { sml_seq: 122, hname: "รพ.สต.บ้านเมืองจันทร์ ต.เมืองจันทร์ อ.เมืองจันทร์", short_name: "รพ.สต.บ้านเมืองจันทร์", tam: "ต.เมืองจันทร์", amp: "อ.เมืองจันทร์", sml_size: "M", zone: "โซน6" },
  { sml_seq: 123, hname: "รพ.สต.บ้านกระแชง ต.กระแชง อ.กันทรลักษ์", short_name: "รพ.สต.บ้านกระแชง", tam: "ต.กระแชง", amp: "อ.กันทรลักษ์", sml_size: "L", zone: "โซน3" },
  { sml_seq: 124, hname: "รพ.สต.บ้านแก ต.หนองหญ้าลาด อ.กันทรลักษ์", short_name: "รพ.สต.บ้านแก", tam: "ต.หนองหญ้าลาด", amp: "อ.กันทรลักษ์", sml_size: "M", zone: "โซน3" },
  { sml_seq: 125, hname: "รพ.สต.บ้านซำขี้เหล็ก ต.พราน อ.ขุนหาญ", short_name: "รพ.สต.บ้านซำขี้เหล็ก", tam: "ต.พราน", amp: "อ.ขุนหาญ", sml_size: "S", zone: "โซน4" },
  { sml_seq: 126, hname: "รพ.สต.บ้านโคน ต.ศรีแก้ว อ.ศรีรัตนะ", short_name: "รพ.สต.บ้านโคน", tam: "ต.ศรีแก้ว", amp: "อ.ศรีรัตนะ", sml_size: "S", zone: "โซน2" },
  { sml_seq: 127, hname: "รพ.สต.บ้านเดื่อ ต.คลีกลิ้ง อ.ศิลาลาด", short_name: "รพ.สต.บ้านเดื่อ", tam: "ต.คลีกลิ้ง", amp: "อ.ศิลาลาด", sml_size: "S", zone: "โซน6" },
  { sml_seq: 128, hname: "รพ.สต.บ้านนากันตม ต.สังเม็ก อ.กันทรลักษ์", short_name: "รพ.สต.บ้านนากันตม", tam: "ต.สังเม็ก", amp: "อ.กันทรลักษ์", sml_size: "M", zone: "โซน3" },
  { sml_seq: 129, hname: "รพ.สต.บ้านจาน ต.จานใหญ่ อ.กันทรลักษ์", short_name: "รพ.สต.บ้านจาน", tam: "ต.จานใหญ่", amp: "อ.กันทรลักษ์", sml_size: "M", zone: "โซน3" },
  { sml_seq: 130, hname: "รพ.สต.บ้านกันจด ต.กระหวัน อ.ขุนหาญ", short_name: "รพ.สต.บ้านกันจด", tam: "ต.กระหวัน", amp: "อ.ขุนหาญ", sml_size: "M", zone: "โซน4" },
  { sml_seq: 131, hname: "รพ.สต.บ้านกราม ต.ไพร อ.ขุนหาญ", short_name: "รพ.สต.บ้านกราม", tam: "ต.ไพร", amp: "อ.ขุนหาญ", sml_size: "M", zone: "โซน4" },
  { sml_seq: 132, hname: "รพ.สต.บ้านจะกอง ต.สะพุง อ.ศรีรัตนะ", short_name: "รพ.สต.บ้านจะกอง", tam: "ต.สะพุง", amp: "อ.ศรีรัตนะ", sml_size: "M", zone: "โซน2" },
  { sml_seq: 133, hname: "รพ.สต.บ้านพรานเหนือ ต.พราน อ.ขุนหาญ", short_name: "รพ.สต.บ้านพรานเหนือ", tam: "ต.พราน", amp: "อ.ขุนหาญ", sml_size: "L", zone: "โซน4" }
];

// 2. Master Data: รายการตำแหน่ง
const DATA70_POSITIONS = [
  "เจ้าพนักงานสาธารณสุขชุมชน",
  "เจ้าหน้าที่บริหารงานสาธารณสุข",
  "เจ้าพนักงานการเงินและบัญชี",
  "เจ้าพนักงานทันตสาธารณสุข",
  "เจ้าพนักงานธุรการ",
  "เจ้าพนักงานเภสัชกรรม",
  "เจ้าพนักงานสาธารณสุข",
  "นักกายภาพบำบัด",
  "นักวิชาการสาธารณสุข",
  "นักสาธารณสุข",
  "พยาบาลวิชาชีพ",
  "แพทย์แผนไทย",
  "เภสัชกร",
  "แพทย์",
  "ทันตแพทย์",
  "ผู้อำนวยการโรงพยาบาลส่งเสริมสุขภาพตำบล",
  "ยังไม่ได้ปรับเปลี่ยนตำแหน่ง"
];

// 3. Master Data: รายการระดับ
const DATA70_LEVELS = [
  "ปฎิบัติงาน",
  "ชำนาญงาน",
  "อาวุโส",
  "ปฎิบัติการ",
  "ชำนาญการ",
  "ชำนาญการพิเศษ",
  "เชี่ยวชาญ",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "ยังไม่ได้เลื่อนระดับ",
  "ยังไม่ได้ปรับระดับ"
];

// 4. Master Data: รายการวุฒิการศึกษา และ ชื่อวุฒิการศึกษา
const DATA70_EDU_DEGREES = [
  "ประกาศนียบัตร(อนุปริญญา)",
  "ปริญญาตรี",
  "ปริญญาโท",
  "ปริญญาเอก"
];

const DATA70_EDU_MAJORS = [
  "ทันตแพทยศาสตร",
  "ทันตแพทยศาสตรบัณฑิต (ท.บ.)",
  "เทคโนโลยี (เทคโนโลยีสารสนเทศธุรกิจ)",
  "เทคโนโลยีบัณฑิต (เทคโนโลยีสารสนเทศธุรกิจ) (ทล.บ.)",
  "การเงินการบัญชี",
  "บัญชี",
  "บัญชีบัณฑิต (บช.บ.)",
  "บริหารธุรกิจบัณฑิต (บธ.บ.)",
  "ประกาศนียบัตรพนักงานอนามัย",
  "ประกาศนียบัตรวิชาพยาบาลศาสตร์และผดุงครรภ์ชั้นสูง (ป.พ.ส.)",
  "ประกาศนียบัตรวิชาพยาบาลศาสตร์ (ป.พย.)",
  "ประกาศนียบัตรทันตาภิบาล",
  "ประกาศนียบัตรครูเทคนิคขั้นสูง (ปท.ส.)",
  "พยาบาลศาสตร",
  "พยาบาลศาสตรบัณฑิต (พย.บ.)",
  "แพทยศาสตร",
  "แพทยศาสตรบัณฑิต (พ.บ.)",
  "เภสัชศาสตร",
  "เภสัชศาสตรบัณฑิต (ภ.บ.)",
  "รัฐประศาสนศาสตร",
  "รัฐประศาสนศาสตรบัณฑิต (รป.บ.)",
  "รัฐศาสตร",
  "รัฐศาสตรบัณฑิต (ร.บ.)",
  "วิทยาศาสตร",
  "วิทยาศาสตรบัณฑิต (วท.บ.)",
  "วิทยาศาสตร (พยาบาลสาธารณสุข)",
  "วิทยาศาสตรบัณฑิต (พยาบาลสาธารณสุข)",
  "วิทยาศาสตร (พยาบาลและผดุงครรภ์)",
  "วิทยาศาสตรบัณฑิต (พยาบาลและผดุงครรภ์)",
  "วิทยาศาสตร (การสาธารณสุข)",
  "สัตวแพทยศาสตร",
  "สัตวแพทยศาสตรบัณฑิต (สพ.บ.)",
  "สาธารณสุขศาสตร",
  "สาธารณสุขศาสตรบัณฑิต (ส.บ.)",
  "การศึกษาบัณฑิต (กศ.บ.)",
  "ครุศาสตรบัณฑิต (ค.บ.)",
  "ครุศาสตรบัณฑิต (พยาบาลศึกษา)",
  "นิติศาสตรบัณฑิต (น.บ.)",
  "ศิลปศาสตรบัณฑิต (ศศ.บ.)",
  "ศิลปศาสตรบัณฑิต (พยาบาล)",
  "ศิลปศาสตรบัณฑิต (รัฐศาสตร์)",
  "ศึกษาศาสตรบัณฑิต (ศษ.บ.)",
  "เศรษฐศาสตรบัณฑิต (ศ.บ.)",
  "สังคมสงเคราะห์ศาสตรบัณฑิต (สส.บ.)",
  "ปริญญาตรี",
  "ปริญญาโท",
  "ปริญญาเอก",
  "วุฒิอื่น นอกเหนือจากนี้"
];

// 5. Master Data: รายชื่อสหกรณ์ออมทรัพย์
const DATA70_COOPS = [
  "สหกรณ์ สสจ.ศรีสะเกษ",
  "สหกรณ์ อบจ.ศรีสะเกษ",
  "สหกรณ์ รพ.ศรีสะเกษ",
  "สหกรณ์ รพ.สรรพสิทธิ์",
  "สหกรณ์ สสจ.กาฬสินธ์",
  "สหกรณ์ สสจ.ขอนแก่น",
  "สหกรณ์ สสจ.ชลบุรี",
  "สหกรณ์ สสจ.ตราด",
  "สหกรณ์ สสจ.มหาสารคาม",
  "สหกรณ์ สสจ.มุกดาหาร",
  "สหกรณ์ สสจ.ยโสธร",
  "สหกรณ์ สสจ.ร้อยเอ็ด",
  "สหกรณ์ สสจ.สกลนคร",
  "สหกรณ์ สสจ.สุรินทร์",
  "สหกรณ์ สสจ.อำนาจเจริญ",
  "สหกรณ์ สสจ.อุบลฯ",
  "สหกรณ์อื่นนอกเหนือจากนี้",
  "ไม่ได้เป็นสมาชิกสหกรณ์"
];

// 5.1 Master Data: รายการกลุ่มงาน (4 กลุ่มงานตามโครงสร้างไฟล์ข้อมูลเงินเดือน70 ล่าสุด)
const DATA70_WORK_GROUPS = [
  "ผอ.รพ.สต.",
  "กลุ่มบริหารสาธารณสุข",
  "กลุ่มส่งเสริมป้องกันควบคุมโรค",
  "กลุ่มเวชปฏิบัติ"
];

// 6. โครงสร้างคอลัมน์มาตรฐานชีต data70 สำหรับ Import / Export Excel & CSV (73/74 คอลัมน์ รวมกลุ่มงาน)
const DATA70_EXPORT_COLUMNS = [
  { key: "seq_no", header: "ลำดับ" },
  { key: "sml_seq", header: "ลำดับsml" },
  { key: "hname", header: "ชื่อรพ.สต." },
  { key: "sml_size", header: "SML" },
  { key: "cid", header: "13หลัก", isText: true },
  { key: "bank_account", header: "เลขบัญชี", isText: true },
  { key: "fullname", header: "ชื่อ-สกุล" },
  { key: "birth_date", header: "วันเดือนปีเกิด" },
  { key: "transfer_date", header: "วันที่ย้ายมาสังกัดหรือบรรจุที่ อบจ.ศรีสะเกษ" },
  { key: "current_position", header: "ตำแหน่งปัจจุบัน" },
  { key: "current_level", header: "ระดับปัจจุบัน" },
  { key: "work_group", header: "กลุ่มงาน" },
  { key: "position_no", header: "เลขตำแหน่งปัจจุบัน" },
  { key: "edu_degree", header: "วุฒิการศึกษาปัจจุบัน" },
  { key: "edu_major", header: "ชื่อวุฒิการศึกษาปัจจุบัน" },
  { key: "salary", header: "เงินเดือนปัจจุบัน", isNum: true },
  { key: "allowance", header: "ค่าตอบแทน(ถ้าไม่มีให้เติม 0)", isNum: true },
  { key: "position_allowance", header: "เงินประจำตำแหน่ง(ถ้าไม่มีให้เติม 0)", isNum: true },
  { key: "pts_allowance", header: "พตส.(ถ้าไม่มีให้เติม 0)", isNum: true },
  { key: "psr_allowance", header: "พสร.(ถ้าไม่มีให้เติม 0)", isNum: true },
  { key: "house_rent", header: "ค่าเช่าบ้าน(ถ้าไม่มีให้เติม 0)", isNum: true },
  { key: "child_tuition", header: "ค่าเล่าเรียนบุตร(ถ้าไม่มีให้เติม 0)", isNum: true },
  { key: "gpf_member", header: "เป็นสมาชิก กบข.หรือไม่" },
  { key: "gpf_amount", header: "กบข(ถ้าไม่มีให้เติม 0)", isNum: true },
  { key: "ch11_allowance", header: "ฉ.11", isNum: true },
  { key: "total_income", header: "รวมรายรับ", isNum: true },
  { key: "coop_member", header: "เป็นสมาชิกสหกรณ์ออมทรัพย์" },
  { key: "first_appoint_date", header: "วันเดือนปีที่บรรจุรับราชการครั้งแรก" },
  { key: "first_position", header: "ตำแหน่งที่บรรจุรับราชการครั้งแรก" },
  { key: "first_level", header: "ระดับที่บรรจุรับราชการครั้งแรก" }
];

for (let i = 1; i <= 14; i++) {
  DATA70_EXPORT_COLUMNS.push(
    { key: `change_date_${i}`, header: `วันเดือนปีที่เปลี่ยนตำแหน่งและระดับครั้งที่${i} (หากยังไม่เคยปรับให้ว่างไว้)` },
    { key: `change_pos_${i}`, header: `ตำแหน่งที่เปลี่ยนครั้งที่${i}` },
    { key: `change_level_${i}`, header: `ระดับที่เปลี่ยนครั้งที่${i}` }
  );
}
DATA70_EXPORT_COLUMNS.push(
  { key: "phone", header: "หมายเลขโทรศัพท์", isText: true },
  { key: "email", header: "อีเมล" }
);

let data70Initialized = false;
let data70VisibleChangeSteps = 7;
let adminData70List = [];
let parsedImportData70Rows = [];
let d70DupCheckTimer = null;
let d70CurrentDuplicateState = {
  duplicate_name: null,
  duplicate_pos_no: null
};

function normalizeFullnameSpaces(str) {
  return String(str || '').trim().replace(/\s+/g, ' ');
}

// แยกตำแหน่งและระดับจากข้อความรวมใน tbmain.nposit เช่น "นักสาธารณสุขชำนาญการ" หรือ "พยาบาลวิชาชีพปฏิบัติการ" -> { pos: "พยาบาลวิชาชีพ", lvl: "ปฎิบัติการ" }
function splitPositionAndLevel(rawPosit) {
  const s = String(rawPosit || '').trim();
  if (!s) return { pos: '', lvl: '' };
  const sNorm = s.replace(/ฏิ/g, 'ฎิ');
  const sortedLevels = [...DATA70_LEVELS].sort((a, b) => b.length - a.length);
  for (const lvl of sortedLevels) {
    const lvlNorm = lvl.replace(/ฏิ/g, 'ฎิ');
    if (lvlNorm.length >= 2 && sNorm.endsWith(lvlNorm)) {
      const pos = s.slice(0, s.length - lvlNorm.length).trim();
      return { pos: pos || s, lvl };
    }
  }
  return { pos: s, lvl: '' };
}

// จับคู่ รพ.สต. จากข้อมูล person (hosp1, tam1, amp1) กับ Master 133 แห่ง
function findMatchingHospital(rawHosp, rawTam, rawAmp) {
  const h = String(rawHosp || '').replace(/\s+/g, ' ').trim();
  const t = String(rawTam || '').replace(/^(ต\.|ตำบล)/, '').trim();
  const a = String(rawAmp || '').replace(/^(อ\.|อำเภอ)/, '').trim();
  if (!h) return null;

  // 1. Exact or full hname match
  const exact = DATA70_HOSPITALS.find(item => item.hname.replace(/\s+/g, ' ') === h);
  if (exact) return exact;

  // 2. Match by short_name + tam/amp
  const byShortAndTam = DATA70_HOSPITALS.find(item => {
    const sh = item.short_name.replace(/^รพ\.สต\./, '').trim();
    return h.includes(sh) && (!t || item.tam.includes(t)) && (!a || item.amp.includes(a));
  });
  if (byShortAndTam) return byShortAndTam;

  // 3. Match by short_name
  return DATA70_HOSPITALS.find(item => {
    const sh = item.short_name.replace(/^รพ\.สต\./, '').trim();
    return sh && h.includes(sh);
  }) || null;
}

function populateSelectOptions(selectEl, items, placeholder) {
  if (!selectEl) return;
  let html = placeholder ? `<option value="">${placeholder}</option>` : '';
  for (const it of items) {
    html += `<option value="${it}">${it}</option>`;
  }
  selectEl.innerHTML = html;
}

function initData70UI() {
  if (data70Initialized) return;
  data70Initialized = true;

  // เติมรายชื่อ รพ.สต. 133 แห่ง
  renderHospitalSelectOptions('');

  // เติมตัวเลือกกรอง รพ.สต. ในหน้า Admin
  const admHospFilter = document.getElementById('admD70FilterHosp');
  if (admHospFilter) {
    let html = '<option value="">-- ทุก รพ.สต. (ทั้งหมด 133 แห่ง) --</option>';
    for (const h of DATA70_HOSPITALS) {
      html += `<option value="${h.hname}">[${h.sml_seq}] ${h.hname} (${h.sml_size})</option>`;
    }
    admHospFilter.innerHTML = html;
  }

  // เติม Dropdown ตำแหน่ง ระดับ กลุ่มงาน วุฒิ สหกรณ์
  populateSelectOptions(document.getElementById('d70_current_position'), DATA70_POSITIONS, '-- เลือกตำแหน่งปัจจุบัน --');
  populateSelectOptions(document.getElementById('d70_current_level'), DATA70_LEVELS, '-- เลือกระดับปัจจุบัน --');
  populateSelectOptions(document.getElementById('d70_work_group'), DATA70_WORK_GROUPS, '-- เลือกกลุ่มงาน --');
  populateSelectOptions(document.getElementById('d70_edu_degree'), DATA70_EDU_DEGREES, '-- เลือกวุฒิการศึกษา --');
  populateSelectOptions(document.getElementById('d70_edu_major'), DATA70_EDU_MAJORS, '-- เลือกชื่อวุฒิการศึกษา --');
  populateSelectOptions(document.getElementById('d70_coop_member'), DATA70_COOPS, '-- เลือกสหกรณ์ออมทรัพย์ --');
  populateSelectOptions(document.getElementById('d70_first_position'), DATA70_POSITIONS, '-- เลือกตำแหน่งบรรจุครั้งแรก --');
  populateSelectOptions(document.getElementById('d70_first_level'), DATA70_LEVELS, '-- เลือกระดับบรรจุครั้งแรก --');

  // สร้างการ์ดประวัติการเปลี่ยนตำแหน่ง/ระดับ ครั้งที่ 1 - 14 ในแท็บ 4
  const container = document.getElementById('d70HistoryContainer');
  if (container) {
    let cardsHtml = '';
    const posOpts = DATA70_POSITIONS.map(p => `<option value="${p}">${p}</option>`).join('');
    const lvlOpts = DATA70_LEVELS.map(l => `<option value="${l}">${l}</option>`).join('');

    for (let i = 1; i <= 14; i++) {
      cardsHtml += `
        <div id="d70HistCard_${i}" style="border:1px solid #cbd5e1; border-radius:6px; background:#f8fafc; padding:10px; margin-bottom:8px; display:${i <= 7 ? 'block' : 'none'};">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:4px;">
            <strong style="color:#1e3a8a; font-size:13px;">📌 ครั้งที่ ${i}: ประวัติการเปลี่ยนตำแหน่งและระดับ</strong>
            <button type="button" onclick="setD70StepUnchanged(${i})" style="background:#e2e8f0; color:#334155; border:1px solid #cbd5e1; padding:2px 8px; border-radius:4px; font-size:11.5px; cursor:pointer; font-weight:bold;">
              🔄 ตั้งเป็น "ยังไม่ได้ปรับเปลี่ยนตำแหน่ง / ระดับ"
            </button>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(185px, 1fr)); gap:8px;">
            <div>
              <label style="font-size:12px; font-weight:bold; color:#334155; display:block; margin-bottom:2px;">วันเดือนปีที่เปลี่ยนครั้งที่ ${i} (พ.ศ. YYYY-MM-DD):</label>
              <input type="text" id="d70_change_date_${i}" placeholder="เช่น 2551-12-11 (เว้นว่างถ้ายังไม่ปรับ)" style="width:100%; padding:6px; font-size:13px; border:1px solid #94a3b8; border-radius:4px; box-sizing:border-box;">
            </div>
            <div>
              <label style="font-size:12px; font-weight:bold; color:#334155; display:block; margin-bottom:2px;">ตำแหน่งที่เปลี่ยนครั้งที่ ${i}:</label>
              <select id="d70_change_pos_${i}" style="width:100%; padding:6px; font-size:13px; border:1px solid #94a3b8; border-radius:4px; box-sizing:border-box;">
                ${posOpts}
              </select>
            </div>
            <div>
              <label style="font-size:12px; font-weight:bold; color:#334155; display:block; margin-bottom:2px;">ระดับที่เปลี่ยนครั้งที่ ${i}:</label>
              <select id="d70_change_level_${i}" style="width:100%; padding:6px; font-size:13px; border:1px solid #94a3b8; border-radius:4px; box-sizing:border-box;">
                ${lvlOpts}
              </select>
            </div>
          </div>
        </div>
      `;
    }
    container.innerHTML = cardsHtml;
  }
}

function renderHospitalSelectOptions(filterKeyword, selectedHname) {
  const sel = document.getElementById('d70_hname');
  if (!sel) return;
  const curVal = selectedHname !== undefined ? selectedHname : sel.value;
  const kw = String(filterKeyword || '').trim().toLowerCase();

  let html = '<option value="">-- เลือก รพ.สต. (ทั้งหมด 133 แห่ง) --</option>';
  for (const h of DATA70_HOSPITALS) {
    const label = `[ลำดับ ${h.sml_seq}] ${h.hname} (ขนาด ${h.sml_size})`;
    if (!kw || label.toLowerCase().includes(kw) || h.hname === curVal) {
      html += `<option value="${h.hname}">${label}</option>`;
    }
  }
  // กรณีค่าเดิมไม่อยู่ใน 133 แห่ง ให้เพิ่มตัวเลือกไว้ด้วย
  if (curVal && !DATA70_HOSPITALS.some(h => h.hname === curVal)) {
    html += `<option value="${curVal}">${curVal}</option>`;
  }
  sel.innerHTML = html;
  if (curVal) sel.value = curVal;
}

function filterD70Hospitals(keyword) {
  renderHospitalSelectOptions(keyword);
  const sel = document.getElementById('d70_hname');
  const kw = String(keyword || '').trim().toLowerCase();
  if (kw && sel && sel.options.length === 2) {
    sel.selectedIndex = 1;
    onD70HospitalChange();
  }
}

function onD70HospitalChange() {
  const sel = document.getElementById('d70_hname');
  if (!sel) return;
  const val = sel.value;
  const found = DATA70_HOSPITALS.find(h => h.hname === val);
  const smlSeqEl = document.getElementById('d70_sml_seq');
  const smlSizeEl = document.getElementById('d70_sml_size');
  if (found) {
    if (smlSeqEl) smlSeqEl.value = found.sml_seq;
    if (smlSizeEl) smlSizeEl.value = found.sml_size;
  }
}

function switchData70Tab(tabNum) {
  for (let t = 1; t <= 4; t++) {
    const panel = document.getElementById(`d70TabPanel${t}`);
    const btn = document.getElementById(`d70TabBtn${t}`);
    if (panel) panel.style.display = t === tabNum ? 'block' : 'none';
    if (btn) {
      if (t === tabNum) {
        btn.style.background = '#1e40af';
        btn.style.color = '#ffffff';
        btn.style.borderColor = '#1e40af';
      } else {
        btn.style.background = '#f1f5f9';
        btn.style.color = '#334155';
        btn.style.borderColor = '#cbd5e1';
      }
    }
  }
}

function updateD70VisibleSteps(count) {
  data70VisibleChangeSteps = Math.max(1, Math.min(14, count));
  for (let i = 1; i <= 14; i++) {
    const card = document.getElementById(`d70HistCard_${i}`);
    if (card) card.style.display = i <= data70VisibleChangeSteps ? 'block' : 'none';
  }
  const btnMore = document.getElementById('btnD70ShowMoreSteps');
  const statusTxt = document.getElementById('d70StepCountInfo');
  if (statusTxt) statusTxt.textContent = `กำลังแสดงครั้งที่ 1 ถึง ${data70VisibleChangeSteps} (จากทั้งหมด 14 ครั้ง)`;
  if (btnMore) {
    btnMore.style.display = data70VisibleChangeSteps >= 14 ? 'none' : 'inline-block';
  }
}

function showMoreD70Steps() {
  updateD70VisibleSteps(data70VisibleChangeSteps + 2);
}

function showAllD70Steps() {
  updateD70VisibleSteps(14);
}

function setD70StepUnchanged(stepIdx) {
  const dEl = document.getElementById(`d70_change_date_${stepIdx}`);
  const pEl = document.getElementById(`d70_change_pos_${stepIdx}`);
  const lEl = document.getElementById(`d70_change_level_${stepIdx}`);
  if (dEl) dEl.value = '';
  if (pEl) pEl.value = 'ยังไม่ได้ปรับเปลี่ยนตำแหน่ง';
  if (lEl) lEl.value = 'ยังไม่ได้ปรับระดับ';
}

function fillRemainingD70Unchanged() {
  for (let i = 1; i <= 14; i++) {
    const dEl = document.getElementById(`d70_change_date_${i}`);
    const pEl = document.getElementById(`d70_change_pos_${i}`);
    const lEl = document.getElementById(`d70_change_level_${i}`);
    if (dEl && !dEl.value.trim()) {
      if (pEl) pEl.value = 'ยังไม่ได้ปรับเปลี่ยนตำแหน่ง';
      if (lEl) lEl.value = 'ยังไม่ได้ปรับระดับ';
    }
  }
}

// คำนวณรวมรายรับแบบ Real-time (เงินเดือน + ค่าตอบแทน + ประจำตำแหน่ง + พ.ต.ส. + พ.ส.ร. + ค่าเช่าบ้าน + ค่าเล่าเรียนบุตร + กบข. + ฉ.11)
function calcD70TotalIncome() {
  const numVal = (id) => {
    const el = document.getElementById(id);
    if (!el) return 0;
    const n = Number(String(el.value || '0').replace(/,/g, '').trim());
    return Number.isFinite(n) ? n : 0;
  };
  const total =
    numVal('d70_salary') +
    numVal('d70_allowance') +
    numVal('d70_position_allowance') +
    numVal('d70_pts_allowance') +
    numVal('d70_psr_allowance') +
    numVal('d70_house_rent') +
    numVal('d70_child_tuition') +
    numVal('d70_gpf_amount') +
    numVal('d70_ch11_allowance');

  const totalEl = document.getElementById('d70_total_income');
  if (totalEl) {
    totalEl.value = Number.isInteger(total) ? String(total) : total.toFixed(2);
  }
}

function setSelectOrAddOption(selectId, value) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const v = String(value || '').trim();
  if (!v) {
    sel.value = '';
    return;
  }
  const exists = Array.from(sel.options).some(opt => opt.value === v);
  if (!exists) {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    sel.appendChild(opt);
  }
  sel.value = v;
}

function fmtNumInput(val) {
  const n = Number(String(val ?? 0).replace(/,/g, ''));
  if (!Number.isFinite(n)) return '0';
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}

// ============================================================================
// ระบบตรวจสอบ "ชื่อ-สกุล" และ "เลขตำแหน่งปัจจุบัน" ไม่ให้ซ้ำกับคนอื่น (Real-time & onBlur)
// ============================================================================
function renderD70DuplicateState(dupName, dupPosNo) {
  d70CurrentDuplicateState.duplicate_name = dupName || null;
  d70CurrentDuplicateState.duplicate_pos_no = dupPosNo || null;

  const nameInput = document.getElementById('d70_fullname');
  const nameMsg = document.getElementById('d70FullnameDupMsg');
  if (nameInput && nameMsg) {
    if (dupName) {
      nameInput.style.borderColor = '#dc2626';
      nameInput.style.background = '#fef2f2';
      nameMsg.style.display = 'block';
      nameMsg.textContent = `⚠️ พบชื่อ-สกุลนี้ในระบบแล้ว (เลข 13 หลัก: ${dupName.cid} | สังกัด: ${dupName.hname || '-'})`;
    } else {
      nameInput.style.borderColor = '#94a3b8';
      nameInput.style.background = '#ffffff';
      nameMsg.style.display = 'none';
      nameMsg.textContent = '';
    }
  }

  const posInput = document.getElementById('d70_position_no');
  const posMsg = document.getElementById('d70PositionNoDupMsg');
  if (posInput && posMsg) {
    if (dupPosNo) {
      posInput.style.borderColor = '#dc2626';
      posInput.style.background = '#fef2f2';
      posMsg.style.display = 'block';
      posMsg.textContent = `⚠️ เลขตำแหน่งนี้ซ้ำกับ ${dupPosNo.fullname || '-'} (${dupPosNo.hname || 'เลข 13 หลัก: ' + dupPosNo.cid})`;
    } else {
      posInput.style.borderColor = '#94a3b8';
      posInput.style.background = '#ffffff';
      posMsg.style.display = 'none';
      posMsg.textContent = '';
    }
  }
}

function scheduleD70DuplicateCheck(fieldType) {
  if (d70DupCheckTimer) clearTimeout(d70DupCheckTimer);
  d70DupCheckTimer = setTimeout(() => {
    triggerD70DuplicateCheck(fieldType);
  }, 350);
}

async function triggerD70DuplicateCheck(fieldType) {
  const cidEl = document.getElementById('d70_cid');
  const nameEl = document.getElementById('d70_fullname');
  const posEl = document.getElementById('d70_position_no');
  if (!cidEl || !nameEl || !posEl) return { duplicate_name: null, duplicate_pos_no: null };

  if (fieldType === 'fullname') {
    // ตัดช่องว่างซ้ำตรงกลางออกเมื่อ onBlur
    const cleaned = normalizeFullnameSpaces(nameEl.value);
    if (document.activeElement !== nameEl && nameEl.value !== cleaned) {
      nameEl.value = cleaned;
    }
  }

  const cid = cidEl.value.replace(/[^0-9]/g, '').trim();
  const fullname = normalizeFullnameSpaces(nameEl.value);
  const position_no = normalizeFullnameSpaces(posEl.value);

  if (!fullname && (!position_no || position_no === '-')) {
    renderD70DuplicateState(null, null);
    return { duplicate_name: null, duplicate_pos_no: null };
  }

  try {
    const res = await apiPost({
      action: 'check_data70_duplicate',
      cid,
      fullname,
      position_no
    });
    if (res && res.success) {
      renderD70DuplicateState(res.duplicate_name, res.duplicate_pos_no);
      return {
        duplicate_name: res.duplicate_name || null,
        duplicate_pos_no: res.duplicate_pos_no || null
      };
    }
  } catch (e) {}
  return d70CurrentDuplicateState;
}

// เปิดหน้าต่าง Modal บันทึกและแก้ไขข้อมูลส่วนบุคคล (data70)
async function openData70Modal(targetCid, isNewFromAdmin) {
  initData70UI();
  const modal = document.getElementById('data70Modal');
  if (!modal) return;

  const cid = String(targetCid || (typeof currentMember !== 'undefined' && currentMember ? currentMember.idno : '') || '').replace(/[^0-9]/g, '').trim();
  const cidInput = document.getElementById('d70_cid');
  if (cidInput) {
    cidInput.value = cid;
    cidInput.readOnly = !isNewFromAdmin && cid.length === 13;
    cidInput.style.background = cidInput.readOnly ? '#e2e8f0' : '#ffffff';
  }

  const searchHospInput = document.getElementById('d70SearchHosp');
  if (searchHospInput) searchHospInput.value = '';
  renderHospitalSelectOptions('');

  modal.style.display = 'flex';
  switchData70Tab(1);

  const badgeEl = document.getElementById('d70StatusBadge');
  if (badgeEl) {
    badgeEl.textContent = '⏳ กำลังโหลดข้อมูล...';
    badgeEl.style.background = '#fef9c3';
    badgeEl.style.color = '#854d0e';
  }

  if (cid.length !== 13) {
    resetData70FormFields('');
    if (badgeEl) {
      badgeEl.textContent = '🆕 เพิ่มข้อมูลบุคลากรใหม่ (กรุณากรอกเลข 13 หลัก)';
      badgeEl.style.background = '#dbeafe';
      badgeEl.style.color = '#1e40af';
    }
    return;
  }

  try {
    const res = await apiPost({ action: 'get_data70', cid });
    if (res && res.success && res.exists && res.record) {
      populateData70Form(res.record);
      if (badgeEl) {
        badgeEl.textContent = `✅ โหลดข้อมูลจากตาราง personnel_data70 สำเร็จ (ลำดับที่ ${res.record.seq_no || '-'})`;
        badgeEl.style.background = '#dcfce7';
        badgeEl.style.color = '#166534';
      }
    } else {
      // ยังไม่มีใน personnel_data70 -> ดึงจาก tbmain / person / tbdetail มาเติมให้อัตโนมัติ
      const fbMem = (res && res.fallback_member) || (typeof currentMember !== 'undefined' ? currentMember : {}) || {};
      const fbSlip = (res && res.fallback_slip) || {};
      const splitPos = splitPositionAndLevel(fbMem.nposit || '');
      const matchedHosp = findMatchingHospital(fbMem.hosp1, fbMem.tam1, fbMem.amp1);

      const autoRec = {
        seq_no: 0,
        sml_seq: matchedHosp ? matchedHosp.sml_seq : 0,
        hname: matchedHosp ? matchedHosp.hname : '',
        sml_size: matchedHosp ? matchedHosp.sml_size : '',
        cid: cid,
        bank_account: fbMem.nobank || '',
        fullname: fbMem.nname || '',
        birth_date: '',
        transfer_date: '2565-10-02',
        current_position: splitPos.pos || '',
        current_level: splitPos.lvl || '',
        work_group: '',
        position_no: '',
        edu_degree: 'ปริญญาตรี',
        edu_major: '',
        salary: fbSlip.money1 || 0,
        allowance: fbSlip.money2 || 0,
        position_allowance: fbSlip.money3 || 0,
        pts_allowance: fbSlip.money5 || 0,
        psr_allowance: fbSlip.money8 || 0,
        house_rent: fbSlip.money10 || 0,
        child_tuition: fbSlip.money12 || 0,
        gpf_member: Number(fbSlip.exp6 || 0) > 0 ? 'มี' : 'ไม่มี',
        gpf_amount: fbSlip.exp6 || 0,
        ch11_allowance: 0,
        coop_member: 'สหกรณ์ สสจ.ศรีสะเกษ',
        first_appoint_date: '',
        first_position: splitPos.pos || '',
        first_level: '',
        phone: (fbMem.mbphone && fbMem.mbphone !== '0') ? fbMem.mbphone : '',
        email: fbMem.email || ''
      };
      for (let i = 1; i <= 14; i++) {
        autoRec[`change_date_${i}`] = '';
        autoRec[`change_pos_${i}`] = 'ยังไม่ได้ปรับเปลี่ยนตำแหน่ง';
        autoRec[`change_level_${i}`] = 'ยังไม่ได้ปรับระดับ';
      }
      populateData70Form(autoRec);
      if (badgeEl) {
        badgeEl.textContent = 'ℹ️ ดึงข้อมูลเบื้องต้นจากตาราง tbmain อัตโนมัติ (กรุณาตรวจสอบและกดบันทึก)';
        badgeEl.style.background = '#e0f2fe';
        badgeEl.style.color = '#0369a1';
      }
    }
  } catch (err) {
    alert('เกิดข้อผิดพลาดในการดึงข้อมูลส่วนบุคคล: ' + err.message);
  }
}

function resetData70FormFields(cid) {
  const emptyRec = {
    seq_no: 0,
    sml_seq: '',
    hname: '',
    sml_size: '',
    cid: cid || '',
    bank_account: '',
    fullname: '',
    birth_date: '',
    transfer_date: '2565-10-02',
    current_position: '',
    current_level: '',
    work_group: '',
    position_no: '',
    edu_degree: 'ปริญญาตรี',
    edu_major: '',
    salary: 0,
    allowance: 0,
    position_allowance: 0,
    pts_allowance: 0,
    psr_allowance: 0,
    house_rent: 0,
    child_tuition: 0,
    gpf_member: 'มี',
    gpf_amount: 0,
    ch11_allowance: 0,
    coop_member: 'สหกรณ์ สสจ.ศรีสะเกษ',
    first_appoint_date: '',
    first_position: '',
    first_level: '',
    phone: '',
    email: ''
  };
  for (let i = 1; i <= 14; i++) {
    emptyRec[`change_date_${i}`] = '';
    emptyRec[`change_pos_${i}`] = 'ยังไม่ได้ปรับเปลี่ยนตำแหน่ง';
    emptyRec[`change_level_${i}`] = 'ยังไม่ได้ปรับระดับ';
  }
  populateData70Form(emptyRec);
}

function populateData70Form(r) {
  renderD70DuplicateState(null, null);
  document.getElementById('d70_seq_no').value = r.seq_no || 0;
  document.getElementById('d70_cid').value = r.cid || '';
  document.getElementById('d70_fullname').value = normalizeFullnameSpaces(r.fullname || '');
  document.getElementById('d70_birth_date').value = r.birth_date || '';
  document.getElementById('d70_phone').value = r.phone || '';
  document.getElementById('d70_email').value = r.email || '';
  document.getElementById('d70_transfer_date').value = r.transfer_date || '';
  document.getElementById('d70_position_no').value = r.position_no || '';

  renderHospitalSelectOptions('', r.hname || '');
  setSelectOrAddOption('d70_hname', r.hname || '');
  document.getElementById('d70_sml_seq').value = r.sml_seq || '';
  document.getElementById('d70_sml_size').value = (r.sml_size || '').toUpperCase();
  if (r.hname && (!r.sml_seq || !r.sml_size)) {
    onD70HospitalChange();
  }

  let curPos = String(r.current_position || '').trim();
  let curLvl = String(r.current_level || '').trim();
  if (curPos) {
    const sp = splitPositionAndLevel(curPos);
    if (sp.lvl && (!curLvl || curPos.replace(/ฏิ/g, 'ฎิ').endsWith(sp.lvl.replace(/ฏิ/g, 'ฎิ')))) {
      curPos = sp.pos;
      if (!curLvl) curLvl = sp.lvl;
    }
  }
  if (curLvl) {
    curLvl = curLvl.replace(/ปฏิบัติ/g, 'ปฎิบัติ');
  }

  setSelectOrAddOption('d70_current_position', curPos);
  setSelectOrAddOption('d70_current_level', curLvl);
  setSelectOrAddOption('d70_work_group', r.work_group || '');
  setSelectOrAddOption('d70_edu_degree', r.edu_degree || '');
  setSelectOrAddOption('d70_edu_major', r.edu_major || '');

  document.getElementById('d70_bank_account').value = r.bank_account || '';
  document.getElementById('d70_salary').value = fmtNumInput(r.salary);
  document.getElementById('d70_allowance').value = fmtNumInput(r.allowance);
  document.getElementById('d70_position_allowance').value = fmtNumInput(r.position_allowance);
  document.getElementById('d70_pts_allowance').value = fmtNumInput(r.pts_allowance);
  document.getElementById('d70_psr_allowance').value = fmtNumInput(r.psr_allowance);
  document.getElementById('d70_house_rent').value = fmtNumInput(r.house_rent);
  document.getElementById('d70_child_tuition').value = fmtNumInput(r.child_tuition);
  document.getElementById('d70_gpf_member').value = r.gpf_member === 'ไม่มี' ? 'ไม่มี' : 'มี';
  document.getElementById('d70_gpf_amount').value = fmtNumInput(r.gpf_amount);
  document.getElementById('d70_ch11_allowance').value = fmtNumInput(r.ch11_allowance);
  setSelectOrAddOption('d70_coop_member', r.coop_member || 'ไม่ได้เป็นสมาชิกสหกรณ์');
  calcD70TotalIncome();

  document.getElementById('d70_first_appoint_date').value = r.first_appoint_date || '';
  setSelectOrAddOption('d70_first_position', r.first_position || '');
  setSelectOrAddOption('d70_first_level', r.first_level || '');

  let highestActiveStep = 7;
  for (let i = 1; i <= 14; i++) {
    const cDate = r[`change_date_${i}`] || '';
    const cPos = r[`change_pos_${i}`] || 'ยังไม่ได้ปรับเปลี่ยนตำแหน่ง';
    const cLvl = r[`change_level_${i}`] || 'ยังไม่ได้ปรับระดับ';

    const dEl = document.getElementById(`d70_change_date_${i}`);
    if (dEl) dEl.value = cDate;
    setSelectOrAddOption(`d70_change_pos_${i}`, cPos);
    setSelectOrAddOption(`d70_change_level_${i}`, cLvl);

    if (cDate || (cPos && cPos !== 'ยังไม่ได้ปรับเปลี่ยนตำแหน่ง')) {
      highestActiveStep = Math.max(highestActiveStep, i);
    }
  }
  updateD70VisibleSteps(Math.min(14, Math.max(7, highestActiveStep + 1)));
}

function closeData70Modal() {
  const modal = document.getElementById('data70Modal');
  if (modal) modal.style.display = 'none';
}

function collectData70FormRecord() {
  calcD70TotalIncome();
  const normName = normalizeFullnameSpaces(document.getElementById('d70_fullname').value);
  document.getElementById('d70_fullname').value = normName;
  const normPosNo = normalizeFullnameSpaces(document.getElementById('d70_position_no').value);
  document.getElementById('d70_position_no').value = normPosNo;

  const rec = {
    seq_no: Number(document.getElementById('d70_seq_no').value || 0),
    sml_seq: Number(document.getElementById('d70_sml_seq').value || 0),
    hname: document.getElementById('d70_hname').value.trim(),
    sml_size: document.getElementById('d70_sml_size').value.trim().toUpperCase(),
    cid: document.getElementById('d70_cid').value.replace(/[^0-9]/g, '').trim(),
    bank_account: document.getElementById('d70_bank_account').value.trim(),
    fullname: normName,
    birth_date: document.getElementById('d70_birth_date').value.trim(),
    transfer_date: document.getElementById('d70_transfer_date').value.trim(),
    current_position: document.getElementById('d70_current_position').value.trim(),
    current_level: document.getElementById('d70_current_level').value.trim(),
    work_group: document.getElementById('d70_work_group') ? document.getElementById('d70_work_group').value.trim() : '',
    position_no: normPosNo,
    edu_degree: document.getElementById('d70_edu_degree').value.trim(),
    edu_major: document.getElementById('d70_edu_major').value.trim(),
    salary: Number(document.getElementById('d70_salary').value || 0),
    allowance: Number(document.getElementById('d70_allowance').value || 0),
    position_allowance: Number(document.getElementById('d70_position_allowance').value || 0),
    pts_allowance: Number(document.getElementById('d70_pts_allowance').value || 0),
    psr_allowance: Number(document.getElementById('d70_psr_allowance').value || 0),
    house_rent: Number(document.getElementById('d70_house_rent').value || 0),
    child_tuition: Number(document.getElementById('d70_child_tuition').value || 0),
    gpf_member: document.getElementById('d70_gpf_member').value.trim(),
    gpf_amount: Number(document.getElementById('d70_gpf_amount').value || 0),
    ch11_allowance: Number(document.getElementById('d70_ch11_allowance').value || 0),
    total_income: Number(document.getElementById('d70_total_income').value || 0),
    coop_member: document.getElementById('d70_coop_member').value.trim(),
    first_appoint_date: document.getElementById('d70_first_appoint_date').value.trim(),
    first_position: document.getElementById('d70_first_position').value.trim(),
    first_level: document.getElementById('d70_first_level').value.trim(),
    phone: document.getElementById('d70_phone').value.trim(),
    email: document.getElementById('d70_email').value.trim()
  };

  for (let i = 1; i <= 14; i++) {
    const dEl = document.getElementById(`d70_change_date_${i}`);
    const pEl = document.getElementById(`d70_change_pos_${i}`);
    const lEl = document.getElementById(`d70_change_level_${i}`);
    rec[`change_date_${i}`] = dEl ? dEl.value.trim() : '';
    rec[`change_pos_${i}`] = (pEl && pEl.value.trim()) ? pEl.value.trim() : 'ยังไม่ได้ปรับเปลี่ยนตำแหน่ง';
    rec[`change_level_${i}`] = (lEl && lEl.value.trim()) ? lEl.value.trim() : 'ยังไม่ได้ปรับระดับ';
  }
  return rec;
}

async function saveData70Form(e) {
  if (e) e.preventDefault();
  const rec = collectData70FormRecord();

  if (rec.cid.length !== 13) {
    alert('กรุณาตรวจสอบเลขประจำตัวประชาชนให้ครบ 13 หลัก');
    switchData70Tab(1);
    return;
  }
  if (!rec.fullname) {
    alert('กรุณากรอกชื่อ-สกุล');
    switchData70Tab(1);
    return;
  }

  const btn = document.getElementById('btnSaveData70');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ กำลังตรวจสอบข้อมูลซ้ำและบันทึก...';
  }

  try {
    // ตรวจสอบ ชื่อ-สกุล และ เลขตำแหน่งปัจจุบัน ซ้ำกับคนอื่นก่อนบันทึก
    const dupRes = await triggerD70DuplicateCheck('both');
    if (dupRes && (dupRes.duplicate_name || dupRes.duplicate_pos_no)) {
      switchData70Tab(1);
      const msgs = [];
      if (dupRes.duplicate_name) {
        msgs.push(`⚠️ พบชื่อ-สกุล "${rec.fullname}" ในระบบแล้ว (เลข 13 หลัก: ${dupRes.duplicate_name.cid} | สังกัด: ${dupRes.duplicate_name.hname || '-'})`);
      }
      if (dupRes.duplicate_pos_no) {
        msgs.push(`⚠️ เลขตำแหน่งปัจจุบัน "${rec.position_no}" ซ้ำกับ ${dupRes.duplicate_pos_no.fullname || '-'} (${dupRes.duplicate_pos_no.hname || dupRes.duplicate_pos_no.cid})`);
      }
      alert('ไม่สามารถบันทึกข้อมูลได้ เนื่องจากพบข้อมูลซ้ำกับบุคลากรอื่น:\n\n' + msgs.join('\n') + '\n\nกรุณาตรวจสอบและแก้ไขก่อนกดบันทึก');
      return;
    }

    const res = await apiPost({
      action: 'save_data70',
      record: rec
    });
    if (!res || !res.success) {
      if (res && (res.duplicate_name || res.duplicate_pos_no)) {
        renderD70DuplicateState(res.duplicate_name, res.duplicate_pos_no);
        switchData70Tab(1);
      }
      alert((res && res.message) || 'ไม่สามารถบันทึกข้อมูลได้');
      return;
    }

    // อัปเดต currentMember ในหน้าเว็บทันทีหากเป็นเลข 13 หลักเดียวกับที่ล็อกอินอยู่ (ไม่ต้อง Logout แล้ว Login ใหม่)
    if (typeof currentMember !== 'undefined' && currentMember && String(currentMember.idno).trim() === rec.cid) {
      const sm = res.synced_member || {};
      const combinedPos = sm.nposit || (rec.current_position
        ? (rec.current_level && rec.current_level !== 'ยังไม่ได้เลื่อนระดับ' && rec.current_level !== 'ยังไม่ได้ปรับระดับ'
            ? `${rec.current_position} ${rec.current_level}`.trim()
            : rec.current_position)
        : currentMember.nposit);

      if (rec.fullname) currentMember.nname = sm.nname || rec.fullname;
      if (combinedPos) currentMember.nposit = combinedPos;
      if (rec.hname) {
        currentMember.d70_hname = rec.hname;
        currentMember.hname = rec.hname;
      }
      if (rec.bank_account) currentMember.nobank = rec.bank_account;
      if (rec.phone) currentMember.mbphone = rec.phone.replace(/[^0-9]/g, '');
      if (rec.email) currentMember.email = rec.email;
      if (rec.work_group !== undefined) currentMember.work_group = rec.work_group;
      if (rec.position_no !== undefined) currentMember.position_no = rec.position_no;
      if (typeof populateMemberHeader === 'function') populateMemberHeader();
    }

    const badgeEl = document.getElementById('d70StatusBadge');
    if (badgeEl) {
      badgeEl.textContent = `✅ บันทึกข้อมูลสำเร็จ (ลำดับที่ ${res.seq_no || rec.seq_no || '-'})`;
      badgeEl.style.background = '#dcfce7';
      badgeEl.style.color = '#166534';
    }

    alert('✅ ' + res.message);

    // หากหน้าต่าง Admin เปิดอยู่ ให้รีเฟรชตารางทันที
    const admModal = document.getElementById('adminData70Modal');
    if (admModal && admModal.style.display === 'flex') {
      loadAdminData70List();
    }
  } catch (err) {
    alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '💾 บันทึกข้อมูลส่วนบุคคล (data70)';
    }
  }
}

// ============================================================================
// ส่วนที่ 3: หน้าต่างสำหรับ Admin "🗂️ จัดการฐานข้อมูลบุคลากร (data70)"
// ============================================================================
async function openAdminData70Modal() {
  initData70UI();
  const modal = document.getElementById('adminData70Modal');
  if (!modal) return;
  modal.style.display = 'flex';
  await loadAdminData70List();
}

function closeAdminData70Modal() {
  const modal = document.getElementById('adminData70Modal');
  if (modal) modal.style.display = 'none';
}

async function loadAdminData70List() {
  const hname = document.getElementById('admD70FilterHosp') ? document.getElementById('admD70FilterHosp').value : '';
  const work_group = document.getElementById('admD70FilterWorkGroup') ? document.getElementById('admD70FilterWorkGroup').value : '';
  const search = document.getElementById('admD70SearchInput') ? document.getElementById('admD70SearchInput').value.trim() : '';
  const tbody = document.getElementById('admD70TableBody');
  const sumEl = document.getElementById('admD70SummaryText');

  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="11" align="center" style="padding:16px; color:#64748b;">⏳ กำลังโหลดข้อมูลบุคลากร (data70)...</td></tr>';
  }

  try {
    const res = await apiPost({
      action: 'list_data70',
      hname,
      work_group,
      search
    });
    if (!res || !res.success) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="11" align="center" style="color:#dc2626; padding:14px;">${(res && res.message) || 'โหลดข้อมูลไม่สำเร็จ'}</td></tr>`;
      return;
    }

    adminData70List = res.rows || [];
    if (sumEl) {
      sumEl.innerHTML = `📊 ข้อมูลในตาราง <code>personnel_data70</code> ทั้งหมด: <b style="color:#1e40af;">${res.total_data70 || 0}</b> คน (แสดงตามตัวกรอง <b style="color:#166534;">${adminData70List.length}</b> คน | สมาชิกใน <code>tbmain</code> ทั้งหมด ${res.total_tbmain || 751} คน)`;
    }

    if (!tbody) return;
    if (adminData70List.length === 0) {
      tbody.innerHTML = '<tr><td colspan="11" align="center" style="padding:16px; color:#64748b;">ไม่พบข้อมูลตามเงื่อนไขที่ค้นหา (สามารถกดปุ่ม "➕ เพิ่ม/แก้ไขบุคลากรจากเลข 13 หลัก" หรือ "📥 นำเข้าไฟล์ Excel (data70)" ได้)</td></tr>';
      return;
    }

    tbody.innerHTML = adminData70List.map((r, idx) => {
      const incomeNum = Number(r.total_income || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const salNum = Number(r.salary || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td align="center">${r.seq_no || (idx + 1)}</td>
          <td align="center">${r.sml_seq || '-'} (${r.sml_size || '-'})</td>
          <td align="left">${r.hname || '-'}</td>
          <td align="center" style="font-family:Consolas, monospace; font-weight:bold; color:#1e3a8a;">${r.cid}</td>
          <td align="left"><b>${r.fullname || '-'}</b></td>
          <td align="left">${r.current_position || '-'} ${r.current_level || ''}</td>
          <td align="center"><span style="background:#eff6ff; color:#1e40af; padding:2px 6px; border-radius:4px; font-weight:bold; font-size:11.5px;">${r.work_group || '-'}</span></td>
          <td align="center" style="font-size:12px;">${r.position_no || '-'}</td>
          <td align="right">${salNum}</td>
          <td align="right" style="color:#15803d; font-weight:bold;">${incomeNum}</td>
          <td align="center" style="white-space:nowrap;">
            <button type="button" onclick="openData70Modal('${r.cid}', false)" style="background:#2563eb; color:#fff; border:none; padding:4px 8px; border-radius:4px; font-size:12px; cursor:pointer; font-weight:bold;">✏️ แก้ไข</button>
            <button type="button" onclick="deleteAdminData70Row('${r.cid}', '${(r.fullname || '').replace(/'/g, '')}')" style="background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5; padding:4px 7px; border-radius:4px; font-size:12px; cursor:pointer; font-weight:bold; margin-left:3px;">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="11" align="center" style="color:#dc2626; padding:14px;">เกิดข้อผิดพลาด: ${err.message}</td></tr>`;
  }
}

function promptOpenData70ByCid() {
  const cid = prompt('กรอกเลขประจำตัวประชาชน 13 หลัก ที่ต้องการเพิ่มหรือแก้ไขข้อมูล (ระบบจะดึงข้อมูลจาก tbmain ให้อัตโนมัติหากมี):', '');
  if (!cid) return;
  const cleanCid = cid.replace(/[^0-9]/g, '').trim();
  if (cleanCid.length !== 13) {
    alert('กรุณากรอกเลขประจำตัวประชาชนให้ครบ 13 หลัก');
    return;
  }
  openData70Modal(cleanCid, true);
}

async function syncAllData70ToTbmain() {
  const btn = document.getElementById('btnSyncAllD70ToMain');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ กำลังซิงก์ข้อมูลทั้งหมดลง tbmain...';
  }
  try {
    const res = await apiPost({ action: 'sync_all_data70_to_tbmain' });
    if (res && res.success) {
      alert('✅ ' + res.message);
    } else {
      alert((res && res.message) || 'ซิงก์ข้อมูลไม่สำเร็จ');
    }
  } catch (err) {
    alert('เกิดข้อผิดพลาด: ' + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🔄 ซิงก์ข้อมูลทั้งหมดลงใบแจ้งเงินเดือน (tbmain)';
    }
  }
}

async function deleteAdminData70Row(cid, fullname) {
  if (!confirm(`ยืนยันการลบข้อมูล data70 ของ "${fullname || cid}" (เลข 13 หลัก: ${cid}) หรือไม่?`)) return;
  try {
    const res = await apiPost({ action: 'delete_data70', cid });
    if (res && res.success) {
      await loadAdminData70List();
    } else {
      alert((res && res.message) || 'ลบข้อมูลไม่สำเร็จ');
    }
  } catch (err) {
    alert('เกิดข้อผิดพลาด: ' + err.message);
  }
}

// ============================================================================
// ส่งออกไฟล์ Excel (.xlsx) และ CSV (.csv) ตามโครงสร้างชีต data70 (72/73 คอลัมน์)
// รักษาเลข 13 หลัก (cid) และเลขบัญชี (bank_account) เป็น Text ไม่ให้เพี้ยนเป็น E+12
// ============================================================================
function exportData70Excel() {
  if (!adminData70List || adminData70List.length === 0) {
    alert('ยังไม่มีข้อมูลสำหรับส่งออก กรุณาโหลดข้อมูลก่อน');
    return;
  }
  if (typeof XLSX === 'undefined') {
    alert('ไม่พบไลบรารี SheetJS (XLSX) กรุณารีเฟรชหน้าเว็บแล้วลองใหม่');
    return;
  }

  const headers = DATA70_EXPORT_COLUMNS.map(c => c.header);
  const aoa = [headers];

  adminData70List.forEach((row, idx) => {
    const rArr = DATA70_EXPORT_COLUMNS.map(col => {
      let val = row[col.key];
      if (col.key === 'seq_no' && (!val || Number(val) === 0)) val = idx + 1;
      if (col.isText) {
        return String(val ?? '').trim();
      }
      if (col.isNum) {
        const n = Number(String(val ?? 0).replace(/,/g, ''));
        return Number.isFinite(n) ? n : 0;
      }
      return String(val ?? '').trim();
    });
    aoa.push(rArr);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // บังคับคอลัมน์ที่เป็น isText (13หลัก, เลขบัญชี, หมายเลขโทรศัพท์) ให้เป็นชนิด String ('s') เพื่อป้องกัน E+12
  const textColIndices = DATA70_EXPORT_COLUMNS
    .map((col, idx) => (col.isText ? idx : -1))
    .filter(idx => idx >= 0);
  for (let r = 1; r < aoa.length; r++) {
    for (const cIdx of textColIndices) {
      const cellRef = XLSX.utils.encode_cell({ r, c: cIdx });
      const val = String(aoa[r][cIdx] ?? '');
      ws[cellRef] = { t: 's', v: val, z: '@' };
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'data70');
  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `personnel_data70_${today}.xlsx`);
}

function exportData70Csv() {
  if (!adminData70List || adminData70List.length === 0) {
    alert('ยังไม่มีข้อมูลสำหรับส่งออก กรุณาโหลดข้อมูลก่อน');
    return;
  }

  const escCsv = (val, forceText) => {
    const s = String(val ?? '').trim();
    if (forceText && /^\d{10,}$/.test(s)) {
      // ใช้ ="3330100466968" หรือใส่ Tab/String เพื่อไม่ให้ Excel แปลงเป็น E+12 เมื่อดับเบิลคลิกเปิด CSV
      return `="${s}"`;
    }
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [];
  lines.push(DATA70_EXPORT_COLUMNS.map(c => escCsv(c.header, false)).join(','));

  adminData70List.forEach((row, idx) => {
    const vals = DATA70_EXPORT_COLUMNS.map(col => {
      let val = row[col.key];
      if (col.key === 'seq_no' && (!val || Number(val) === 0)) val = idx + 1;
      if (col.isNum) {
        const n = Number(String(val ?? 0).replace(/,/g, ''));
        return Number.isFinite(n) ? (Number.isInteger(n) ? String(n) : n.toFixed(2)) : '0';
      }
      return escCsv(val, Boolean(col.isText));
    });
    lines.push(vals.join(','));
  });

  // ใส่ UTF-8 BOM (\uFEFF) เพื่อให้เปิดใน Microsoft Excel ภาษาไทยไม่ต่างดาว
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `personnel_data70_${today}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================================
// นำเข้าไฟล์ Excel / CSV (data70 ครบทุกคอลัมน์)
// ============================================================================
function cleanExcelTextValue(val) {
  let s = String(val ?? '').trim();
  // กรณีสูตร ="3330100466968" จาก CSV
  if (s.startsWith('="') && s.endsWith('"')) {
    s = s.slice(2, -1);
  }
  return s;
}

function handleData70FileSelect(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  if (typeof XLSX === 'undefined') {
    alert('ไม่พบไลบรารีอ่านไฟล์ Excel กรุณารีเฟรชหน้าเว็บ');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (evt) {
    try {
      const data = new Uint8Array(evt.target.result);
      const wb = XLSX.read(data, { type: 'array', raw: false });
      // เลือกชีตชื่อ data70 ก่อน ถ้าไม่มีใช้ชีตแรก
      const sheetName = wb.SheetNames.find(n => n.toLowerCase().includes('data70')) || wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });

      parsedImportData70Rows = [];
      let startRow = 1;
      let hasWorkGroupCol = true; // โครงสร้างใหม่มี "กลุ่มงาน" ที่คอลัมน์ index 11 (หลังระดับปัจจุบัน)

      // ค้นหาแถว Header ที่มีคำว่า "13หลัก" หรือ "ชื่อ-สกุล" หรือ "ลำดับsml"
      for (let r = 0; r < Math.min(10, rows.length); r++) {
        const rowCells = (rows[r] || []).map(c => String(c || '').trim());
        const rowStr = rowCells.join(' ');
        if (rowStr.includes('13หลัก') || rowStr.includes('ลำดับsml') || rowStr.includes('ชื่อ-สกุล')) {
          startRow = r + 1;
          hasWorkGroupCol = rowCells.some(c => c.includes('กลุ่มงาน'));
          break;
        }
      }

      // เตรียม Map ตรวจสอบ ชื่อ-สกุล และ เลขตำแหน่งปัจจุบัน ซ้ำกับคนอื่น
      const seenNameMap = new Map();
      const seenPosNoMap = new Map();
      for (const ex of (adminData70List || [])) {
        const eCid = String(ex.cid || '').trim();
        const eName = normalizeFullnameSpaces(ex.fullname);
        const ePos = normalizeFullnameSpaces(ex.position_no);
        if (eName) seenNameMap.set(eName, { cid: eCid, fullname: eName, hname: ex.hname || '' });
        if (ePos && ePos !== '-' && ePos !== 'ไม่มี') {
          seenPosNoMap.set(ePos, { cid: eCid, fullname: eName, hname: ex.hname || '', position_no: ePos });
        }
      }

      const duplicateWarnings = [];

      for (let r = startRow; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length < 5) continue;

        const rawCid = cleanExcelTextValue(row[4]);
        const cid = rawCid.replace(/[^0-9]/g, '');
        if (cid.length !== 13) continue;

        const hname = cleanExcelTextValue(row[2]);
        const matchedHosp = DATA70_HOSPITALS.find(h => h.hname === hname);
        const shift = hasWorkGroupCol ? 1 : 0;

        const normFullname = normalizeFullnameSpaces(cleanExcelTextValue(row[6]));
        const workGroupVal = hasWorkGroupCol ? cleanExcelTextValue(row[11]) : '';
        const normPosNo = normalizeFullnameSpaces(cleanExcelTextValue(row[11 + shift]));

        // ตรวจสอบชื่อ-สกุลซ้ำกับเลข 13 หลักอื่น
        if (normFullname && seenNameMap.has(normFullname)) {
          const owner = seenNameMap.get(normFullname);
          if (owner.cid !== cid) {
            duplicateWarnings.push(`แถวที่ ${r + 1}: ชื่อ-สกุล "${normFullname}" (${cid}) ซ้ำกับเลข 13 หลัก ${owner.cid} (${owner.hname || '-'})`);
            continue;
          }
        }

        // ตรวจสอบเลขตำแหน่งปัจจุบันซ้ำกับเลข 13 หลักอื่น
        if (normPosNo && normPosNo !== '-' && normPosNo !== 'ไม่มี' && seenPosNoMap.has(normPosNo)) {
          const owner = seenPosNoMap.get(normPosNo);
          if (owner.cid !== cid) {
            duplicateWarnings.push(`แถวที่ ${r + 1}: เลขตำแหน่ง "${normPosNo}" ของ ${normFullname} (${cid}) ซ้ำกับ ${owner.fullname} (${owner.cid})`);
            continue;
          }
        }

        if (normFullname) seenNameMap.set(normFullname, { cid, fullname: normFullname, hname });
        if (normPosNo && normPosNo !== '-' && normPosNo !== 'ไม่มี') {
          seenPosNoMap.set(normPosNo, { cid, fullname: normFullname, hname, position_no: normPosNo });
        }

        const rec = {
          seq_no: Number(cleanExcelTextValue(row[0])) || (parsedImportData70Rows.length + 1),
          sml_seq: Number(cleanExcelTextValue(row[1])) || (matchedHosp ? matchedHosp.sml_seq : 0),
          hname: hname,
          sml_size: cleanExcelTextValue(row[3]).toUpperCase() || (matchedHosp ? matchedHosp.sml_size : ''),
          cid: cid,
          bank_account: cleanExcelTextValue(row[5]).replace(/[^0-9]/g, '') || cleanExcelTextValue(row[5]),
          fullname: normFullname,
          birth_date: cleanExcelTextValue(row[7]),
          transfer_date: cleanExcelTextValue(row[8]),
          current_position: cleanExcelTextValue(row[9]),
          current_level: cleanExcelTextValue(row[10]),
          work_group: workGroupVal,
          position_no: normPosNo,
          edu_degree: cleanExcelTextValue(row[12 + shift]),
          edu_major: cleanExcelTextValue(row[13 + shift]),
          salary: Number(cleanExcelTextValue(row[14 + shift]).replace(/,/g, '')) || 0,
          allowance: Number(cleanExcelTextValue(row[15 + shift]).replace(/,/g, '')) || 0,
          position_allowance: Number(cleanExcelTextValue(row[16 + shift]).replace(/,/g, '')) || 0,
          pts_allowance: Number(cleanExcelTextValue(row[17 + shift]).replace(/,/g, '')) || 0,
          psr_allowance: Number(cleanExcelTextValue(row[18 + shift]).replace(/,/g, '')) || 0,
          house_rent: Number(cleanExcelTextValue(row[19 + shift]).replace(/,/g, '')) || 0,
          child_tuition: Number(cleanExcelTextValue(row[20 + shift]).replace(/,/g, '')) || 0,
          gpf_member: cleanExcelTextValue(row[21 + shift]) || 'ไม่มี',
          gpf_amount: Number(cleanExcelTextValue(row[22 + shift]).replace(/,/g, '')) || 0,
          ch11_allowance: Number(cleanExcelTextValue(row[23 + shift]).replace(/,/g, '')) || 0,
          total_income: Number(cleanExcelTextValue(row[24 + shift]).replace(/,/g, '')) || 0,
          coop_member: cleanExcelTextValue(row[25 + shift]) || 'ไม่ได้เป็นสมาชิกสหกรณ์',
          first_appoint_date: cleanExcelTextValue(row[26 + shift]),
          first_position: cleanExcelTextValue(row[27 + shift]),
          first_level: cleanExcelTextValue(row[28 + shift])
        };

        for (let i = 1; i <= 14; i++) {
          const baseIdx = (29 + shift) + (i - 1) * 3;
          rec[`change_date_${i}`] = cleanExcelTextValue(row[baseIdx]);
          rec[`change_pos_${i}`] = cleanExcelTextValue(row[baseIdx + 1]) || 'ยังไม่ได้ปรับเปลี่ยนตำแหน่ง';
          rec[`change_level_${i}`] = cleanExcelTextValue(row[baseIdx + 2]) || 'ยังไม่ได้ปรับระดับ';
        }

        rec.phone = cleanExcelTextValue(row[71 + shift]);
        rec.email = cleanExcelTextValue(row[72 + shift]);

        parsedImportData70Rows.push(rec);
      }

      const infoEl = document.getElementById('admD70ImportStatus');
      const btnConfirm = document.getElementById('btnConfirmImportD70');
      if (infoEl) {
        infoEl.style.display = 'block';
        let html = `✅ อ่านไฟล์ <b>"${file.name}"</b> (ชีต <code>${sheetName}</code>) สำเร็จ: พบข้อมูลบุคลากรที่พร้อมนำเข้า จำนวน <b>${parsedImportData70Rows.length}</b> รายการ`;
        if (duplicateWarnings.length > 0) {
          html += `<div style="margin-top:6px; padding:6px 8px; background:#fef2f2; border:1px solid #fca5a5; border-radius:4px; color:#dc2626; font-size:12px;">
            <b>⚠️ พบรายการที่มี ชื่อ-สกุล หรือ เลขตำแหน่งปัจจุบัน ซ้ำกับคนอื่น (${duplicateWarnings.length} รายการ ระบบได้ตัดออกจากการนำเข้า):</b><br>
            ${duplicateWarnings.slice(0, 10).map(w => `• ${w}`).join('<br>')}
          </div>`;
        }
        infoEl.innerHTML = html;
      }
      if (btnConfirm) {
        btnConfirm.style.display = parsedImportData70Rows.length > 0 ? 'inline-block' : 'none';
      }
    } catch (err) {
      alert('ไม่สามารถอ่านไฟล์ Excel/CSV ได้: ' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

async function confirmImportData70Batch() {
  if (!parsedImportData70Rows || parsedImportData70Rows.length === 0) {
    alert('กรุณาเลือกไฟล์ Excel หรือ CSV ตามรูปแบบ data70 ก่อน');
    return;
  }

  const btn = document.getElementById('btnConfirmImportD70');
  if (btn) {
    btn.disabled = true;
    btn.textContent = `⏳ กำลังนำเข้า ${parsedImportData70Rows.length} รายการ...`;
  }

  try {
    let totalImported = 0;
    let totalSynced = 0;
    const chunkSize = 50;

    for (let i = 0; i < parsedImportData70Rows.length; i += chunkSize) {
      const chunk = parsedImportData70Rows.slice(i, i + chunkSize);
      const res = await apiPost({
        action: 'import_data70_batch',
        items: chunk
      });
      if (!res || !res.success) {
        throw new Error((res && res.message) || 'นำเข้าข้อมูลไม่สำเร็จ');
      }
      totalImported += Number(res.imported_count || 0);
      totalSynced += Number(res.synced_main_count || 0);
    }

    alert(`✅ นำเข้าข้อมูลบุคลากร (data70) ลงฐานข้อมูลสำเร็จ!\n\n• นำเข้า/อัปเดตข้อมูลบุคลากร: ${totalImported} คน\n• ซิงก์เบอร์โทรศัพท์และอีเมลลงตาราง tbmain: ${totalSynced} คน`);
    const infoEl = document.getElementById('admD70ImportStatus');
    if (infoEl) infoEl.style.display = 'none';
    if (btn) btn.style.display = 'none';
    await loadAdminData70List();
  } catch (err) {
    alert('เกิดข้อผิดพลาดในการนำเข้า: ' + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🚀 ยืนยันนำเข้าข้อมูลลงฐานข้อมูล personnel_data70';
    }
  }
}
