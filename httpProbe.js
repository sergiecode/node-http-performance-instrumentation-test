/**
 * httpProbe.js
 * 
 * Módulo de instrumentación HTTP real que ejecuta una request y devuelve
 * un objeto plano con todas las propiedades necesarias para construir
 * una futura instancia de testeo de rendimiento HTTP.
 * 
 * Principio: La red se mide en Node.js, no en el browser.
 */

import https from 'https';
import http from 'http';
import { nowMicro } from './time.js';

/**
 * Ejecuta una request HTTP instrumentada con métricas completas
 * 
 * @param {Object} config - Configuración de la request
 * @param {string} config.url - URL completa a ejecutar
 * @param {string} [config.method='GET'] - Método HTTP
 * @param {string|null} [config.body=null] - Body de la request
 * @param {number} config.iterationNumber - Número de iteración lógica
 * @param {number} config.threadNumber - Slot de concurrencia
 * @returns {Promise<Object>} Objeto con todas las métricas instrumentadas
 */
export function probeRequest({ url, method = 'GET', body = null, iterationNumber, threadNumber }) {
  return new Promise((resolve, reject) => {
    const metrics = {
      // Identificación
      _iterationNumber: iterationNumber,
      _threadNumber: threadNumber,

      // Timestamps (microsegundos desde epoch)
      _startTime: nowMicro(),
      _endTime: 0,

      _requestStart: 0,
      _responseStart: 0,
      _responseEnd: 0,

      _domainLookupStart: 0,
      _domainLookupEnd: 0,

      // HTTP y backend
      _httpStatus: 0,
      _httpHeaders: '',
      _resultPayload: '',
      _podInstance: null,
      _profiling: null,

      // Tamaños (bytes)
      _requestSize: body ? Buffer.byteLength(body) : 0,
      _responseSize: 0,
      _transferSize: 0
    };

    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    const req = protocol.request(url, { method }, res => {
      metrics._httpStatus = res.statusCode;
      metrics._httpHeaders = JSON.stringify(res.headers);
      metrics._podInstance = res.headers['x-pod-id'] ?? null;
      metrics._profiling = res.headers['server-timing'] ?? null;

      metrics._responseStart = nowMicro();

      let responseBody = '';
      res.on('data', chunk => {
        metrics._responseSize += chunk.length;
        responseBody += chunk.toString();
      });

      res.on('end', () => {
        metrics._responseEnd = nowMicro();
        metrics._endTime = nowMicro();
        metrics._resultPayload = responseBody;
        metrics._transferSize = metrics._requestSize + metrics._responseSize;

        resolve(metrics);
      });
    });

    req.on('socket', socket => {
      socket.on('lookup', () => {
        metrics._domainLookupStart = nowMicro();
      });

      socket.on('connect', () => {
        metrics._domainLookupEnd = nowMicro();
        metrics._requestStart = nowMicro();
      });
    });

    req.on('error', err => {
      metrics._endTime = nowMicro();
      metrics._resultPayload = JSON.stringify({ error: err.message });
      reject(err);
    });

    if (body) req.write(body);
    req.end();
  });
}

/**
 * Métodos calculados derivados de las propiedades base
 */
export function calculateMetrics(metrics) {
  return {
    // Tamaño total de transferencia
    totalTransferSize: metrics._transferSize || (metrics._requestSize + metrics._responseSize),
    
    // Duración total end-to-end (milisegundos)
    duration: (metrics._endTime - metrics._startTime) / 1000,
    
    // Tiempo total de respuesta (milisegundos)
    totalResponseTime: (metrics._responseEnd - metrics._requestStart) / 1000,
    
    // Tiempo de lookup DNS (milisegundos)
    dnsLookupTime: (metrics._domainLookupEnd - metrics._domainLookupStart) / 1000,
    
    // Tiempo de procesamiento del servidor (estimado) (milisegundos)
    serverProcessingTime: ((metrics._responseStart - metrics._requestStart) / 1000) - 
                          ((metrics._domainLookupEnd - metrics._domainLookupStart) / 1000),
    
    // Tiempo hasta el primer byte - TTFB (milisegundos)
    timeToFirstByte: (metrics._responseStart - metrics._requestStart) / 1000,
    
    // Tiempo de descarga del response (milisegundos)
    downloadTime: (metrics._responseEnd - metrics._responseStart) / 1000
  };
}

/**
 * Booleanos de estado
 */
export function getStatusFlags(metrics, expectations = {}) {
  const { expectedStatus = 200 } = expectations;
  
  return {
    // Success basado en status esperado
    isSuccess: metrics._httpStatus === expectedStatus,
    
    // Cache local (si transferSize es 0)
    isLocalCached: metrics._transferSize === 0,
    
    // Cache del backend (basado en headers)
    isBackendCached: checkBackendCache(metrics._httpHeaders)
  };
}

/**
 * Confidence Range (SLA)
 */
export function getConfidenceRange(calculatedMetrics, slaThreshold = 1000) {
  const { duration } = calculatedMetrics;
  
  if (duration <= slaThreshold * 0.8) {
    return 'UNDER_SLA';
  } else if (duration <= slaThreshold) {
    return 'WITHIN_SLA';
  } else {
    return 'OVER_SLA';
  }
}

/**
 * Helper para verificar cache del backend
 */
function checkBackendCache(headersJson) {
  try {
    const headers = JSON.parse(headersJson);
    return !!(
      headers['x-cache'] || 
      headers['age'] || 
      headers['cf-cache-status']
    );
  } catch {
    return false;
  }
}
