import fs from 'fs';

// Caminho do arquivo original (fora do workspace)
const CAMINHO_ORIGINAL = 'c:/Users/pablo/OneDrive/Documentos/scraper/output/masculino.json';
const CAMINHO_BACKUP = 'c:/Users/pablo/OneDrive/Documentos/scraper/output/masculino.backup.json';

function extrairNomeEDescricao(nomeCompleto) {
  if (!nomeCompleto || typeof nomeCompleto !== 'string') {
    return { nomeAjustado: nomeCompleto || '', descricao: '' };
  }
  const partes = nomeCompleto.split(' - ');
  const nomeAjustado = partes[0].trim();
  const descricao = partes.slice(1).join(' - ').trim();
  return { nomeAjustado, descricao };
}

function refatorarItem(item) {
  const novo = { ...item };
  // Corrige campos faltantes/typos
  if (novo.nomeCompleto && (!novo.nome || novo.nome.trim().length === 0)) {
    const { nomeAjustado, descricao } = extrairNomeEDescricao(novo.nomeCompleto);
    novo.nome = nomeAjustado;
    if (descricao) novo.descricao = descricao;
  } else if (novo.nome && novo.nomeCompleto) {
    const { nomeAjustado, descricao } = extrairNomeEDescricao(novo.nomeCompleto);
    novo.nome = nomeAjustado; // força igual ao prefixo
    if (descricao) novo.descricao = descricao;
  }

  // Se houver descrição embutida em nomeCompleto quebrado
  if (!novo.descricao && typeof novo.nomeCompleto === 'string') {
    const { descricao } = extrairNomeEDescricao(novo.nomeCompleto);
    if (descricao) novo.descricao = descricao;
  }

  // Mantém campos existentes, como preco, link, imagem
  return novo;
}

function main() {
  if (!fs.existsSync(CAMINHO_ORIGINAL)) {
    console.error('Arquivo masculino.json não encontrado em:', CAMINHO_ORIGINAL);
    process.exit(1);
  }

  const raw = fs.readFileSync(CAMINHO_ORIGINAL, 'utf8');
  let json;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    console.error('JSON inválido em masculino.json:', e.message);
    process.exit(1);
  }

  const arr = Array.isArray(json) ? json : [json];
  const refatorado = arr.map(refatorarItem);

  // Backup
  try {
    fs.writeFileSync(CAMINHO_BACKUP, JSON.stringify(json, null, 2), 'utf8');
    console.log('Backup criado em:', CAMINHO_BACKUP);
  } catch (e) {
    console.warn('Falha ao criar backup:', e.message);
  }

  // Gravar
  fs.writeFileSync(CAMINHO_ORIGINAL, JSON.stringify(refatorado, null, 2), 'utf8');
  console.log('Arquivo refatorado com sucesso:', CAMINHO_ORIGINAL);
  console.log('Total de itens refatorados:', refatorado.length);
}

main();
