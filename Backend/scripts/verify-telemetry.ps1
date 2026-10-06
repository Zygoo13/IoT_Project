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

function Expect([bool]$condition, [string]$message) {
    if (-not $condition) { throw $message }
}

function Publish([string]$topic, [string]$payload) {
    & 'C:\Program Files\Mosquitto\mosquitto_pub.exe' -h 127.0.0.1 -p 1883 `
        -u $env:IOT_MQTT_USER -P $env:IOT_MQTT_PASSWORD -q 0 `
        -t $topic -m $payload *> $null
    if ($LASTEXITCODE -ne 0) { throw 'MQTT publish failed' }
}

function StartBroker {
    $process = Start-Process -FilePath 'C:\Program Files\Mosquitto\mosquitto.exe' `
        -ArgumentList @('-c', '.mosquitto-test.conf') -WorkingDirectory (Get-Location).Path `
        -WindowStyle Hidden -PassThru
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        $process.Refresh()
        if ($process.HasExited) { throw 'Test broker exited early' }
        & 'C:\Program Files\Mosquitto\mosquitto_pub.exe' -h 127.0.0.1 -p 1883 `
            -u $env:IOT_MQTT_USER -P $env:IOT_MQTT_PASSWORD -q 0 `
            -t 'iot/test/ready' -m 'ready' *> $null
        if ($LASTEXITCODE -eq 0) { return $process }
        Start-Sleep -Milliseconds 500
    }
    throw 'Test broker did not become ready'
}

function StopBroker($process) {
    if ($null -eq $process) { return }
    $process.Refresh()
    if (-not $process.HasExited) {
        Stop-Process -Id $process.Id -Force
        Wait-Process -Id $process.Id -Timeout 5 -ErrorAction SilentlyContinue
    }
}

function Api([string]$path, [string]$token) {
    $response = Invoke-WebRequest ('http://127.0.0.1:8080' + $path) `
        -Headers @{ Authorization = 'Bearer ' + $token } -SkipHttpErrorCheck
    if ([int]$response.StatusCode -ne 200) { throw "$path returned $($response.StatusCode)" }
    return ($response.Content | ConvertFrom-Json)
}

function CountReadings {
    return [long](MySql 'SELECT COUNT(*) FROM SensorData;')
}

function WaitForCount([long]$expected) {
    for ($attempt = 0; $attempt -lt 25; $attempt++) {
        if ((CountReadings) -eq $expected) { return }
        Start-Sleep -Milliseconds 400
    }
    throw "Expected $expected SensorData rows, got $(CountReadings)"
}

function WaitUntil([DateTimeOffset]$target) {
    $remaining = [math]::Ceiling(($target - [DateTimeOffset]::UtcNow).TotalMilliseconds)
    if ($remaining -gt 0) { Start-Sleep -Milliseconds $remaining }
}

$loginBody = @{ username = $env:IOT_SEED_USERNAME; password = $env:IOT_SEED_PASSWORD } | ConvertTo-Json -Compress
$token = (Invoke-RestMethod 'http://127.0.0.1:8080/api/auth/login' `
    -Method POST -ContentType 'application/json' -Body $loginBody).token
if (-not $token) { throw 'Login did not return JWT' }

$baseline = (MySql 'SELECT COUNT(*), COALESCE(MAX(id),0) FROM SensorData;').Split("`t")
$beforeCount = [long]$baseline[0]
$beforeMaxId = [long]$baseline[1]
$startedUtc = [DateTimeOffset]::UtcNow.ToString('yyyy-MM-dd HH:mm:ss')
$broker = $null
$sensorWasChanged = $false
$humActive = 1

try {
    $broker = StartBroker
    Start-Sleep -Seconds 7 # Scheduled subscriber retries every five seconds.

    Publish 'iot/sensor/data' '{"sensorCode":"DHT11_TEMP","value":29.1}'
    Publish 'iot/sensor/data' '{"sensorCode":"DHT11_HUM","value":58.2345}'
    Publish 'iot/sensor/data' '{"sensorCode":"LDR_LIGHT","value":123.3456}'
    WaitForCount ($beforeCount + 3)
    $validAt = [DateTimeOffset]::UtcNow

    $rows = @(MySql "SELECT sd.id, s.code, sd.value, TIMESTAMPDIFF(SECOND, sd.recordedAt, UTC_TIMESTAMP()) FROM SensorData sd JOIN Sensor s ON s.id=sd.sensorId WHERE sd.id > $beforeMaxId ORDER BY sd.id;")
    Expect ($rows.Count -eq 3) 'Three publishes did not create exactly three rows'
    $codes = @($rows | ForEach-Object { ($_ -split "`t")[1] })
    Expect ($codes -contains 'DHT11_TEMP' -and $codes -contains 'DHT11_HUM' -and $codes -contains 'LDR_LIGHT') 'Wrong Sensor mapping'
    foreach ($row in $rows) {
        $age = [int](($row -split "`t")[3])
        Expect ($age -ge 0 -and $age -le 10) 'recordedAt is not current UTC'
    }
    $dashboard = Api '/api/dashboard' $token
    $table = Api '/api/sensor-data?size=3' $token
    Expect ($dashboard.hardware.status -eq 'ONLINE') 'Dashboard did not become Online'
    Expect ($dashboard.latest.DHT11_TEMP.value -eq 29.1 -and
            $dashboard.latest.DHT11_HUM.value -eq 58.2345 -and
            $dashboard.latest.LDR_LIGHT.value -eq 123.3456) 'Dashboard latest values differ from MQTT'
    Expect ($table.totalElements -eq ($beforeCount + 3) -and $table.content.Count -eq 3) 'REST SensorData did not read the new rows'
    $lastSeen = $dashboard.hardware.lastSeenAt
    Write-Output 'three_valid_messages=three_rows_correct_sensor_utc_rest_online'

    foreach ($payload in @(
        '{',
        '{"sensorCode":"DHT11_TEMP"}',
        '{"value":29.1}',
        '{"sensorCode":"UNKNOWN","value":29.1}',
        '{"sensorCode":"DHT11_TEMP","value":"29.1"}',
        '{"sensorCode":"DHT11_TEMP","value":null}',
        '{"sensorCode":"DHT11_TEMP","value":1e309}',
        '{"sensorCode":"DHT11_HUM","value":101}',
        '{"sensorCode":"LDR_LIGHT","value":-1}',
        '{"sensorCode":"DHT11_TEMP","value":29.1,"extra":1}'
    )) { Publish 'iot/sensor/data' $payload }

    $humActive = [int](MySql "SELECT active FROM Sensor WHERE code='DHT11_HUM';")
    $null = MySql "UPDATE Sensor SET active=0 WHERE code='DHT11_HUM';"
    $sensorWasChanged = $true
    Publish 'iot/sensor/data' '{"sensorCode":"DHT11_HUM","value":59.5}'
    Start-Sleep -Seconds 2
    $null = MySql "UPDATE Sensor SET active=$humActive WHERE code='DHT11_HUM';"
    $sensorWasChanged = $false
    Expect ((CountReadings) -eq ($beforeCount + 3)) 'Invalid/inactive payload created a row'
    Expect ((Api '/api/dashboard' $token).hardware.lastSeenAt -eq $lastSeen) 'Invalid payload moved lastSeenAt'
    Write-Output 'invalid_json_fields_code_value_inactive=no_rows_no_liveness_refresh'

    WaitUntil ($validAt.AddSeconds(24))
    Publish 'iot/sensor/data' '{"sensorCode":"UNKNOWN","value":29.1}'
    WaitUntil ($validAt.AddSeconds(32))
    $offline = Api '/api/dashboard' $token
    Expect ($offline.hardware.status -eq 'OFFLINE' -and $offline.hardware.lastSeenAt -eq $lastSeen) 'Invalid message extended Online beyond 30 seconds'
    Expect ($offline.latest.DHT11_TEMP.value -eq 29.1) 'Offline lost latest valid value'
    Expect ((CountReadings) -eq ($beforeCount + 3)) 'Invalid message created a row after 30 seconds'
    Write-Output 'after_30_seconds_without_valid_reading=OFFLINE_last_value_retained'

    StopBroker $broker
    $broker = $null
    $null = Api '/api/dashboard' $token
    $null = Api '/api/sensor-data' $token
    Write-Output 'broker_stopped_rest=200'
    $broker = StartBroker
    Start-Sleep -Seconds 7
    Publish 'iot/sensor/data' '{"sensorCode":"DHT11_TEMP","value":30.1234}'
    WaitForCount ($beforeCount + 4)
    Expect ((Api '/api/dashboard' $token).hardware.status -eq 'ONLINE') 'Reconnect did not restore telemetry'
    Write-Output 'broker_restarted_resubscribed_new_reading=OK'
}
finally {
    StopBroker $broker
    if ($sensorWasChanged) {
        $null = MySql "UPDATE Sensor SET active=$humActive WHERE code='DHT11_HUM';"
    }
    $ids = @(MySql "SELECT sd.id FROM SensorData sd JOIN Sensor s ON s.id=sd.sensorId WHERE sd.id > $beforeMaxId AND sd.recordedAt >= '$startedUtc' AND ((s.code='DHT11_TEMP' AND sd.value IN (29.1000,30.1234)) OR (s.code='DHT11_HUM' AND sd.value IN (58.2345,59.5000,101.0000)) OR (s.code='LDR_LIGHT' AND sd.value IN (123.3456,-1.0000))) ORDER BY sd.id;")
    if ($ids.Count -gt 0) {
        $numbers = @($ids | ForEach-Object { [long]$_ })
        $null = MySql ('DELETE FROM SensorData WHERE id IN (' + ($numbers -join ',') + ');')
    }
    Write-Output "test_rows_removed=$($ids.Count) remaining=$(CountReadings) baseline=$beforeCount"
    Expect ((CountReadings) -eq $beforeCount) 'Telemetry fixture cleanup did not restore the original count'
}
