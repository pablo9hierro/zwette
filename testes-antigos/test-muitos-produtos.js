/**
 * Teste com muitos produtos
 */
import { buscarProdutosFiltrado, formatarProdutosParaCliente } from './atendimento/bloco3-magazord.js';

async function testarMuitosProdutos() {
  console.log('='.repeat(60));
  console.log('🧪 TESTE: Busca com MUITOS produtos (Branco)');
  console.log('='.repeat(60));
  
  const contexto = {
    tipoProduto: 'jaleco',
    genero: 'feminino',
    cor: 'Branco'
  };
  
  const resultado = await buscarProdutosFiltrado(contexto);
  
  console.log(`\n✅ Total encontrado: ${resultado.total}`);
  console.log(`Produtos retornados: ${resultado.produtos.length}`);
  
  const mensagem = formatarProdutosParaCliente(resultado.produtos, contexto);
  console.log('\n📝 Mensagem (primeiros 1000 caracteres):');
  console.log(mensagem.substring(0, 1000));
  console.log('\n...');
  console.log('\n📏 Tamanho total da mensagem:', mensagem.length, 'caracteres');
}

testarMuitosProdutos().catch(console.error);
