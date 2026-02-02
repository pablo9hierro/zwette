import { processarAtendimentoJana } from './atendimento/orquestrador-jana.js';

const testNumber = `test-multiplos-filtros-${Date.now()}@s.whatsapp.net`;

console.log('🧪 TESTE - Captura Múltipla de Filtros');
console.log('='.repeat(60));

async function testarCenarios() {
  try {
    // =================================================================
    // CENÁRIO 1: Cliente manda 3 FILTROS de uma vez
    // =================================================================
    console.log('\n📍 CENÁRIO 1: 3 filtros de uma vez');
    console.log('='.repeat(60));
    
    const test1 = `test-3filtros-${Date.now()}@s.whatsapp.net`;
    await processarAtendimentoJana('simitarra', test1);
    await processarAtendimentoJana('Pablo', test1);
    
    console.log('\n💬 Cliente: "jaleco masculino verde"');
    const resp1 = await processarAtendimentoJana('jaleco masculino verde', test1);
    
    console.log('\n✅ RESPOSTA:');
    if (typeof resp1 === 'string') {
      console.log(resp1.substring(0, 200));
      
      if (resp1.includes('Posso') || resp1.includes('buscar')) {
        console.log('\n✅ SUCESSO! Foi direto para confirmação!');
      } else {
        console.log('\n❌ ERRO! Não foi direto para confirmação');
      }
    } else {
      console.log('❌ ERRO! Resposta não é string (deveria ser confirmação direta)');
    }
    
    // =================================================================
    // CENÁRIO 2: Cliente manda 2 FILTROS (tipo + gênero)
    // =================================================================
    console.log('\n\n📍 CENÁRIO 2: 2 filtros de uma vez (tipo + gênero)');
    console.log('='.repeat(60));
    
    const test2 = `test-2filtros-${Date.now()}@s.whatsapp.net`;
    await processarAtendimentoJana('simitarra', test2);
    await processarAtendimentoJana('Maria', test2);
    
    console.log('\n💬 Cliente: "jaleco masculino"');
    const resp2 = await processarAtendimentoJana('jaleco masculino', test2);
    
    console.log('\n✅ RESPOSTA:');
    if (Array.isArray(resp2) && resp2.length === 2) {
      console.log('\n--- Mensagem 1 ---');
      console.log(resp2[0]);
      console.log('\n--- Mensagem 2 ---');
      console.log(resp2[1].substring(0, 150) + '...');
      
      if (resp2[0].includes('Que bom que escolheu') && resp2[1].includes('Cores')) {
        console.log('\n✅ SUCESSO! Confirmou os 2 e perguntou o terceiro (cor)!');
      } else {
        console.log('\n❌ ERRO! Não confirmou corretamente os 2 filtros');
      }
    } else {
      console.log('❌ ERRO! Não retornou array com 2 mensagens');
      console.log('Tipo da resposta:', typeof resp2);
      console.log('É array?', Array.isArray(resp2));
    }
    
    // =================================================================
    // CENÁRIO 3: Cliente manda 1 FILTRO (fluxo normal)
    // =================================================================
    console.log('\n\n📍 CENÁRIO 3: 1 filtro (fluxo normal)');
    console.log('='.repeat(60));
    
    const test3 = `test-1filtro-${Date.now()}@s.whatsapp.net`;
    await processarAtendimentoJana('simitarra', test3);
    await processarAtendimentoJana('João', test3);
    
    console.log('\n💬 Cliente: "jaleco"');
    const resp3 = await processarAtendimentoJana('jaleco', test3);
    
    console.log('\n✅ RESPOSTA:');
    if (Array.isArray(resp3) && resp3.length === 2) {
      console.log('\n--- Mensagem 1 ---');
      console.log(resp3[0]);
      console.log('\n--- Mensagem 2 ---');
      console.log(resp3[1].substring(0, 100) + '...');
      
      console.log('\n✅ Fluxo normal funcionando (1 filtro por vez)');
    }
    
    console.log('\n\n' + '='.repeat(60));
    console.log('✅ TESTES FINALIZADOS!');
    console.log('='.repeat(60));
    console.log('📊 RESUMO:');
    console.log('   • 3 filtros de uma vez → Confirmação direta');
    console.log('   • 2 filtros de uma vez → Confirma + pede terceiro');
    console.log('   • 1 filtro → Fluxo sequencial normal');
    
  } catch (erro) {
    console.error('\n❌ ERRO:', erro);
    console.error(erro.stack);
  }
}

testarCenarios();
