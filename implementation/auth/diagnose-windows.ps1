$urls = @('https://aviarockets.cl/login.html','https://aviarockets.cl/register.html','https://api.aviarockets.cl/api/v1/health','https://api.aviarockets.cl/api/v1/auth/me')
foreach ($url in $urls) { curl.exe --max-time 20 -sS -o NUL -w "$url HTTP %{http_code} TLS %{ssl_verify_result}\n" $url }
curl.exe --max-time 20 -sS -o NUL -D - -X OPTIONS https://api.aviarockets.cl/api/v1/auth/login -H 'Origin: https://aviarockets.cl' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: content-type' | Select-String 'Access-Control'
