#!/usr/bin/env bash
set -u
for url in https://aviarockets.cl/login.html https://aviarockets.cl/register.html https://api.aviarockets.cl/api/v1/health https://api.aviarockets.cl/api/v1/auth/me; do
 curl --max-time 20 -sS -o /dev/null -w "$url HTTP %{http_code} TLS %{ssl_verify_result}\n" "$url" || true
done
curl --max-time 20 -sS -o /dev/null -D - -X OPTIONS https://api.aviarockets.cl/api/v1/auth/login -H 'Origin: https://aviarockets.cl' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: content-type' | sed -n '/^[Aa]ccess-[Cc]ontrol/p'
