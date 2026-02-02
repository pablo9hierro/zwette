/**
 * Gerenciador de Contexto de Atendimento
 * Mantém e atualiza o estado das preferências do cliente durante a conversa
 */

/**
 * Estrutura do contexto de preferências do cliente
 * @typedef {Object} ContextoPreferencias
 * @property {string|null} tipo - Tipo de produto (jaleco, scrub, avental, etc)
 * @property {string|null} genero - Gênero (masculino, feminino, unissex)
 * @property {string|null} cor - Cor preferida
 * @property {string|null} tamanho - Tamanho desejado
 * @property {string|null} manga - Tipo de manga (curta, longa)
 * @property {string|null} estilo - Estilo específico (clássico, moderno, etc)
 * @property {string|null} tecido - Tipo de tecido preferido
 * @property {Array<string>} caracteristicasMencionadas - Lista de características já mencionadas
 * @property {boolean} buscarealizada - Se já foi realizada busca com essas características
 * @property {string|null} ultimaPergunta - Última pergunta feita ao cliente
 * @property {boolean} aguardandoConfirmacao - Se está aguardando confirmação do cliente para buscar
 */

/**
 * Inicializa um novo contexto vazio
 * @returns {ContextoPreferencias}
 */
export function inicializarContexto() {
  return {
    tipo: null,
    genero: null,
    cor: null,
    tamanho: null,
    manga: null,
    estilo: null,
    tecido: null,
    caracteristicasMencionadas: [],
    buscaRealizada: false,
    ultimaPergunta: null,
    aguardandoConfirmacao: false,
    aguardandoConfirmacaoMudancaTipo: false, // NOVO
    tipoNovoPendente: null // NOVO
  };
}

/**
 * Atualiza o contexto com novas preferências extraídas da mensagem
 * @param {ContextoPreferencias} contextoAtual - Contexto atual
 * @param {Object} dadosExtraidos - Dados extraídos da mensagem do cliente
 * @returns {Object} { contextoAtualizado, mudancasDetectadas, caracteristicasNovas }
 */
export function atualizarContexto(contextoAtual, dadosExtraidos) {  console.log('🔍 [atualizarContexto] ENTRADA:');
  console.log('   contextoAtual:', JSON.stringify(contextoAtual));
  console.log('   dadosExtraidos:', JSON.stringify(dadosExtraidos));
    // CRÍTICO: Começar com o contexto atual para MANTER características anteriores
  const contextoNovo = { 
    tipo: contextoAtual.tipo || null,
    genero: contextoAtual.genero || null,
    cor: contextoAtual.cor || null,
    tamanho: contextoAtual.tamanho || null,
    manga: contextoAtual.manga || null,
    estilo: contextoAtual.estilo || null,
    tecido: contextoAtual.tecido || null,
    caracteristicasMencionadas: [...(contextoAtual.caracteristicasMencionadas || [])],
    buscaRealizada: contextoAtual.buscaRealizada || false,
    ultimaPergunta: contextoAtual.ultimaPergunta || null,
    aguardandoConfirmacao: contextoAtual.aguardandoConfirmacao || false,
    aguardandoConfirmacaoMudancaTipo: contextoAtual.aguardandoConfirmacaoMudancaTipo || false,
    tipoNovoPendente: contextoAtual.tipoNovoPendente || null
  };
  
  const mudancasDetectadas = [];
  const caracteristicasNovas = [];

  // Mapear campos que podem ser atualizados
  const campos = ['tipo', 'genero', 'cor', 'tamanho', 'manga', 'estilo', 'tecido'];

  campos.forEach(campo => {
    if (dadosExtraidos[campo]) {
      const valorNovo = dadosExtraidos[campo].toLowerCase();
      const valorAtual = contextoNovo[campo]?.toLowerCase();

      // Verificar se é uma mudança ou nova característica
      if (valorAtual && valorAtual !== valorNovo) {
        mudancasDetectadas.push({
          campo,
          valorAnterior: contextoNovo[campo],
          valorNovo: dadosExtraidos[campo]
        });
      } else if (!valorAtual) {
        caracteristicasNovas.push(campo);
      }

      // Atualizar APENAS se tiver valor novo
      contextoNovo[campo] = dadosExtraidos[campo];

      // Adicionar às características mencionadas se ainda não estiver
      if (!contextoNovo.caracteristicasMencionadas.includes(campo)) {
        contextoNovo.caracteristicasMencionadas.push(campo);
      }
    }
  });

  // Se houve mudanças, resetar flags de busca
  if (mudancasDetectadas.length > 0 || caracteristicasNovas.length > 0) {
    contextoNovo.buscaRealizada = false;
    contextoNovo.aguardandoConfirmacao = false;
  }

  console.log('✅ [atualizarContexto] SAÍDA:');
  console.log('   contextoNovo:', JSON.stringify(contextoNovo));
  console.log('   mudancasDetectadas:', mudancasDetectadas);
  console.log('   caracteristicasNovas:', caracteristicasNovas);

  return {
    contextoAtualizado: contextoNovo,
    mudancasDetectadas,
    caracteristicasNovas
  };
}

/**
 * Verifica se o contexto tem informações suficientes para buscar produtos
 * @param {ContextoPreferencias} contexto
 * @returns {Object} { temInfoSuficiente, camposFaltantes, quantidadeCaracteristicas, prontoParaBuscaRobusta }
 */
export function verificarContextoCompleto(contexto) {
  const camposObrigatorios = ['tipo', 'genero'];
  const camposFaltantes = [];

  camposObrigatorios.forEach(campo => {
    if (!contexto[campo]) {
      camposFaltantes.push(campo);
    }
  });

  // Contar características coletadas
  const caracteristicas = ['tipo', 'genero', 'cor', 'manga', 'tamanho', 'estilo'];
  const quantidadeCaracteristicas = caracteristicas.filter(c => contexto[c]).length;

  // Pelo menos tipo e gênero são obrigatórios
  // Ideal: 3-4 características para busca robusta
  return {
    temInfoSuficiente: camposFaltantes.length === 0,
    camposFaltantes,
    quantidadeCaracteristicas,
    prontoParaBuscaRobusta: quantidadeCaracteristicas >= 3
  };
}

/**
 * Gera resumo textual do contexto atual
 * @param {ContextoPreferencias} contexto
 * @returns {string}
 */
export function gerarResumoContexto(contexto) {
  const partes = [];

  if (contexto.tipo) partes.push(contexto.tipo);
  if (contexto.genero) partes.push(contexto.genero);
  if (contexto.cor) partes.push(`cor ${contexto.cor}`);
  if (contexto.manga) partes.push(`manga ${contexto.manga}`);
  if (contexto.tamanho) partes.push(`tamanho ${contexto.tamanho}`);
  if (contexto.estilo) partes.push(`estilo ${contexto.estilo}`);

  return partes.length > 0 ? partes.join(', ') : 'sem preferências definidas';
}

/**
 * Recupera contexto armazenado ou cria novo
 * @param {Object|null} contextoArmazenado - Contexto do banco de dados
 * @returns {ContextoPreferencias}
 */
export function recuperarContexto(contextoArmazenado) {
  if (!contextoArmazenado) {
    return inicializarContexto();
  }

  // Se for string JSON, converter
  if (typeof contextoArmazenado === 'string') {
    try {
      return JSON.parse(contextoArmazenado);
    } catch {
      return inicializarContexto();
    }
  }

  // Garantir que tem todos os campos necessários
  return {
    ...inicializarContexto(),
    ...contextoArmazenado
  };
}

/**
 * Marca que uma pergunta foi feita ao cliente
 * @param {ContextoPreferencias} contexto
 * @param {string} pergunta
 * @returns {ContextoPreferencias}
 */
export function registrarPergunta(contexto, pergunta) {
  return {
    ...contexto,
    ultimaPergunta: pergunta,
    aguardandoConfirmacao: pergunta.toLowerCase().includes('posso') || 
                           pergunta.toLowerCase().includes('gostaria')
  };
}

/**
 * Marca que uma busca foi realizada com o contexto atual
 * @param {ContextoPreferencias} contexto
 * @returns {ContextoPreferencias}
 */
export function marcarBuscaRealizada(contexto) {
  return {
    ...contexto,
    buscaRealizada: true,
    aguardandoConfirmacao: false
  };
}
