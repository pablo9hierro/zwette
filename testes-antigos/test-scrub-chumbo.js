/**
 * Teste: Buscar Scrub Masculino Chumbo (não deve retornar produtos com "Roxa" ou "Preta" no nome)
 */
import { buscarProdutosFiltrado } from './atendimento/bloco3-magazord.js';

async function testarScrubChumbo() {
  console.log('='.repeat(60));
  console.log('✅ TESTE: Scrub Masculino Chumbo - Validação de Nome');
  console.log('='.repeat(60));
  
  const resultado = await buscarProdutosFiltrado({
    tipoProduto: 'scrub',
    genero: 'masculino',
    cor: 'Chumbo'
  });
  
  console.log(`\nTotal encontrado: ${resultado.total} produtos\n`);
  
  let problemasEncontrados = 0;
  
  resultado.produtos.forEach((produto, index) => {
    const nome = produto.nome || produto.nomeCompleto;
    console.log(`${index + 1}. ${nome}`);
    console.log(`   Cor PRIMARY: ${produto.coresDisponiveis[0]}`);
    
    // Verificar se o nome menciona outra cor
    const nomeLC = nome.toLowerCase();
    if (nomeLC.includes('roxa') || nomeLC.includes('roxo')) {
      console.log('   ❌ ERRO: Nome menciona "ROXA"!');
      problemasEncontrados++;
    } else if (nomeLC.includes('preta') || nomeLC.includes('preto')) {
      console.log('   ❌ ERRO: Nome menciona "PRETA"!');
      problemasEncontrados++;
    } else {
      console.log('   ✅ OK: Nome coerente com a cor');
    }
    console.log('');
  });
  
  console.log('='.repeat(60));
  if (problemasEncontrados === 0) {
    console.log('🎉 TESTE PASSOU! Todos os produtos têm nomes coerentes.');
  } else {
    console.log(`❌ TESTE FALHOU! ${problemasEncontrados} produto(s) com nomes inconsistentes.`);
  }
  console.log('='.repeat(60));
}

testarScrubChumbo().catch(console.error);
