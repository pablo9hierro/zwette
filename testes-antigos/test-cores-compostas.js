/**
 * Teste de detecção de cores compostas
 */
import { buscarProdutosFiltrado } from './atendimento/bloco3-magazord.js';

async function testarCoresCompostas() {
  console.log('='.repeat(60));
  console.log('🎨 TESTE: Cores compostas');
  console.log('='.repeat(60));
  
  // TESTE 1: Rosa Pink (composta)
  console.log('\n--- TESTE 1: Macacão Feminino ROSA PINK ---');
  const resultado1 = await buscarProdutosFiltrado({
    tipoProduto: 'macacao',
    genero: 'feminino',
    cor: 'Rosa Pink'
  });
  
  console.log(`✅ Encontrados: ${resultado1.total} produtos`);
  if (resultado1.produtos.length > 0) {
    console.log('\n📦 Produtos:');
    resultado1.produtos.forEach((p, i) => {
      console.log(`${i + 1}. ${p.nome}`);
      console.log(`   Cores: ${p.coresDisponiveis.join(', ')}`);
    });
  }
  
  // TESTE 2: Rosa (simples) - deve retornar APENAS produtos com "Rosa" exato
  console.log('\n\n--- TESTE 2: Macacão Feminino ROSA (simples) ---');
  const resultado2 = await buscarProdutosFiltrado({
    tipoProduto: 'macacao',
    genero: 'feminino',
    cor: 'Rosa'
  });
  
  console.log(`✅ Encontrados: ${resultado2.total} produtos`);
  if (resultado2.produtos.length > 0) {
    console.log('\n📦 Produtos (primeiros 5):');
    resultado2.produtos.slice(0, 5).forEach((p, i) => {
      console.log(`${i + 1}. ${p.nome}`);
      console.log(`   Cores: ${p.coresDisponiveis.join(', ')}`);
    });
  }
  
  // TESTE 3: Azul Bebe
  console.log('\n\n--- TESTE 3: Macacão Feminino AZUL BEBE ---');
  const resultado3 = await buscarProdutosFiltrado({
    tipoProduto: 'macacao',
    genero: 'feminino',
    cor: 'Azul Bebe'
  });
  
  console.log(`✅ Encontrados: ${resultado3.total} produtos`);
  if (resultado3.produtos.length > 0) {
    console.log('\n📦 Produtos:');
    resultado3.produtos.forEach((p, i) => {
      console.log(`${i + 1}. ${p.nome}`);
      console.log(`   Cores: ${p.coresDisponiveis.join(', ')}`);
    });
  }
}

testarCoresCompostas().catch(console.error);
