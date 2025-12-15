/**
 * Fuente de tiempo en microsegundos desde Unix epoch
 * 
 * Todas las propiedades temporales se almacenan como number en microsegundos
 * para garantizar:
 * - Serialización simple
 * - Precisión sub-milisegundo
 * - Cálculos matemáticos directos
 */

const EPOCH_START = Date.now() * 1000;
const HR_START = process.hrtime.bigint();

/**
 * Retorna el tiempo actual en microsegundos desde Unix epoch
 * @returns {number} Microsegundos desde epoch
 */
export function nowMicro() {
  const diff = process.hrtime.bigint() - HR_START;
  return EPOCH_START + Number(diff / 1000n);
}
