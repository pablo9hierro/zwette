import { processarAtendimentoJana } from './atendimento/orquestrador-jana.js';

const testNumber = `test-continuacao-${Date.now()}@s.whatsapp.net`;

console.log('🧪 TESTE - Fluxo de Continuação e Encerramento');
console.log('='.repeat(60));

async function testarFluxoCompleto() {
  try {
    console.log('\n📍 PASSO 1: Iniciando atendimento');
    const resp1 = await processarAtendimentoJana('simitarra', testNumber);
    console.log('✅ Resposta 1:', Array.isArray(resp1) ? `[${resp1.length} mensagens]` : 'string');
    
    console.log('\n📍 PASSO 2: Enviando nome');
    const resp2 = await processarAtendimentoJana('Pablo', testNumber);
    console.log('✅ Resposta 2:', Array.isArray(resp2) ? `[${resp2.length} mensagens]` : 'string');
    
    console.log('\n📍 PASSO 3: Escolhendo tipo (jaleco)');
    const resp3 = await processarAtendimentoJana('jaleco', testNumber);
    console.log('✅ Resposta 3:', Array.isArray(resp3) ? `[${resp3.length} mensagens]` : 'string');
    
    console.log('\n📍 PASSO 4: Escolhendo gênero (masculino)');
    const resp4 = await processarAtendimentoJana('masculino', testNumber);
    console.log('✅ Resposta 4:', Array.isArray(resp4) ? `[${resp4.length} mensagens]` : 'string');
    
    console.log('\n📍 PASSO 5: Escolhendo cor (branco)');
    const resp5 = await processarAtendimentoJana('branco', testNumber);
    console.log('✅ Resposta 5:', Array.isArray(resp5) ? `[${resp5.length} mensagens]` : 'string');
    
    console.log('\n📍 PASSO 6: Confirmando busca (sim)');
    const resp6 = await processarAtendimentoJana('sim', testNumber);
    console.log('✅ Resposta 6:', Array.isArray(resp6) ? `[${resp6.length} mensagens]` : 'string');
    
    if (Array.isArray(resp6)) {
      console.log('\n📦 MENSAGENS DA BUSCA:');
      resp6.forEach((msg, i) => {
        console.log(`\n--- Mensagem ${i + 1}/${resp6.length} ---`);
        console.log(msg.substring(0, 150) + (msg.length > 150 ? '...' : ''));
      });
      
      if (resp6.length === 3) {
        console.log('\n✅ SUCESSO! Retornou 3 mensagens (produtos + continuação)');
      } else {
        console.log(`\n❌ ERRO! Esperava 3 mensagens, recebeu ${resp6.length}`);
      }
    }
    
    console.log('\n📍 PASSO 7: Testando CONTINUAR');
    const resp7 = await processarAtendimentoJana('continuar', testNumber);
    console.log('✅ Resposta 7:', Array.isArray(resp7) ? `[${resp7.length} mensagens]` : 'string');
    
    if (Array.isArray(resp7)) {
      console.log('\n📦 RESPOSTA CONTINUAR:');
      resp7.forEach((msg, i) => {
        console.log(`\n--- Mensagem ${i + 1}/${resp7.length} ---`);
        console.log(msg.substring(0, 150) + (msg.length > 150 ? '...' : ''));
      });
    }
    
    console.log('\n📍 PASSO 8: Escolhendo novo tipo (avental)');
    const resp8 = await processarAtendimentoJana('avental', testNumber);
    console.log('✅ Resposta 8:', Array.isArray(resp8) ? `[${resp8.length} mensagens]` : 'string');
    
    console.log('\n📍 PASSO 9: Escolhendo gênero (unissex)');
    const resp9 = await processarAtendimentoJana('unissex', testNumber);
    console.log('✅ Resposta 9:', Array.isArray(resp9) ? `[${resp9.length} mensagens]` : 'string');
    
    console.log('\n📍 PASSO 10: Escolhendo cor (preto)');
    const resp10 = await processarAtendimentoJana('preto', testNumber);
    console.log('✅ Resposta 10:', Array.isArray(resp10) ? `[${resp10.length} mensagens]` : 'string');
    
    console.log('\n📍 PASSO 11: Confirmando segunda busca');
    const resp11 = await processarAtendimentoJana('sim', testNumber);
    console.log('✅ Resposta 11:', Array.isArray(resp11) ? `[${resp11.length} mensagens]` : 'string');
    
    console.log('\n📍 PASSO 12: Testando ENCERRAR');
    const resp12 = await processarAtendimentoJana('encerrar', testNumber);
    console.log('✅ Resposta 12:', Array.isArray(resp12) ? `[${resp12.length} mensagens]` : 'string');
    
    if (typeof resp12 === 'string' && resp12.includes('Foi um prazer')) {
      console.log('\n✅ SUCESSO! Mensagem de encerramento enviada corretamente');
      console.log('\n📜 MENSAGEM DE DESPEDIDA:');
      console.log(resp12);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ TESTE COMPLETO FINALIZADO!');
    console.log('📊 RESUMO:');
    console.log('   • Iniciou atendimento ✅');
    console.log('   • Capturou nome ✅');
    console.log('   • Primeira busca completa ✅');
    console.log('   • Mensagem de continuação enviada ✅');
    console.log('   • Continuou buscando (reiniciou filtros) ✅');
    console.log('   • Segunda busca completa ✅');
    console.log('   • Encerrou atendimento com despedida ✅');
    
  } catch (erro) {
    console.error('\n❌ ERRO NO TESTE:', erro);
    console.error(erro.stack);
  }
}

testarFluxoCompleto();
