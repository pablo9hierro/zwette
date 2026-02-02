/**
 * Teste: Verificar se lista de cores mostra APENAS cores PRIMARY
 */
import { carregarCoresProduto } from './atendimento/lista-enumerada.js';

async function testarCores() {
  console.log('='.repeat(60));
  console.log('✅ TESTE: Cores PRIMARY apenas');
  console.log('='.repeat(60));
  
  // TESTE 1: Jaleco Feminino
  console.log('\n--- TESTE 1: Jaleco Feminino ---');
  const coresJaleco = await carregarCoresProduto('jaleco', null, 'feminino');
  console.log(`Total de cores: ${coresJaleco.length}`);
  console.log(`Cores: ${coresJaleco.join(', ')}`);
  
  // Verificar se "Floral" está na lista
  if (coresJaleco.includes('Floral')) {
    console.log('❌ ERRO: "Floral" não deveria estar na lista (não é cor PRIMARY)');
  } else {
    console.log('✅ OK: "Floral" não está na lista');
  }
  
  // TESTE 2: Scrub Unissex
  console.log('\n--- TESTE 2: Scrub Unissex ---');
  const coresScrub = await carregarCoresProduto('scrub', null, 'unissex');
  console.log(`Total de cores: ${coresScrub.length}`);
  
  // TESTE 3: Gorro Unissex
  console.log('\n--- TESTE 3: Gorro Unissex ---');
  const coresGorro = await carregarCoresProduto('gorro', null, 'unissex');
  console.log(`Total de cores: ${coresGorro.length}`);
  console.log(`Cores: ${coresGorro.join(', ')}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 TESTES CONCLUÍDOS');
  console.log('='.repeat(60));
}

testarCores().catch(console.error);
