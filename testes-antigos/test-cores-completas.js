/**
 * Teste de lista de cores
 */
import { carregarCoresProduto } from './atendimento/lista-enumerada.js';

async function testarCores() {
  console.log('='.repeat(60));
  console.log('🎨 TESTE: Lista de cores do catálogo');
  console.log('='.repeat(60));
  
  const cores = await carregarCoresProduto('jaleco', null);
  
  console.log(`\n✅ Total de cores encontradas: ${cores.length}`);
  console.log('\n📋 Cores disponíveis:');
  cores.forEach((cor, i) => {
    console.log(`${i + 1}. ${cor}`);
  });
}

testarCores().catch(console.error);
