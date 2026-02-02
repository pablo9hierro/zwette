/**
 * TESTE: Fluxo completo de cálculo de frete
 * Simula produtos de busca + cálculo de frete com range
 */

import { calcularFrete } from './atendimento/calcular-frete.js';

console.log('🧪 TESTE: Fluxo Completo de Frete\n');
console.log('━'.repeat(60));

async function testarFluxoFrete() {
  const CEP = '58073493';
  
  // Simular produtos retornados da busca final
  const produtosBusca = [
    {
      nome: 'Jaleco Feminino Branco',
      sku: '002-SD-102-000-M',
      preco: 89.90,
      peso: 0.5,
      altura: 4,
      largura: 29,
      comprimento: 38
    },
    {
      nome: 'Jaleco Feminino Azul',
      sku: '002-SD-103-000-F',
      preco: 95.00,
      peso: 0.6,
      altura: 5,
      largura: 30,
      comprimento: 40
    },
    {
      nome: 'Jaleco Feminino Verde',
      sku: '002-SD-105-000-F',
      preco: 92.50,
      peso: 0.55,
      altura: 4,
      largura: 29,
      comprimento: 39
    }
  ];
  
  console.log(`📦 Produtos para calcular frete: ${produtosBusca.length}`);
  console.log(`📍 CEP: ${CEP}`);
  console.log('');
  
  let freteMin = Infinity;
  let freteMax = 0;
  
  // Calcular frete de cada produto
  for (const produto of produtosBusca) {
    console.log(`\n🔍 Calculando frete: ${produto.nome}...`);
    
    const resultadoFrete = await calcularFrete(CEP, [produto]);
    
    if (resultadoFrete.sucesso && resultadoFrete.opcoes) {
      console.log(`   ✅ ${resultadoFrete.opcoes.length} opções encontradas`);
      
      resultadoFrete.opcoes.forEach(opcao => {
        if (opcao.valor < freteMin) {
          freteMin = opcao.valor;
          console.log(`   💰 Novo MÍNIMO: R$ ${freteMin.toFixed(2)}`);
        }
        if (opcao.valor > freteMax) {
          freteMax = opcao.valor;
          console.log(`   💰 Novo MÁXIMO: R$ ${freteMax.toFixed(2)}`);
        }
      });
    }
  }
  
  console.log('\n' + '━'.repeat(60));
  console.log('\n📊 RESULTADO FINAL:\n');
  console.log(`💰 Frete MÍNIMO: R$ ${freteMin.toFixed(2)}`);
  console.log(`💰 Frete MÁXIMO: R$ ${freteMax.toFixed(2)}`);
  console.log('');
  
  // Mensagem que será enviada ao cliente
  const mensagemCliente = [
    `📦 *Cálculo de Frete - CEP ${CEP}*\n\n` +
    `Para estes produtos jaleco que você escolheu, ` +
    `a variação de preço de frete é entre:\n\n` +
    `💰 *R$ ${freteMin.toFixed(2)}* (mais econômico)\n` +
    `💰 *R$ ${freteMax.toFixed(2)}* (mais rápido)\n\n` +
    `_O valor pode variar dependendo do produto e transportadora escolhida._`,
    
    `💬 *O que você gostaria de fazer agora?*\n\n` +
    `1️⃣ Buscar outro produto\n` +
    `2️⃣ Encerrar atendimento`
  ];
  
  console.log('💬 MENSAGEM PARA O CLIENTE:');
  console.log('━'.repeat(60));
  mensagemCliente.forEach(msg => console.log(msg + '\n'));
  console.log('━'.repeat(60));
}

testarFluxoFrete()
  .then(() => {
    console.log('\n✅ Teste concluído!');
    process.exit(0);
  })
  .catch(erro => {
    console.error('\n❌ Erro:', erro.message);
    process.exit(1);
  });
