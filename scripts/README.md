# Development Scripts

## Warmup Script

### ¿Por qué las primeras invocaciones al API son lentas?

Next.js 15 usa **lazy compilation** (compilación bajo demanda) en modo desarrollo:

- ✅ **Ventaja**: El servidor inicia rápido (~3-5 segundos)
- ❌ **Desventaja**: Cada ruta se compila la primera vez que la visitas

**Ejemplo:**
```bash
# Primera invocación (con compilación)
○ Compiling /api/projects ...
✓ Compiled /api/projects in 5.9s (4744 modules)
GET /api/projects 200 in 6400ms  👈 5.9s compilación + 500ms query

# Segunda invocación (sin compilación)
GET /api/projects 200 in 54ms    👈 ⚡ 118x más rápido!
```

### Solución: Script de Warmup

El script `warmup-dev.sh` pre-compila las rutas más usadas al iniciar el servidor.

**Uso:**

```bash
# Opción 1: Iniciar con warmup automático (recomendado)
npm run dev:fast

# Opción 2: Ejecutar warmup manualmente después de iniciar
npm run dev
# En otra terminal:
./scripts/warmup-dev.sh
```

**Rutas que pre-compila:**
- `/api/auth/session` - Autenticación
- `/api/projects` - Lista de proyectos
- `/api/spaces` - Espacios
- `/api/notifications` - Notificaciones
- `/api/templates` - Templates

### Resultado

Después del warmup, todas las invocaciones al API responderán en **<200ms** en lugar de 5-10 segundos.

### Producción

En producción (`npm run build`), **todas las rutas se pre-compilan** automáticamente. No hay delays de compilación.

---

## Optimizaciones de Performance Implementadas

### 1. Optimización de `/api/projects` (N+1 Query Fix)

**Problema:**
- 1 query para proyectos + 9 queries individuales para contar tareas
- Tiempo: ~2.7 segundos ❌

**Solución:**
- 1 query única con JOIN para proyectos + tareas
- Cálculo de progreso en memoria
- Tiempo: ~50-160ms ✅

**Mejora:** 94-98% más rápido (50x)

### 2. Otras optimizaciones
- Uso consistente de `include` en Prisma para evitar N+1 queries
- JOINs eficientes en lugar de queries separadas
- Remoción de datos innecesarios del JSON de respuesta
