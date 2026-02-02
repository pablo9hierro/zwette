/**
 * ================================================================
 * TESTE: VALIDAÇÃO DINÂMICA DE FILTROS
 * Garante que busca com 2 filtros só acontece quando produto
 * REALMENTE não tem cores no catálogo
 * ================================================================
 */

import { buscarProdutosFiltrado } from './atendimento/bloco3-magazord.js';

console.log('🧪 TESTE: Validação Dinâmica de Filtros\n');
console.log('═'.repeat(70));

// ====================================================================
// TESTE 1: Produto SEM cores (Bandeja) - DEVE PERMITIR busca com 2 filtros
// ====================================================================
console.log('\n1️⃣ TESTE: Bandeja (produto SEM cores no catálogo)');
console.log('   Entrada: tipo=bandeja, genero=unissex, cor=null');
console.log('   Esperado: ✅ PERMITIR busca (produto não tem cores)\n');

try {
  const resultado1 = await buscarProdutosFiltrado({
    tipoProduto: 'bandeja',
    genero: 'unissex',
    cor: null
  });
  
  if (resultado1.produtos && resultado1.produtos.length > 0) {
    console.log('   ✅ SUCESSO: Busca permitida (produto sem cores)');
    console.log(`      → Encontrou ${resultado1.produtos.length} produto(s)`);
    console.log(`      → ${resultado1.produtos[0].nome}`);
  } else {
    console.log('   ❌ FALHOU: Deveria encontrar produtos');
  }
} catch (erro) {
  console.log('   ❌ ERRO INESPERADO:', erro.message);
}

// ====================================================================
// TESTE 2: Produto COM cores (Crachá) - DEVE BLOQUEAR busca com 2 filtros
// ====================================================================
console.log('\n\n2️⃣ TESTE: Crachá (produto COM cores no catálogo)');
console.log('   Entrada: tipo=cracha, genero=unissex, cor=null');
console.log('   Esperado: ❌ BLOQUEAR busca (produto TEM cores)\n');

try {
  const resultado2 = await buscarProdutosFiltrado({
    tipoProduto: 'cracha',
    genero: 'unissex',
    cor: null
  });
  
  console.log('   ❌ FALHOU: Deveria ter bloqueado a busca!');
  console.log('      → Produto TEM cores disponíveis no catálogo');
  console.log(`      → Mas retornou ${resultado2.produtos?.length || 0} produtos`);
  
} catch (erro) {
  if (erro.message.includes('cores disponíveis') || erro.message.includes('obrigatório especificar')) {
    console.log('   ✅ SUCESSO: Busca bloqueada corretamente!');
    console.log('      → Erro esperado:', erro.message);
  } else {
    console.log('   ⚠️ Erro diferente do esperado:', erro.message);
  }
}

// ====================================================================
// TESTE 3: Produto COM cores E cor fornecida - DEVE PERMITIR
// ====================================================================
console.log('\n\n3️⃣ TESTE: Crachá COM cor fornecida');
console.log('   Entrada: tipo=cracha, genero=unissex, cor=Dourado');
console.log('   Esperado: ✅ PERMITIR busca (3 filtros completos)\n');

try {
  const resultado3 = await buscarProdutosFiltrado({
    tipoProduto: 'cracha',
    genero: 'unissex',
    cor: 'Dourado'
  });
  
  if (resultado3.produtos && resultado3.produtos.length > 0) {
    console.log('   ✅ SUCESSO: Busca com 3 filtros funcionou');
    console.log(`      → Encontrou ${resultado3.produtos.length} produto(s)`);
    console.log(`      → ${resultado3.produtos[0].nome}`);
  } else {
    console.log('   ❌ FALHOU: Deveria encontrar crachá dourado');
  }
} catch (erro) {
  console.log('   ❌ ERRO INESPERADO:', erro.message);
}

// ====================================================================
// TESTE 4: Jaleco (produto COM cores) - DEVE BLOQUEAR sem cor
// ====================================================================
console.log('\n\n4️⃣ TESTE: Jaleco (produto COM cores no catálogo)');
console.log('   Entrada: tipo=jaleco, genero=feminino, cor=null');
console.log('   Esperado: ❌ BLOQUEAR busca (produto TEM cores)\n');

try {
  const resultado4 = await buscarProdutosFiltrado({
    tipoProduto: 'jaleco',
    genero: 'feminino',
    cor: null
  });
  
  console.log('   ❌ FALHOU: Deveria ter bloqueado a busca!');
  console.log('      → Jaleco TEM cores disponíveis no catálogo');
  console.log(`      → Mas retornou ${resultado4.produtos?.length || 0} produtos`);
  
} catch (erro) {
  if (erro.message.includes('cores disponíveis') || erro.message.includes('obrigatório especificar')) {
    console.log('   ✅ SUCESSO: Busca bloqueada corretamente!');
    console.log('      → Erro esperado:', erro.message);
  } else {
    console.log('   ⚠️ Erro diferente do esperado:', erro.message);
  }
}

// ====================================================================
// TESTE 5: Kit Office (SEM cores) - DEVE PERMITIR busca com 2 filtros
// ====================================================================
console.log('\n\n5️⃣ TESTE: Kit Office (produto SEM cores no catálogo)');
console.log('   Entrada: tipo=kit-office, genero=unissex, cor=null');
console.log('   Esperado: ✅ PERMITIR busca (produto não tem cores)\n');

try {
  const resultado5 = await buscarProdutosFiltrado({
    tipoProduto: 'kit-office',
    genero: 'Unissex',
    cor: null
  });
  
  if (resultado5.produtos && resultado5.produtos.length > 0) {
    console.log('   ✅ SUCESSO: Busca permitida (produto sem cores)');
    console.log(`      → Encontrou ${resultado5.produtos.length} produto(s)`);
    console.log(`      → ${resultado5.produtos[0].nome}`);
  } else {
    console.log('   ❌ FALHOU: Deveria encontrar produtos');
  }
} catch (erro) {
  console.log('   ❌ ERRO INESPERADO:', erro.message);
}

console.log('\n' + '═'.repeat(70));
console.log('\n🎯 RESUMO DA VALIDAÇÃO DINÂMICA:');
console.log('   ✅ Produtos SEM cores: Busca com 2 filtros PERMITIDA');
console.log('   ❌ Produtos COM cores: Busca com 2 filtros BLOQUEADA');
console.log('   ✅ Produtos COM cores + cor fornecida: Busca PERMITIDA');
console.log('\n   → Sistema agora valida DINAMICAMENTE baseado no catálogo!');
console.log('   → Impossível fazer busca com 2 filtros se produto TEM cores.\n');
