/**
 * Teste completo: Simula fluxo exato WhatsApp (simitarra → pablo → cracha → unissex → dourado → sim)
 */

import { processarMensagemBloco1 } from './atendimento/bloco1-identificacao.js';
import { processarMensagemBloco2 } from './atendimento/bloco2-filtro.js';
import { processarMensagemBloco3 } from './atendimento/bloco3-magazord.js';

console.log('🧪 TESTE: Fluxo completo WhatsApp - Crachá Dourado\n');
console.log('═'.repeat(60));

let contexto = {
  faseAtual: 'identificacao',
  totalBuscas: 0,
  caracteristicasMencionadas: []
};

// 1. "simitarra" (ativa atendimento, contexto reseta)
console.log('\n1️⃣ Cliente: "simitarra" (palavra-chave)');
contexto = {
  faseAtual: 'identificacao',
  totalBuscas: 0,
  caracteristicasMencionadas: []
};
console.log('   → Fase: identificacao (resetado)');

// 2. "pablo" (captura nome)
console.log('\n2️⃣ Cliente: "pablo"');
const resultado1 = await processarMensagemBloco1('pablo', contexto);
contexto = resultado1.contextoAtualizado;
console.log(`   → Nome: ${contexto.nomeCliente}`);
console.log(`   → Fase: ${contexto.faseAtual}`);

// 3. "cracha" (captura tipo)
console.log('\n3️⃣ Cliente: "cracha"');
const resultado2 = await processarMensagemBloco2('cracha', contexto);
contexto = resultado2.contextoAtualizado;
console.log(`   → Tipo: ${contexto.tipoProduto}`);
console.log(`   → Fase: ${contexto.faseAtual}`);

// 4. "unissex" (captura gênero)
console.log('\n4️⃣ Cliente: "unissex"');
const resultado3 = await processarMensagemBloco2('unissex', contexto);
contexto = resultado3.contextoAtualizado;
console.log(`   → Gênero: ${contexto.genero}`);
console.log(`   → Fase: ${contexto.faseAtual}`);

// 5. "dourado" (captura cor)
console.log('\n5️⃣ Cliente: "dourado"');
const resultado4 = await processarMensagemBloco2('dourado', contexto);
contexto = resultado4.contextoAtualizado;
console.log(`   → Cor: ${contexto.cor}`);
console.log(`   → Fase: ${contexto.faseAtual}`);

// 6. "sim" (confirma busca)
console.log('\n6️⃣ Cliente: "sim" (confirma busca)');
console.log(`   → Contexto enviado para busca:`);
console.log(`      • tipoProduto: ${contexto.tipoProduto}`);
console.log(`      • genero: ${contexto.genero}`);
console.log(`      • cor: ${contexto.cor}`);

const resultado5 = await processarMensagemBloco3('sim', contexto);
contexto = resultado5.contextoAtualizado;

console.log(`\n7️⃣ Resultado da busca:`);
if (resultado5.produtos && resultado5.produtos.length > 0) {
  console.log(`   ✅ SUCESSO: Encontrou ${resultado5.produtos.length} produto(s)!`);
  resultado5.produtos.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.nome} (SKU: ${p.sku})`);
  });
} else {
  console.log(`   ❌ ERRO: Nenhum produto encontrado!`);
  console.log(`   Motivo: Sistema não encontrou match`);
}

console.log('\n' + '═'.repeat(60));
if (resultado5.produtos && resultado5.produtos.length > 0) {
  console.log('🎉 TESTE PASSOU! Fluxo completo funcionando!');
} else {
  console.log('❌ TESTE FALHOU! Busca retornou 0 produtos');
  console.log('\nDebug:');
  console.log('- Verificar se cores estão sendo limpas na busca');
  console.log('- Verificar logs de comparação (deveria aparecer "🎨 Comparando")');
}
console.log('═'.repeat(60));

process.exit(resultado5.produtos && resultado5.produtos.length > 0 ? 0 : 1);
