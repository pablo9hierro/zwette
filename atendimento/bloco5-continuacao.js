/**
 * =====================================================
 * BLOCO 5: CONTINUAÇÃO OU ENCERRAMENTO DO ATENDIMENTO
 * Processa a intenção do cliente após receber produtos
 * =====================================================
 */

import { gerarListaTiposProdutosComRecomendacao } from './lista-enumerada.js';

/**
 * Detecta se cliente quer continuar buscando produtos
 */
function detectarContinuacao(mensagem) {
  const palavrasContinuar = [
    'continuar',
    'continua',
    'sim',
    'quero',
    'buscar',
    'procurar',
    'outro',
    'outra',
    'mais',
    'produto',
    'ver mais',
    'mostrar mais'
  ];
  
  const mensagemLower = mensagem.toLowerCase().trim();
  return palavrasContinuar.some(p => mensagemLower.includes(p));
}

/**
 * Detecta se cliente quer encerrar atendimento
 */
function detectarEncerramento(mensagem) {
  const palavrasEncerrar = [
    'encerrar',
    'encerra',
    'finalizar',
    'finaliza',
    'terminar',
    'termina',
    'não',
    'nao',
    'tchau',
    'obrigado',
    'obrigada',
    'valeu',
    'só isso',
    'so isso',
    'é só',
    'e so',
    'pronto',
    'acabou'
  ];
  
  const mensagemLower = mensagem.toLowerCase().trim();
  return palavrasEncerrar.some(p => mensagemLower.includes(p));
}

/**
 * Reinicia busca mantendo nome do cliente
 */
function reiniciarBusca(contexto) {
  const nomeCliente = contexto.nomeCliente;
  const totalBuscas = contexto.totalBuscas || 0;
  
  return {
    ...contexto,
    nomeCliente,
    totalBuscas,
    // Resetar filtros
    tipoProduto: null,
    modelo: null,
    genero: null,
    cor: null,
    tamanho: null,
    coresDisponiveis: [],
    modelosDisponiveis: [],
    ultimaListaEnumerada: null,
    aguardandoResposta: 'tipo_produto',
    confirmacaoPendente: false,
    buscaRealizada: false,
    produtosPesquisados: [],
    faseAtual: 'filtro'
  };
}

/**
 * Processa resposta de continuação ou encerramento
 */
export async function processarContinuacao(mensagem, contexto, numeroUsuario) {
  const resultado = {
    mensagem: '',
    contextoAtualizado: { ...contexto },
    proximaFase: null,
    listaEnumerada: null
  };
  
  // ====================================================================
  // 🔍 DETECÇÃO INTELIGENTE: Antes de perguntar continuar/encerrar,
  // verificar se cliente já está pedindo nova busca com filtros específicos
  // Exemplo: Cliente diz "jaleco feminino" ao invés de "continuar"
  // ====================================================================
  console.log('🔍 Verificando se cliente especificou novos filtros...');
  
  // Importar funções de detecção
  const { detectarTipoProduto, detectarGenero, detectarCor, processarBloco2 } = await import('./bloco2-filtro.js');
  const { carregarCoresProduto, carregarGenerosProduto, gerarListaTiposProdutosComRecomendacao } = await import('./lista-enumerada.js');
  
  const tipoDetectado = detectarTipoProduto(mensagem);
  const generoDetectado = detectarGenero(mensagem);
  
  // Se detectou filtros específicos, cliente quer buscar direto!
  if (tipoDetectado || generoDetectado) {
    console.log('🎯 Cliente especificou filtros! Iniciando nova busca...');
    console.log('   Tipo:', tipoDetectado);
    console.log('   Gênero:', generoDetectado);
    
    // Resetar contexto mantendo nome
    resultado.contextoAtualizado = reiniciarBusca(contexto);
    
    // Processar com o bloco2 (que já tem lógica de múltiplos filtros)
    const resultadoBloco2 = await processarBloco2(mensagem, resultado.contextoAtualizado, numeroUsuario);
    
    return resultadoBloco2;
  }
  
  // Se não detectou filtros específicos, continuar com fluxo normal
  // Detectar intenção
  const querContinuar = detectarContinuacao(mensagem);
  const querEncerrar = detectarEncerramento(mensagem);
  
  // Se detectou continuação
  if (querContinuar && !querEncerrar) {
    console.log('🔄 Cliente quer continuar buscando');
    
    // Reiniciar busca (resetar filtros, manter nome)
    resultado.contextoAtualizado = reiniciarBusca(contexto);
    
    // Gerar lista de tipos de produtos
    const { mensagem: listaTipos, lista } = await gerarListaTiposProdutosComRecomendacao(null);
    
    const mensagem1 = `Ótimo, *${contexto.nomeCliente}*! 😊\n\n` +
                     `Vamos buscar mais produtos perfeitos para você!`;
    const mensagem2 = listaTipos;
    
    resultado.mensagem = [mensagem1, mensagem2];
    resultado.proximaFase = 'filtro';
    resultado.listaEnumerada = {
      tipo_lista: 'tipos_produto',
      itens: lista.map((t, i) => ({ numero: i + 1, valor: t })),
      referente_a: null
    };
    
    return resultado;
  }
  
  // Se detectou encerramento
  if (querEncerrar) {
    console.log('👋 Cliente quer encerrar atendimento');
    
    const mensagemDespedida = `Foi um prazer te atender, *${contexto.nomeCliente}*! 😊\n\n` +
                              `Você pode finalizar a compra diretamente no site:\n` +
                              `🌐 https://www.danajalecos.com.br\n\n` +
                              `Qualquer dúvida, é só me chamar novamente com *"simitarra"*!\n\n` +
                              `Até logo! 👋✨`;
    
    resultado.mensagem = mensagemDespedida;
    resultado.contextoAtualizado.faseAtual = 'encerrado';
    resultado.contextoAtualizado.atendimentoEncerrado = true;
    resultado.contextoAtualizado.motivoEncerramento = 'cliente_finalizou';
    resultado.proximaFase = 'encerrado';
    
    return resultado;
  }
  
  // Não entendeu a resposta
  console.log('❓ Não entendeu se quer continuar ou encerrar');
  resultado.mensagem = `Desculpe, não entendi. Você quer:\n\n` +
                      `• *Continuar* buscando mais produtos?\n` +
                      `• *Encerrar* o atendimento?\n\n` +
                      `Por favor, escolha uma das opções! 😊`;
  
  return resultado;
}
