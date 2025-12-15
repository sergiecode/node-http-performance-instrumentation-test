# node-http-performance-instrumentation-test

Instrumentación HTTP en Node.js para medir latencia, timings de red y métricas reales con precisión de microsegundos.

## Qué hace

Ejecuta requests HTTP reales desde Node.js y captura:
- Timestamps de DNS, conexión, TTFB y descarga
- Tamaños de transferencia (request + response)
- Status HTTP y headers del backend
- Métricas calculadas (duration, serverProcessingTime, etc.)

## Cómo ejecutar

```bash
# Test con métricas reales
node main.js

# Visualización HTML (datos simulados)
start index.html
```

## Propiedades capturadas

### Timestamps (microsegundos desde epoch)

| Propiedad | Qué mide |
|-----------|----------|
| `_startTime` | Inicio total |
| `_domainLookupStart` | Inicio DNS |
| `_domainLookupEnd` | Fin DNS |
| `_requestStart` | Envío del request |
| `_responseStart` | Primer byte (TTFB) |
| `_responseEnd` | Fin de descarga |
| `_endTime` | Fin completo |

### Tamaños (bytes)

| Propiedad | Valor |
|-----------|-------|
| `_requestSize` | Bytes enviados |
| `_responseSize` | Bytes recibidos |
| `_transferSize` | Total transferido |

### HTTP

| Propiedad | Contenido |
|-----------|-----------|
| `_httpStatus` | Código de status |
| `_httpHeaders` | Headers del response |
| `_resultPayload` | Body recibido |
| `_podInstance` | ID del pod backend |
| `_profiling` | Server-Timing header |

## Métricas calculadas (en milisegundos)

```js
duration             = (_endTime - _startTime) / 1000
dnsLookupTime        = (_domainLookupEnd - _domainLookupStart) / 1000
timeToFirstByte      = (_responseStart - _requestStart) / 1000
downloadTime         = (_responseEnd - _responseStart) / 1000
serverProcessingTime = timeToFirstByte - dnsLookupTime
```

## Estados

| Flag | Indica |
|------|--------|
| `isSuccess` | Status HTTP cumple expectativa |
| `isBackendCached` | Response viene de cache |
| `confidenceRange` | `UNDER_SLA` / `WITHIN_SLA` / `OVER_SLA` |

## Estructura

```
time.js       → Fuente de tiempo de alta precisión
httpProbe.js  → Instrumentación HTTP completa
main.js       → Orquestador y logging en consola
index.html    → Visualización web
style.css     → Estilos
renderer.js   → Renderizado dinámico (opcional para HTML)
```

## Ejemplo de salida

```
🚀 Node HTTP Performance Instrumentation Test
📡 Ejecutando request a: https://jsonplaceholder.typicode.com/posts/1

📊 Métricas Calculadas
  duration: 84.92 ms
  dnsLookupTime: 4.42 ms
  timeToFirstByte (TTFB): 14.20 ms
  downloadTime: 0.60 ms
  serverProcessingTime: 9.77 ms

🟢 Confidence Range: UNDER_SLA
```

## Requisitos

- Node.js 18+ (para ESM nativo)
- Sin dependencias externas (solo módulos nativos)
