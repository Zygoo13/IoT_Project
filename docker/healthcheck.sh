#!/bin/sh
# Kiểm tra cả trang React và API đã được Spring Boot phục vụ.
curl --fail --silent http://127.0.0.1/ > /dev/null || exit 1
status=$(curl --silent --output /dev/null --write-out '%{http_code}' http://127.0.0.1/api/profile)
[ "$status" = "401" ]
