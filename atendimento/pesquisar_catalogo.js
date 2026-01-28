/**
 * Módulo de Sugestões de Catálogo
 * Sugere opções ao cliente quando ele está indeciso ou explorando
 */

/**
 * Gera sugestões de produtos quando o cliente está explorando
 * @param {Object} contexto - Contexto atual de preferências
 * @returns {Object} Mensagem com sugestões
 */
export function gerarSugestoes(contexto) {
  const { tipo, genero, cor, manga } = contexto;

  // Se não tem nem tipo, sugerir tipos de produtos
  if (!tipo) {
    return {
      tipo: 'sugestao_tipos',
      mensagem: gerarSugestaoTipos(),
      opcoes: ['jaleco', 'scrub', 'avental', 'touca']
    };
  }

  // Se tem tipo mas não tem gênero
  if (!genero) {
    return {
      tipo: 'sugestao_genero',
      mensagem: gerarSugestaoGenero(tipo),
      opcoes: ['masculino', 'feminino', 'unissex']
    };
  }

  // Se tem tipo e gênero mas não tem cor
  if (!cor) {
    return {
      tipo: 'sugestao_cores',
      mensagem: gerarSugestaoCores(tipo, genero),
      opcoes: ['azul', 'branco', 'preto', 'verde', 'rosa', 'bege']
    };
  }

  // Se tem tipo, gênero e cor mas não especificou manga
  if (tipo === 'jaleco' && !manga) {
    return {
      tipo: 'sugestao_manga',
      mensagem: gerarSugestaoManga(tipo, genero, cor),
      opcoes: ['manga curta', 'manga longa']
    };
  }

  // Se já tem informações suficientes, sugerir buscar
  return {
    tipo: 'pronto_buscar',
    mensagem: gerarMensagemProntoBuscar(contexto),
    opcoes: ['sim', 'não']
  };
}

/**
 * Gera mensagem sugerindo tipos de produtos
 * @returns {string}
 */
function gerarSugestaoTipos() {
  return `Temos vários tipos de produtos! O que você procura?

• Jalecos (clássicos para profissionais)
• Scrubs (confortáveis e modernos)
• Aventais
• Toucas

Qual te interessa?`;
}

/**
 * Gera mensagem sugerindo gêneros
 * @param {string} tipo
 * @returns {string}
 */
function gerarSugestaoGenero(tipo) {
  const tipoFormatado = tipo.charAt(0).toUpperCase() + tipo.slice(1);
  return `${tipoFormatado}! Você procura modelo masculino, feminino ou unissex?`;
}

/**
 * Gera mensagem sugerindo cores
 * @param {string} tipo
 * @param {string} genero
 * @returns {string}
 */
function gerarSugestaoCores(tipo, genero) {
  return `Legal! Qual cor você prefere para o ${tipo} ${genero}?

Temos disponível:
• Azul (marinho e bebê)
• Branco
• Preto
• Verde
• Rosa
• Bege`;
}

/**
 * Gera mensagem sugerindo tipo de manga
 * @param {string} tipo
 * @param {string} genero
 * @param {string} cor
 * @returns {string}
 */
function gerarSugestaoManga(tipo, genero, cor) {
  return `Perfeito! ${tipo.charAt(0).toUpperCase() + tipo.slice(1)} ${genero} ${cor}. Você prefere manga curta ou manga longa?`;
}

/**
 * Gera mensagem quando está pronto para buscar
 * @param {Object} contexto
 * @returns {string}
 */
function gerarMensagemProntoBuscar(contexto) {
  const descricao = construirDescricaoProduto(contexto);
  return `Ótimo! Posso buscar ${descricao} para você?`;
}

/**
 * Constrói descrição legível do produto baseado no contexto
 * @param {Object} contexto
 * @returns {string}
 */
function construirDescricaoProduto(contexto) {
  const partes = [];
  
  if (contexto.tipo) partes.push(contexto.tipo + 's');
  if (contexto.genero) partes.push(contexto.genero + 's');
  if (contexto.cor) partes.push('na cor ' + contexto.cor);
  if (contexto.manga) partes.push('de manga ' + contexto.manga);
  if (contexto.tamanho) partes.push('tamanho ' + contexto.tamanho);

  return partes.join(' ');
}

/**
 * Verifica se deve fazer sugestões ou ir direto para busca
 * @param {Object} contexto
 * @returns {boolean} true se deve sugerir, false se deve buscar direto
 */
export function deveFazerSugestao(contexto) {
  // Se não tem tipo ou gênero, precisa de sugestões
  if (!contexto.tipo || !contexto.genero) {
    return true;
  }

  // Se tem tipo e gênero mas não tem outras preferências, pode sugerir cores/manga
  if (!contexto.cor && !contexto.manga) {
    return true;
  }

  // Se já tem informações suficientes, não precisa sugerir
  return false;
}

/**
 * Gera mensagem de confirmação antes de buscar
 * @param {Object} contexto
 * @returns {string}
 */
export function gerarMensagemConfirmacao(contexto) {
  const descricao = construirDescricaoProduto(contexto);
  
  const variacoes = [
    `Posso buscar ${descricao} para você?`,
    `Vou procurar ${descricao} no catálogo, tudo bem?`,
    `Quer que eu pesquise ${descricao}?`,
    `Deixa eu buscar ${descricao} para você?`
  ];

  // Retornar uma variação aleatória
  return variacoes[Math.floor(Math.random() * variacoes.length)];
}

/**
 * Verifica se a mensagem já foi usada recentemente
 * @param {string} mensagem
 * @param {Array<string>} historicoMensagens
 * @returns {boolean}
 */
export function mensagemJaUsada(mensagem, historicoMensagens = []) {
  if (!historicoMensagens || historicoMensagens.length === 0) {
    return false;
  }

  // Verificar nas últimas 3 mensagens
  const ultimasMensagens = historicoMensagens.slice(-3);
  
  return ultimasMensagens.some(msg => {
    if (!msg) return false;
    return msg.toLowerCase().includes(mensagem.toLowerCase().substring(0, 20));
  });
}

/**
 * Gera mensagem personalizada baseada no sentimento detectado
 * @param {string} sentimento
 * @param {Object} contexto
 * @returns {string|null}
 */
export function gerarMensagemPorSentimento(sentimento, contexto) {
  if (sentimento === 'frustrado') {
    const descricao = construirDescricaoProduto(contexto);
    return `Entendi! Vou buscar ${descricao} agora mesmo para você. 🔍`;
  }

  if (sentimento === 'negativo') {
    return `Desculpe se não ficou claro. Posso te ajudar de outra forma?`;
  }

  return null;
}
