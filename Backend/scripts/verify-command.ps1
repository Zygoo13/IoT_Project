$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

Get-Content -LiteralPath '.env' -Encoding UTF8 | ForEach-Object {
    $i = $_.IndexOf('=')
    if ($i -gt 0) {
        [Environment]::SetEnvironmentVariable($_.Substring(0, $i), $_.Substring($i + 1), 'Process')
    }
}

function Sql([string]$query) {
    $result = $query | docker exec -i -e "MYSQL_PWD=$($env:MYSQL_PASSWORD)" `
        iot_backend_mysql_20261005 mysql "--user=$($env:MYSQL_USER)" `
        "--database=$($env:MYSQL_DATABASE)" -N -B
    if ($LASTEXITCODE -ne 0) { throw 'MySQL query failed' }
    return $result
}
function Expect([bool]$ok, [string]$why) { if (-not $ok) { throw $why } }
function PublishStatus([string]$payload) {
    & 'C:\Program Files\Mosquitto\mosquitto_pub.exe' -h 127.0.0.1 -p 1883 `
        -u $env:IOT_MQTT_USER -P $env:IOT_MQTT_PASSWORD -q 0 `
        -t 'iot/device/status' -m $payload *> $null
    if ($LASTEXITCODE -ne 0) { throw 'Status publish failed' }
}
function StartBroker {
    $p = Start-Process -FilePath 'C:\Program Files\Mosquitto\mosquitto.exe' `
        -ArgumentList @('-c', '.mosquitto-test.conf') -WorkingDirectory (Get-Location).Path `
        -WindowStyle Hidden -PassThru
    for ($i = 0; $i -lt 20; $i++) {
        $p.Refresh()
        if ($p.HasExited) { throw 'Test broker exited early' }
        & 'C:\Program Files\Mosquitto\mosquitto_pub.exe' -h 127.0.0.1 -p 1883 `
            -u $env:IOT_MQTT_USER -P $env:IOT_MQTT_PASSWORD -q 0 `
            -t 'iot/test/ready' -m 'ready' *> $null
        if ($LASTEXITCODE -eq 0) { return $p }
        Start-Sleep -Milliseconds 500
    }
    throw 'Test broker did not become ready'
}
function StopBroker($p) {
    if ($null -eq $p) { return }
    $p.Refresh()
    if (-not $p.HasExited) {
        Stop-Process -Id $p.Id -Force
        Wait-Process -Id $p.Id -Timeout 5 -ErrorAction SilentlyContinue
    }
}

$base = 'http://127.0.0.1:8080'
$login = @{ username = $env:IOT_SEED_USERNAME; password = $env:IOT_SEED_PASSWORD } | ConvertTo-Json -Compress
$token = (Invoke-RestMethod "$base/api/auth/login" -Method POST -ContentType 'application/json' -Body $login).token
$headers = @{ Authorization = "Bearer $token" }
function GetDashboard { return (Invoke-RestMethod "$base/api/dashboard" -Headers $headers) }
function LedStatus { return ((GetDashboard).devices | Where-Object code -eq 'LED1' | Select-Object -ExpandProperty status) }
function Led2Status { return ((GetDashboard).devices | Where-Object code -eq 'LED2' | Select-Object -ExpandProperty status) }
function GetHistory([long]$id) {
    $page = Invoke-RestMethod "$base/api/action-history?searchField=ID&search=$id" -Headers $headers
    Expect ($page.totalElements -eq 1) "History $id was not found"
    return $page.content[0]
}
function WaitHistory([long]$id, [string]$state) {
    for ($i = 0; $i -lt 30; $i++) {
        $row = GetHistory $id
        if ($row.deliveryState -eq $state) { return $row }
        Start-Sleep -Milliseconds 250
    }
    throw "History $id did not become $state"
}
function Command([string]$action) {
    $r = Invoke-WebRequest "$base/api/devices/$deviceId/actions" -Method POST `
        -Headers $headers -ContentType 'application/json' `
        -Body (@{ action = $action } | ConvertTo-Json -Compress) -SkipHttpErrorCheck
    Expect ([int]$r.StatusCode -eq 202) "Command $action returned $($r.StatusCode)"
    $body = $r.Content | ConvertFrom-Json
    Expect ($body.status -eq 'ACCEPTED' -and $body.requestId -gt $baselineMax) 'Wrong accepted response'
    $testIds.Add([long]$body.requestId)
    return [long]$body.requestId
}

$device = (Sql "SELECT id, status, DATE_FORMAT(updatedAt,'%Y-%m-%d %H:%i:%s.%f') FROM Device WHERE code='LED1';").Split("`t")
$deviceId = [long]$device[0]
$originalStatus = $device[1]
$originalUpdatedAt = $device[2]
Expect ($originalStatus -eq 'OFF') 'This isolated test requires LED1 initially OFF'
$device2 = (Sql "SELECT id, status, DATE_FORMAT(updatedAt,'%Y-%m-%d %H:%i:%s.%f') FROM Device WHERE code='LED2';").Split("`t")
$device2Id = [long]$device2[0]
$original2Status = $device2[1]
$original2UpdatedAt = $device2[2]
Expect ($original2Status -eq 'OFF') 'This isolated test requires LED2 initially OFF'
$baseline = (Sql 'SELECT COUNT(*), COALESCE(MAX(id),0) FROM ActionHistory;').Split("`t")
$baselineCount = [long]$baseline[0]
$baselineMax = [long]$baseline[1]
$started = [DateTimeOffset]::UtcNow.ToString('yyyy-MM-dd HH:mm:ss')
$testIds = [System.Collections.Generic.List[long]]::new()
$broker = $null
$subscriber = $null
$secondSubscriber = $null

try {
    $broker = StartBroker
    Start-Sleep -Seconds 7 # Backend retries subscription every five seconds.
    $subscriber = Start-Job -ArgumentList $env:IOT_MQTT_USER,$env:IOT_MQTT_PASSWORD `
        -ScriptBlock {
            param($user, $password)
            & 'C:\Program Files\Mosquitto\mosquitto_sub.exe' -h 127.0.0.1 -p 1883 `
                -u $user -P $password -q 0 -t 'iot/device/command' -C 6 -W 90
        }
    Start-Sleep -Seconds 2

    $one = Command 'ON'
    $pending = GetHistory $one
    Expect ($pending.action -eq 'ON' -and $pending.status -eq 'OFF' -and
            $pending.deliveryState -eq 'PENDING' -and $null -eq $pending.confirmedAt) 'First command was prematurely confirmed'
    Expect ((LedStatus) -eq 'OFF') 'Device changed before status'
    $dbPending = (Sql "SELECT action,status,confirmedAt FROM ActionHistory WHERE id=$one;").Split("`t")
    Expect ($dbPending[0] -eq 'ON' -and $dbPending[1] -eq 'OFF' -and $dbPending[2] -eq 'NULL') 'Initial history DB values differ'
    Write-Output 'ON_from_OFF=pending_history_ON_OFF_null_device_OFF'

    PublishStatus (@{ requestId = 999999999; deviceCode = 'LED1'; status = 'ON' } | ConvertTo-Json -Compress)
    PublishStatus (@{ requestId = $one; deviceCode = 'LED2'; status = 'ON' } | ConvertTo-Json -Compress)
    PublishStatus (@{ requestId = $one; deviceCode = 'LED1'; status = 'BROKEN' } | ConvertTo-Json -Compress)
    PublishStatus ('{"requestId":' + $one + ',"deviceCode":"LED1"}')
    Start-Sleep -Seconds 1
    Expect ((GetHistory $one).deliveryState -eq 'PENDING') 'Invalid status confirmed history'
    Expect ((LedStatus) -eq 'OFF') 'Invalid status changed device'
    Write-Output 'unknown_id_wrong_device_bad_status_missing_field=ignored'

    PublishStatus (@{ requestId = $one; deviceCode = 'LED1'; status = 'ON' } | ConvertTo-Json -Compress)
    $confirmed = WaitHistory $one 'CONFIRMED'
    Expect ($confirmed.status -eq 'ON' -and $null -ne $confirmed.confirmedAt) 'First confirmation wrong'
    Expect ((LedStatus) -eq 'ON') 'Device did not become ON'
    $firstConfirmedAt = $confirmed.confirmedAt
    PublishStatus (@{ requestId = $one; deviceCode = 'LED1'; status = 'OFF' } | ConvertTo-Json -Compress)
    Start-Sleep -Milliseconds 600
    Expect ((GetHistory $one).confirmedAt -eq $firstConfirmedAt) 'Duplicate changed confirmedAt'
    Expect ((LedStatus) -eq 'ON') 'Duplicate changed device'
    Write-Output 'correct_ack=confirmed_ON_duplicate_ignored'

    $two = Command 'ON'
    Expect ((GetHistory $two).deliveryState -eq 'PENDING') 'Duplicate ON was not recorded separately'
    PublishStatus (@{ requestId = $two; deviceCode = 'LED1'; status = 'ON' } | ConvertTo-Json -Compress)
    $null = WaitHistory $two 'CONFIRMED'
    Write-Output 'duplicate_ON=new_history_and_command'

    $three = Command 'OFF'
    PublishStatus (@{ requestId = $three; deviceCode = 'LED1'; status = 'ON' } | ConvertTo-Json -Compress)
    $different = WaitHistory $three 'CONFIRMED'
    Expect ($different.action -eq 'OFF' -and $different.status -eq 'ON') 'Action and actual Status were not independent'
    Write-Output 'action_OFF_actual_status_ON=preserved'

    $four = Command 'OFF'
    Start-Sleep -Seconds 11
    $timedOut = GetHistory $four
    Expect ($timedOut.deliveryState -eq 'TIMEOUT' -and $null -eq $timedOut.confirmedAt -and $timedOut.status -eq 'ON') 'Timeout state wrong'
    Expect ((LedStatus) -eq 'ON') 'Timeout changed device'
    PublishStatus (@{ requestId = $four; deviceCode = 'LED1'; status = 'OFF' } | ConvertTo-Json -Compress)
    $late = WaitHistory $four 'CONFIRMED'
    Expect ($late.status -eq 'OFF' -and $null -ne $late.confirmedAt) 'Late status did not confirm'
    Expect ((LedStatus) -eq 'OFF') 'Late status did not update device'
    Write-Output 'timeout_after_10s=TIMEOUT_no_device_change_late_ack=CONFIRMED'

    $five = Command 'OFF'
    $six = Command 'ON'
    PublishStatus (@{ requestId = $six; deviceCode = 'LED1'; status = 'ON' } | ConvertTo-Json -Compress)
    $null = WaitHistory $six 'CONFIRMED'
    PublishStatus (@{ requestId = $five; deviceCode = 'LED1'; status = 'OFF' } | ConvertTo-Json -Compress)
    $old = WaitHistory $five 'CONFIRMED'
    Expect ($old.status -eq 'OFF') 'Old history not confirmed'
    Expect ((LedStatus) -eq 'ON') 'Old response overwrote newer device status'
    Write-Output 'reverse_ack_order=both_histories_confirmed_newer_device_status_kept'

    $messages = @(Receive-Job $subscriber -Wait)
    Expect ($messages.Count -eq 6) "Expected six command publishes, got $($messages.Count)"
    for ($i = 0; $i -lt 6; $i++) {
        $expectedId = $testIds[$i]
        $expectedAction = @('ON','ON','OFF','OFF','OFF','ON')[$i]
        $expected = '{"requestId":' + $expectedId + ',"deviceCode":"LED1","action":"' + $expectedAction + '"}'
        Expect ($messages[$i] -ceq $expected) "Command MQTT payload/order differs at index $i"
    }
    Write-Output 'mqtt_commands=six_exact_json_payloads_in_request_order'

    StopBroker $broker
    $broker = $null
    Start-Sleep -Seconds 2
    $failed = Invoke-WebRequest "$base/api/devices/$deviceId/actions" -Method POST `
        -Headers $headers -ContentType 'application/json' -Body '{"action":"OFF"}' -SkipHttpErrorCheck
    Expect ([int]$failed.StatusCode -eq 503) "Broker outage returned $($failed.StatusCode), expected 503"
    $errorBody = $failed.Content | ConvertFrom-Json
    Expect ($errorBody.code -eq 'MQTT_PUBLISH_FAILED' -and $errorBody.requestId -gt $baselineMax) 'Publish failure lacks requestId'
    $testIds.Add([long]$errorBody.requestId)
    $notSent = GetHistory ([long]$errorBody.requestId)
    Expect ($notSent.deliveryState -eq 'PENDING' -and $null -eq $notSent.confirmedAt -and $notSent.status -eq 'ON') 'Publish failure changed history status'
    Expect ((LedStatus) -eq 'ON') 'Publish failure changed device'
    Write-Output 'broker_down=503_with_requestId_history_unconfirmed_device_unchanged'

    $noToken = Invoke-WebRequest "$base/api/devices/$deviceId/actions" -Method POST `
        -ContentType 'application/json' -Body '{"action":"ON"}' -SkipHttpErrorCheck
    $badAction = Invoke-WebRequest "$base/api/devices/$deviceId/actions" -Method POST `
        -Headers $headers -ContentType 'application/json' -Body '{"action":"BLINK"}' -SkipHttpErrorCheck
    $badBody = Invoke-WebRequest "$base/api/devices/$deviceId/actions" -Method POST `
        -Headers $headers -ContentType 'application/json' -Body '{"action":"ON","extra":1}' -SkipHttpErrorCheck
    $unknown = Invoke-WebRequest "$base/api/devices/999999999/actions" -Method POST `
        -Headers $headers -ContentType 'application/json' -Body '{"action":"ON"}' -SkipHttpErrorCheck
    Expect ([int]$noToken.StatusCode -eq 401 -and [int]$badAction.StatusCode -eq 400 -and
            [int]$badBody.StatusCode -eq 400 -and [int]$unknown.StatusCode -eq 404) 'REST command validation/auth differed'
    Expect ([long](Sql 'SELECT COUNT(*) FROM ActionHistory;') -eq ($baselineCount + 7)) 'Invalid REST request created history'
    Write-Output 'rest_validation=no_JWT_401_bad_action_or_body_400_unknown_device_404'

    $broker = StartBroker
    Start-Sleep -Seconds 7
    $secondSubscriber = Start-Job -ArgumentList $env:IOT_MQTT_USER,$env:IOT_MQTT_PASSWORD `
        -ScriptBlock {
            param($user, $password)
            & 'C:\Program Files\Mosquitto\mosquitto_sub.exe' -h 127.0.0.1 -p 1883 `
                -u $user -P $password -q 0 -t 'iot/device/command' -C 1 -W 20
        }
    Start-Sleep -Seconds 2
    $led2Response = Invoke-WebRequest "$base/api/devices/$device2Id/actions" -Method POST `
        -Headers $headers -ContentType 'application/json' -Body '{"action":"ON"}' -SkipHttpErrorCheck
    Expect ([int]$led2Response.StatusCode -eq 202) 'LED2 command was not accepted after broker restart'
    $led2Id = [long](($led2Response.Content | ConvertFrom-Json).requestId)
    $testIds.Add($led2Id)
    Expect ((Led2Status) -eq 'OFF') 'LED2 changed before confirmation'
    $led2Messages = @(Receive-Job $secondSubscriber -Wait)
    Expect ($led2Messages.Count -eq 1 -and $led2Messages[0] -ceq `
        ('{"requestId":' + $led2Id + ',"deviceCode":"LED2","action":"ON"}')) 'LED2 MQTT command wrong after reconnect'
    PublishStatus (@{ requestId = $led2Id; deviceCode = 'LED2'; status = 'ON' } | ConvertTo-Json -Compress)
    $null = WaitHistory $led2Id 'CONFIRMED'
    Expect ((Led2Status) -eq 'ON') 'LED2 did not confirm after reconnect'
    Write-Output 'broker_restarted=LED2_command_and_status_confirmed'
}
finally {
    StopBroker $broker
    if ($null -ne $subscriber) {
        if ($subscriber.State -eq 'Running') { Stop-Job $subscriber }
        Remove-Job $subscriber -Force
    }
    if ($null -ne $secondSubscriber) {
        if ($secondSubscriber.State -eq 'Running') { Stop-Job $secondSubscriber }
        Remove-Job $secondSubscriber -Force
    }
    if ($testIds.Count -gt 0) {
        $ids = $testIds -join ','
        $rows = @(Sql "SELECT id FROM ActionHistory WHERE id IN ($ids) AND id > $baselineMax AND deviceId IN ($deviceId,$device2Id) AND createdAt >= '$started' ORDER BY id;")
        if ($rows.Count -gt 0) {
            $safeIds = @($rows | ForEach-Object { [long]$_ }) -join ','
            $null = Sql "DELETE FROM ActionHistory WHERE id IN ($safeIds);"
        }
        Write-Output "test_histories_removed=$($rows.Count)"
    }
    $null = Sql "UPDATE Device SET status='$originalStatus', updatedAt='$originalUpdatedAt' WHERE id=$deviceId;"
    $null = Sql "UPDATE Device SET status='$original2Status', updatedAt='$original2UpdatedAt' WHERE id=$device2Id;"
    $after = [long](Sql 'SELECT COUNT(*) FROM ActionHistory;')
    Write-Output "history_count_after_cleanup=$after baseline=$baselineCount"
    Expect ($after -eq $baselineCount) 'History cleanup did not restore baseline count'
}
