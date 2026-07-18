/**
 * data.js
 * Carrega estados, municípios e agora a base OFFLINE da Bahia
 */

let ESTADOS = [];
let MUNICIPIOS = {};
let IRRADIACAO_BA = {};   // ← NOVO

async function initData() {
  try {
    const [estResp, munResp, baResp] = await Promise.all([
      fetch('data/estados.json'),
      fetch('data/municipios.json'),
      fetch('data/irradiacao_bahia.json')
    ]);

    ESTADOS    = await estResp.json();
    MUNICIPIOS = await munResp.json();
    IRRADIACAO_BA = await baResp.json();

    console.log(`[data] ${ESTADOS.length} estados | ${Object.values(MUNICIPIOS).flat().length} municípios`);
    console.log(`[data] ${Object.keys(IRRADIACAO_BA).length} cidades da Bahia com dados OFFLINE carregados.`);

  } catch (err) {
    console.error('[data] Falha ao carregar base geográfica:', err);
    alert('Erro ao carregar a base de dados. Verifique os arquivos em /data/.');
  }
}