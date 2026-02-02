/**
 * Teste de busca dolma-avental
 */
import { buscarProdutosFiltrado } from './atendimento/bloco3-magazord.js';

async function testar() {
  console.log('='.repeat(60));
  console.log('🧪 TESTE: Dolma-avental Masculino');
  console.log('='.repeat(60));
  
  // TESTE 1: Preto
  console.log('\n--- TESTE 1: Preto ---');
  const resultado1 = await buscarProdutosFiltrado({
    tipoProduto: 'dolma-avental',
    genero: 'masculino',
    cor: 'Preto'
  });
  
  console.log(`Encontrados: ${resultado1.total} produtos`);
  resultado1.produtos.forEach((p, i) => {
    console.log(`${i + 1}. ${p.nome}`);
    console.log(`   Cores: ${p.coresDisponiveis.join(', ')}`);
  });
  
  // TESTE 2: Branco
  console.log('\n--- TESTE 2: Branco ---');
  const resultado2 = await buscarProdutosFiltrado({
    tipoProduto: 'dolma-avental',
    genero: 'masculino',
    cor: 'Branco'
  });
  
  console.log(`Encontrados: ${resultado2.total} produtos`);
  resultado2.produtos.forEach((p, i) => {
    console.log(`${i + 1}. ${p.nome}`);
    console.log(`   Cores: ${p.coresDisponiveis.join(', ')}`);
  });
  
  // TESTE 3: Feminino Branco
  console.log('\n--- TESTE 3: Feminino Branco ---');
  const resultado3 = await buscarProdutosFiltrado({
    tipoProduto: 'dolma-avental',
    genero: 'feminino',
    cor: 'Branco'
  });
  
  console.log(`Encontrados: ${resultado3.total} produtos`);
}

testar().catch(console.error);
