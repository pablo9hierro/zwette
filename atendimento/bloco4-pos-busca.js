/**
 * ================================================================
 * BLOCO 4: Processamento Pós-Busca (Frete, Continuação)
 * Processa ações após envio dos produtos (calcular frete, nova busca, etc)
 * ================================================================
 */

import { calcularFrete, formatarMensagemFrete, validarCEP } from './calcular-frete.js';
import { detectarTipoProduto, detectarGenero, detectarCor } from './bloco2-filtro.js';

/**
 * Processa mensagem na fase de continuação/frete
 * @param {String} mensagem - Mensagem do cliente
 * @param {Object} contexto - Contexto da conversa
 * @param {Array} produtosEncontrados - Produtos da última busca
 * @returns {Object} Resultado com mensagem e contexto atualizado
 */
export async function processarPosBusca(mensagem, contexto, produtosEncontrados) {
  console.log('\n📋 [Bloco 4] Processando ação pós-busca...');
  
  const resultado = {
    mensagem: '',
    contextoAtualizado: { ...contexto },
    aguardandoCEP: false
  };
  
  const mensagemLower = mensagem.toLowerCase().trim();
  
  // ====================================================================
  // DETECÇÃO DINÂMICA: Cliente mencionou produto em qualquer momento
  // ====================================================================
  const tipoProdutoDetectado = detectarTipoProduto(mensagem);
  
  if (tipoProdutoDetectado && !contexto.aguardandoCEP) {
    console.log('   🎯 PRODUTO DETECTADO no pós-busca:', tipoProdutoDetectado);
    console.log('   🔀 Redirecionando para fluxo de busca...');
    
    // Detectar também gênero e cor se mencionados
    const generoDetectado = detectarGenero(mensagem);
    
    // Para detectar cor, carregar cores do produto
    let corDetectada = null;
    if (generoDetectado) {
      const { carregarCoresProduto } = await import('./lista-enumerada.js');
      const coresDisponiveis = await carregarCoresProduto(tipoProdutoDetectado, generoDetectado);
      corDetectada = detectarCor(mensagem, coresDisponiveis);
    }
    
    console.log('   📊 Filtros detectados:');
    console.log('      Tipo:', tipoProdutoDetectado);
    console.log('      Gênero:', generoDetectado || 'não detectado');
    console.log('      Cor:', corDetectada || 'não detectado');
    
    // Resetar contexto para nova busca
    resultado.contextoAtualizado.tipoProduto = tipoProdutoDetectado;
    resultado.contextoAtualizado.genero = generoDetectado;
    resultado.contextoAtualizado.cor = corDetectada;
    resultado.contextoAtualizado.faseAtual = 'filtro';
    resultado.contextoAtualizado.aguardandoCEP = false;
    resultado.contextoAtualizado.aguardandoResposta = null;
    resultado.contextoAtualizado.caracteristicasMencionadas = [];
    resultado.contextoAtualizado.confirmacaoPendente = false;
    
    if (tipoProdutoDetectado) resultado.contextoAtualizado.caracteristicasMencionadas.push('tipo');
    if (generoDetectado) resultado.contextoAtualizado.caracteristicasMencionadas.push('genero');
    if (corDetectada) resultado.contextoAtualizado.caracteristicasMencionadas.push('cor');
    
    // Redirecionar para o bloco 2 processar
    resultado.redirecionarPara = 'filtro';
    
    return resultado;
  }
  
  // ====================================================================
  // CENÁRIO 1: Cliente quer calcular frete
  // ====================================================================
  if (detectarIntencaoFrete(mensagemLower)) {
    console.log('   📦 Cliente quer calcular frete');
    
    resultado.mensagem = 
      `📦 *Cálculo de Frete*\n\n` +
      `Perfeito! Para calcular o frete, preciso do seu CEP.\n\n` +
      `Por favor, digite apenas os *8 números* do CEP:\n` +
      `_Exemplo: 58000000_`;
    
    resultado.contextoAtualizado.aguardandoResposta = 'cep';
    resultado.contextoAtualizado.aguardandoCEP = true;
    resultado.contextoAtualizado.produtosParaFrete = produtosEncontrados;
    resultado.aguardandoCEP = true;
    
    return resultado;
  }
  
  // ====================================================================
  // CENÁRIO 2: Cliente forneceu CEP (após pedir cálculo de frete)
  // ====================================================================
  if (contexto.aguardandoCEP || contexto.aguardandoResposta === 'cep') {
    console.log('   📍 Processando CEP fornecido...');
    
    // 🎯 DETECÇÃO PRIORITÁRIA: Cliente mencionou produto enquanto aguarda CEP
    const tipoProdutoDetectadoNoCEP = detectarTipoProduto(mensagem);
    
    if (tipoProdutoDetectadoNoCEP) {
      console.log('   🎯 PRODUTO DETECTADO durante aguardo de CEP:', tipoProdutoDetectadoNoCEP);
      console.log('   🔀 Interrompendo fluxo de frete e redirecionando para busca...');
      
      // Detectar também gênero e cor se mencionados
      const generoDetectado = detectarGenero(mensagem);
      
      // Para detectar cor, carregar cores do produto
      let corDetectada = null;
      if (generoDetectado) {
        const { carregarCoresProduto } = await import('./lista-enumerada.js');
        const coresDisponiveis = await carregarCoresProduto(tipoProdutoDetectadoNoCEP, generoDetectado);
        corDetectada = detectarCor(mensagem, coresDisponiveis);
      }
      
      // Resetar contexto para nova busca
      resultado.contextoAtualizado.tipoProduto = tipoProdutoDetectadoNoCEP;
      resultado.contextoAtualizado.genero = generoDetectado;
      resultado.contextoAtualizado.cor = corDetectada;
      resultado.contextoAtualizado.faseAtual = 'filtro';
      resultado.contextoAtualizado.aguardandoCEP = false;
      resultado.contextoAtualizado.aguardandoResposta = null;
      resultado.contextoAtualizado.caracteristicasMencionadas = [];
      resultado.contextoAtualizado.confirmacaoPendente = false;
      
      if (tipoProdutoDetectadoNoCEP) resultado.contextoAtualizado.caracteristicasMencionadas.push('tipo');
      if (generoDetectado) resultado.contextoAtualizado.caracteristicasMencionadas.push('genero');
      if (corDetectada) resultado.contextoAtualizado.caracteristicasMencionadas.push('cor');
      
      // Redirecionar para o bloco 2 processar
      resultado.redirecionarPara = 'filtro';
      
      return resultado;
    }
    
    // Detectar cancelamento ou encerramento
    if (mensagemLower.includes('cancelar') || mensagemLower.includes('voltar') || mensagemLower.includes('sair')) {
      console.log('   ❌ Cliente cancelou cálculo de frete');
      resultado.mensagem = 
        `Tudo bem! 😊\n\n` +
        `💬 *O que você gostaria de fazer?*\n\n` +
        `1️⃣ Ver mais detalhes de algum produto\n` +
        `2️⃣ Buscar outro produto\n` +
        `3️⃣ Encerrar atendimento`;
      
      resultado.contextoAtualizado.aguardandoCEP = false;
      resultado.contextoAtualizado.aguardandoResposta = 'continuacao_ou_encerramento';
      
      return resultado;
    }
    
    // Detectar encerramento explícito
    if (detectarEncerramento(mensagemLower)) {
      console.log('   👋 Cliente quer encerrar durante aguardo de CEP');
      
      resultado.mensagem = 
        `Foi um prazer te atender! 😊\n\n` +
        `Se precisar de mais alguma coisa, é só chamar! Estou sempre por aqui! 💚\n\n` +
        `Até breve! 👋`;
      
      resultado.contextoAtualizado.faseAtual = 'encerrado';
      resultado.contextoAtualizado.aguardandoCEP = false;
      resultado.contextoAtualizado.aguardandoResposta = null;
      
      return resultado;
    }
    
    // Validar CEP
    if (!validarCEP(mensagem)) {
      resultado.mensagem = 
        `❌ CEP inválido!\n\n` +
        `Por favor, digite apenas os *8 números* do CEP.\n` +
        `_Exemplo: 58000000_\n\n` +
        `Ou digite *"cancelar"* para voltar ao menu.`;
      
      // MANTER aguardando CEP
      resultado.contextoAtualizado.aguardandoCEP = true;
      resultado.contextoAtualizado.aguardandoResposta = 'cep';
      
      return resultado;
    }
    
    // 🎯 CALCULAR FRETE DO PRIMEIRO PRODUTO DA BUSCA
    console.log('   📦 Calculando frete...');
    
    // Usar produtos da última busca (salvos no contexto)
    const produtosParaFrete = contexto.produtosParaFrete || contexto.produtosEncontrados || produtosEncontrados || [];
    
    console.log(`   📦 Total de produtos encontrados: ${produtosParaFrete.length}`);
    
    if (produtosParaFrete.length === 0) {
      console.log('   ⚠️ Nenhum produto encontrado para calcular frete');
      resultado.mensagem = 
        `❌ Ops! Não encontrei produtos para calcular o frete.\n\n` +
        `Que tal fazer uma nova busca?`;
      resultado.contextoAtualizado.aguardandoCEP = false;
      resultado.contextoAtualizado.aguardandoResposta = 'pos_frete';
      return resultado;
    }
    
    // 🎯 PEGAR APENAS O PRIMEIRO PRODUTO
    const primeiroProduto = produtosParaFrete[0];
    console.log(`   ✅ Usando produto: ${primeiroProduto.nome} (SKU: ${primeiroProduto.codigo})`);
    
    const resultadoFrete = await calcularFrete(mensagem, primeiroProduto);
    
    // Formatar mensagem com range de frete
    if (resultadoFrete.sucesso && resultadoFrete.opcoes && resultadoFrete.opcoes.length > 0) {
      const freteMin = Math.min(...resultadoFrete.opcoes.map(o => o.valor));
      const freteMax = Math.max(...resultadoFrete.opcoes.map(o => o.valor));
      
      resultado.mensagem = [
        `📦 *Cálculo de Frete*\n\n` +
        `O valor do frete para os produtos encontrados variam entre *R$ ${freteMin.toFixed(2)}* e *R$ ${freteMax.toFixed(2)}*, ` +
        `dependendo da empresa de transporte e prazos de entrega.`,
        
        // 🔑 MENSAGEM HUMANIZADA
        `Foi um prazer te ajudar a escolher seus produtos e calcular o seu frete! 😊\n\n` +
        `Gostaria de buscar outro produto ou deseja encerrar o atendimento?`
      ];
      
      resultado.contextoAtualizado.aguardandoCEP = false;
      resultado.contextoAtualizado.aguardandoResposta = 'pos_frete';
      resultado.contextoAtualizado.freteCalculado = true;
      resultado.contextoAtualizado.ultimoCEP = mensagem.replace(/\D/g, '');
    } else {
      // Erro ao calcular - pedir CEP novamente
      console.error('   ❌ Erro no cálculo de frete:', resultadoFrete.erro || 'Sem detalhes');
      
      resultado.mensagem = 
        `❌ Não foi possível calcular o frete para este CEP.\n\n` +
        `Por favor, informe um CEP válido.`;
      
      // MANTER aguardando CEP para tentar novamente
      resultado.contextoAtualizado.aguardandoCEP = true;
      resultado.contextoAtualizado.aguardandoResposta = 'cep';
    }
    
    return resultado;
  }
  
  // ====================================================================
  // CENÁRIO 3: Cliente quer buscar outro produto
  // ====================================================================
  if (detectarNovaBusca(mensagemLower)) {
    console.log('   🔄 Cliente quer fazer nova busca');
    
    resultado.mensagem = `Legal! Vamos começar uma nova busca! 🔍\n\nQue tipo de produto você procura?`;
    resultado.contextoAtualizado.faseAtual = 'filtro';
    resultado.contextoAtualizado.aguardandoResposta = 'tipo';
    resultado.contextoAtualizado.tipoProduto = null;
    resultado.contextoAtualizado.genero = null;
    resultado.contextoAtualizado.cor = null;
    resultado.contextoAtualizado.confirmacaoPendente = false;
    
    return resultado;
  }
  
  // ====================================================================
  // CENÁRIO 4: Cliente quer encerrar
  // ====================================================================
  if (detectarEncerramento(mensagemLower)) {
    console.log('   👋 Cliente quer encerrar');
    
    resultado.mensagem = 
      `Foi um prazer te atender! 😊\n\n` +
      `Se precisar de mais alguma coisa, é só chamar! Estou sempre por aqui! 💚\n\n` +
      `Até breve! 👋`;
    
    resultado.contextoAtualizado.faseAtual = 'encerrado';
    resultado.contextoAtualizado.aguardandoResposta = null;
    
    return resultado;
  }
  
  // ====================================================================
  // CENÁRIO 5: Mensagem não reconhecida - mostrar opções
  // ====================================================================
  
  // Se já calculou frete, mostrar mensagem humanizada
  if (contexto.freteCalculado || contexto.aguardandoResposta === 'pos_frete') {
    resultado.mensagem = 
      `Desculpa, não entendi. 😅\n\n` +
      `Gostaria de buscar outro produto ou deseja encerrar o atendimento?`;
  } else {
    // Antes de calcular frete, mostrar opções padrão
    resultado.mensagem = 
      `Desculpa, não entendi. 😅\n\n` +
      `💬 *O que você gostaria de fazer?*\n\n` +
      `1️⃣ Ver mais detalhes de algum produto\n` +
      `2️⃣ 📦 *Calcular frete para o meu CEP*\n` +
      `3️⃣ Buscar outro produto\n` +
      `4️⃣ Encerrar atendimento`;
  }
  
  return resultado;
}

/**
 * Detecta se cliente quer calcular frete
 */
function detectarIntencaoFrete(mensagem) {
  const palavrasFrete = [
    'frete',
    'entrega',
    'entregar',
    'cep',
    'envio',
    'enviar',
    'correio',
    'quanto custa',
    'quanto fica',
    'calcular',
    'opção 2',
    'opcao 2',
    '2️⃣',
    'numero 2'
  ];
  
  return palavrasFrete.some(p => mensagem.includes(p));
}

/**
 * Detecta se cliente quer fazer nova busca
 */
function detectarNovaBusca(mensagem) {
  const palavrasNovaBusca = [
    'outr',
    'nova busca',
    'novo produto',
    'buscar',
    'procurar',
    'quero ver',
    'opção 3',
    'opcao 3',
    '3️⃣',
    'numero 3'
  ];
  
  return palavrasNovaBusca.some(p => mensagem.includes(p));
}

/**
 * Detecta se cliente quer encerrar
 */
function detectarEncerramento(mensagem) {
  const palavrasEncerramento = [
    'tchau',
    'ate logo',
    'até logo',
    'adeus',
    'finalizar',
    'encerrar',
    'terminar',
    'obrigad',
    'valeu',
    'ja encontrei',
    'já encontrei',
    'opção 4',
    'opcao 4',
    '4️⃣',
    'numero 4'
  ];
  
  return palavrasEncerramento.some(p => mensagem.includes(p));
}
