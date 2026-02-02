/**
 * Teste simples da busca de produtos COM OS 3 FILTROS OBRIGATÓRIOS
 */
import { buscarProdutosFiltrado, formatarProdutosParaCliente } from './atendimento/bloco3-magazord.js';

async function testarBusca() {
  console.log('='.repeat(60));
  console.log('🧪 TESTE: Busca com 3 FILTROS OBRIGATÓRIOS');
  console.log('='.repeat(60));
  
  // TESTE 1: Jaleco Feminino Rosa
  console.log('\n--- TESTE 1: Jaleco Feminino Rosa ---');
  const contexto1 = {
    tipoProduto: 'jaleco',
    genero: 'feminino',
    cor: 'Rosa'
  };
  
  console.log('\n📋 Contexto da busca:');
  console.log(JSON.stringify(contexto1, null, 2));
  
  const resultado1 = await buscarProdutosFiltrado(contexto1);
  
  console.log('\n✅ Resultado:');
  console.log(`Total encontrado: ${resultado1.total}`);
  console.log(`Produtos retornados: ${resultado1.produtos.length}`);
  
  if (resultado1.produtos.length > 0) {
    console.log('\n📦 Primeiros 5 produtos:');
    resultado1.produtos.slice(0, 5).forEach((p, i) => {
      console.log(`${i + 1}. ${p.nome} - ${p.coresDisponiveis.join(', ')}`);
    });
  }
  
  // TESTE 2: Jaleco Masculino Branco
  console.log('\n\n--- TESTE 2: Jaleco Masculino Branco ---');
  const contexto2 = {
    tipoProduto: 'jaleco',
    genero: 'masculino',
    cor: 'Branco'
  };
  
  const resultado2 = await buscarProdutosFiltrado(contexto2);
  console.log(`\n✅ Encontrados: ${resultado2.total} produtos`);
  
  // TESTE 3: Jaleco Feminino Cinza
  console.log('\n\n--- TESTE 3: Jaleco Feminino Cinza ---');
  const contexto3 = {
    tipoProduto: 'jaleco',
    genero: 'feminino',
    cor: 'Cinza'
  };
  
  const resultado3 = await buscarProdutosFiltrado(contexto3);
  console.log(`\n✅ Encontrados: ${resultado3.total} produtos`);
  if (resultado3.produtos.length > 0) {
    console.log(`Produto: ${resultado3.produtos[0].nome}`);
  }
}

testarBusca().catch(console.error);
