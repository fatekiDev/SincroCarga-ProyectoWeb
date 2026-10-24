#!/usr/bin/env bash
# Comprueba que las URLs de producción responden.
# Uso: API_URL=https://api.example.com FRONTEND_URL=https://app.example.com bash scripts/smoke-prod.sh
set -u
API_URL="${API_URL:-}"; FRONTEND_URL="${FRONTEND_URL:-}"
API_URL="${API_URL%/}"; FRONTEND_URL="${FRONTEND_URL%/}"
if [ -z "$API_URL" ] || [ -z "$FRONTEND_URL" ]; then
  echo "Faltan API_URL y/o FRONTEND_URL" >&2; exit 2
fi
fail=0
check() { # descripción, comando de prueba
  if eval "$2" >/dev/null 2>&1; then echo "OK    $1"; else echo "FALLA $1"; fail=1; fi
}
status() { curl -s -o /dev/null -w '%{http_code}' --max-time 60 "$@"; }

# Render (plan gratuito) puede tardar en despertar: primer intento con espera larga.
check "Frontend responde 200"                       "[ \"\$(status $FRONTEND_URL/)\" = 200 ]"
check "API: GET /api/health"                        "curl -fs --max-time 60 $API_URL/api/health | grep -q '\"status\":\"ok\"'"
check "API: GET /api/health/db (PostgreSQL/Neon)"   "curl -fs --max-time 60 $API_URL/api/health/db | grep -q '\"database\":\"connected\"'"
check "API: GET /api/publicaciones/catalogos"       "[ \"\$(status $API_URL/api/publicaciones/catalogos)\" = 200 ]"
check "API: GET /api/publicaciones"                 "[ \"\$(status $API_URL/api/publicaciones)\" = 200 ]"
check "API: ruta inexistente devuelve 404 JSON"     "[ \"\$(status $API_URL/api/no-existe)\" = 404 ]"
check "Rutas protegidas exigen sesión (401)"        "[ \"\$(status $API_URL/api/publicaciones/mine)\" = 401 ]"
check "Admin protegido sin sesión (401)"            "[ \"\$(status $API_URL/api/admin/resumen)\" = 401 ]"
check "CORS: origen del frontend permitido"         "curl -s -D - -o /dev/null -H 'Origin: $FRONTEND_URL' $API_URL/api/health | grep -qi 'access-control-allow-origin: $FRONTEND_URL'"
check "CORS: origen ajeno rechazado (403)"          "[ \"\$(status -H 'Origin: https://evil.example' $API_URL/api/health)\" = 403 ]"
exit $fail
