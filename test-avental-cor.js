/**
 * TEST: Verificar busca de Avental com cor no nome
 * Problema: "Areia Escura Regulavel" tem cor="" mas cor está no nome do produto
 */

import { buscarProdutosDireto } from './atendimento/match-catalogo.js';

console.log('='.repeat(80));
console.log('🧪 TESTE: BUSCA AVENTAL COM COR NO NOME');
console.log('='.repeat(80));

// TEST 1: Buscar "Areia Escura Regulavel" - cor está no nome, não no campo
console.log('\n📋 TESTE 1: Avental Linho Areia Escura Regulavel (masculino)');
console.log('   Expectativa: Encontrar produto (cor está no NOME, não no campo cor)');
const resultado1 = buscarProdutosDireto('dolma-avental', 'Linho', 'Areia Escura Regulavel', 'masculino');
console.log(`   ✅ Resultado: ${resultado1.length} produto(s) encontrado(s)`);
if (resultado1.length > 0) {
  console.log(`   📦 Produto: ${resultado1[0].nome}`);
  console.log(`   🎨 Campo cor: "${resultado1[0].cor || '(vazio)'}"`);
  console.log(`   🌈 Cores disponíveis: ${resultado1[0].coresDisponiveis?.join(', ') || 'N/A'}`);
}

// TEST 2: Buscar "Branco" - cor está no nome E no campo
console.log('\n📋 TESTE 2: Dolma Branco (masculino)');
console.log('   Expectativa: Encontrar produtos (cor pode estar no nome OU no campo)');
const resultado2 = buscarProdutosDireto('dolma-avental', 'Masculina', 'Branco', 'masculino');
console.log(`   ✅ Resultado: ${resultado2.length} produto(s) encontrado(s)`);
if (resultado2.length > 0) {
  resultado2.slice(0, 3).forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.nome}`);
    console.log(`      Campo cor: "${p.cor || '(vazio)'}"`);
  });
}

// TEST 3: Buscar cores compostas no nome
console.log('\n📋 TESTE 3: Avental "Areia Escura" (sem "Regulavel")');
console.log('   Expectativa: Encontrar produtos com "Areia" E "Escura" no nome');
const resultado3 = buscarProdutosDireto('dolma-avental', null, 'Areia Escura', 'masculino');
console.log(`   ✅ Resultado: ${resultado3.length} produto(s) encontrado(s)`);
if (resultado3.length > 0) {
  resultado3.slice(0, 5).forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.nome}`);
  });
}

// TEST 4: Buscar estampados
console.log('\n📋 TESTE 4: Avental Estampado');
console.log('   Expectativa: Encontrar produtos estampados (Vintage, Longo, etc)');
const resultado4 = buscarProdutosDireto('dolma-avental', null, 'Estampado', 'masculino');
console.log(`   ✅ Resultado: ${resultado4.length} produto(s) encontrado(s)`);
if (resultado4.length > 0) {
  resultado4.slice(0, 5).forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.nome}`);
    console.log(`      Cores disponíveis: ${p.coresDisponiveis?.join(', ') || 'N/A'}`);
  });
}

console.log('\n' + '='.repeat(80));
console.log('✅ TESTES CONCLUÍDOS');
console.log('='.repeat(80));
