#!/bin/bash

echo "📊 Midiendo performance de APIs..."
echo "=================================="
echo ""

# Array de endpoints a medir
endpoints=(
  "/api/auth/session"
  "/api/projects"
  "/api/spaces"
  "/api/notifications"
  "/api/templates"
)

# Función para medir un endpoint
measure_endpoint() {
  local endpoint=$1
  local url="http://localhost:3030${endpoint}"
  
  echo "⏱️  Midiendo ${endpoint}..."
  
  # Ejecutar 3 veces y tomar el promedio
  local total=0
  for i in {1..3}; do
    local time=$(curl -w "%{time_total}" -o /dev/null -s "${url}")
    local ms=$(echo "${time} * 1000" | bc)
    total=$(echo "${total} + ${ms}" | bc)
    echo "   Intento ${i}: ${ms}ms"
  done
  
  local avg=$(echo "scale=2; ${total} / 3" | bc)
  echo "   ✅ Promedio: ${avg}ms"
  echo ""
}

# Medir cada endpoint
for endpoint in "${endpoints[@]}"; do
  measure_endpoint "${endpoint}"
done

echo "=================================="
echo "✅ Diagnóstico completado"
