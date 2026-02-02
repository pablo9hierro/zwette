/**
 * =====================================================
 * SISTEMA DE CONTEXTO AVANÇADO - ATENDIMENTO JANA
 * Sistema de 4 Blocos com Memória Expandida
 * =====================================================
 */

/**
 * Estrutura expandida do contexto de atendimento
 * @typedef {Object} ContextoAtendimento
 * 
 * IDENTIFICAÇÃO (Bloco 1)
 * @property {string|null} nomeCliente - Nome do cliente
 * @property {string|null} profissao - Profissão do cliente
 * @property {string[]} profissoesSinonimos - Sinônimos detectados
 * @property {boolean} profissaoConfirmada - Se profissão foi confirmada
 * 
 * PREFERÊNCIAS (Bloco 2)
 * @property {string|null} tipoProduto - Tipo principal (jaleco, scrub, etc)
 * @property {string|null} modelo - Modelo específico
 * @property {string|null} genero - Masculino, feminino, unissex
 * @property {string|null} cor - Cor preferida (opcional)
 * @property {string|null} tamanho - Tamanho desejado
 * @property {string[]} modelosSolicitados - Lista de modelos que cliente quer ver (até 5)
 * @property {string[]} coresDisponiveis - Cores disponíveis no catálogo filtrado
 * @property {string[]} modelosDisponiveis - Modelos disponíveis no catálogo filtrado
 * 
 * CONTROLE DE FLUXO
 * @property {string} faseAtual - identificacao | filtro | confirmacao | busca | encerramento
 * @property {string} ultimaPergunta - Última pergunta feita ao cliente
 * @property {string|null} aguardandoResposta - Tipo de resposta esperada
 * @property {boolean} confirmacaoPendente - Se está aguardando confirmação para buscar
 * @property {boolean} listaEnumeradaEnviada - Se enviou lista enumerada
 * @property {Object|null} ultimaListaEnumerada - Última lista enviada
 * 
 * HISTÓRICO
 * @property {Array} produtosPesquisados - Produtos já pesquisados
 * @property {Array} historicoFases - Histórico de transições de fase
 * @property {Array} caracteristicasMencionadas - Lista de características já capturadas
 * @property {boolean} buscaRealizada - Se já foi feita alguma busca
 * @property {number} totalBuscas - Total de buscas realizadas
 * 
 * ENCERRAMENTO
 * @property {boolean} clienteSatisfeito - Se cliente demonstrou satisfação
 * @property {boolean} atendimentoEncerrado - Se atendimento foi encerrado
 * @property {string|null} motivoEncerramento - Motivo do encerramento
 * @property {Date|null} dataUltimaInteracao - Data da última mensagem
 */

/**
 * Inicializa contexto expandido
 */
export function inicializarContextoAvancado() {
  return {
    // BLOCO 1: IDENTIFICAÇÃO
    nomeCliente: null,
    profissao: null,
    profissoesSinonimos: [],
    profissaoConfirmada: false,
    
    // BLOCO 2: PREFERÊNCIAS E FILTROS
    tipoProduto: null,
    modelo: null,
    genero: null,
    cor: null,
    tamanho: null,
    modelosSolicitados: [], // Cliente pode pedir ver múltiplos modelos
    coresDisponiveis: [],
    modelosDisponiveis: [],
    tamanhosSolicitados: [],
    
    // CONTROLE DE FLUXO
    faseAtual: 'identificacao', // identificacao | filtro | confirmacao | busca | encerramento
    ultimaPergunta: null,
    aguardandoResposta: null, // 'nome' | 'profissao' | 'tipo_produto' | 'modelo' | 'cor' | 'confirmacao'
    confirmacaoPendente: false,
    listaEnumeradaEnviada: false,
    ultimaListaEnumerada: null,
    
    // HISTÓRICO E MEMÓRIA
    produtosPesquisados: [],
    historicoFases: [],
    caracteristicasMencionadas: [],
    buscaRealizada: false,
    totalBuscas: 0,
    
    // ENCERRAMENTO
    clienteSatisfeito: false,
    atendimentoEncerrado: false,
    motivoEncerramento: null,
    dataUltimaInteracao: new Date().toISOString(),
    
    // COMPATIBILIDADE COM SISTEMA ANTIGO
    tipo: null,
    manga: null,
    estilo: null,
    tecido: null,
    aguardandoConfirmacao: false
  };
}

/**
 * Atualiza contexto de forma inteligente
 * Mantém memória e adiciona novos dados
 */
export function atualizarContextoAvancado(contextoAtual, novosRados) {
  const contexto = { ...contextoAtual };
  
  // Atualizar timestamp
  contexto.dataUltimaInteracao = new Date().toISOString();
  
  // BLOCO 1: Identificação
  if (novosRados.nomeCliente && !contexto.nomeCliente) {
    contexto.nomeCliente = novosRados.nomeCliente;
    contexto.caracteristicasMencionadas.push('nome');
  }
  
  if (novosRados.profissao) {
    contexto.profissao = novosRados.profissao;
    contexto.profissaoConfirmada = true;
    contexto.caracteristicasMencionadas.push('profissao');
  }
  
  // BLOCO 2: Preferências
  if (novosRados.tipoProduto) {
    // Se mudou tipo de produto, resetar modelo/cor
    if (contexto.tipoProduto && contexto.tipoProduto !== novosRados.tipoProduto) {
      contexto.modelo = null;
      contexto.cor = null;
      contexto.modelosSolicitados = [];
      contexto.coresDisponiveis = [];
      contexto.modelosDisponiveis = [];
    }
    contexto.tipoProduto = novosRados.tipoProduto;
    contexto.tipo = novosRados.tipoProduto; // Compatibilidade
    contexto.caracteristicasMencionadas.push('tipo');
  }
  
  if (novosRados.modelo) {
    contexto.modelo = novosRados.modelo;
    
    // Adicionar à lista de modelos solicitados (máximo 5)
    if (!contexto.modelosSolicitados.includes(novosRados.modelo)) {
      if (contexto.modelosSolicitados.length < 5) {
        contexto.modelosSolicitados.push(novosRados.modelo);
      }
    }
    contexto.caracteristicasMencionadas.push('modelo');
  }
  
  if (novosRados.genero) {
    contexto.genero = novosRados.genero;
    contexto.caracteristicasMencionadas.push('genero');
  }
  
  if (novosRados.cor) {
    contexto.cor = novosRados.cor;
    contexto.caracteristicasMencionadas.push('cor');
  }
  
  if (novosRados.tamanho) {
    contexto.tamanho = novosRados.tamanho;
    if (!contexto.tamanhosSolicitados.includes(novosRados.tamanho)) {
      contexto.tamanhosSolicitados.push(novosRados.tamanho);
    }
    contexto.caracteristicasMencionadas.push('tamanho');
  }
  
  // Atualizar listas disponíveis (vindo do catálogo)
  if (novosRados.coresDisponiveis) {
    contexto.coresDisponiveis = novosRados.coresDisponiveis;
  }
  
  if (novosRados.modelosDisponiveis) {
    contexto.modelosDisponiveis = novosRados.modelosDisponiveis;
  }
  
  // Controle de fluxo
  if (novosRados.faseAtual) {
    // Registrar mudança de fase
    if (contexto.faseAtual !== novosRados.faseAtual) {
      contexto.historicoFases.push({
        de: contexto.faseAtual,
        para: novosRados.faseAtual,
        timestamp: new Date().toISOString()
      });
    }
    contexto.faseAtual = novosRados.faseAtual;
  }
  
  if (novosRados.ultimaPergunta) {
    contexto.ultimaPergunta = novosRados.ultimaPergunta;
  }
  
  if (novosRados.aguardandoResposta !== undefined) {
    contexto.aguardandoResposta = novosRados.aguardandoResposta;
  }
  
  if (novosRados.confirmacaoPendente !== undefined) {
    contexto.confirmacaoPendente = novosRados.confirmacaoPendente;
    contexto.aguardandoConfirmacao = novosRados.confirmacaoPendente; // Compatibilidade
  }
  
  // Lista enumerada
  if (novosRados.ultimaListaEnumerada) {
    contexto.listaEnumeradaEnviada = true;
    contexto.ultimaListaEnumerada = novosRados.ultimaListaEnumerada;
  }
  
  // Registrar produto pesquisado
  if (novosRados.produtoPesquisado) {
    contexto.produtosPesquisados.push({
      ...novosRados.produtoPesquisado,
      timestamp: new Date().toISOString()
    });
    contexto.buscaRealizada = true;
    contexto.totalBuscas++;
  }
  
  // Encerramento
  if (novosRados.clienteSatisfeito !== undefined) {
    contexto.clienteSatisfeito = novosRados.clienteSatisfeito;
  }
  
  if (novosRados.atendimentoEncerrado !== undefined) {
    contexto.atendimentoEncerrado = novosRados.atendimentoEncerrado;
  }
  
  if (novosRados.motivoEncerramento) {
    contexto.motivoEncerramento = novosRados.motivoEncerramento;
  }
  
  return contexto;
}

/**
 * Verifica se contexto tem dados mínimos para busca
 */
export function contextoTemDadosMinimos(contexto) {
  // Obrigatórios: tipoProduto, modelo
  // Opcional: cor, tamanho, genero
  return !!(contexto.tipoProduto && contexto.modelo);
}

/**
 * Verifica se contexto está completo para busca ideal
 */
export function contextoCompleto(contexto) {
  return !!(
    contexto.tipoProduto && 
    contexto.modelo && 
    (contexto.genero || contexto.cor)
  );
}

/**
 * Identifica qual informação está faltando
 */
export function identificarFaltando(contexto) {
  const faltando = [];
  
  if (!contexto.nomeCliente) faltando.push('nome');
  if (!contexto.tipoProduto) faltando.push('tipo_produto');
  if (!contexto.modelo) faltando.push('modelo');
  if (!contexto.genero) faltando.push('genero');
  if (!contexto.cor) faltando.push('cor');
  
  return faltando;
}

/**
 * Determina próxima fase automaticamente
 */
export function determinarProximaFase(contexto) {
  // Se não tem nome, continua em identificação
  if (!contexto.nomeCliente) {
    return 'identificacao';
  }
  
  // Se não tem tipo de produto, vai para filtro
  if (!contexto.tipoProduto) {
    return 'filtro';
  }
  
  // Se não tem modelo, continua em filtro
  if (!contexto.modelo) {
    return 'filtro';
  }
  
  // Se tem tipo e modelo, mas não confirmou, vai para confirmação
  if (contexto.tipoProduto && contexto.modelo && !contexto.confirmacaoPendente) {
    return 'confirmacao';
  }
  
  // Se confirmou, vai para busca
  if (contexto.confirmacaoPendente && !contexto.buscaRealizada) {
    return 'busca';
  }
  
  // Se já fez busca e cliente satisfeito, encerrar
  if (contexto.buscaRealizada && contexto.clienteSatisfeito) {
    return 'encerramento';
  }
  
  return contexto.faseAtual;
}

/**
 * Serializa contexto para salvar no banco
 */
export function serializarContexto(contexto) {
  return JSON.stringify(contexto);
}

/**
 * Desserializa contexto do banco
 */
export function desserializarContexto(contextoJSON) {
  if (!contextoJSON) {
    return inicializarContextoAvancado();
  }
  
  if (typeof contextoJSON === 'string') {
    return JSON.parse(contextoJSON);
  }
  
  return contextoJSON;
}

/**
 * Gera resumo legível do contexto
 */
export function gerarResumoContexto(contexto) {
  const partes = [];
  
  if (contexto.nomeCliente) {
    partes.push(`Cliente: ${contexto.nomeCliente}`);
  }
  
  if (contexto.profissao) {
    partes.push(`Profissão: ${contexto.profissao}`);
  }
  
  if (contexto.tipoProduto) {
    partes.push(`Produto: ${contexto.tipoProduto}`);
  }
  
  if (contexto.modelo) {
    partes.push(`Modelo: ${contexto.modelo}`);
  }
  
  if (contexto.genero) {
    partes.push(`Gênero: ${contexto.genero}`);
  }
  
  if (contexto.cor) {
    partes.push(`Cor: ${contexto.cor}`);
  }
  
  if (contexto.tamanho) {
    partes.push(`Tamanho: ${contexto.tamanho}`);
  }
  
  if (contexto.modelosSolicitados.length > 0) {
    partes.push(`Modelos interessados: ${contexto.modelosSolicitados.join(', ')}`);
  }
  
  partes.push(`Fase: ${contexto.faseAtual}`);
  partes.push(`Buscas: ${contexto.totalBuscas}`);
  
  return partes.join(' | ');
}

/**
 * Verifica inatividade (mais de 12 horas)
 */
export function verificarInatividade(contexto) {
  if (!contexto.dataUltimaInteracao) {
    return false;
  }
  
  const ultimaInteracao = new Date(contexto.dataUltimaInteracao);
  const agora = new Date();
  const diferencaHoras = (agora - ultimaInteracao) / (1000 * 60 * 60);
  
  return diferencaHoras >= 12;
}

/**
 * Compatibilidade: recuperar contexto antigo
 */
export function migrarContextoAntigo(contextoAntigo) {
  const novo = inicializarContextoAvancado();
  
  if (contextoAntigo.tipo) novo.tipoProduto = contextoAntigo.tipo;
  if (contextoAntigo.genero) novo.genero = contextoAntigo.genero;
  if (contextoAntigo.cor) novo.cor = contextoAntigo.cor;
  if (contextoAntigo.tamanho) novo.tamanho = contextoAntigo.tamanho;
  if (contextoAntigo.manga) novo.manga = contextoAntigo.manga;
  if (contextoAntigo.estilo) novo.estilo = contextoAntigo.estilo;
  if (contextoAntigo.tecido) novo.tecido = contextoAntigo.tecido;
  if (contextoAntigo.caracteristicasMencionadas) {
    novo.caracteristicasMencionadas = contextoAntigo.caracteristicasMencionadas;
  }
  if (contextoAntigo.buscaRealizada) novo.buscaRealizada = contextoAntigo.buscaRealizada;
  
  return novo;
}
