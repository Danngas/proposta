// =====================================================
// ENNER ENGENHARIA — PROPOSTA COMERCIAL
// Lógica da capa: dados dinâmicos, dados padrão via JSON,
// e cálculo automático de datas (validade = data + N dias)
// =====================================================

// Fallback embutido, usado caso data.json não possa ser carregado
// (ex: abrindo o arquivo direto no navegador sem servidor local)
const DADOS_PADRAO_FALLBACK = {
  empresa: {
    nome: "Enner Engenharia",
    email: "suporte.enner@gmail.com",
    telefone: "(71) 9 9923-9315",
    instagram: "@enner.engenharia"
  },
  propostaPadrao: {
    cliente: "Francisco",
    representante: "Eng. Hiago Macedo",
    representanteTelefone: "(71) 9 8888-7777",
    cidade: "Santa Maria da Vitória – BA",
    endereco: "Rua Exemplo, 100",
    validadeDias: 5,
    geracao: {
      estado: "Bahia",
      municipio: "Santa Maria da Vitória",
      potenciaModuloW: 610,
      qtdModulos: 20,
      perdasPercent: 14,
      diasMes: 30,
      consumoMedioKwh: 1200,
      valorContaAtual: 1250.00
    },
    itens: {
      kit: {
        titulo: "Kit fotovoltaico",
        qtd: "01",
        descricao: ["SAJ R6-10K", "20 módulos 610 W", "Cabos, String Box CC e Quadro CA"]
      },
      engenharia: {
        titulo: "Engenharia",
        qtd: "01",
        descricao: ["Vistoria e visita técnica", "Homologação", "Comissionamento", "Monitoramento"]
      },
      instalacao: {
        titulo: "Instalação",
        qtd: "01",
        descricao: ["Incluso"]
      }
    },
    destaques: {
      geracaoMensalKwh: "10.000",
      economiaPercentual: "95"
    }
  }
};

function formatarDataBR(date){
  const dd = String(date.getDate()).padStart(2,'0');
  const mm = String(date.getMonth()+1).padStart(2,'0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function somarDias(date, dias){
  const d = new Date(date);
  d.setDate(d.getDate() + dias);
  return d;
}

function inicializarData(){
  const inputData = document.getElementById('in-data');
  const hoje = new Date();
  const iso = hoje.toISOString().split('T')[0];
  inputData.value = iso;
}

// Busca data.json; se falhar (ex: file:// sem servidor), usa o fallback embutido
async function carregarDadosPadrao(){
  try{
    const resp = await fetch('data.json');
    if(!resp.ok) throw new Error('data.json não encontrado');
    return await resp.json();
  }catch(err){
    console.warn('Não foi possível carregar data.json, usando dados padrão embutidos.', err);
    return DADOS_PADRAO_FALLBACK;
  }
}

function preencherFormularioComDados(dados){
  const empresa = dados.empresa || {};
  const proposta = dados.propostaPadrao || {};

  if(empresa.email)      document.getElementById('in-email').value = empresa.email;
  if(empresa.telefone)   document.getElementById('in-telefone').value = empresa.telefone;
  if(empresa.instagram)  document.getElementById('in-instagram').value = empresa.instagram;

  if(proposta.cliente)              document.getElementById('in-cliente').value = proposta.cliente;
  if(proposta.representante)        document.getElementById('in-representante').value = proposta.representante;
  if(proposta.representanteTelefone) document.getElementById('in-representante-telefone').value = proposta.representanteTelefone;
  if(proposta.cidade)               document.getElementById('in-cidade').value = proposta.cidade;
  if(proposta.endereco)       document.getElementById('in-endereco').value = proposta.endereco;
  if(proposta.validadeDias)   document.getElementById('in-validade-dias').value = proposta.validadeDias;

  const itens = proposta.itens || {};
  if(itens.kit){
    document.getElementById('in-kit-titulo').value = itens.kit.titulo || '';
    document.getElementById('in-kit-desc').value = (itens.kit.descricao || []).join('\n');
    document.getElementById('in-kit-qtd').value = itens.kit.qtd || '';
  }
  if(itens.engenharia){
    document.getElementById('in-engenharia-titulo').value = itens.engenharia.titulo || '';
    document.getElementById('in-engenharia-desc').value = (itens.engenharia.descricao || []).join('\n');
    document.getElementById('in-engenharia-qtd').value = itens.engenharia.qtd || '';
  }
  if(itens.instalacao){
    document.getElementById('in-instalacao-titulo').value = itens.instalacao.titulo || '';
    document.getElementById('in-instalacao-desc').value = (itens.instalacao.descricao || []).join('\n');
    document.getElementById('in-instalacao-qtd').value = itens.instalacao.qtd || '';
  }

  const destaques = proposta.destaques || {};
  if(destaques.geracaoMensalKwh) document.getElementById('in-geracao').value = destaques.geracaoMensalKwh;
  if(destaques.economiaPercentual) document.getElementById('in-economia').value = destaques.economiaPercentual;

  const geracao = proposta.geracao || {};
  if(geracao.potenciaModuloW) document.getElementById('in-potencia-modulo').value = geracao.potenciaModuloW;
  if(geracao.qtdModulos)      document.getElementById('in-qtd-modulos').value = geracao.qtdModulos;
  if(geracao.perdasPercent !== undefined) document.getElementById('in-perdas').value = geracao.perdasPercent;
  if(geracao.diasMes)         document.getElementById('in-dias-mes').value = geracao.diasMes;
  if(geracao.consumoMedioKwh) document.getElementById('in-consumo-medio').value = geracao.consumoMedioKwh;
  if(geracao.valorContaAtual !== undefined) document.getElementById('in-valor-conta').value = geracao.valorContaAtual;

  if(geracao.estado && geracao.municipio && window.aplicarLocalizacaoPadrao){
    window.aplicarLocalizacaoPadrao(geracao.estado, geracao.municipio);
  }

  atualizarCapa();
}

function limparFormulario(){
  ['in-email','in-telefone','in-instagram','in-cliente','in-representante','in-representante-telefone','in-cidade','in-endereco',
   'in-kit-titulo','in-kit-desc','in-kit-qtd',
   'in-engenharia-titulo','in-engenharia-desc','in-engenharia-qtd',
   'in-instalacao-titulo','in-instalacao-desc','in-instalacao-qtd',
   'in-geracao','in-economia','in-estado','in-consumo-medio','in-valor-conta']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('in-validade-dias').value = 5;
  document.getElementById('in-potencia-modulo').value = 610;
  document.getElementById('in-qtd-modulos').value = 20;
  document.getElementById('in-perdas').value = 14;
  document.getElementById('in-dias-mes').value = 30;
  const inputMunicipio = document.getElementById('in-municipio');
  inputMunicipio.value = '';
  inputMunicipio.disabled = true;
  inputMunicipio.placeholder = 'Selecione o estado primeiro';
  atualizarCapa();
  if(window.atualizarPagina4) window.atualizarPagina4();
}

function preencherChecklist(ulId, itensTexto){
  const ul = document.getElementById(ulId);
  ul.innerHTML = '';
  itensTexto
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
    .forEach(linha => {
      const li = document.createElement('li');
      li.textContent = linha;
      ul.appendChild(li);
    });
}

function atualizarCapa(){
  const cliente = document.getElementById('in-cliente').value.trim() || '—';
  const representante = document.getElementById('in-representante').value.trim() || '—';
  const representanteTelefone = document.getElementById('in-representante-telefone').value.trim() || '—';
  const cidade = document.getElementById('in-cidade').value.trim() || '—';
  const endereco = document.getElementById('in-endereco').value.trim() || '—';
  const email = document.getElementById('in-email').value.trim() || '—';
  const telefone = document.getElementById('in-telefone').value.trim() || '—';
  const instagram = document.getElementById('in-instagram').value.trim() || '—';
  const dataStr = document.getElementById('in-data').value;
  const diasValidade = parseInt(document.getElementById('in-validade-dias').value, 10) || 5;

  let dataProposta;
  if(dataStr){
    const [y,m,d] = dataStr.split('-').map(Number);
    dataProposta = new Date(y, m-1, d);
  } else {
    dataProposta = new Date();
  }

  const dataValidade = somarDias(dataProposta, diasValidade);
  const dataFormatada = formatarDataBR(dataProposta);
  const validadeFormatada = formatarDataBR(dataValidade);

  // --- Capa (página 1) ---
  document.getElementById('out-cliente').textContent = cliente;
  document.getElementById('out-representante').textContent = representante;
  document.getElementById('out-cidade').textContent = cidade;
  document.getElementById('out-data').textContent = dataFormatada;
  document.getElementById('out-validade').textContent = validadeFormatada;
  document.getElementById('out-email').textContent = email;
  document.getElementById('out-telefone').textContent = telefone;
  document.getElementById('out-instagram').textContent = instagram;

  // --- Página 2: dados da proposta ---
  document.getElementById('p2-out-data').textContent = dataFormatada;
  document.getElementById('p2-out-validade').textContent = validadeFormatada;
  document.getElementById('p2-out-representante').textContent = representante;
  document.getElementById('p2-out-telefone').textContent = representanteTelefone;
  document.getElementById('p2-out-email').textContent = email;
  document.getElementById('p2-out-instagram').textContent = instagram;
  document.getElementById('p2-out-cliente').textContent = cliente;
  document.getElementById('p2-out-cidade').textContent = cidade;
  document.getElementById('p2-out-endereco').textContent = endereco;
  document.getElementById('p2-out-telefone-footer').textContent = telefone;
  document.getElementById('p2-out-email-footer').textContent = email;
  document.getElementById('p2-out-instagram-footer').textContent = instagram;

  // --- Página 4: rodapé (mesmos dados da empresa) ---
  document.getElementById('p4-out-telefone-footer').textContent = telefone;
  document.getElementById('p4-out-email-footer').textContent = email;
  document.getElementById('p4-out-instagram-footer').textContent = instagram;

  // --- Página 2: itens da proposta ---
  document.getElementById('p2-item-kit-titulo').textContent = document.getElementById('in-kit-titulo').value.trim() || 'Kit';
  document.getElementById('p2-item-kit-qtd').textContent = document.getElementById('in-kit-qtd').value.trim() || '01';
  preencherChecklist('p2-item-kit-desc', document.getElementById('in-kit-desc').value);

  document.getElementById('p2-item-engenharia-titulo').textContent = document.getElementById('in-engenharia-titulo').value.trim() || 'Engenharia';
  document.getElementById('p2-item-engenharia-qtd').textContent = document.getElementById('in-engenharia-qtd').value.trim() || '01';
  preencherChecklist('p2-item-engenharia-desc', document.getElementById('in-engenharia-desc').value);

  document.getElementById('p2-item-instalacao-titulo').textContent = document.getElementById('in-instalacao-titulo').value.trim() || 'Instalação';
  document.getElementById('p2-item-instalacao-qtd').textContent = document.getElementById('in-instalacao-qtd').value.trim() || '01';
  preencherChecklist('p2-item-instalacao-desc', document.getElementById('in-instalacao-desc').value);

  // --- Página 2: destaques do sistema ---
  document.getElementById('p2-out-geracao').textContent = document.getElementById('in-geracao').value.trim() || '10.000';
  document.getElementById('p2-out-economia').textContent = document.getElementById('in-economia').value.trim() || '95';
}

document.addEventListener('DOMContentLoaded', async () => {
  inicializarData();

  // ao abrir, já popula com os dados padrão do JSON (usuário pode sobrescrever manualmente depois)
  const dadosPadrao = await carregarDadosPadrao();
  preencherFormularioComDados(dadosPadrao);

  document.getElementById('btn-gerar').addEventListener('click', atualizarCapa);
  document.getElementById('btn-baixar-pdf').addEventListener('click', () => window.print());
  document.getElementById('btn-carregar-json').addEventListener('click', async () => {
    const dados = await carregarDadosPadrao();
    preencherFormularioComDados(dados);
  });
  document.getElementById('btn-limpar').addEventListener('click', limparFormulario);

  // atualização em tempo real conforme o usuário digita
  ['in-cliente','in-representante','in-representante-telefone','in-cidade','in-endereco','in-data','in-validade-dias',
   'in-email','in-telefone','in-instagram',
   'in-kit-titulo','in-kit-desc','in-kit-qtd',
   'in-engenharia-titulo','in-engenharia-desc','in-engenharia-qtd',
   'in-instalacao-titulo','in-instalacao-desc','in-instalacao-qtd',
   'in-geracao','in-economia']
    .forEach(id => document.getElementById(id).addEventListener('input', atualizarCapa));
});
