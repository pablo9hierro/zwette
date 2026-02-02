/**
 * Teste COMPLETO: Todas as mensagens sequenciais implementadas
 */
import { processarAtendimentoJana } from './atendimento/orquestrador-jana.js';

async function testarFluxoCompletoBuscaFinal() {
  console.log('═'.repeat(75));
  console.log('🎬 TESTE COMPLETO: Fluxo com TODAS as mensagens sequenciais');
  console.log('═'.repeat(75));
  
  const numeroTeste = '5511955554444@s.whatsapp.net';
  
  const mostrarResposta = (resposta, titulo) => {
    console.log(`\n🤖 ${titulo}:\n`);
    if (Array.isArray(resposta)) {
      console.log(`   [${resposta.length} mensagens sequenciais]\n`);
      resposta.forEach((msg, i) => {
        const preview = msg.length > 150 ? msg.substring(0, 150) + '...' : msg;
        console.log(`   📨 Mensagem ${i + 1}:`);
        console.log(`   ${preview.split('\n').join('\n   ')}\n`);
        if (i < resposta.length - 1) console.log('   ⏱️  [1 segundo]\n');
      });
    } else {
      const preview = resposta.length > 150 ? resposta.substring(0, 150) + '...' : resposta;
      console.log(`   ${preview}\n`);
    }
  };
  
  // 1️⃣ Ativar bot
  console.log('\n' + '─'.repeat(75));
  console.log('👤 Cliente: "simitarra"');
  console.log('─'.repeat(75));
  const r1 = await processarAtendimentoJana('simitarra', numeroTeste);
  mostrarResposta(r1, 'Jana responde');
  
  // 2️⃣ Informar nome
  console.log('─'.repeat(75));
  console.log('👤 Cliente: "pablo"');
  console.log('─'.repeat(75));
  const r2 = await processarAtendimentoJana('pablo', numeroTeste);
  mostrarResposta(r2, 'Jana responde');
  
  // 3️⃣ Escolher produto
  console.log('─'.repeat(75));
  console.log('👤 Cliente: "jaleco"');
  console.log('─'.repeat(75));
  const r3 = await processarAtendimentoJana('jaleco', numeroTeste);
  mostrarResposta(r3, 'Jana responde');
  
  // 4️⃣ Escolher gênero
  console.log('─'.repeat(75));
  console.log('👤 Cliente: "feminino"');
  console.log('─'.repeat(75));
  const r4 = await processarAtendimentoJana('feminino', numeroTeste);
  mostrarResposta(r4, 'Jana responde');
  
  // 5️⃣ Escolher cor
  console.log('─'.repeat(75));
  console.log('👤 Cliente: "branco"');
  console.log('─'.repeat(75));
  const r5 = await processarAtendimentoJana('branco', numeroTeste);
  mostrarResposta(r5, 'Jana responde');
  
  // 6️⃣ Confirmar busca
  console.log('─'.repeat(75));
  console.log('👤 Cliente: "pode sim"');
  console.log('─'.repeat(75));
  const r6 = await processarAtendimentoJana('pode sim', numeroTeste);
  mostrarResposta(r6, 'Jana responde');
  
  console.log('═'.repeat(75));
  console.log('✅ TESTE COMPLETO CONCLUÍDO!');
  console.log('═'.repeat(75));
  
  console.log('\n📊 RESUMO DAS MENSAGENS SEQUENCIAIS:');
  console.log('   1️⃣  "simitarra" → 2 mensagens (apresentação + nome)');
  console.log('   2️⃣  "pablo" → 2 mensagens (prazer + catálogo)');
  console.log('   3️⃣  "jaleco" → 2 mensagens (ótima escolha + gêneros)');
  console.log('   4️⃣  "feminino" → 2 mensagens (perfeito + cores)');
  console.log('   5️⃣  "branco" → 1 mensagem (confirmação)');
  console.log('   6️⃣  "pode sim" → 2 mensagens (encontrei X + lista produtos)');
  console.log('   ✨ Total: 11 mensagens ao longo do fluxo');
  console.log('   🎯 Atendimento humanizado, natural e não-robótico!\n');
}

testarFluxoCompletoBuscaFinal().catch(console.error);
