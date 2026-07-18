/**
 * chart-irr.js
 * Gráficos: Irradiação mensal + Geração mensal estimada
 */

let irrChartInstance = null;
let generationChartInstance = null;

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const DIAS_POR_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // média (fevereiro = 28)

// ─── Gráfico de Irradiação (já existia) ─────────────────────────────────────
function renderIrrChart(irrs, media) {
  const ctx = document.getElementById('irr-chart').getContext('2d');
  if (irrChartInstance) irrChartInstance.destroy();

  irrChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: MESES,
      datasets: [{
        label: 'Irradiação',
        data: irrs,
        backgroundColor: irrs.map(v => v >= media ? 'rgba(245,166,35,0.85)' : 'rgba(245,166,35,0.35)'),
        borderColor: irrs.map(v => v >= media ? 'rgba(245,166,35,1)' : 'rgba(245,166,35,0.5)'),
        borderWidth: 1,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { title: { display: true, text: 'kWh/m²/dia' } }
      }
    }
  });
}




/**
 * Gráfico de Geração Mensal com linha de referência do consumo pretendido
 */
function renderGenerationChart(potenciaTotalKwp, irradiacaoMensal, perdasPercent, geracaoPretendida) {
  const canvas = document.getElementById('generation-chart');
  if (!canvas) {
    console.error("❌ Canvas #generation-chart não encontrado!");
    return;
  }

  const ctx = canvas.getContext('2d');
  if (generationChartInstance) generationChartInstance.destroy();

  const fatorPerdas = 1 - (perdasPercent / 100);

  // Calcula geração mensal real
  const geracaoMensal = irradiacaoMensal.map((irrDia, index) => {
    const dias = DIAS_POR_MES[index];
    return potenciaTotalKwp * irrDia * dias * fatorPerdas;
  });

  const totalAnual = geracaoMensal.reduce((a, b) => a + b, 0);

  // Cria o gráfico
  generationChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: MESES,
      datasets: [
        {
          label: 'Geração Estimada (kWh)',
          data: geracaoMensal.map(v => Math.round(v)),
          backgroundColor: 'rgba(46, 204, 113, 0.85)',
          borderColor: '#2ECC71',
          borderWidth: 2,
          borderRadius: 8,
          order: 2
        },
        {
          label: 'Consumo Pretendido',
          data: Array(12).fill(Math.round(geracaoPretendida)),   // linha em todos os meses
          type: 'line',
          borderColor: '#e74c3c',        // vermelho
          borderWidth: 3,
          borderDash: [6, 3],            // linha tracejada
          pointRadius: 0,
          tension: 0,
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#7A95B8',
            usePointStyle: true,
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.raw} kWh`
          }
        }
      },
      scales: {
        y: {
          title: { 
            display: true, 
            text: 'Geração mensal (kWh)',
            color: '#7A95B8'
          },
          grid: { color: 'rgba(255,255,255,0.05)' }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });

  // Atualiza o total anual no card principal
  document.getElementById('r-anual').innerHTML = 
    `${Math.round(totalAnual)}<span class="result-unit">kWh/ano</span>`;
}

// ─── Destruir gráficos ───────────────────────────────────────────────────────
function destroyIrrChart() {
  if (irrChartInstance) { irrChartInstance.destroy(); irrChartInstance = null; }
  if (generationChartInstance) { generationChartInstance.destroy(); generationChartInstance = null; }
}