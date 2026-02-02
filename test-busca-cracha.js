/**
 * Teste: Busca de crachá (problema reportado)
 */

import { buscarProdutosFiltrado } from './atendimento/bloco3-magazord.js';

async function testarBuscaCracha() {
  console.log('🧪 TESTE: Busca de crachá (bug reportado)\n');
  
  const testes = [
    {
      nome: 'Crachá Unissex Dourado',
      contexto: {
        tipoProduto: 'cracha',
        genero: 'unissex',
        cor: 'Dourado'
      }
    },
    {
      nome: 'Crachá Unissex Prata',
      contexto: {
        tipoProduto: 'cracha',
        genero: 'unissex',
        cor: 'Prata'
      }
    },
    {
      nome: 'Crachá Unissex Preto',
      contexto: {
        tipoProduto: 'cracha',
        genero: 'unissex',
        cor: 'Preto'
      }
    },
    {
      nome: 'Bandeja Unissex SEM COR',
      contexto: {
        tipoProduto: 'bandeja',
        genero: 'unissex',
        cor: null // Produto sem cor
      }
    }
  ];
  
  let passou = true;
  
  for (const teste of testes) {
    console.log(`\n📝 Testando: ${teste.nome}`);
    console.log(`   Filtro: ${teste.contexto.tipoProduto} + ${teste.contexto.genero} + ${teste.contexto.cor}`);
    
    try {
      const resultado = await buscarProdutosFiltrado(teste.contexto);
      
      if (resultado.produtos && resultado.produtos.length > 0) {
        console.log(`   ✅ Encontrou ${resultado.produtos.length} produto(s)`);
        console.log(`   → SKU: ${resultado.produtos[0].sku}`);
        console.log(`   → Nome: ${resultado.produtos[0].nome}`);
      } else {
        console.log(`   ❌ ERRO: Nenhum produto encontrado!`);
        passou = false;
      }
    } catch (erro) {
      console.log(`   ❌ ERRO: ${erro.message}`);
      passou = false;
    }
  }
  
  return passou;
}

// Executar
testarBuscaCracha().then(sucesso => {
  console.log('\n' + '═'.repeat(60));
  if (sucesso) {
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    console.log('   → Crachá Dourado: ENCONTRADO ✅');
    console.log('   → Crachá Prata: ENCONTRADO ✅');
    console.log('   → Crachá Preto: ENCONTRADO ✅');
    console.log('   → Match funciona com nomes limpos!');
  } else {
    console.log('❌ ALGUNS TESTES FALHARAM');
    console.log('   Verifique os logs acima');
  }
  console.log('═'.repeat(60));
  
  process.exit(sucesso ? 0 : 1);
});
