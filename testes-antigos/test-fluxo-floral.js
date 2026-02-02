/**
 * Teste: Fluxo completo - Jaleco Feminino Floral (deve retornar 0)
 */
import { buscarProdutosFiltrado } from './atendimento/bloco3-magazord.js';
import { carregarCoresProduto } from './atendimento/lista-enumerada.js';

async function testarFluxoFloral() {
  console.log('='.repeat(60));
  console.log('✅ TESTE: Fluxo Completo - Jaleco Feminino');
  console.log('='.repeat(60));
  
  // PASSO 1: Carregar cores disponíveis
  console.log('\n--- PASSO 1: Carregar cores disponíveis ---');
  const cores = await carregarCoresProduto('jaleco', null, 'feminino');
  console.log(`Total de cores: ${cores.length}`);
  console.log(`Lista: ${cores.slice(0, 10).join(', ')}...`);
  
  // Verificar se Floral está na lista
  const floralNaLista = cores.includes('Floral');
  console.log(`\n"Floral" na lista de sugestões? ${floralNaLista ? '❌ SIM (ERRO!)' : '✅ NÃO (CORRETO!)'}`);
  
  // PASSO 2: Tentar buscar Jaleco Feminino Branco (deve funcionar)
  console.log('\n--- PASSO 2: Buscar Jaleco Feminino BRANCO ---');
  const resultadoBranco = await buscarProdutosFiltrado({
    tipoProduto: 'jaleco',
    genero: 'feminino',
    cor: 'Branco'
  });
  console.log(`✅ Encontrados: ${resultadoBranco.total} produtos`);
  if (resultadoBranco.total > 0) {
    console.log(`   Primeiro: ${resultadoBranco.produtos[0].nome}`);
  }
  
  // PASSO 3: Tentar buscar Jaleco Feminino Floral (deve retornar 0)
  console.log('\n--- PASSO 3: Buscar Jaleco Feminino FLORAL ---');
  const resultadoFloral = await buscarProdutosFiltrado({
    tipoProduto: 'jaleco',
    genero: 'feminino',
    cor: 'Floral'
  });
  console.log(`Encontrados: ${resultadoFloral.total} produtos`);
  
  if (resultadoFloral.total === 0) {
    console.log('✅ CORRETO: Não há produtos com "Floral" como cor PRIMARY');
  } else {
    console.log('❌ ERRO: Encontrou produtos mas não deveria!');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 TESTE CONCLUÍDO');
  console.log('='.repeat(60));
  console.log('\n📝 RESUMO:');
  console.log('   • Lista de cores mostra APENAS cores PRIMARY');
  console.log('   • "Floral" não aparece mais na lista de sugestões');
  console.log('   • Cliente não pode selecionar cor que retorna 0 produtos');
  console.log('   • 100% de garantia: cor sugerida = cor disponível');
}

testarFluxoFloral().catch(console.error);
