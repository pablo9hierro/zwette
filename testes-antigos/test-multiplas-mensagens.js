/**
 * Teste: Verificar mensagens múltiplas quando detecta "simitarra"
 */
import { processarAtendimentoJana } from './atendimento/orquestrador-jana.js';

async function testarSimitarra() {
  console.log('='.repeat(60));
  console.log('✅ TESTE: Múltiplas mensagens ao detectar "simitarra"');
  console.log('='.repeat(60));
  
  const numeroTeste = '5511999999999@s.whatsapp.net';
  
  console.log('\n--- Enviando "simitarra" ---');
  const resposta = await processarAtendimentoJana('simitarra', numeroTeste);
  
  console.log('\n📨 Tipo de resposta:', Array.isArray(resposta) ? 'ARRAY (múltiplas)' : 'STRING (única)');
  
  if (Array.isArray(resposta)) {
    console.log(`📊 Total de mensagens: ${resposta.length}\n`);
    
    resposta.forEach((msg, index) => {
      console.log(`\n${'-'.repeat(60)}`);
      console.log(`📨 MENSAGEM ${index + 1}:`);
      console.log('-'.repeat(60));
      console.log(msg);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ TESTE PASSOU! Sistema retorna múltiplas mensagens.');
    console.log('='.repeat(60));
  } else {
    console.log('\n' + '='.repeat(60));
    console.log('❌ TESTE FALHOU! Sistema retorna apenas 1 mensagem.');
    console.log('Resposta:', resposta);
    console.log('='.repeat(60));
  }
}

testarSimitarra().catch(console.error);
