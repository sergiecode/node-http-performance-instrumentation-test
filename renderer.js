/**
 * renderer.js
 * 
 * Módulo para renderizar dinámicamente las propiedades de métricas en HTML.
 * Recibe un objeto de métricas y genera elementos DOM estructurados.
 */

/**
 * Renderiza todas las propiedades de un objeto de métricas en el DOM
 * 
 * @param {Object} data - Objeto con métricas a renderizar
 * @param {string} containerId - ID del contenedor HTML
 */
export function renderMetrics(data, containerId = 'metrics') {
  const container = document.getElementById(containerId);
  
  if (!container) {
    console.error(`Container with id "${containerId}" not found`);
    return;
  }

  // Limpiar contenedor
  container.innerHTML = '';

  // Crear secciones
  const sections = categorizeMetrics(data);

  Object.entries(sections).forEach(([sectionName, properties]) => {
    const section = createSection(sectionName, properties);
    container.appendChild(section);
  });
}

/**
 * Categoriza las métricas por tipo
 */
function categorizeMetrics(data) {
  const sections = {
    'Identificación': {},
    'Timestamps (microsegundos)': {},
    'Tamaños (bytes)': {},
    'HTTP y Backend': {},
    'Métricas Calculadas': {},
    'Estado': {}
  };

  Object.entries(data).forEach(([key, value]) => {
    if (key === '_iterationNumber' || key === '_threadNumber') {
      sections['Identificación'][key] = value;
    } else if (key.includes('Time') || key.includes('Start') || key.includes('End')) {
      sections['Timestamps (microsegundos)'][key] = value;
    } else if (key.includes('Size')) {
      sections['Tamaños (bytes)'][key] = value;
    } else if (key.startsWith('_http') || key === '_podInstance' || key === '_profiling' || key === '_resultPayload') {
      sections['HTTP y Backend'][key] = value;
    } else if (key.startsWith('is') || key === 'confidenceRange') {
      sections['Estado'][key] = value;
    } else {
      sections['Métricas Calculadas'][key] = value;
    }
  });

  return sections;
}

/**
 * Crea una sección HTML con sus propiedades
 */
function createSection(title, properties) {
  const section = document.createElement('div');
  section.className = 'metric-section';

  const heading = document.createElement('h2');
  heading.textContent = title;
  section.appendChild(heading);

  Object.entries(properties).forEach(([key, value]) => {
    const row = createPropertyRow(key, value);
    section.appendChild(row);
  });

  return section;
}

/**
 * Crea una fila de propiedad con key y value
 */
function createPropertyRow(key, value) {
  const row = document.createElement('div');
  row.className = 'metric-row';

  const keySpan = document.createElement('span');
  keySpan.className = 'metric-key';
  keySpan.textContent = key;

  const valueSpan = document.createElement('span');
  valueSpan.className = 'metric-value';
  valueSpan.textContent = formatValue(key, value);

  row.appendChild(keySpan);
  row.appendChild(valueSpan);

  return row;
}

/**
 * Formatea valores según su tipo
 */
function formatValue(key, value) {
  // Limitar payloads largos
  if (key === '_resultPayload' && typeof value === 'string' && value.length > 100) {
    return value.substring(0, 100) + '...';
  }

  // Limitar headers largos
  if (key === '_httpHeaders' && typeof value === 'string' && value.length > 150) {
    return value.substring(0, 150) + '...';
  }

  // Formatear números con decimales
  if (typeof value === 'number' && !Number.isInteger(value)) {
    return value.toFixed(2);
  }

  // Formatear booleanos
  if (typeof value === 'boolean') {
    return value ? '✅ true' : '❌ false';
  }

  // Null/undefined
  if (value === null || value === undefined) {
    return 'null';
  }

  return JSON.stringify(value);
}

/**
 * Renderiza un mensaje de error
 */
export function renderError(error, containerId = 'metrics') {
  const container = document.getElementById(containerId);
  
  if (!container) return;

  container.innerHTML = `
    <div class="error-message">
      <h2>❌ Error</h2>
      <p>${error.message || error}</p>
    </div>
  `;
}
