/**
 * ================================================================
 * TESTE: Validação e Limpeza de Cores
 * Verifica se cores suspeitas são filtradas corretamente
 * ================================================================
 */

import { carregarCoresProduto } from './atendimento/lista-enumerada.js';

console.log('🧪 TESTE: Limpeza e Validação de Cores\n');
console.log('═'.repeat(70));

// ====================================================================
// TESTE 1: Jaleco Feminino (produto com cores problemáticas)
// ====================================================================
console.log('\n1️⃣ TESTE: Jaleco Feminino (cores no catálogo)');

try {
  const coresJaleco = await carregarCoresProduto('jaleco', null, 'feminino');
  
  console.log(`\n📊 RESULTADO:`);
  console.log(`   Total de cores: ${coresJaleco.length}`);
  console.log(`\n🎨 Cores válidas encontradas:`);
  
  coresJaleco.forEach((cor, i) => {
    console.log(`   ${i + 1}. ${cor}`);
  });
  
  // Verificar se tem cores suspeitas
  const coresSuspeitas = coresJaleco.filter(cor => 
    cor.toLowerCase().includes('estampado') ||
    cor.toLowerCase().includes('manuela') ||
    cor.toLowerCase().includes('feminino') ||
    cor.split(/\s+/).length > 4
  );
  
  if (coresSuspeitas.length > 0) {
    console.log(`\n   ❌ FALHOU: Ainda tem ${coresSuspeitas.length} cores suspeitas:`);
    coresSuspeitas.forEach(cor => {
      console.log(`      • "${cor}"`);
    });
  } else {
    console.log(`\n   ✅ SUCESSO: Nenhuma cor suspeita encontrada!`);
  }
  
} catch (erro) {
  console.log(`   ❌ ERRO: ${erro.message}`);
}

// ====================================================================
// TESTE 2: Crachá (produto com cores simples)
// ====================================================================
console.log('\n\n2️⃣ TESTE: Crachá (cores limpas esperadas)');

try {
  const coresCracha = await carregarCoresProduto('cracha', null, 'unissex');
  
  console.log(`\n📊 RESULTADO:`);
  console.log(`   Total de cores: ${coresCracha.length}`);
  console.log(`\n🎨 Cores:`);
  
  coresCracha.forEach((cor, i) => {
    console.log(`   ${i + 1}. ${cor}`);
  });
  
  // Verificar limpeza
  const coresComProblemas = coresCracha.filter(cor => 
    cor.toLowerCase().includes('crachá') ||
    cor.toLowerCase().includes('magnético')
  );
  
  if (coresComProblemas.length > 0) {
    console.log(`\n   ❌ FALHOU: ${coresComProblemas.length} cores não foram limpas corretamente`);
  } else {
    console.log(`\n   ✅ SUCESSO: Todas as cores foram limpas!`);
  }
  
} catch (erro) {
  console.log(`   ❌ ERRO: ${erro.message}`);
}

// ====================================================================
// TESTE 3: Touca (produto com 1 cor)
// ====================================================================
console.log('\n\n3️⃣ TESTE: Touca (deve ter apenas 1 cor)');

try {
  const coresTouca = await carregarCoresProduto('touca', null, 'unissex');
  
  console.log(`\n📊 RESULTADO:`);
  console.log(`   Total de cores: ${coresTouca.length}`);
  
  if (coresTouca.length === 1) {
    console.log(`   ✅ SUCESSO: 1 cor encontrada: "${coresTouca[0]}"`);
  } else {
    console.log(`   ❌ FALHOU: Esperava 1 cor, encontrou ${coresTouca.length}`);
    coresTouca.forEach(cor => console.log(`      • ${cor}`));
  }
  
} catch (erro) {
  console.log(`   ❌ ERRO: ${erro.message}`);
}

console.log('\n' + '═'.repeat(70));
console.log('\n🎯 VALIDAÇÕES:');
console.log('   ✅ Cores com "Estampado" devem ser DESCARTADAS');
console.log('   ✅ Cores com modelos (Manuela, Marta, etc) devem ser LIMPAS');
console.log('   ✅ Cores com mais de 4 palavras devem ser DESCARTADAS');
console.log('   ✅ Cores com palavras redundantes devem ser LIMPAS');
console.log('\n');
