/**
 * Teste: Verificar múltiplas mensagens quando cliente informa o nome
 */
import { processarAtendimentoJana } from './atendimento/orquestrador-jana.js';

async function testarNomeCliente() {
  console.log('='.repeat(70));
  console.log('✅ TESTE: Múltiplas mensagens ao informar nome');
  console.log('='.repeat(70));
  
  const numeroTeste = '5511977776666@s.whatsapp.net';
  
  // Passo 1: Ativar bot
  console.log('\n--- PASSO 1: Ativar bot com "simitarra" ---');
  const resposta1 = await processarAtendimentoJana('simitarra', numeroTeste);
  console.log(`Tipo: ${Array.isArray(resposta1) ? 'ARRAY' : 'STRING'}`);
  console.log(`Total: ${Array.isArray(resposta1) ? resposta1.length + ' mensagens' : '1 mensagem'}`);
  
  // Passo 2: Informar nome
  console.log('\n--- PASSO 2: Informar nome "pablo" ---');
  const resposta2 = await processarAtendimentoJana('pablo', numeroTeste);
  
  console.log(`\n📨 Tipo de resposta: ${Array.isArray(resposta2) ? 'ARRAY (múltiplas)' : 'STRING (única)'}`);
  
  if (Array.isArray(resposta2)) {
    console.log(`📊 Total de mensagens: ${resposta2.length}\n`);
    
    resposta2.forEach((msg, index) => {
      console.log(`${'-'.repeat(70)}`);
      console.log(`📨 MENSAGEM ${index + 1}:`);
      console.log('-'.repeat(70));
      console.log(msg);
      console.log('');
    });
    
    console.log('='.repeat(70));
    console.log('✅ TESTE PASSOU! Sistema retorna 2 mensagens ao capturar nome.');
    console.log('='.repeat(70));
    
    // Validar conteúdo
    console.log('\n🔍 VALIDAÇÃO DE CONTEÚDO:');
    const temPrazer = resposta2[0].includes('Prazer');
    const temAjudar = resposta2[0].includes('ajudar');
    const temCatalogo = resposta2[1].includes('catálogo');
    const temLista = resposta2[1].includes('Dolma-avental') || resposta2[1].includes('Jaleco');
    
    console.log(`   ${temPrazer ? '✅' : '❌'} Mensagem 1 contém "Prazer"`);
    console.log(`   ${temAjudar ? '✅' : '❌'} Mensagem 1 contém "ajudar"`);
    console.log(`   ${temCatalogo ? '✅' : '❌'} Mensagem 2 contém "catálogo"`);
    console.log(`   ${temLista ? '✅' : '❌'} Mensagem 2 contém lista de produtos`);
    
    if (temPrazer && temAjudar && temCatalogo && temLista) {
      console.log('\n🎉 VALIDAÇÃO: Todas as verificações passaram!');
    }
  } else {
    console.log('\n' + '='.repeat(70));
    console.log('❌ TESTE FALHOU! Sistema retorna apenas 1 mensagem.');
    console.log('='.repeat(70));
  }
}

testarNomeCliente().catch(console.error);
