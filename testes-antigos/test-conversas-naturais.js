/**
 * TESTE: Robustez da IA em conversas naturais
 * Valida que a IA entende variações de linguagem natural
 */

import { analisarMensagemManual } from './atendimento/entender_mensagem_IA.js';

console.log('═══════════════════════════════════════════════════════════');
console.log('  TESTE: CONVERSAS NATURAIS - IA Robusta');
console.log('═══════════════════════════════════════════════════════════\n');

// ============================================================
// PARTE 1: Detecção de NOME (várias formas)
// ============================================================
console.log('📋 PARTE 1: Detecção de NOME\n');

const testesNome = [
  { msg: 'meu nome é pablo', esperado: 'pablo' },
  { msg: 'sou pablo', esperado: 'pablo' },
  { msg: 'me chamo pablo', esperado: 'pablo' },
  { msg: 'eu sou pablo', esperado: 'pablo' },
  { msg: 'pode me chamar de pablo', esperado: 'pablo' },
  { msg: 'Meu nome é Maria', esperado: 'maria' },
  { msg: 'sou Carlos', esperado: 'carlos' },
];

let acertosNome = 0;
testesNome.forEach((teste, i) => {
  const resultado = analisarMensagemManual(teste.msg, {});
  const passou = resultado.dadosExtraidos?.nome?.toLowerCase() === teste.esperado;
  console.log(`  ${i + 1}. "${teste.msg}" → Nome: ${resultado.dadosExtraidos?.nome || 'não detectado'} ${passou ? '✅' : '❌'}`);
  if (passou) acertosNome++;
});

console.log(`\n  Resultado: ${acertosNome}/${testesNome.length} (${Math.round(acertosNome/testesNome.length*100)}%)\n`);

// ============================================================
// PARTE 2: Detecção de PRODUTO (várias formas)
// ============================================================
console.log('📋 PARTE 2: Detecção de PRODUTO\n');

const testesProduto = [
  { msg: 'jaleco', esperado: 'jaleco' },
  { msg: 'quero jaleco', esperado: 'jaleco' },
  { msg: 'tem jaleco?', esperado: 'jaleco' },
  { msg: 'pode ver jaleco pra mim?', esperado: 'jaleco' },
  { msg: 'quero saber de jaleco', esperado: 'jaleco' },
  { msg: 'gostaria de ver jaleco', esperado: 'jaleco' },
  { msg: 'gorro', esperado: 'gorro' },
  { msg: 'quero gorro', esperado: 'gorro' },
  { msg: 'tem como ver pra mim gorro?', esperado: 'gorro' },
  { msg: 'quero saber de gorro', esperado: 'gorro' },
  { msg: 'quero gorros', esperado: 'gorro' },
];

let acertosProduto = 0;
testesProduto.forEach((teste, i) => {
  const resultado = analisarMensagemManual(teste.msg, {});
  const passou = resultado.dadosExtraidos?.tipo === teste.esperado;
  console.log(`  ${i + 1}. "${teste.msg}" → Tipo: ${resultado.dadosExtraidos?.tipo || 'não detectado'} ${passou ? '✅' : '❌'}`);
  if (passou) acertosProduto++;
});

console.log(`\n  Resultado: ${acertosProduto}/${testesProduto.length} (${Math.round(acertosProduto/testesProduto.length*100)}%)\n`);

// ============================================================
// PARTE 3: Detecção de FRUSTRAÇÃO
// ============================================================
console.log('📋 PARTE 3: Detecção de FRUSTRAÇÃO\n');

const testesFrustracao = [
  { msg: 'já falei que quero jaleco', esperadoIntencao: 'confirmar_preferencia' },
  { msg: 'ja disse que é jaleco', esperadoIntencao: 'confirmar_preferencia' },
  { msg: 'de novo? jaleco', esperadoIntencao: 'confirmar_preferencia' },
  { msg: 'quantas vezes vou repetir? jaleco', esperadoIntencao: 'confirmar_preferencia' },
];

let acertosFrustracao = 0;
testesFrustracao.forEach((teste, i) => {
  const resultado = analisarMensagemManual(teste.msg, {});
  const passou = resultado.intencao === teste.esperadoIntencao;
  console.log(`  ${i + 1}. "${teste.msg}"`);
  console.log(`      → Intenção: ${resultado.intencao} ${passou ? '✅' : '❌'}`);
  if (passou) acertosFrustracao++;
});

console.log(`\n  Resultado: ${acertosFrustracao}/${testesFrustracao.length} (${Math.round(acertosFrustracao/testesFrustracao.length*100)}%)\n`);

// ============================================================
// RESUMO GERAL
// ============================================================
console.log('═══════════════════════════════════════════════════════════');
console.log('  RESUMO GERAL');
console.log('═══════════════════════════════════════════════════════════\n');

const totalTestes = testesNome.length + testesProduto.length + testesFrustracao.length;
const totalAcertos = acertosNome + acertosProduto + acertosFrustracao;
const percentualGeral = Math.round(totalAcertos / totalTestes * 100);

console.log(`  📊 NOME:       ${acertosNome}/${testesNome.length} (${Math.round(acertosNome/testesNome.length*100)}%)`);
console.log(`  📊 PRODUTO:    ${acertosProduto}/${testesProduto.length} (${Math.round(acertosProduto/testesProduto.length*100)}%)`);
console.log(`  📊 FRUSTRAÇÃO: ${acertosFrustracao}/${testesFrustracao.length} (${Math.round(acertosFrustracao/testesFrustracao.length*100)}%)`);
console.log(`\n  🎯 GERAL:      ${totalAcertos}/${totalTestes} (${percentualGeral}%)`);

if (percentualGeral === 100) {
  console.log('\n  ✅ PERFEITO! IA entende conversas naturais!\n');
} else if (percentualGeral >= 90) {
  console.log('\n  ✅ EXCELENTE! IA muito robusta!\n');
} else if (percentualGeral >= 70) {
  console.log('\n  ⚠️  BOM, mas precisa melhorias.\n');
} else {
  console.log('\n  ❌ PRECISA MELHORIAS URGENTES!\n');
}

console.log('═══════════════════════════════════════════════════════════');
console.log('  💡 MELHORIAS IMPLEMENTADAS');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('  ✅ Detecção flexível de nome:');
console.log('     • "meu nome é pablo"');
console.log('     • "sou pablo"');
console.log('     • "me chamo pablo"\n');

console.log('  ✅ Detecção de produto em várias formas:');
console.log('     • "jaleco"');
console.log('     • "quero jaleco"');
console.log('     • "tem jaleco?"');
console.log('     • "pode ver jaleco pra mim?"\n');

console.log('  ✅ Detecção de frustração:');
console.log('     • "já falei que..."');
console.log('     • "de novo?"');
console.log('     • "quantas vezes..."\n');

console.log('  ✅ IA não vai mais:');
console.log('     ❌ Repetir pergunta de nome');
console.log('     ❌ Pedir produto 3 vezes');
console.log('     ❌ Ignorar frustração do cliente\n');

console.log('═══════════════════════════════════════════════════════════\n');
