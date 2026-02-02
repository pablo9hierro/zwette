/**
 * TESTE COMPLETO: Fluxo tipo → gênero → cor
 */

import { processarBloco2 } from './atendimento/bloco2-filtro.js';

async function testarFluxoCompleto() {
  console.log('='.repeat(70));
  console.log('🧪 TESTE: Fluxo Completo - Tipo → Gênero → Cor');
  console.log('='.repeat(70));
  console.log();

  // ====================================================================
  // CENÁRIO 1: Cliente seleciona "scrub"
  // ====================================================================
  console.log('📋 CENÁRIO 1: Seleção de tipo "scrub"');
  console.log('-'.repeat(70));
  
  let contexto = {
    nomeCliente: 'Teste',
    faseAtual: 'filtro',
    aguardandoResposta: 'tipo_produto',
    ultimaListaEnumerada: {
      tipo_lista: 'tipos_produto',
      itens: [
        { numero: 1, valor: 'jaleco' },
        { numero: 2, valor: 'scrub' },
        { numero: 3, valor: 'gorro' }
      ]
    },
    caracteristicasMencionadas: []
  };

  let resultado = await processarBloco2('scrub', contexto, '5511999999999');
  
  console.log('\n✅ RESULTADO ETAPA 1:');
  console.log('   Tipo capturado:', resultado.contextoAtualizado.tipoProduto);
  console.log('   Aguardando:', resultado.contextoAtualizado.aguardandoResposta);
  console.log('   Lista enviada:', resultado.listaEnumerada?.tipo_lista);
  console.log('   Mensagem:', resultado.mensagem.substring(0, 150) + '...');
  
  if (!resultado.contextoAtualizado.tipoProduto) {
    console.log('❌ FALHA: Tipo não capturado!');
    process.exit(1);
  }
  
  if (resultado.listaEnumerada?.tipo_lista !== 'generos') {
    console.log('❌ FALHA: Lista de gêneros não enviada!');
    console.log('   Lista atual:', resultado.listaEnumerada?.tipo_lista);
    process.exit(1);
  }
  
  console.log('\n');

  // ====================================================================
  // CENÁRIO 2: Cliente seleciona "feminino"
  // ====================================================================
  console.log('📋 CENÁRIO 2: Seleção de gênero "feminino"');
  console.log('-'.repeat(70));
  
  contexto = {
    ...resultado.contextoAtualizado,
    ultimaListaEnumerada: resultado.listaEnumerada
  };

  console.log('Contexto antes:');
  console.log('   tipoProduto:', contexto.tipoProduto);
  console.log('   genero:', contexto.genero);
  console.log('   aguardandoResposta:', contexto.aguardandoResposta);
  console.log('   ultimaListaEnumerada:', contexto.ultimaListaEnumerada?.tipo_lista);
  console.log();

  resultado = await processarBloco2('feminino', contexto, '5511999999999');
  
  console.log('\n✅ RESULTADO ETAPA 2:');
  console.log('   Gênero capturado:', resultado.contextoAtualizado.genero);
  console.log('   Aguardando:', resultado.contextoAtualizado.aguardandoResposta);
  console.log('   Lista enviada:', resultado.listaEnumerada?.tipo_lista);
  console.log('   Próxima fase:', resultado.proximaFase);
  console.log('   Mensagem:', resultado.mensagem.substring(0, 150) + '...');
  
  if (resultado.contextoAtualizado.genero !== 'feminino') {
    console.log('❌ FALHA: Gênero não capturado!');
    console.log('   Esperado: feminino');
    console.log('   Recebido:', resultado.contextoAtualizado.genero);
    process.exit(1);
  }
  
  if (resultado.listaEnumerada?.tipo_lista !== 'cores') {
    console.log('❌ FALHA CRÍTICA: Lista de cores NÃO enviada!');
    console.log('   Lista atual:', resultado.listaEnumerada?.tipo_lista);
    console.log('   proximaFase:', resultado.proximaFase);
    console.log('   Mensagem completa:', resultado.mensagem);
    process.exit(1);
  }
  
  console.log('\n');

  // ====================================================================
  // CENÁRIO 3: Cliente seleciona cor "azul"
  // ====================================================================
  console.log('📋 CENÁRIO 3: Seleção de cor "azul"');
  console.log('-'.repeat(70));
  
  contexto = {
    ...resultado.contextoAtualizado,
    ultimaListaEnumerada: resultado.listaEnumerada
  };

  resultado = await processarBloco2('1', contexto, '5511999999999'); // Seleciona primeira cor
  
  console.log('\n✅ RESULTADO ETAPA 3:');
  console.log('   Cor capturada:', resultado.contextoAtualizado.cor);
  console.log('   Próxima fase:', resultado.proximaFase);
  console.log('   Mensagem:', resultado.mensagem.substring(0, 150) + '...');
  
  if (!resultado.contextoAtualizado.cor) {
    console.log('❌ FALHA: Cor não capturada!');
    process.exit(1);
  }
  
  if (resultado.proximaFase !== 'confirmacao') {
    console.log('❌ FALHA: Não foi para confirmação!');
    console.log('   proximaFase:', resultado.proximaFase);
    process.exit(1);
  }
  
  console.log('\n');
  
  // ====================================================================
  // RESUMO FINAL
  // ====================================================================
  console.log('='.repeat(70));
  console.log('✅ ✅ ✅ TODOS OS CENÁRIOS PASSARAM! ✅ ✅ ✅');
  console.log('='.repeat(70));
  console.log('Payload final:');
  console.log('   📦 Tipo:', resultado.contextoAtualizado.tipoProduto);
  console.log('   ⚧️  Gênero:', resultado.contextoAtualizado.genero);
  console.log('   🎨 Cor:', resultado.contextoAtualizado.cor);
  console.log();
  console.log('Fluxo validado:');
  console.log('   ✅ Tipo → Lista de gêneros');
  console.log('   ✅ Gênero → Lista de cores');
  console.log('   ✅ Cor → Confirmação');
  console.log();
}

testarFluxoCompleto().catch(error => {
  console.error('\n❌ ERRO NO TESTE:', error);
  console.error(error.stack);
  process.exit(1);
});
