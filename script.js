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
    cidade: "Santa Maria da Vitória – BA",
    validadeDias: 5
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

  if(proposta.cliente)        document.getElementById('in-cliente').value = proposta.cliente;
  if(proposta.representante)  document.getElementById('in-representante').value = proposta.representante;
  if(proposta.cidade)         document.getElementById('in-cidade').value = proposta.cidade;
  if(proposta.validadeDias)   document.getElementById('in-validade-dias').value = proposta.validadeDias;

  atualizarCapa();
}

function limparFormulario(){
  ['in-email','in-telefone','in-instagram','in-cliente','in-representante','in-cidade']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('in-validade-dias').value = 5;
  atualizarCapa();
}

function atualizarCapa(){
  const cliente = document.getElementById('in-cliente').value.trim() || '—';
  const representante = document.getElementById('in-representante').value.trim() || '—';
  const cidade = document.getElementById('in-cidade').value.trim() || '—';
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

  document.getElementById('out-cliente').textContent = cliente;
  document.getElementById('out-representante').textContent = representante;
  document.getElementById('out-cidade').textContent = cidade;
  document.getElementById('out-data').textContent = formatarDataBR(dataProposta);
  document.getElementById('out-validade').textContent = formatarDataBR(dataValidade);
  document.getElementById('out-email').textContent = email;
  document.getElementById('out-telefone').textContent = telefone;
  document.getElementById('out-instagram').textContent = instagram;
}

document.addEventListener('DOMContentLoaded', async () => {
  inicializarData();

  // ao abrir, já popula com os dados padrão do JSON (usuário pode sobrescrever manualmente depois)
  const dadosPadrao = await carregarDadosPadrao();
  preencherFormularioComDados(dadosPadrao);

  document.getElementById('btn-gerar').addEventListener('click', atualizarCapa);
  document.getElementById('btn-carregar-json').addEventListener('click', async () => {
    const dados = await carregarDadosPadrao();
    preencherFormularioComDados(dados);
  });
  document.getElementById('btn-limpar').addEventListener('click', limparFormulario);

  // atualização em tempo real conforme o usuário digita
  ['in-cliente','in-representante','in-cidade','in-data','in-validade-dias','in-email','in-telefone','in-instagram']
    .forEach(id => document.getElementById(id).addEventListener('input', atualizarCapa));
});