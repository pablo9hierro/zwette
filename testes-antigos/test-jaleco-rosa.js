import { buscarProdutosFiltrado } from './atendimento/bloco3-magazord.js';

async function testar() {
  console.log('=== TESTE: Jaleco Feminino com cores compostas ===\n');
  
  // Rosa simples
  console.log('--- Rosa ---');
  const r1 = await buscarProdutosFiltrado({
    tipoProduto: 'jaleco',
    genero: 'feminino',
    cor: 'Rosa'
  });
  console.log(`Encontrados: ${r1.total} produtos`);
  console.log(`Primeiros 3: ${r1.produtos.slice(0,3).map(p => p.nome).join(' | ')}\n`);
  
  // Rosa Pink
  console.log('--- Rosa Pink ---');
  const r2 = await buscarProdutosFiltrado({
    tipoProduto: 'jaleco',
    genero: 'feminino',
    cor: 'Rosa Pink'
  });
  console.log(`Encontrados: ${r2.total} produtos`);
  if (r2.total > 0) {
    console.log(`Primeiro: ${r2.produtos[0].nome}`);
    console.log(`Primeira cor: ${r2.produtos[0].coresDisponiveis[0]}`);
  }
}

testar().catch(console.error);
