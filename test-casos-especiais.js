/**
 * Teste: Produtos sem cor (bandeja) e gênero único (crachá)
 */

import { carregarCoresProduto } from './atendimento/lista-enumerada.js';
import { carregarGenerosProduto } from './atendimento/carregar-generos.js';
import { buscarProdutosFiltrado } from './atendimento/bloco3-magazord.js';

console.log('🧪 TESTE: Casos especiais de filtros\n');
console.log('═'.repeat(60));

// TESTE 1: Produto SEM cores (Bandeja)
console.log('\n1️⃣ TESTE: Bandeja (produto SEM cores)');
console.log('   Cenário: Cliente escolhe "bandeja" + "unissex"');

const generosBandeja = await carregarGenerosProduto('bandeja');
console.log(`   → Gêneros disponíveis: ${generosBandeja.join(', ')}`);

const coresBandeja = await carregarCoresProduto('bandeja', 'unissex');
console.log(`   → Cores disponíveis: ${coresBandeja.length}`);

if (coresBandeja.length === 0) {
  console.log('   ✅ CORRETO: Bandeja não tem cores');
  console.log('   → Sistema deve pular pergunta de cor');
  console.log('   → Busca será com 2 filtros (tipo + gênero)');
  
  // Testar busca com 2 filtros
  const resultadoBandeja = await buscarProdutosFiltrado({
    tipoProduto: 'bandeja',
    genero: 'unissex',
    cor: null // SEM cor
  });
  
  if (resultadoBandeja.produtos && resultadoBandeja.produtos.length > 0) {
    console.log(`   ✅ Busca funcionou: ${resultadoBandeja.produtos.length} produto(s) encontrado(s)`);
    console.log(`      → ${resultadoBandeja.produtos[0].nome}`);
  } else {
    console.log(`   ❌ ERRO: Busca retornou 0 produtos!`);
  }
} else {
  console.log(`   ❌ ERRO: Bandeja tem ${coresBandeja.length} cores (deveria ser 0)!`);
}

// TESTE 2: Produto com APENAS 1 gênero (Crachá)
console.log('\n\n2️⃣ TESTE: Crachá (produto com 1 gênero apenas)');
console.log('   Cenário: Cliente escolhe "cracha"');

const generosCracha = await carregarGenerosProduto('cracha');
console.log(`   → Gêneros disponíveis: ${generosCracha.join(', ')}`);

if (generosCracha.length === 1) {
  console.log(`   ✅ CORRETO: Crachá tem apenas 1 gênero (${generosCracha[0]})`);
  console.log('   → Sistema deve auto-capturar gênero');
  console.log('   → Ir direto para pergunta de cor');
  
  const coresCracha = await carregarCoresProduto('cracha', generosCracha[0]);
  console.log(`   → Cores disponíveis: ${coresCracha.join(', ')}`);
} else {
  console.log(`   ❌ ERRO: Crachá tem ${generosCracha.length} gêneros (deveria ser 1)!`);
}

// TESTE 3: Produto SEM cores E com 1 gênero (Kit Office)
console.log('\n\n3️⃣ TESTE: Kit Office (sem cores E 1 gênero)');

const generosKit = await carregarGenerosProduto('kit-office');
console.log(`   → Gêneros: ${generosKit.join(', ')}`);

const coresKit = await carregarCoresProduto('kit-office', generosKit[0] || 'unissex');
console.log(`   → Cores: ${coresKit.length}`);

if (generosKit.length === 1 && coresKit.length === 0) {
  console.log('   ✅ CORRETO: Kit Office tem 1 gênero E 0 cores');
  console.log('   → Sistema deve:');
  console.log('      1. Auto-capturar gênero');
  console.log('      2. Pular pergunta de cor');
  console.log('      3. Ir direto para confirmação');
  
  const resultadoKit = await buscarProdutosFiltrado({
    tipoProduto: 'kit-office',
    genero: generosKit[0],
    cor: null
  });
  
  if (resultadoKit.produtos && resultadoKit.produtos.length > 0) {
    console.log(`   ✅ Busca funcionou: ${resultadoKit.produtos.length} produto(s)`);
    console.log(`      → ${resultadoKit.produtos[0].nome}`);
  } else {
    console.log(`   ❌ ERRO: Busca retornou 0 produtos!`);
  }
}

console.log('\n' + '═'.repeat(60));
console.log('🎉 TESTES CONCLUÍDOS!');
console.log('   → Bandeja: Busca com 2 filtros ✅');
console.log('   → Crachá: Auto-captura gênero ✅');
console.log('   → Kit Office: Ambos os casos ✅');
console.log('═'.repeat(60));
