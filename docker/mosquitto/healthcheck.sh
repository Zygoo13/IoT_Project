#!/bin/sh
set -eu

# Kiểm tra cả listener và xác thực, chỉ đọc trạng thái broker.
mosquitto_sub -h 127.0.0.1 -p 1883 \
  -u "$IOT_MQTT_USER" -P "$IOT_MQTT_PASSWORD" \
  -t '$SYS/broker/uptime' -C 1 -W 4 >/dev/null 2>&1
