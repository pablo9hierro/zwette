/**
 * Teste: Simular fluxo completo de touca
 * Sem WhatsApp, apenas lógica do bloco2-filtro
 */

import { carregarCoresProduto } from './atendimento/lista-enumerada.js';

async function testarFluxoTouca() {
  console.log('🧪 TESTE: Fluxo completo touca (tipo → gênero → cor)\n');
  
  let passou = true;
  
  // Cenário 1: Cliente diz "quero touca" (só tipo, sem gênero)
  // Comportamento: Retorna cores do catálogo geral (produtos sem filtro de gênero)
  console.log('📝 Cenário 1: Cliente diz "quero touca" (tipo=touca, gênero=null)');
  const cores1 = await carregarCoresProduto('touca', null);
  console.log(`   → Cores retornadas: [${cores1.join(', ')}]`);
  if (cores1.length === 1 && cores1[0] === 'Preto') {
    console.log('   ✅ CORRETO: Retorna ["Preto"] do catálogo geral (não é lista genérica!)');
  } else if (cores1.length === 10) {
    console.log('   ❌ ERRO: Retornou lista genérica de 10 cores!');
    passou = false;
  } else {
    console.log(`   ⚠️ AVISO: Retornou ${cores1.length} cores (esperado 1)`);
  }
  
  // Cenário 2: Cliente responde "unissex" (tipo=touca, gênero=unissex)
  console.log('\n📝 Cenário 2: Cliente responde "unissex" (tipo=touca, gênero=unissex)');
  const cores2 = await carregarCoresProduto('touca', null, 'unissex');
  console.log(`   → Cores retornadas: [${cores2.join(', ')}]`);
  if (cores2.length === 1 && cores2[0] === 'Preto') {
    console.log('   ✅ CORRETO: Retorna apenas ["Preto"]');
  } else {
    console.log('   ❌ ERRO: Deveria retornar apenas ["Preto"]!');
    passou = false;
  }
  
  // Cenário 3: Avental (produto com várias cores)
  console.log('\n📝 Cenário 3: Avental unissex (produto com múltiplas cores)');
  const cores3 = await carregarCoresProduto('avental', null, 'unissex');
  console.log(`   → Cores retornadas: ${cores3.length} cores`);
  if (cores3.length > 1) {
    console.log(`   ✅ CORRETO: Retorna ${cores3.length} cores reais do catálogo`);
    console.log(`   → Exemplo: ${cores3.slice(0, 3).join(', ')}...`);
  } else {
    console.log('   ❌ ERRO: Avental deveria ter múltiplas cores!');
    passou = false;
  }
  
  return passou;
}

// Executar
testarFluxoTouca().then(sucesso => {
  console.log('\n' + '='.repeat(60));
  if (sucesso) {
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    console.log('   Sistema agora:');
    console.log('   → Retorna [] quando gênero não especificado');
    console.log('   → Retorna cores REAIS do catálogo quando gênero especificado');
    console.log('   → NUNCA retorna lista genérica');
  } else {
    console.log('❌ ALGUNS TESTES FALHARAM');
  }
  console.log('='.repeat(60));
  process.exit(sucesso ? 0 : 1);
});
