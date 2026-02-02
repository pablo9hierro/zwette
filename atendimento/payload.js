/**
 * Construtor de Payload para Busca de Produtos
 * Mapeia as características do contexto para parâmetros de busca precisos
 */

/**
 * Constrói payload de busca baseado no contexto de preferências
 * @param {Object} contexto - Contexto de preferências do cliente
 * @returns {Object} Payload estruturado para busca no catálogo
 */
export function construirPayload(contexto) {
  const payload = {
    filtros: {},
    palavrasChave: [],
    prioridade: [],
    score: 0
  };

  // Tipo de produto (obrigatório para busca)
  if (contexto.tipo) {
    payload.filtros.tipo = normalizarTipo(contexto.tipo);
    payload.palavrasChave.push(contexto.tipo.toLowerCase());
    payload.score += 20;
  }

  // Gênero (obrigatório para busca)
  if (contexto.genero) {
    payload.filtros.genero = normalizarGenero(contexto.genero);
    payload.palavrasChave.push(contexto.genero.toLowerCase());
    payload.score += 20;
  }

  // Cor (importante)
  if (contexto.cor) {
    payload.filtros.cor = normalizarCor(contexto.cor);
    payload.palavrasChave.push(contexto.cor.toLowerCase());
    payload.prioridade.push('cor');
    payload.score += 15;
  }

  // Manga (importante)
  if (contexto.manga) {
    payload.filtros.manga = normalizarManga(contexto.manga);
    payload.palavrasChave.push(`manga ${contexto.manga}`.toLowerCase());
    payload.prioridade.push('manga');
    payload.score += 15;
  }

  // Tamanho (complementar)
  if (contexto.tamanho) {
    payload.filtros.tamanho = contexto.tamanho.toUpperCase();
    payload.prioridade.push('tamanho');
    payload.score += 10;
  }

  // Estilo (complementar)
  if (contexto.estilo) {
    payload.filtros.estilo = normalizarEstilo(contexto.estilo);
    payload.palavrasChave.push(contexto.estilo.toLowerCase());
    payload.score += 5;
  }

  // Tecido (complementar)
  if (contexto.tecido) {
    payload.filtros.tecido = contexto.tecido.toLowerCase();
    payload.palavrasChave.push(contexto.tecido.toLowerCase());
    payload.score += 5;
  }

  return payload;
}

/**
 * Normaliza o tipo de produto para correspondência no catálogo
 * @param {string} tipo
 * @returns {string}
 */
function normalizarTipo(tipo) {
  const tipos = {
    'jaleco': 'jaleco',
    'jalecos': 'jaleco',
    'scrub': 'scrub',
    'scrubs': 'scrub',
    'avental': 'avental',
    'aventais': 'avental',
    'touca': 'touca',
    'toucas': 'touca'
  };

  return tipos[tipo.toLowerCase()] || tipo.toLowerCase();
}

/**
 * Normaliza o gênero para correspondência no catálogo
 * @param {string} genero
 * @returns {string}
 */
function normalizarGenero(genero) {
  const generos = {
    'masculino': 'masculino',
    'homem': 'masculino',
    'masculina': 'masculino',
    'feminino': 'feminino',
    'mulher': 'feminino',
    'feminina': 'feminino',
    'unissex': 'unissex',
    'uni': 'unissex'
  };

  return generos[genero.toLowerCase()] || genero.toLowerCase();
}

/**
 * Normaliza a cor para correspondência no catálogo
 * @param {string} cor
 * @returns {Array<string>} Array de variações da cor
 */
function normalizarCor(cor) {
  const corLower = cor.toLowerCase();
  
  // Mapear variações de cores
  const mapeamentoCores = {
    'azul': ['azul', 'blue'],
    'azul marinho': ['azul marinho', 'marinho'],
    'azul bebe': ['azul bebe', 'azul bebê', 'azul claro'],
    'azul claro': ['azul claro', 'azul bebe'],
    'branco': ['branco', 'white'],
    'preto': ['preto', 'black'],
    'verde': ['verde', 'green'],
    'rosa': ['rosa', 'pink'],
    'vermelho': ['vermelho', 'red'],
    'cinza': ['cinza', 'gray', 'grey'],
    'bege': ['bege', 'beige']
  };

  // Tentar encontrar correspondência exata ou parcial
  for (const [corPadrao, variacoes] of Object.entries(mapeamentoCores)) {
    if (corLower.includes(corPadrao) || variacoes.some(v => corLower.includes(v))) {
      return variacoes;
    }
  }

  // Se não encontrar, retornar a cor original
  return [corLower];
}

/**
 * Normaliza o tipo de manga
 * @param {string} manga
 * @returns {string}
 */
function normalizarManga(manga) {
  const mangaLower = manga.toLowerCase();
  
  if (mangaLower.includes('curta') || mangaLower === 'curta') {
    return 'curta';
  }
  if (mangaLower.includes('longa') || mangaLower === 'longa') {
    return 'longa';
  }
  
  return manga;
}

/**
 * Normaliza o estilo do produto
 * @param {string} estilo
 * @returns {Array<string>}
 */
function normalizarEstilo(estilo) {
  const estiloLower = estilo.toLowerCase();
  
  const mapeamentoEstilos = {
    'clássico': ['clássico', 'classico', 'tradicional'],
    'moderno': ['moderno', 'contemporâneo', 'contemporaneo'],
    'elegante': ['elegante', 'sofisticado'],
    'casual': ['casual', 'confortável', 'confortavel']
  };

  for (const [estiloPadrao, variacoes] of Object.entries(mapeamentoEstilos)) {
    if (variacoes.some(v => estiloLower.includes(v))) {
      return variacoes;
    }
  }

  return [estiloLower];
}

/**
 * Verifica se o payload tem informações mínimas necessárias para busca
 * @param {Object} payload
 * @returns {boolean}
 */
export function payloadValido(payload) {
  return payload.filtros.tipo && payload.filtros.genero;
}

/**
 * Gera descrição textual do payload para mostrar ao cliente
 * @param {Object} payload
 * @returns {string}
 */
export function descreverPayload(payload) {
  const partes = [];
  
  if (payload.filtros.tipo) partes.push(payload.filtros.tipo);
  if (payload.filtros.genero) partes.push(payload.filtros.genero);
  
  if (payload.filtros.cor) {
    const cores = Array.isArray(payload.filtros.cor) 
      ? payload.filtros.cor[0] 
      : payload.filtros.cor;
    partes.push(cores);
  }
  
  if (payload.filtros.manga) {
    partes.push(`manga ${payload.filtros.manga}`);
  }
  
  if (payload.filtros.tamanho) {
    partes.push(`tamanho ${payload.filtros.tamanho}`);
  }

  return partes.join(' ');
}

/**
 * Compara dois payloads para verificar se são equivalentes
 * @param {Object} payload1
 * @param {Object} payload2
 * @returns {boolean}
 */
export function payloadsEquivalentes(payload1, payload2) {
  if (!payload1 || !payload2) return false;
  
  const filtros1 = JSON.stringify(payload1.filtros);
  const filtros2 = JSON.stringify(payload2.filtros);
  
  return filtros1 === filtros2;
}
