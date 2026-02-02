/**
 * BUFFER DE MENSAGENS - Aguarda 3s para concatenar mensagens fragmentadas
 * Ex: "quero" + "jaleco" + "azul" = "quero jaleco azul"
 */

const DELAY_MS = 3000; // 3 segundos
const buffers = new Map(); // { numeroCliente: { mensagens: [], timer: timeout } }

/**
 * Adiciona mensagem ao buffer e retorna null (ainda aguardando)
 * ou retorna mensagem concatenada (após delay)
 */
export function adicionarAoBuffer(numeroCliente, mensagem) {
  return new Promise((resolve) => {
    // Se não tem buffer, criar
    if (!buffers.has(numeroCliente)) {
      buffers.set(numeroCliente, {
        mensagens: [],
        timer: null
      });
    }
    
    const buffer = buffers.get(numeroCliente);
    
    // Adicionar mensagem
    buffer.mensagens.push(mensagem);
    console.log(`📝 Buffer [${numeroCliente}]: ${buffer.mensagens.length} mensagem(ns)`);
    
    // Limpar timer anterior
    if (buffer.timer) {
      clearTimeout(buffer.timer);
    }
    
    // Criar novo timer
    buffer.timer = setTimeout(() => {
      const mensagemConcatenada = buffer.mensagens.join(' ');
      console.log(`✅ Buffer processado: "${mensagemConcatenada}"`);
      
      // Limpar buffer
      buffer.mensagens = [];
      buffer.timer = null;
      
      resolve(mensagemConcatenada);
    }, DELAY_MS);
  });
}

/**
 * Normaliza texto em português BR com erros
 */
export function normalizarPortuguesBR(texto) {
  if (!texto) return '';
  
  let normalizado = texto.toLowerCase().trim();
  
  // Correções comuns de digitação
  const correcoes = {
    // Erros de teclado
    'pabço': 'pablo',
    'jqleco': 'jaleco',
    'scrub': 'scrub',
    'gprro': 'gorro',
    
    // Português BR coloquial
    'vc': 'você',
    'tb': 'também',
    'blz': 'beleza',
    'vlw': 'valeu',
    'obg': 'obrigado',
    'pf': 'por favor',
    'pfv': 'por favor',
    
    // Confirmações
    'ss': 'sim',
    'nn': 'não',
    'pd': 'pode',
    'qro': 'quero',
    
    // Produtos
    'jalecp': 'jaleco',
    'jalwco': 'jaleco',
    'scrb': 'scrub',
    'grro': 'gorro',
    'tpuca': 'touca',
    'avental': 'avental',
    
    // Cores
    'azl': 'azul',
    'brancp': 'branco',
    'pretl': 'preto',
    'verdw': 'verde',
    'rpsa': 'rosa'
  };
  
  // Aplicar correções
  Object.keys(correcoes).forEach(erro => {
    const regex = new RegExp(`\\b${erro}\\b`, 'gi');
    normalizado = normalizado.replace(regex, correcoes[erro]);
  });
  
  return normalizado;
}
