import { processarAtendimentoJana } from './atendimento/orquestrador-jana.js';

const testNumber = `test-humanizado-${Date.now()}@s.whatsapp.net`;

console.log('🧪 TESTE - Mensagens Humanizadas');
console.log('='.repeat(60));

async function testarMensagensHumanizadas() {
  try {
    // Fluxo completo até busca
    await processarAtendimentoJana('simitarra', testNumber);
    await processarAtendimentoJana('Pablo', testNumber);
    await processarAtendimentoJana('jaleco', testNumber);
    await processarAtendimentoJana('masculino', testNumber);
    
    console.log('\n📍 Testando mensagem de CONFIRMAÇÃO (sem instruções explícitas)');
    const respConfirm = await processarAtendimentoJana('branco', testNumber);
    console.log('\n✅ MENSAGEM DE CONFIRMAÇÃO:');
    console.log(respConfirm);
    console.log('\n' + '='.repeat(60));
    
    console.log('\n📍 Testando mensagem de CONTINUAÇÃO (natural e humana)');
    const respBusca = await processarAtendimentoJana('sim', testNumber);
    
    if (Array.isArray(respBusca) && respBusca.length === 3) {
      console.log('\n✅ MENSAGEM 3 (CONTINUAÇÃO):');
      console.log(respBusca[2]);
      console.log('\n' + '='.repeat(60));
      
      // Verificar se NÃO tem lista robotizada
      if (respBusca[2].includes('Digite:') || respBusca[2].includes('• *Continuar*')) {
        console.log('\n❌ ERRO: Ainda tem lista robotizada!');
      } else {
        console.log('\n✅ SUCESSO: Mensagem natural e humana!');
      }
      
      // Verificar se é natural
      if (respBusca[2].includes('E aí') || respBusca[2].includes('gostou')) {
        console.log('✅ Tom conversacional detectado!');
      }
    }
    
  } catch (erro) {
    console.error('\n❌ ERRO:', erro);
  }
}

testarMensagensHumanizadas();
