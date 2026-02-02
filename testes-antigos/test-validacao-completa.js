/**
 * Teste final completo
 */
import { buscarProdutosFiltrado } from './atendimento/bloco3-magazord.js';

async function testarTudo() {
  console.log('='.repeat(60));
  console.log('✅ TESTE FINAL: Validação dos 3 filtros obrigatórios');
  console.log('='.repeat(60));
  
  // TESTE 1: Sem cor (deve dar erro)
  console.log('\n--- TESTE 1: SEM COR (deve falhar) ---');
  let teste1Ok = false;
  try {
    await buscarProdutosFiltrado({
      tipoProduto: 'jaleco',
      genero: 'feminino'
      // cor ausente
    });
    console.log('❌ ERRO: Deveria ter lançado exceção!');
  } catch (erro) {
    console.log('✅ Erro capturado corretamente:', erro.message);
    teste1Ok = true;
  }
  if (!teste1Ok) throw new Error('Teste 1 falhou!');
  
  // TESTE 2: Sem gênero (deve dar erro)
  console.log('\n--- TESTE 2: SEM GÊNERO (deve falhar) ---');
  let teste2Ok = false;
  try {
    await buscarProdutosFiltrado({
      tipoProduto: 'jaleco',
      cor: 'Branco'
      // genero ausente
    });
    console.log('❌ ERRO: Deveria ter lançado exceção!');
  } catch (erro) {
    console.log('✅ Erro capturado corretamente:', erro.message);
    teste2Ok = true;
  }
  if (!teste2Ok) throw new Error('Teste 2 falhou!');
  
  // TESTE 3: Com todos os 3 filtros (deve funcionar)
  console.log('\n--- TESTE 3: COM OS 3 FILTROS (deve funcionar) ---');
  const resultado = await buscarProdutosFiltrado({
    tipoProduto: 'dolma-avental',
    genero: 'masculino',
    cor: 'Preto'
  });
  console.log(`✅ Busca realizada com sucesso!`);
  console.log(`   Encontrados: ${resultado.total} produtos`);
  console.log(`   Produto: ${resultado.produtos[0].nome}`);
  console.log(`   Cor principal: ${resultado.produtos[0].coresDisponiveis[0]}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 TODOS OS TESTES PASSARAM!');
  console.log('='.repeat(60));
}

testarTudo().catch(console.error);
