import { processarAtendimentoJana } from './atendimento/orquestrador-jana.js';

const testNumber = `test-${Date.now()}@s.whatsapp.net`;

console.log('🧪 TESTE DEBUG - Captura de tipo de produto');
console.log('=' '.repeat(60));

async function testarFluxo() {
  console.log('\n📍 PASSO 1: Iniciando atendimento com "simitarra"');
  const resp1 = await processarAtendimentoJana('simitarra', testNumber);
  console.log('Resposta 1:', Array.isArray(resp1) ? `[${resp1.length} mensagens]` : resp1.substring(0, 100));
  
  console.log('\n📍 PASSO 2: Enviando nome "Pablo"');
  const resp2 = await processarAtendimentoJana('Pablo', testNumber);
  console.log('Resposta 2:', Array.isArray(resp2) ? `[${resp2.length} mensagens]` : resp2.substring(0, 100));
  
  console.log('\n📍 PASSO 3: Enviando tipo "jaleco"');
  const resp3 = await processarAtendimentoJana('jaleco', testNumber);
  console.log('Resposta 3:', Array.isArray(resp3) ? `[${resp3.length} mensagens]` : resp3.substring(0, 100));
  
  if (Array.isArray(resp3) && resp3.length === 2) {
    console.log('\n✅ SUCESSO! Tipo de produto retornou 2 mensagens');
    console.log('Mensagem 1:', resp3[0].substring(0, 80));
    console.log('Mensagem 2:', resp3[1].substring(0, 80));
  } else {
    console.log('\n❌ FALHA! Tipo de produto NÃO retornou array com 2 mensagens');
  }
}

testarFluxo().catch(console.error);
