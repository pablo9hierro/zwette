import 'dotenv/config';
import { buscarProdutosComIA, formatarProdutosIA } from './atendimento/buscar_produtos_ia.js';

console.log('🧪 Testando busca inteligente de produtos com IA...\n');

// Teste 1: Jaleco masculino azul
const contexto1 = {
  tipo: 'jaleco',
  genero: 'masculino',
  cor: 'azul'
};

const historico1 = [
  { role: 'bot', mensagem: 'Que tipo de produto você procura?' },
  { role: 'cliente', mensagem: 'jaleco' },
  { role: 'bot', mensagem: 'Masculino ou feminino?' },
  { role: 'cliente', mensagem: 'masculino' },
  { role: 'bot', mensagem: 'Qual cor prefere?' },
  { role: 'cliente', mensagem: 'azul' }
];

console.log('🔍 Teste 1: Jaleco masculino azul');
console.log('📋 Contexto:', contexto1);

try {
  const resultado1 = await buscarProdutosComIA(contexto1, historico1);
  console.log('\n✅ Resultado da busca:');
  console.log(`   - Sucesso: ${resultado1.sucesso}`);
  console.log(`   - Produtos encontrados: ${resultado1.produtos?.length || 0}`);
  console.log(`   - Filtros aplicados:`, resultado1.filtrosAplicados);
  
  if (resultado1.produtos?.length) {
    console.log('\n📦 Produtos recomendados:');
    resultado1.produtos.forEach((p, i) => {
      console.log(`   ${i+1}. ${p.nome} (Match: ${p.matchScore}%)`);
      console.log(`      Motivo: ${p.motivoRecomendacao}`);
    });
  }
  
  console.log('\n💬 Mensagem formatada para cliente:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const mensagem = formatarProdutosIA(resultado1);
  console.log(mensagem);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
} catch (erro) {
  console.error('❌ Erro:', erro.message);
}

// Teste 2: Scrub feminino rosa
console.log('\n\n🔍 Teste 2: Scrub feminino rosa');
const contexto2 = {
  tipo: 'scrub',
  genero: 'feminino',
  cor: 'rosa'
};

const historico2 = [
  { role: 'cliente', mensagem: 'quero scrub feminino rosa' }
];

try {
  const resultado2 = await buscarProdutosComIA(contexto2, historico2);
  console.log(`\n✅ Produtos encontrados: ${resultado2.produtos?.length || 0}`);
  
  if (resultado2.produtos?.length) {
    resultado2.produtos.forEach((p, i) => {
      console.log(`   ${i+1}. ${p.nome} (${p.matchScore}%)`);
    });
  }
  
} catch (erro) {
  console.error('❌ Erro:', erro.message);
}

console.log('\n✅ Testes concluídos!');
