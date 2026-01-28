/**
 * Extrator de Informações da Mensagem do Cliente
 * Usa análise manual para entender a mensagem e extrair dados estruturados
 */

/**
 * Analisa a mensagem do cliente e extrai informações estruturadas
 * @param {string} mensagemCliente - Mensagem enviada pelo cliente
 * @param {Object} contextoAtual - Contexto atual da conversa
 * @returns {Promise<Object>} Dados extraídos e intenção detectada
 */
export async function entenderMensagem(mensagemCliente, contextoAtual = {}) {
  // Usar análise manual (sem Gemini) para evitar custos e problemas de API
  console.log('🔍 Usando análise MANUAL (sem IA)');
  return analisarMensagemManual(mensagemCliente, contextoAtual);
}

/**
 * Análise manual sem IA
 * @param {string} mensagem
 * @param {Object} contexto
 * @returns {Object}
 */
function analisarMensagemManual(mensagem, contexto) {
  const msgLower = mensagem.toLowerCase();
  const ultimaPergunta = contexto.ultimaPergunta || '';
  
  // Detectar se está respondendo uma pergunta
  let eRespostaContextual = false;
  if (ultimaPergunta) {
    // Se perguntou sobre cor e mensagem é uma cor
    if (ultimaPergunta.includes('cor') && msgLower.match(/\b(azul|branco|preto|verde|rosa|vermelho|bege|cinza)\b/)) {
      eRespostaContextual = true;
    }
    // Se perguntou sobre manga e mensagem é tipo de manga
    if (ultimaPergunta.includes('manga') && msgLower.match(/\b(curta|longa)\b/)) {
      eRespostaContextual = true;
    }
    // Se perguntou sobre tamanho e mensagem é tamanho
    if (ultimaPergunta.includes('tamanho') && msgLower.match(/\b(pp|p|m|g|gg|g1|g2|g3)\b/i)) {
      eRespostaContextual = true;
    }
    // Se perguntou sobre gênero e mensagem é gênero
    if ((ultimaPergunta.includes('masculino') || ultimaPergunta.includes('feminino')) && 
        msgLower.match(/\b(masculino|feminino|unissex)\b/)) {
      eRespostaContextual = true;
    }
  }
  
  // Detectar tipo de mensagem
  let tipoMensagem = 'afirmacao';
  if (mensagem.includes('?') || msgLower.match(/\b(tem|qual|quais|como|onde|quando|quanto|cadê|cade)\b/)) {
    tipoMensagem = 'pergunta';
  } else if (eRespostaContextual || msgLower.match(/^(sim|não|azul|branco|rosa|verde|preto|curta|longa|pp|p|m|g|gg|g1|g2|g3|masculino|feminino)$/i)) {
    tipoMensagem = 'resposta';
  }
  
  // Detectar intenção
  let intencao = 'outro';
  
  // CRÍTICO: Detectar quando cliente quer MUDAR características
  if (msgLower.match(/\b(mudar|trocar|outra|outro|diferente|mudou|troque|alterar|procure|busque|pesquise)\b/)) {
    // Se disse "outra cor", "outro tamanho", etc = mudar
    // Se disse "procure de outra cor" = mudar
    intencao = 'mudar_preferencia';
  } else if (msgLower.match(/^(quero|sim|pode)$/)) {
    // Se responde "quero", "sim", "pode" sozinho = confirmar intenção anterior
    if (ultimaPergunta.includes('outras opções') || ultimaPergunta.includes('mudar')) {
      intencao = 'mudar_preferencia'; // Cliente confirmou que quer mudar
    } else {
      intencao = 'confirmar_busca';
    }
  } else if (tipoMensagem === 'pergunta') {
    intencao = 'perguntar';
  } else if (tipoMensagem === 'resposta' || eRespostaContextual) {
    intencao = 'responder';
  } else if (msgLower.match(/\b(sim|pode|quero|mostre|faça|pesquise|busque)\b/)) {
    intencao = 'confirmar_busca';
  } else if (msgLower.match(/\b(não|nao|nunca|nem)\b/)) {
    intencao = 'negar_busca';
  } else if (msgLower.match(/\b(jaleco|scrub|avental)\b/)) {
    intencao = 'buscar_produto';
  } else if (msgLower.match(/\b(oi|olá|ola|bom dia|boa tarde|boa noite)\b/)) {
    intencao = 'saudacao';
  }
  
  // Detectar QUAL característica quer mudar
  let caracteristicaParaMudar = null;
  if (intencao === 'mudar_preferencia') {
    if (msgLower.includes('cor')) {
      caracteristicaParaMudar = 'cor';
    } else if (msgLower.includes('manga')) {
      caracteristicaParaMudar = 'manga';
    } else if (msgLower.includes('tamanho')) {
      caracteristicaParaMudar = 'tamanho';
    } else if (msgLower.includes('genero') || msgLower.includes('gênero') || msgLower.includes('masculino') || msgLower.includes('feminino')) {
      caracteristicaParaMudar = 'genero';
    } else {
      // Se não especificou, assumir que é a última coisa discutida
      if (ultimaPergunta.includes('cor')) caracteristicaParaMudar = 'cor';
      else if (ultimaPergunta.includes('manga')) caracteristicaParaMudar = 'manga';
      else if (ultimaPergunta.includes('tamanho')) caracteristicaParaMudar = 'tamanho';
      else caracteristicaParaMudar = 'cor'; // Default: assumir cor
    }
  }

  // Detectar sentimento
  let sentimento = 'neutro';
  if (msgLower.match(/\b(porra|merda|caralho|droga)\b/)) {
    sentimento = 'frustrado';
  }
  
  // Verificar match com catálogo
  const temMatchCatalogo = msgLower.match(/\b(jaleco|scrub|avental|touca|azul|branco|preto|verde|rosa|vermelho|bege|manga|curta|longa|masculino|feminino|pp|p|m|g|gg|g1|g2|g3)\b/) !== null;

  // Extrair dados básicos
  const dadosExtraidos = {
    tipo: null,
    genero: null,
    cor: null,
    tamanho: null,
    manga: null,
    estilo: null,
    tecido: null
  };

  // Tipos de produtos do catálogo
  const tiposProdutos = {
    'jaleco': ['jaleco', 'jalecos'],
    'scrub': ['scrub', 'scrubs'],
    'avental': ['avental', 'aventais'],
    'touca': ['touca', 'toucas'],
    'gorro': ['gorro', 'gorros', 'gorra', 'gorras']
  };
  
  // Detectar tipo
  for (const [tipo, variacoes] of Object.entries(tiposProdutos)) {
    if (variacoes.some(v => msgLower.includes(v))) {
      dadosExtraidos.tipo = tipo;
      break;
    }
  }
  
  // Detectar se é mudança de tipo (produto diferente do contexto atual)
  let mudancaDeTipo = false;
  if (dadosExtraidos.tipo && contexto.tipo && dadosExtraidos.tipo !== contexto.tipo) {
    mudancaDeTipo = true;
  }
  else if (msgLower.includes('scrub')) dadosExtraidos.tipo = 'scrub';
  else if (msgLower.includes('avental')) dadosExtraidos.tipo = 'avental';

  // Gênero
  if (msgLower.match(/\b(masculino|homem|masculina)\b/)) dadosExtraidos.genero = 'masculino';
  else if (msgLower.match(/\b(feminino|mulher|feminina)\b/)) dadosExtraidos.genero = 'feminino';

  // Manga
  if (msgLower.includes('manga curta') || msgLower.includes('curta')) {
    dadosExtraidos.manga = 'curta';
  } else if (msgLower.includes('manga longa') || msgLower.includes('longa')) {
    dadosExtraidos.manga = 'longa';
  }

  // Cores
  const cores = ['azul', 'branco', 'preto', 'verde', 'rosa', 'vermelho', 'cinza', 'bege'];
  cores.forEach(cor => {
    if (msgLower.includes(cor)) dadosExtraidos.cor = cor;
  });

  // Tamanhos
  const tamanhos = ['PPP', 'PP', 'P', 'M', 'G', 'GG', 'G1', 'G2', 'G3'];
  tamanhos.forEach(tam => {
    if (msgLower.match(new RegExp(`\\b${tam}\\b`, 'i'))) {
      dadosExtraidos.tamanho = tam;
    }
  });
  
  // NOVO: Detectar se cliente está CONFIRMANDO (repetindo) característica atual
  let confirmandoCaracteristica = false;
  if (dadosExtraidos.cor && contexto.cor === dadosExtraidos.cor) {
    confirmandoCaracteristica = true;
  }
  if (dadosExtraidos.manga && contexto.manga === dadosExtraidos.manga) {
    confirmandoCaracteristica = true;
  }
  if (dadosExtraidos.tamanho && contexto.tamanho === dadosExtraidos.tamanho) {
    confirmandoCaracteristica = true;
  }

  return {
    sucesso: true,
    intencao,
    tipoMensagem,
    sentimento,
    dadosExtraidos,
    confirmacaoBusca: intencao === 'confirmar_busca',
    mudancaDetectada: intencao === 'mudar_preferencia',
    caracteristicaParaMudar, // Indica qual campo resetar
    mudancaDeTipo, // Indica mudança de tipo de produto
    confirmandoCaracteristica, // NOVO: Cliente repetiu característica atual
    palavrasChave: msgLower.split(/\s+/).slice(0, 5),
    temMatchCatalogo
  };
}

/**
 * Detecta se o cliente está respondendo uma pergunta específica
 * @param {string} mensagem - Mensagem do cliente
 * @param {string|null} ultimaPergunta - Última pergunta feita
 * @returns {boolean}
 */
export function eRespostaPergunta(mensagem, ultimaPergunta) {
  if (!ultimaPergunta) return false;
  
  const msgLower = mensagem.toLowerCase();
  
  // APENAS confirmações explícitas "sim", "pode", etc.
  // NÃO considerar respostas de características como confirmação
  if (msgLower.match(/\b(sim|pode|quero|claro|confirmo|yes|ok|autorizo|pesquisa|pesquise)\b/)) {
    return true;
  }
  
  return false;
}

/**
 * Verifica se mensagem responde uma pergunta sobre característica
 * (cor, tamanho, manga, etc) - NÃO é confirmação de busca!
 */
export function eRespostaCaracteristica(mensagem, ultimaPergunta) {
  if (!ultimaPergunta) return false;
  
  const msgLower = mensagem.toLowerCase();
  const perguntaLower = ultimaPergunta.toLowerCase();
  
  // Resposta sobre COR
  if (perguntaLower.includes('cor') && 
      msgLower.match(/\b(azul|branco|preto|verde|rosa|vermelho|bege|cinza|marinho)\b/)) {
    return true;
  }
  
  // Resposta sobre TAMANHO
  if (perguntaLower.includes('tamanho') && 
      msgLower.match(/\b(pp|p|m|g|gg|g1|g2|g3)\b/i)) {
    return true;
  }
  
  // Resposta sobre MANGA
  if (perguntaLower.includes('manga') && 
      msgLower.match(/\b(curta|longa|sem)\b/)) {
    return true;
  }
  
  return false;
}
