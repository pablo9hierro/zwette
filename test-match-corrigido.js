/**
 * TESTE: Match direto corrigido
 * Valida: nome não pega cores, confirmação detecta "quero", ordem correta
 */

import { 
  extrairNome, 
  matchTipoProduto, 
  matchGenero, 
  matchCor,
  matchConfirmacao 
} from './atendimento/match-catalogo.js';

console.log('═══════════════════════════════════════════════════════════');
console.log('  TESTE: Match Direto Corrigido');
console.log('═══════════════════════════════════════════════════════════\n');

// ===== TESTE 1: Nome NÃO deve pegar cores/produtos =====
console.log('📋 PARTE 1: NOME não deve pegar cores/produtos\n');

const testesParte1 = [
  { msg: 'bege', esperaNome: null, motivo: 'é cor' },
  { msg: 'chumbo', esperaNome: null, motivo: 'é cor' },
  { msg: 'macacao', esperaNome: null, motivo: 'é tipo' },
  { msg: 'pablo', esperaNome: 'Pablo', motivo: 'nome real' },
  { msg: 'maria', esperaNome: 'Maria', motivo: 'nome real' },
  { msg: 'é pablo', esperaNome: null, motivo: 'tem palavra reservada' }
];

let acertos1 = 0;
testesParte1.forEach((teste, i) => {
  const tipo = matchTipoProduto(teste.msg);
  const genero = matchGenero(teste.msg);
  const cor = matchCor(teste.msg, null);
  const nome = extrairNome(teste.msg, tipo, genero, cor);
  
  const passou = (nome === teste.esperaNome);
  console.log(`  ${i+1}. "${teste.msg}" (${teste.motivo})`);
  console.log(`      → Nome: ${nome || 'null'} ${passou ? '✅' : '❌'}`);
  if (passou) acertos1++;
});

console.log(`\n  Resultado: ${acertos1}/${testesParte1.length} (${Math.round(acertos1/testesParte1.length*100)}%)\n`);

// ===== TESTE 2: Confirmação deve detectar "quero" e "ja disse" =====
console.log('📋 PARTE 2: CONFIRMAÇÃO deve detectar variações\n');

const testesParte2 = [
  { msg: 'quero', espera: true },
  { msg: 'sim', espera: true },
  { msg: 'ja falei que sim', espera: true },
  { msg: 'ja disse que quero', espera: true },
  { msg: 'pode ser', espera: true },
  { msg: 'não', espera: false },
  { msg: 'nao quero', espera: false }
];

let acertos2 = 0;
testesParte2.forEach((teste, i) => {
  const conf = matchConfirmacao(teste.msg);
  const passou = (conf === teste.espera);
  console.log(`  ${i+1}. "${teste.msg}"`);
  console.log(`      → Confirmação: ${conf} (esperava ${teste.espera}) ${passou ? '✅' : '❌'}`);
  if (passou) acertos2++;
});

console.log(`\n  Resultado: ${acertos2}/${testesParte2.length} (${Math.round(acertos2/testesParte2.length*100)}%)\n`);

// ===== TESTE 3: Tipo/Cor devem funcionar ANTES do nome =====
console.log('📋 PARTE 3: TIPO/COR detectados ANTES de extrair nome\n');

const testesParte3 = [
  { msg: 'macacao', esperaTipo: 'macacao', esperaNome: null },
  { msg: 'bege', esperaCor: 'Bege', esperaNome: null },
  { msg: 'chumbo', esperaCor: 'Chumbo', esperaNome: null },
  { msg: 'jaleco', esperaTipo: 'jaleco', esperaNome: null }
];

let acertos3 = 0;
testesParte3.forEach((teste, i) => {
  const tipo = matchTipoProduto(teste.msg);
  const cor = matchCor(teste.msg, null);
  const nome = extrairNome(teste.msg, tipo, null, cor);
  
  const passTipo = !teste.esperaTipo || tipo === teste.esperaTipo;
  const passCor = !teste.esperaCor || cor === teste.esperaCor;
  const passNome = nome === teste.esperaNome;
  const passou = passTipo && passCor && passNome;
  
  console.log(`  ${i+1}. "${teste.msg}"`);
  console.log(`      → Tipo: ${tipo || 'null'} (esperava ${teste.esperaTipo || 'null'}) ${passTipo ? '✅' : '❌'}`);
  console.log(`      → Cor: ${cor || 'null'} (esperava ${teste.esperaCor || 'null'}) ${passCor ? '✅' : '❌'}`);
  console.log(`      → Nome: ${nome || 'null'} (esperava ${teste.esperaNome || 'null'}) ${passNome ? '✅' : '❌'}`);
  if (passou) acertos3++;
});

console.log(`\n  Resultado: ${acertos3}/${testesParte3.length} (${Math.round(acertos3/testesParte3.length*100)}%)\n`);

// ===== RESUMO GERAL =====
console.log('═══════════════════════════════════════════════════════════');
console.log('  RESUMO GERAL');
console.log('═══════════════════════════════════════════════════════════\n');

const total = testesParte1.length + testesParte2.length + testesParte3.length;
const acertosTotal = acertos1 + acertos2 + acertos3;
const percentual = Math.round(acertosTotal / total * 100);

console.log(`  📊 NOME:        ${acertos1}/${testesParte1.length} (${Math.round(acertos1/testesParte1.length*100)}%)`);
console.log(`  📊 CONFIRMAÇÃO: ${acertos2}/${testesParte2.length} (${Math.round(acertos2/testesParte2.length*100)}%)`);
console.log(`  📊 TIPO/COR:    ${acertos3}/${testesParte3.length} (${Math.round(acertos3/testesParte3.length*100)}%)`);
console.log(`\n  🎯 GERAL:       ${acertosTotal}/${total} (${percentual}%)\n`);

if (percentual === 100) {
  console.log('  ✅ PERFEITO! Todos os problemas corrigidos!\n');
} else if (percentual >= 80) {
  console.log('  ⚠️  BOM, mas ainda precisa ajustes.\n');
} else {
  console.log('  ❌ RUIM - precisa melhorias urgentes.\n');
}

console.log('═══════════════════════════════════════════════════════════');
console.log('  💡 CORREÇÕES IMPLEMENTADAS');
console.log('═══════════════════════════════════════════════════════════\n');
console.log('  ✅ extrairNome() agora:');
console.log('     • NÃO pega cores ("bege", "chumbo")');
console.log('     • NÃO pega tipos ("macacao", "jaleco")');
console.log('     • SÓ extrai nome se não detectou dados importantes');
console.log('     • Bloqueia palavras reservadas\n');
console.log('  ✅ matchConfirmacao() agora:');
console.log('     • Detecta "quero" como SIM');
console.log('     • Detecta "ja falei que sim" como SIM (frustração)');
console.log('     • Detecta "ja disse que quero" como SIM\n');
console.log('  ✅ Orquestrador agora:');
console.log('     • Checa tipo/genero/cor ANTES de extrair nome');
console.log('     • Passa parâmetros para extrairNome() evitar conflitos\n');
console.log('═══════════════════════════════════════════════════════════');
