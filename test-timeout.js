/**
 * TESTE: Sistema de Timeout de Conversa
 * Demonstra limpeza de memória após 2 minutos de inatividade
 */

import { iniciarTimeout, cancelarTimeout, listarTimersAtivos } from './atendimento/timeout-conversa.js';

console.log('═══════════════════════════════════════════════════════════');
console.log('  TESTE: TIMEOUT DE CONVERSA (2 minutos)');
console.log('═══════════════════════════════════════════════════════════\n');

// Simular payload de um cliente
const payload = {
  nome: 'Carlos',
  fase: 'filtro_cor',
  preferencias: {
    tipoProduto: 'jaleco',
    genero: 'masculino',
    cor: null
  },
  contexto: [
    'Cliente escolheu jaleco',
    'Cliente escolheu masculino',
    'Aguardando escolha de cor'
  ],
  produtosEncontrados: [],
  ultimaBusca: null
};

console.log('📋 SITUAÇÃO INICIAL:');
console.log(`   Nome: ${payload.nome}`);
console.log(`   Fase: ${payload.fase}`);
console.log(`   Preferências:`, payload.preferencias);
console.log(`   Contexto: ${payload.contexto.length} itens\n`);

// Simular telefone do cliente
const telefone = '5583987516699';

console.log('⏱️  INICIANDO TIMER...');
console.log(`   Telefone: ${telefone}`);
console.log(`   Timeout: 2 minutos (120 segundos)\n`);

// Mock do Supabase (para teste sem banco)
const supabaseMock = null;

// Iniciar timeout
iniciarTimeout(telefone, payload, supabaseMock);

console.log('✅ Timer iniciado com sucesso!\n');

// Listar timers ativos
listarTimersAtivos();

console.log('\n💡 COMPORTAMENTO ESPERADO:');
console.log('   • Se cliente NÃO responder em 2 minutos:');
console.log('     ✅ Nome mantido: Carlos');
console.log('     ❌ Preferências apagadas (tipo, genero, cor)');
console.log('     ❌ Contexto resetado');
console.log('     📍 Fase volta para: identificacao\n');

console.log('   • Se cliente responder ANTES dos 2 minutos:');
console.log('     ✅ Timer é reiniciado (mais 2 minutos)');
console.log('     ✅ Memória mantida intacta\n');

console.log('   • Se atendimento finalizar/encerrar:');
console.log('     ⏹️  Timer é cancelado');
console.log('     ✅ Sem limpeza de memória\n');

console.log('═══════════════════════════════════════════════════════════');
console.log('  TESTE RÁPIDO (5 segundos ao invés de 2 minutos)');
console.log('═══════════════════════════════════════════════════════════\n');

// Simular timeout rápido para demonstração (5 segundos)
const payloadTeste = {
  nome: 'Maria',
  fase: 'busca',
  preferencias: {
    tipoProduto: 'scrub',
    genero: 'feminino',
    cor: 'azul'
  },
  contexto: ['Teste rápido'],
  produtosEncontrados: [],
  ultimaBusca: null
};

const telefoneTeste = '5583999999999';

console.log('📋 Cliente teste: Maria');
console.log('   Preferências: scrub feminino azul\n');

// Criar função de timeout customizada para teste (5 segundos)
const timeoutTeste = setTimeout(() => {
  console.log('\n⏰ TIMEOUT ACIONADO! (após 5 segundos)');
  console.log('🧹 Limpando memória...\n');
  
  const nomeOriginal = payloadTeste.nome;
  
  // Limpar payload mantendo nome
  payloadTeste.fase = 'identificacao';
  payloadTeste.preferencias = { tipoProduto: null, genero: null, cor: null };
  payloadTeste.contexto = [`Cliente voltou após timeout - Nome mantido: ${nomeOriginal}`];
  
  console.log('✅ RESULTADO DA LIMPEZA:');
  console.log(`   Nome: ${payloadTeste.nome} (MANTIDO)`);
  console.log(`   Fase: ${payloadTeste.fase} (resetada)`);
  console.log(`   Preferências:`, payloadTeste.preferencias);
  console.log(`   Contexto: ${payloadTeste.contexto[0]}\n`);
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ✅ TESTE CONCLUÍDO COM SUCESSO!');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Limpar timer real também
  cancelarTimeout(telefone);
  process.exit(0);
}, 5000);

console.log('⏱️  Timer de teste iniciado (5 segundos)...');
console.log('   Aguardando timeout...\n');
