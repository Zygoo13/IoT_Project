#!/bin/sh
set -eu

# Bind mount Windows không giữ quyền POSIX; dùng bản sao riêng trong container.
cp /run/secrets/mosquitto-passwords /mosquitto/config/passwords
chown mosquitto:mosquitto /mosquitto/config/passwords /mosquitto/data
chmod 600 /mosquitto/config/passwords
exec /usr/sbin/mosquitto -c /mosquitto/config/mosquitto.conf
