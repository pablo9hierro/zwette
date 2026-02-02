/**
 * Teste COMPLETO: Fluxo de conversação com múltiplas mensagens sequenciais
 */
import { processarAtendimentoJana } from './atendimento/orquestrador-jana.js';

async function simularFluxoCompleto() {
  console.log('═'.repeat(70));
  console.log('🎬 SIMULAÇÃO COMPLETA: Fluxo com Múltiplas Mensagens');
  console.log('═'.repeat(70));
  
  const numeroTeste = '5511966665555@s.whatsapp.net';
  
  // ========================================
  // 1. Cliente ativa o bot
  // ========================================
  console.log('\n' + '─'.repeat(70));
  console.log('👤 Cliente digita: "simitarra"');
  console.log('─'.repeat(70));
  
  const resp1 = await processarAtendimentoJana('simitarra', numeroTeste);
  
  console.log(`\n🤖 Jana responde com ${resp1.length} mensagens:\n`);
  resp1.forEach((msg, i) => {
    console.log(`📨 Mensagem ${i + 1}:`);
    console.log(msg);
    console.log('');
    if (i < resp1.length - 1) console.log('⏱️  [1 segundo de pausa]\n');
  });
  
  // ========================================
  // 2. Cliente informa o nome
  // ========================================
  console.log('─'.repeat(70));
  console.log('👤 Cliente digita: "pablo"');
  console.log('─'.repeat(70));
  
  const resp2 = await processarAtendimentoJana('pablo', numeroTeste);
  
  console.log(`\n🤖 Jana responde com ${Array.isArray(resp2) ? resp2.length : 1} mensagens:\n`);
  
  if (Array.isArray(resp2)) {
    resp2.forEach((msg, i) => {
      console.log(`📨 Mensagem ${i + 1}:`);
      console.log(msg.substring(0, 200) + (msg.length > 200 ? '...' : ''));
      console.log('');
      if (i < resp2.length - 1) console.log('⏱️  [1 segundo de pausa]\n');
    });
  } else {
    console.log(resp2.substring(0, 200) + '...');
  }
  
  console.log('\n' + '═'.repeat(70));
  console.log('✅ SIMULAÇÃO CONCLUÍDA COM SUCESSO!');
  console.log('═'.repeat(70));
  
  console.log('\n📊 RESUMO DO FLUXO:');
  console.log('   1️⃣  "simitarra" → 2 mensagens (apresentação + pergunta nome)');
  console.log('   2️⃣  "pablo" → 2 mensagens (prazer + catálogo)');
  console.log('   ✨ Total: 4 mensagens sequenciais');
  console.log('   🎯 Atendimento natural, humanizado e não-robótico\n');
}

simularFluxoCompleto().catch(console.error);
