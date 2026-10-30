# ==============================================================================
# สคริปต์เปิดรันเว็บแอปพลิเคชัน ระบบแจ้งเงินเดือนออนไลน์ อบจ.ศรีสะเกษ (PaySlip)
# เชื่อมต่อฐานข้อมูลจริง MySQL 183.88.214.9:3306 (Database: slip)
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$port = 8085
$folder = $PSScriptRoot
if (-not $folder) { $folder = Get-Location }

$dllPath = Join-Path $folder "MySql.Data.dll"
if (-not (Test-Path $dllPath)) {
    $altDll = "d:\งานหน้าจอส่งไล0966\ข้อบัญญัติอบจ69\MySql.Data.dll"
    if (Test-Path $altDll) { Copy-Item $altDll $dllPath -Force }
}
[void][System.Reflection.Assembly]::LoadFrom($dllPath)
Add-Type -AssemblyName System.Web.Extensions

$connStr = "Server=183.88.214.9;Port=3306;Database=slip;Uid=jojo204;Pwd=jo11032518jo;CharSet=utf8;"
$jsonSer = New-Object System.Web.Script.Serialization.JavaScriptSerializer
$jsonSer.MaxJsonLength = 67108864

function Sql-Esc([string]$s) {
    if ($null -eq $s) { return "''" }
    return "'" + $s.Replace("\", "\\").Replace("'", "''") + "'"
}

function Query-Table([MySql.Data.MySqlClient.MySqlConnection]$conn, [string]$sql) {
    $cmd = New-Object MySql.Data.MySqlClient.MySqlCommand($sql, $conn)
    $da = New-Object MySql.Data.MySqlClient.MySqlDataAdapter($cmd)
    $dt = New-Object System.Data.DataTable
    [void]$da.Fill($dt)
    $list = New-Object System.Collections.ArrayList
    foreach ($r in $dt.Rows) {
        $dict = @{}
        foreach ($c in $dt.Columns) {
            $val = $r[$c.ColumnName]
            $dict[$c.ColumnName] = if ($val -is [DBNull]) { "" } else { [string]$val }
        }
        [void]$list.Add($dict)
    }
    return ,$list
}

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host " ระบบแจ้งเงินเดือนออนไลน์ องค์การบริหารส่วนจังหวัดศรีสะเกษ (PaySlip)" -ForegroundColor Green
Write-Host " เชื่อมต่อฐานข้อมูล: 183.88.214.9 (MySQL Database: slip)" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Cyan

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
} catch {
    $port = 8086
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Start()
}

$url = "http://localhost:$port/index.html"
Write-Host "เว็บไซต์พร้อมใช้งานที่: $url" -ForegroundColor Green
Start-Process $url

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        $localPath = $request.Url.LocalPath

        if ($localPath -eq "/api/slip") {
            $response.ContentType = "application/json; charset=utf-8"
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $bodyObj = @{}
            if ($request.HttpMethod -eq "POST") {
                $sr = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $rawBody = $sr.ReadToEnd()
                $sr.Close()
                if ($rawBody) { $bodyObj = $jsonSer.DeserializeObject($rawBody) }
            }
            $action = if ($bodyObj.ContainsKey("action")) { $bodyObj["action"] } else { $request.QueryString["action"] }
            if (-not $action) { $action = "stats" }

            $conn = New-Object MySql.Data.MySqlClient.MySqlConnection($connStr)
            $conn.Open()
            $resHash = @{ success = $false; message = "Unknown action" }

            if ($action -eq "stats") {
                $r1 = Query-Table $conn "SELECT COUNT(*) AS cnt FROM tbmain;"
                $r2 = Query-Table $conn "SELECT COUNT(*) AS cnt FROM tbmain WHERE chn > 0 OR passc <> '#123456#';"
                $resHash = @{
                    success = $true
                    total_members = [int]$r1[0]["cnt"]
                    changed_members = [int]$r2[0]["cnt"]
                }
            }
            elseif ($action -eq "login") {
                $idno = [string]$bodyObj["idno"]
                $pass = [string]$bodyObj["password"]
                $qMem = Query-Table $conn @"
SELECT m.noman, m.nname, m.nobank, m.idno, m.nposit, m.noffice, m.passc, m.cbank, m.mbphone, m.chn,
       COALESCE(o.noffice, 'องค์การบริหารส่วนจังหวัดศรีสะเกษ') AS office_name,
       COALESCE(b.namebank, 'ธนาคารกรุงไทย จำกัด(มหาชน)') AS bank_name,
       COALESCE(b.sakhabank, 'สาขาศรีสะเกษ') AS bank_branch
FROM tbmain m
LEFT JOIN tboffice o ON m.noffice = o.coff
LEFT JOIN tbbank b ON LPAD(TRIM(m.cbank), 4, '0') = LPAD(TRIM(b.cbank), 4, '0')
WHERE m.idno = $(Sql-Esc $idno) AND m.passc = $(Sql-Esc $pass)
LIMIT 1;
"@
                if ($qMem.Count -eq 0) {
                    $resHash = @{ success = $false; message = "เลขประจำตัวประชาชน หรือ รหัสผ่าน ไม่ถูกต้อง!" }
                } else {
                    $qMonths = Query-Table $conn @"
SELECT d.nauto, d.yy, d.mm, COALESCE(mt.nmonth, '') AS month_name,
       d.daypay, d.notes, d.sumget, d.sumpay, d.sumnet
FROM tbdetail d
LEFT JOIN tbmonth mt ON d.mm = mt.mm
WHERE d.idno = $(Sql-Esc $idno)
ORDER BY CAST(d.yy AS UNSIGNED) DESC, CAST(d.mm AS UNSIGNED) DESC;
"@
                    $resHash = @{
                        success = $true
                        member = $qMem[0]
                        months = $qMonths
                    }
                }
            }
            elseif ($action -eq "slip_detail") {
                $nauto = [int]$bodyObj["nauto"]
                $idno = [string]$bodyObj["idno"]
                $qSlip = Query-Table $conn @"
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
WHERE d.nauto = $nauto AND d.idno = $(Sql-Esc $idno)
LIMIT 1;
"@
                if ($qSlip.Count -eq 0) {
                    $resHash = @{ success = $false; message = "ไม่พบข้อมูลสลิปเงินเดือน" }
                } else {
                    $resHash = @{ success = $true; slip = $qSlip[0] }
                }
            }
            elseif ($action -eq "change_password") {
                $idno = [string]$bodyObj["idno"]
                $newPass = [string]$bodyObj["new_password"]
                $cmd = New-Object MySql.Data.MySqlClient.MySqlCommand("UPDATE tbmain SET passc = $(Sql-Esc $newPass), dayup = NOW(), chn = 1 WHERE idno = $(Sql-Esc $idno);", $conn)
                [void]$cmd.ExecuteNonQuery()
                $resHash = @{ success = $true; message = "บันทึกเปลี่ยนรหัสผ่านใหม่เรียบร้อยแล้ว!" }
            }
            elseif ($action -eq "request_otp") {
                $idno = [string]$bodyObj["idno"]
                $qMem = Query-Table $conn "SELECT noman, nname, nobank, idno, nposit, mbphone FROM tbmain WHERE idno = $(Sql-Esc $idno) LIMIT 1;"
                if ($qMem.Count -eq 0) {
                    $resHash = @{ success = $false; message = "ไม่พบเลขประจำตัวประชาชนนี้ในระบบทะเบียนสมาชิก tbmain" }
                } else {
                    $m = $qMem[0]
                    $phone = [string]$m["mbphone"]
                    $otp = (Get-Random -Minimum 100000 -Maximum 999999).ToString()
                    $ref = "R" + (Get-Random -Minimum 100 -Maximum 999).ToString()
                    $cmd = New-Object MySql.Data.MySqlClient.MySqlCommand("INSERT INTO tb_otp (idno, mbphone, otp_code, ref_code, created_at, expires_at, is_used) VALUES ($(Sql-Esc $idno), $(Sql-Esc $phone), '$otp', '$ref', NOW(), DATE_ADD(NOW(), INTERVAL 5 MINUTE), 0);", $conn)
                    [void]$cmd.ExecuteNonQuery()
                    $resHash = @{
                        success = $true
                        ref_code = $ref
                        masked_phone = if ($phone.Length -ge 9) { $phone.Substring(0,3) + "-xxx-" + $phone.Substring($phone.Length-4) } else { "ไม่ระบุเบอร์โทร" }
                        member_name = $m["nname"]
                        member_position = $m["nposit"]
                        demo_otp = $otp
                    }
                }
            }
            elseif ($action -eq "reset_password_otp") {
                $idno = [string]$bodyObj["idno"]
                $newPass = [string]$bodyObj["new_password"]
                $cmd = New-Object MySql.Data.MySqlClient.MySqlCommand("UPDATE tbmain SET passc = $(Sql-Esc $newPass), dayup = NOW(), chn = 1 WHERE idno = $(Sql-Esc $idno);", $conn)
                [void]$cmd.ExecuteNonQuery()
                $resHash = @{ success = $true; message = "ตั้งรหัสผ่านใหม่สำเร็จ!" }
            }

            $conn.Close()
            $outJson = $jsonSer.Serialize($resHash)
            $outBytes = [System.Text.Encoding]::UTF8.GetBytes($outJson)
            $response.ContentLength64 = $outBytes.Length
            $response.OutputStream.Write($outBytes, 0, $outBytes.Length)
            $response.Close()
            continue
        }

        $relPath = [System.Uri]::UnescapeDataString($localPath.TrimStart('/'))
        if (-not $relPath -or $relPath -eq "" -or $relPath -eq "frmin.php") { $relPath = "index.html" }
        $filePath = Join-Path $folder $relPath

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $ct = "text/plain; charset=utf-8"
            switch ($ext) {
                ".html" { $ct = "text/html; charset=utf-8" }
                ".js"   { $ct = "application/javascript; charset=utf-8" }
                ".json" { $ct = "application/json; charset=utf-8" }
                ".css"  { $ct = "text/css; charset=utf-8" }
                ".png"  { $ct = "image/png" }
                ".jpg"  { $ct = "image/jpeg" }
                ".pdf"  { $ct = "application/pdf" }
            }
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $ct
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.Close()
    } catch {}
}
