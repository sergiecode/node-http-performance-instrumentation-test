/**
 * main.js
 * 
 * Orquestador de ejecución que ejecuta requests HTTP instrumentadas
 * y muestra todas las métricas en consola.
 * 
 * Este es el entry point del proyecto.
 */

import { probeRequest, calculateMetrics, getStatusFlags, getConfidenceRange } from './httpProbe.js';

/**
 * Ejecuta una prueba completa de instrumentación HTTP
 */
async function runInstrumentation() {
  console.log('🚀 Node HTTP Performance Instrumentation Test\n');
  console.log('═'.repeat(60));
  console.log('Principio: La red se mide en Node.js, no en el browser');
  console.log('═'.repeat(60));
  console.log();

  const testUrl = 'https://jsonplaceholder.typicode.com/posts/1';
  
  console.log(`📡 Ejecutando request a: ${testUrl}`);
  console.log();

  try {
    // Ejecutar la request instrumentada
    const rawMetrics = await probeRequest({
      url: testUrl,
      method: 'GET',
      body: null,
      iterationNumber: 1,
      threadNumber: 0
    });

    // Calcular métricas derivadas
    const calculatedMetrics = calculateMetrics(rawMetrics);
    
    // Obtener flags de estado
    const statusFlags = getStatusFlags(rawMetrics, { expectedStatus: 200 });
    
    // Obtener confidence range (SLA: 1000ms)
    const confidenceRange = getConfidenceRange(calculatedMetrics, 1000);

    // Mostrar resultados en consola
    displayResults(rawMetrics, calculatedMetrics, statusFlags, confidenceRange);

  } catch (error) {
    console.error('❌ Error durante la instrumentación:', error.message);
  }
}

/**
 * Muestra todos los resultados de forma estructurada en consola
 */
function displayResults(raw, calculated, flags, confidence) {
  console.log('\n┌─────────────────────────────────────────────────────────┐');
  console.log('│                  RAW METRICS (Base)                    │');
  console.log('└─────────────────────────────────────────────────────────┘\n');
  
  console.group('📋 Identificación');
  console.log('_iterationNumber:', raw._iterationNumber);
  console.log('_threadNumber:', raw._threadNumber);
  console.groupEnd();
  console.log();

  console.group('⏱️  Timestamps (microsegundos desde epoch)');
  console.log('_startTime:', raw._startTime);
  console.log('_domainLookupStart:', raw._domainLookupStart);
  console.log('_domainLookupEnd:', raw._domainLookupEnd);
  console.log('_requestStart:', raw._requestStart);
  console.log('_responseStart:', raw._responseStart);
  console.log('_responseEnd:', raw._responseEnd);
  console.log('_endTime:', raw._endTime);
  console.groupEnd();
  console.log();

  console.group('📦 Tamaños (bytes)');
  console.log('_requestSize:', raw._requestSize);
  console.log('_responseSize:', raw._responseSize);
  console.log('_transferSize:', raw._transferSize);
  console.groupEnd();
  console.log();

  console.group('🌐 HTTP y Backend');
  console.log('_httpStatus:', raw._httpStatus);
  console.log('_podInstance:', raw._podInstance);
  console.log('_profiling:', raw._profiling);
  console.log('_httpHeaders:', raw._httpHeaders.substring(0, 100) + '...');
  console.log('_resultPayload:', raw._resultPayload.substring(0, 100) + '...');
  console.groupEnd();
  console.log();

  console.log('\n┌─────────────────────────────────────────────────────────┐');
  console.log('│              CALCULATED METRICS (Derivadas)             │');
  console.log('└─────────────────────────────────────────────────────────┘\n');

  console.group('📊 Métricas Calculadas');
  console.log('totalTransferSize:', calculated.totalTransferSize, 'bytes');
  console.log('duration:', calculated.duration.toFixed(2), 'ms');
  console.log('totalResponseTime:', calculated.totalResponseTime.toFixed(2), 'ms');
  console.log('dnsLookupTime:', calculated.dnsLookupTime.toFixed(2), 'ms');
  console.log('serverProcessingTime:', calculated.serverProcessingTime.toFixed(2), 'ms');
  console.log('timeToFirstByte (TTFB):', calculated.timeToFirstByte.toFixed(2), 'ms');
  console.log('downloadTime:', calculated.downloadTime.toFixed(2), 'ms');
  console.groupEnd();
  console.log();

  console.log('\n┌─────────────────────────────────────────────────────────┐');
  console.log('│                   STATUS FLAGS                          │');
  console.log('└─────────────────────────────────────────────────────────┘\n');

  console.group('✅ Booleanos de Estado');
  console.log('isSuccess:', flags.isSuccess);
  console.log('isLocalCached:', flags.isLocalCached);
  console.log('isBackendCached:', flags.isBackendCached);
  console.groupEnd();
  console.log();

  console.log('\n┌─────────────────────────────────────────────────────────┐');
  console.log('│                 CONFIDENCE RANGE (SLA)                  │');
  console.log('└─────────────────────────────────────────────────────────┘\n');

  const confidenceEmoji = {
    'UNDER_SLA': '🟢',
    'WITHIN_SLA': '🟡',
    'OVER_SLA': '🔴'
  };

  console.log(`${confidenceEmoji[confidence]} Confidence Range: ${confidence}`);
  console.log();

  console.log('═'.repeat(60));
  console.log('✅ Instrumentación completada correctamente');
  console.log('═'.repeat(60));
}

// Ejecutar la instrumentación
runInstrumentation();
