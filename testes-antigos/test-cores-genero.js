/**
 * Teste de cores filtradas por gênero
 */
import { carregarCoresProduto } from './atendimento/lista-enumerada.js';

async function testarCoresPorGenero() {
  console.log('='.repeat(60));
  console.log(' TESTE: Cores filtradas por gênero');
  console.log('='.repeat(60));
  
  // TESTE 1: Scrub GERAL (sem filtro)
  console.log('\n--- Scrub SEM filtro de gênero ---');
  const coresGeral = await carregarCoresProduto('scrub', null, null);
  console.log(`Total de cores: ${coresGeral.length}`);
  console.log(`Cores: ${coresGeral.join(', ')}`);
  
  // TESTE 2: Scrub FEMININO
  console.log('\n--- Scrub FEMININO ---');
  const coresFeminino = await carregarCoresProduto('scrub', null, 'feminino');
  console.log(`Total de cores: ${coresFeminino.length}`);
  console.log(`Cores: ${coresFeminino.join(', ')}`);
  
  // TESTE 3: Scrub MASCULINO
  console.log('\n--- Scrub MASCULINO ---');
  const coresMasculino = await carregarCoresProduto('scrub', null, 'masculino');
  console.log(`Total de cores: ${coresMasculino.length}`);
  console.log(`Cores: ${coresMasculino.join(', ')}`);
  
  // TESTE 4: Scrub UNISSEX
  console.log('\n--- Scrub UNISSEX ---');
  const coresUnissex = await carregarCoresProduto('scrub', null, 'unissex');
  console.log(`Total de cores: ${coresUnissex.length}`);
  console.log(`Cores: ${coresUnissex.join(', ')}`);
}

testarCoresPorGenero().catch(console.error);
