$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

Get-Content -LiteralPath '.env' -Encoding UTF8 | ForEach-Object {
    $separator = $_.IndexOf('=')
    if ($separator -gt 0) {
        [Environment]::SetEnvironmentVariable($_.Substring(0, $separator),
            $_.Substring($separator + 1), 'Process')
    }
}

function MySql([string]$sql) {
    $result = $sql | docker exec -i -e "MYSQL_PWD=$($env:MYSQL_PASSWORD)" `
        iot_backend_mysql_20261005 mysql "--user=$($env:MYSQL_USER)" `
        "--database=$($env:MYSQL_DATABASE)" -N -B
    if ($LASTEXITCODE -ne 0) { throw 'MySQL command failed' }
    return $result
}

function Request([string]$path, [string]$token) {
    $headers = @{}
    if ($token) { $headers.Authorization = 'Bearer ' + $token }
    return Invoke-WebRequest -Uri ('http://127.0.0.1:8080' + $path) `
        -Method GET -Headers $headers -SkipHttpErrorCheck
}

function Json([string]$path, [string]$token) {
    $response = Request $path $token
    if ([int]$response.StatusCode -ne 200) { throw "$path returned $($response.StatusCode)" }
    return ($response.Content | ConvertFrom-Json)
}

function Expect([bool]$condition, [string]$message) {
    if (-not $condition) { throw $message }
}

function BadQuery([string]$path, [string]$token) {
    $response = Request $path $token
    if ([int]$response.StatusCode -ne 400) { throw "$path should return 400" }
    $body = $response.Content | ConvertFrom-Json
    Expect ($body.code -eq 'BAD_QUERY') "$path should use BAD_QUERY"
}

$loginBody = @{ username = $env:IOT_SEED_USERNAME; password = $env:IOT_SEED_PASSWORD } | ConvertTo-Json -Compress
$token = (Invoke-RestMethod 'http://127.0.0.1:8080/api/auth/login' `
    -Method POST -ContentType 'application/json' -Body $loginBody).token
if (-not $token) { throw 'Login did not return a token' }

$initial = MySql 'SELECT (SELECT COUNT(*) FROM SensorData), (SELECT COUNT(*) FROM ActionHistory);'
Expect ($initial -eq "0`t0") 'Fixture requires empty SensorData and ActionHistory'

$sensorStart = $null
$sensorEnd = $null
$historyStart = $null
$historyEnd = $null
try {
    $sensorRows = @()
    foreach ($i in 0..17) {
        $sensorRows += "((SELECT id FROM Sensor WHERE code='DHT11_TEMP'), $($i + 20), DATE_ADD('2010-01-02 00:00:00', INTERVAL $i SECOND))"
    }
    foreach ($i in 0..2) {
        $second = $i + 18
        $sensorRows += "((SELECT id FROM Sensor WHERE code='DHT11_HUM'), $($i + 50), DATE_ADD('2010-01-02 00:00:00', INTERVAL $second SECOND))"
    }
    $sensorRows += "((SELECT id FROM Sensor WHERE code='LDR_LIGHT'), 500, '2010-01-02 00:00:21')"
    $sensorRows += "((SELECT id FROM Sensor WHERE code='DHT11_TEMP'), 23.5, UTC_TIMESTAMP(6))"
    $insert = 'INSERT INTO SensorData (sensorId, value, recordedAt) VALUES ' + ($sensorRows -join ',') + '; SELECT CONCAT(LAST_INSERT_ID(), '':'' , ROW_COUNT());'
    $parts = (MySql $insert).Split(':')
    Expect ($parts.Count -eq 2) 'Sensor fixture ID was not returned'
    $sensorStart = [long]$parts[0]
    $sensorEnd = $sensorStart + [int]$parts[1] - 1
    Expect ([int]$parts[1] -eq 23) 'Sensor fixture insert failed'

    $quotedUser = [string][char]96 + 'User' + [string][char]96
    $historyRows = @()
    foreach ($i in 0..17) {
        $action = if ($i % 2 -eq 0) { 'ON' } else { 'OFF' }
        $historyRows += "((SELECT id FROM $quotedUser LIMIT 1), (SELECT id FROM Device WHERE code='LED1'), '$action', 'OFF', DATE_ADD('2010-01-02 00:00:00', INTERVAL $i SECOND), NULL)"
    }
    foreach ($i in 18..20) {
        $historyRows += "((SELECT id FROM $quotedUser LIMIT 1), (SELECT id FROM Device WHERE code='LED2'), 'ON', 'OFF', DATE_ADD('2010-01-02 00:00:00', INTERVAL $i SECOND), NULL)"
    }
    $historyRows += "((SELECT id FROM $quotedUser LIMIT 1), (SELECT id FROM Device WHERE code='LED2'), 'OFF', 'OFF', '2010-01-02 00:00:21', '2010-01-02 00:00:22')"
    $historyRows += "((SELECT id FROM $quotedUser LIMIT 1), (SELECT id FROM Device WHERE code='LED1'), 'ON', 'OFF', DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 1 HOUR), NULL)"
    $insert = 'INSERT INTO ActionHistory (userId, deviceId, action, status, createdAt, confirmedAt) VALUES ' + ($historyRows -join ',') + '; SELECT CONCAT(LAST_INSERT_ID(), '':'' , ROW_COUNT());'
    $parts = (MySql $insert).Split(':')
    Expect ($parts.Count -eq 2) 'History fixture ID was not returned'
    $historyStart = [long]$parts[0]
    $historyEnd = $historyStart + [int]$parts[1] - 1
    Expect ([int]$parts[1] -eq 23) 'History fixture insert failed'

    $dashboard = Json '/api/dashboard' $token
    Expect ($dashboard.latest.DHT11_TEMP.value -eq 23.5) 'Latest temperature is wrong'
    Expect ($dashboard.latest.DHT11_HUM.value -eq 52) 'Latest humidity is wrong'
    Expect ($dashboard.latest.LDR_LIGHT.value -eq 500) 'Latest light is wrong'
    Expect ($dashboard.chart.DHT11_TEMP.Count -eq 15) 'Temperature chart must have 15 points'
    Expect ($dashboard.chart.DHT11_TEMP[0].value -eq 24) 'Chart must be chronological'
    Expect ($dashboard.chart.DHT11_TEMP[14].value -eq 23.5) 'Chart must end at latest value'
    Expect ($dashboard.chart.DHT11_HUM.Count -eq 3 -and $dashboard.chart.LDR_LIGHT.Count -eq 1) 'Chart series must be separate'
    Expect ($dashboard.hardware.status -eq 'ONLINE' -and -not $dashboard.latest.DHT11_TEMP.stale) 'Recent telemetry must be online'
    Expect ($dashboard.latest.DHT11_HUM.stale -and $dashboard.latest.LDR_LIGHT.stale) 'Old readings must be stale'
    Write-Output 'dashboard_latest_chart_15_online_stale=OK'

    $sensorPage0 = Json '/api/sensor-data' $token
    $sensorPage1 = Json '/api/sensor-data?page=1' $token
    $historyPage0 = Json '/api/action-history' $token
    $historyPage1 = Json '/api/action-history?page=1' $token
    Expect ($sensorPage0.totalElements -eq 23 -and $sensorPage0.content.Count -eq 20 -and $sensorPage1.content.Count -eq 3) 'Sensor 20-row pagination failed'
    Expect ($historyPage0.totalElements -eq 23 -and $historyPage0.content.Count -eq 20 -and $historyPage1.content.Count -eq 3) 'History 20-row pagination failed'
    Expect ((Json '/api/sensor-data?page=99' $token).content.Count -eq 0) 'Beyond-last sensor page must be empty'
    Expect ((Json '/api/action-history?page=99' $token).totalElements -eq 23) 'Beyond-last history page must keep total'
    Write-Output 'both_tables_20_row_limit_and_beyond_last=OK'

    $sensorFiltered = Json '/api/sensor-data?searchField=SENSOR_TYPE&search=temperature&from=2010-01-02T00%3A00%3A05Z&to=2010-01-02T00%3A00%3A09Z&sortBy=VALUE&order=ASC&size=2&page=1' $token
    Expect ((Json '/api/sensor-data?searchField=SENSOR_TYPE&search=temperature' $token).totalElements -eq 19) 'Sensor type search failed'
    Expect ($sensorFiltered.totalElements -eq 5 -and $sensorFiltered.content.Count -eq 2) 'Sensor search/time/page count failed'
    Expect ($sensorFiltered.content[0].value -eq 27 -and $sensorFiltered.content[1].value -eq 28) 'Sensor sort before pagination failed'
    Expect ((Json "/api/sensor-data?searchField=ID&search=$sensorStart" $token).totalElements -eq 1) 'Sensor ID search failed'
    Expect ((Json '/api/sensor-data?searchField=VALUE&search=25' $token).totalElements -eq 1) 'Sensor VALUE search failed'
    Expect ((Json '/api/sensor-data?searchField=TIME&search=2010-01-02' $token).totalElements -eq 22) 'Sensor TIME date search failed'
    Expect ((Json '/api/sensor-data?searchField=TIME&search=2010-01-02T00%3A00%3A05Z' $token).totalElements -eq 1) 'Sensor TIME second search failed'
    Expect ((Json '/api/sensor-data?from=2010-01-02T07%3A00%3A05%2B07%3A00&to=2010-01-02T07%3A00%3A05%2B07%3A00' $token).totalElements -eq 1) 'Offset conversion failed'
    foreach ($sort in @('ID','SENSOR_TYPE','VALUE','TIME')) { $null = Json "/api/sensor-data?sortBy=$sort" $token }
    Write-Output 'sensor_search_filter_sort_page_and_offset=OK'

    $historyFiltered = Json '/api/action-history?searchField=DEVICE&search=led1&device=LED1&action=ON&status=OFF&from=2010-01-02T00%3A00%3A04Z&to=2010-01-02T00%3A00%3A12Z&sortBy=TIME&order=ASC&size=2&page=1' $token
    Expect ($historyFiltered.totalElements -eq 5 -and $historyFiltered.content.Count -eq 2) 'History search/filter/page count failed'
    Expect ($historyFiltered.content[0].id -eq ($historyStart + 8) -and $historyFiltered.content[1].id -eq ($historyStart + 10)) 'History sort before pagination failed'
    Expect ((Json "/api/action-history?searchField=ID&search=$historyStart" $token).totalElements -eq 1) 'History ID search failed'
    Expect ((Json '/api/action-history?searchField=DEVICE&search=led1' $token).totalElements -eq 19) 'History DEVICE search failed'
    Expect ((Json '/api/action-history?device=LED2&action=ON&status=OFF' $token).totalElements -eq 3) 'History filters failed'
    foreach ($sort in @('ID','DEVICE','ACTION','STATUS','TIME')) { $null = Json "/api/action-history?sortBy=$sort" $token }
    $states = @($historyPage0.content + $historyPage1.content | ForEach-Object { $_.deliveryState })
    Expect ($states -contains 'PENDING' -and $states -contains 'TIMEOUT' -and $states -contains 'CONFIRMED') 'History delivery states failed'
    Write-Output 'history_search_filter_sort_page_delivery_states=OK'

    foreach ($path in @(
        '/api/sensor-data?page=-1', '/api/sensor-data?page=abc',
        '/api/sensor-data?size=0', '/api/sensor-data?size=21',
        '/api/sensor-data?sortBy=DEVICE', '/api/sensor-data?order=SIDEWAYS',
        '/api/sensor-data?searchField=DEVICE&search=LED1',
        '/api/sensor-data?search=25', '/api/sensor-data?searchField=ID',
        '/api/sensor-data?searchField=ID&search=bad',
        '/api/sensor-data?searchField=VALUE&search=bad',
        '/api/sensor-data?searchField=TIME&search=bad',
        '/api/sensor-data?from=bad',
        '/api/sensor-data?from=2010-01-03T00%3A00%3A00Z&to=2010-01-02T00%3A00%3A00Z',
        '/api/action-history?size=21', '/api/action-history?sortBy=VALUE',
        '/api/action-history?searchField=VALUE&search=5',
        '/api/action-history?device=LED3', '/api/action-history?action=BAD',
        '/api/action-history?status=BAD',
        '/api/action-history?from=2010-01-03T00%3A00%3A00Z&to=2010-01-02T00%3A00%3A00Z'
    )) { BadQuery $path $token }
    Write-Output 'invalid_queries_400=OK'

    $null = MySql "DELETE FROM SensorData WHERE id = $sensorEnd;"
    $offline = Json '/api/dashboard' $token
    Expect ($offline.hardware.status -eq 'OFFLINE' -and $offline.latest.DHT11_TEMP.stale) 'Old telemetry must be offline/stale'
    Expect ($offline.latest.DHT11_TEMP.value -eq 37) 'Offline must retain latest old reading'
    Write-Output 'dashboard_offline_retains_last_value=OK'
}
finally {
    if ($null -ne $historyStart) { $null = MySql "DELETE FROM ActionHistory WHERE id BETWEEN $historyStart AND $historyEnd;" }
    if ($null -ne $sensorStart) { $null = MySql "DELETE FROM SensorData WHERE id BETWEEN $sensorStart AND $sensorEnd;" }
    $remaining = MySql 'SELECT (SELECT COUNT(*) FROM SensorData), (SELECT COUNT(*) FROM ActionHistory);'
    Write-Output "fixture_remaining=$remaining"
    Expect ($remaining -eq "0`t0") 'Fixture cleanup failed'
}
