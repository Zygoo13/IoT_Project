param(
    [ValidateSet('load', 'status', 'clean', 'devices')]
    [string]$Mode = 'status'
)

$ErrorActionPreference = 'Stop'
$backend = Split-Path $PSScriptRoot -Parent
$manifestPath = Join-Path $backend '.demo-data-manifest.json'

Get-Content -LiteralPath (Join-Path $backend '.env') -Encoding UTF8 | ForEach-Object {
    $separator = $_.IndexOf('=')
    if ($separator -gt 0) {
        [Environment]::SetEnvironmentVariable($_.Substring(0, $separator),
            $_.Substring($separator + 1), 'Process')
    }
}

$container = if ($env:IOT_DEMO_MYSQL_CONTAINER) { $env:IOT_DEMO_MYSQL_CONTAINER } else { 'iot_backend_mysql_20261005' }
function MySql([string]$sql) {
    $lines = $sql | docker exec -i -e "MYSQL_PWD=$($env:MYSQL_PASSWORD)" $container `
        mysql "--user=$($env:MYSQL_USER)" "--database=$($env:MYSQL_DATABASE)" -N -B
    if ($LASTEXITCODE -ne 0) { throw 'Không chạy được MySQL CLI trong container.' }
    return @($lines)
}
function Require([bool]$condition, [string]$message) {
    if (-not $condition) { throw $message }
}
function SaveManifest($data) {
    $data | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifestPath -Encoding UTF8
}
function LoadManifest {
    return Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
}
function DbIds {
    $rows = @(MySql 'SELECT ''U'', id FROM `User` UNION ALL SELECT ''S'', id FROM Sensor UNION ALL SELECT ''D'', id FROM Device ORDER BY 1, 2;')
    $ids = @{ U = @(); S = @(); D = @() }
    foreach ($row in $rows) {
        $part = $row -split "`t"
        $ids[$part[0]] += [long]$part[1]
    }
    Require ($ids.U.Count -eq 1 -and $ids.S.Count -eq 3 -and $ids.D.Count -eq 2) 'Cần đúng 1 User, 3 Sensor, 2 Device.'
    $sensorRows = @(MySql 'SELECT code, id FROM Sensor ORDER BY code;')
    $deviceRows = @(MySql 'SELECT code, id FROM Device ORDER BY code;')
    $sensors = @{}; $devices = @{}
    foreach ($row in $sensorRows) { $part = $row -split "`t"; $sensors[$part[0]] = [long]$part[1] }
    foreach ($row in $deviceRows) { $part = $row -split "`t"; $devices[$part[0]] = [long]$part[1] }
    foreach ($code in @('DHT11_TEMP', 'DHT11_HUM', 'LDR_LIGHT')) { Require ($sensors.ContainsKey($code)) "Thiếu Sensor $code" }
    foreach ($code in @('LED1', 'LED2')) { Require ($devices.ContainsKey($code)) "Thiếu Device $code" }
    return @{ user = $ids.U[0]; sensors = $sensors; devices = $devices }
}
function SqlTime($value) { return ([datetime]::Parse($value).ToString('yyyy-MM-dd HH:mm:ss.ffffff')) }
function QueryDemoRows($data) {
    $parts = @()
    for ($i = 0; $i -lt $data.sensor.Count; $i++) {
        $row = $data.sensor[$i]
        $parts += "SELECT 'S' AS kind, $i AS idx, id FROM SensorData WHERE sensorId=$($row.sensorId) AND value=$($row.value) AND recordedAt='$(SqlTime $row.recordedAt)'"
    }
    for ($i = 0; $i -lt $data.history.Count; $i++) {
        $row = $data.history[$i]
        $confirmed = if ($row.confirmedAt) { "confirmedAt='$(SqlTime $row.confirmedAt)'" } else { 'confirmedAt IS NULL' }
        $parts += "SELECT 'H' AS kind, $i AS idx, id FROM ActionHistory WHERE userId=$($row.userId) AND deviceId=$($row.deviceId) AND action='$($row.action)' AND status='$($row.status)' AND createdAt='$(SqlTime $row.createdAt)' AND $confirmed"
    }
    return @(MySql (($parts -join ' UNION ALL ') + ';'))
}
function VerifyRows($data) {
    $found = @(QueryDemoRows $data)
    $expected = $data.sensor.Count + $data.history.Count
    Require ($found.Count -eq $expected) "Tìm thấy $($found.Count)/$expected dòng demo; dừng để tránh đụng dữ liệu khác."
    $unique = @{}
    foreach ($line in $found) {
        $part = $line -split "`t"
        $key = "$($part[0])/$($part[1])"
        Require (-not $unique.ContainsKey($key)) "Dòng demo $key bị trùng chữ ký."
        $unique[$key] = [long]$part[2]
        $row = if ($part[0] -eq 'S') { $data.sensor[[int]$part[1]] } else { $data.history[[int]$part[1]] }
        if ($row.id) { Require ([long]$row.id -eq [long]$part[2]) "ID của $key đã đổi; từ chối dọn."
        } else { $row | Add-Member -NotePropertyName id -NotePropertyValue ([long]$part[2]) -Force }
    }
}

if ($Mode -eq 'load' -and -not (Test-Path -LiteralPath $manifestPath)) {
    $ids = DbIds
    $start = (Get-Date).ToUniversalTime().AddMinutes(-90)
    $start = [datetime]::SpecifyKind($start, [DateTimeKind]::Utc)
    $sensor = @()
    $series = @('DHT11_TEMP', 'DHT11_HUM', 'LDR_LIGHT')
    for ($i = 0; $i -lt 18; $i++) {
        $at = $start.AddMinutes(2 * $i).ToString('yyyy-MM-dd HH:mm:ss.123456')
        foreach ($code in $series) {
            $value = switch ($code) {
                'DHT11_TEMP' { 28.5 + 4.2 * [math]::Sin($i * 0.55) + $i * 0.04 }
                'DHT11_HUM' { 64 - 13 * [math]::Sin($i * 0.55 + 0.25) + $i * 0.12 }
                'LDR_LIGHT' {
                    if ($i -eq 0) { 5 }
                    elseif ($i -eq 1) { 195 }
                    elseif ($i -eq 2) { 140 }
                    else { 58 + 31 * [math]::Sin($i * 0.55 + 1.1) + $i * 0.15 }
                }
            }
            $value = [math]::Round($value, 4)
            $sensor += [pscustomobject]@{ sensorId = $ids.sensors[$code]; value = $value.ToString('0.0000', [cultureinfo]::InvariantCulture); recordedAt = $at; id = $null }
        }
    }
    $history = @()
    foreach ($code in @('LED1', 'LED2')) {
        $lastStatus = 'OFF'
        for ($i = 0; $i -lt 14; $i++) {
            $at = $start.AddHours(-2).AddMinutes(5 * $i + $(if ($code -eq 'LED2') { 2 } else { 0 }))
            $action = if ($code -eq 'LED1' -and $i -eq 13) { 'ON' }
                      elseif ($i % 2 -eq 0) { 'ON' } else { 'OFF' }
            $unconfirmed = $i -in @(8, 12)
            if (-not $unconfirmed) {
                $lastStatus = if ($i -eq 4) { 'OFF' } else { $action }
            }
            $history += [pscustomobject]@{
                userId = $ids.user; deviceId = $ids.devices[$code]; action = $action;
                status = $lastStatus; createdAt = $at.ToString('yyyy-MM-dd HH:mm:ss.654321');
                confirmedAt = if ($unconfirmed) { $null } else { $at.AddSeconds(2).ToString('yyyy-MM-dd HH:mm:ss.654321') };
                id = $null
            }
        }
    }
    $data = [pscustomobject]@{ state = 'pending'; sensor = $sensor; history = $history }
    SaveManifest $data
}

if ($Mode -eq 'devices') {
    $null = DbIds
    $before = @(MySql "SELECT code, status FROM Device WHERE code IN ('LED1','LED2') ORDER BY code;")
    Require ($before.Count -eq 2) 'Cần đúng LED1 và LED2 để đặt trạng thái demo.'
    $null = MySql "UPDATE Device SET status=CASE code WHEN 'LED1' THEN 'ON' ELSE 'OFF' END, updatedAt=UTC_TIMESTAMP(6) WHERE (code='LED1' AND status<>'ON') OR (code='LED2' AND status<>'OFF');"
    $after = @(MySql "SELECT code, status FROM Device WHERE code IN ('LED1','LED2') ORDER BY code;")
    Require ($after[0] -eq "LED1`tON" -and $after[1] -eq "LED2`tOFF") 'Trạng thái LED chưa đúng.'
    Write-Output 'Trạng thái DEMO: LED1=ON, LED2=OFF. Đây không phải xác nhận từ ESP32.'
    exit 0
}

if (-not (Test-Path -LiteralPath $manifestPath)) {
    Write-Output 'Chưa có dữ liệu demo. Chạy: .\scripts\demo-data.ps1 load'
    exit 0
}
$data = LoadManifest
$existing = @(QueryDemoRows $data)
$expected = $data.sensor.Count + $data.history.Count
if ($Mode -eq 'load' -and $existing.Count -eq 0 -and $data.state -eq 'pending') {
    $sql = @('START TRANSACTION;')
    foreach ($row in $data.sensor) {
        $sql += "INSERT INTO SensorData (sensorId, value, recordedAt) VALUES ($($row.sensorId), $($row.value), '$(SqlTime $row.recordedAt)');"
    }
    foreach ($row in $data.history) {
        $confirmed = if ($row.confirmedAt) { "'$(SqlTime $row.confirmedAt)'" } else { 'NULL' }
        $sql += "INSERT INTO ActionHistory (userId, deviceId, action, status, createdAt, confirmedAt) VALUES ($($row.userId), $($row.deviceId), '$($row.action)', '$($row.status)', '$(SqlTime $row.createdAt)', $confirmed);"
    }
    $sql += 'COMMIT;'
    $null = MySql ($sql -join "`n")
}
VerifyRows $data
$data.state = 'loaded'
SaveManifest $data

if ($Mode -eq 'clean') {
    $sql = @('START TRANSACTION;')
    foreach ($row in $data.sensor) {
        $sql += "DELETE FROM SensorData WHERE id=$($row.id) AND sensorId=$($row.sensorId) AND value=$($row.value) AND recordedAt='$(SqlTime $row.recordedAt)';"
        $sql += "SELECT ROW_COUNT();"
    }
    foreach ($row in $data.history) {
        $confirmed = if ($row.confirmedAt) { "confirmedAt='$(SqlTime $row.confirmedAt)'" } else { 'confirmedAt IS NULL' }
        $sql += "DELETE FROM ActionHistory WHERE id=$($row.id) AND userId=$($row.userId) AND deviceId=$($row.deviceId) AND action='$($row.action)' AND status='$($row.status)' AND createdAt='$(SqlTime $row.createdAt)' AND $confirmed;"
        $sql += "SELECT ROW_COUNT();"
    }
    $sql += 'COMMIT;'
    $counts = @(MySql ($sql -join "`n"))
    Require ($counts.Count -eq $expected -and @($counts | Where-Object { $_ -ne '1' }).Count -eq 0) 'Không dọn đủ dòng demo; kiểm tra DB trước khi chạy lại.'
    Remove-Item -LiteralPath $manifestPath
    Write-Output "Đã dọn đúng $($data.sensor.Count) SensorData và $($data.history.Count) ActionHistory demo."
} else {
    Write-Output "Dữ liệu DEMO: $($data.sensor.Count) SensorData, $($data.history.Count) ActionHistory; không đổi Device.status."
}
