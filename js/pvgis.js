/**
 * pvgis.js
 * Serviço de consulta à API PVGIS (JRC) — irradiação solar
 * Usa proxy CORS para contornar restrições de browser (GitHub Pages)
 * Autor: Daniel Silva de Souza
 *
 * Equivalente ao solar/services/pvgis_service.py
 */

const PVGIS_BASE = 'https://re.jrc.ec.europa.eu/api/v5_2/PVcalc';

// Proxy CORS público — necessário pois o PVGIS não permite chamadas diretas do browser
const CORS_PROXY = 'https://corsproxy.io/?';

/**
 * Busca dados de irradiação mensal no PVGIS para um par lat/lon.
 *
 * @param {number} lat  - Latitude
 * @param {number} lon  - Longitude
 * @returns {Promise<{ irradiacaoMediaDiaria: number, mensal: number[], fonte: string }>}
 */
async function getIrradiation(lat, lon) {
  const params = new URLSearchParams({
    lat,
    lon,
    peakpower: 1,       // 1 kWp para normalização
    loss: 0,            // perdas tratadas no sizing
    outputformat: 'json'
  });

  const targetUrl = `${PVGIS_BASE}?${params.toString()}`;
  const proxyUrl  = `${CORS_PROXY}${encodeURIComponent(targetUrl)}`;

  const response = await fetch(proxyUrl, { timeout: 15000 });

  if (!response.ok) {
    throw new Error(`PVGIS HTTP ${response.status}`);
  }

  const data = await response.json();

  let monthly;
  try {
    monthly = data.outputs.monthly.fixed;
  } catch {
    throw new Error('Resposta inesperada da API PVGIS.');
  }

  const irrs = monthly.map(m => m['H(i)_d']).filter(v => v !== undefined);

  if (!irrs.length) {
    throw new Error('Dados de irradiação não encontrados na resposta do PVGIS.');
  }

  const media = irrs.reduce((a, b) => a + b, 0) / irrs.length;

  return {
    irradiacaoMediaDiaria: parseFloat(media.toFixed(3)),
    mensal: irrs,
    fonte: 'pvgis',
    lat: parseFloat(lat.toFixed(6)),
    lon: parseFloat(lon.toFixed(6)),
  };
}
