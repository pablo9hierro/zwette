import { processarAtendimentoJana } from './atendimento/orquestrador-jana.js';

const testNumber = `test-robe-${Date.now()}@s.whatsapp.net`;

console.log('🧪 TESTE - Robe Unissex com Gênero Feminino/Masculino');
console.log('='.repeat(60));

async function testarRobeUnissex() {
  try {
    console.log('\n📍 CENÁRIO 1: Robe Feminino (Unissex deve aparecer)');
    console.log('='.repeat(60));
    
    await processarAtendimentoJana('simitarra', testNumber);
    await processarAtendimentoJana('Maria', testNumber);
    await processarAtendimentoJana('robe', testNumber);
    await processarAtendimentoJana('feminino', testNumber);
    
    const respCores = await processarAtendimentoJana('ver cores', testNumber);
    
    console.log('\n✅ CORES OFERECIDAS:');
    if (Array.isArray(respCores) && respCores.length > 0) {
      console.log(respCores[respCores.length - 1].substring(0, 300));
      
      const cores = respCores[respCores.length - 1];
      
      // Verificar cores do catálogo: Rosa Nude, Preto, Branco (do unissex)
      if (cores.includes('Rosa') || cores.includes('Preto') || cores.includes('Branco')) {
        console.log('✅ SUCESSO! Cores unissex estão disponíveis para feminino');
      } else {
        console.log('❌ ERRO! Cores unissex não apareceram');
      }
    } else if (typeof respCores === 'string') {
      console.log(respCores.substring(0, 300));
      
      if (respCores.includes('Rosa') || respCores.includes('Preto') || respCores.includes('Branco')) {
        console.log('✅ SUCESSO! Cores unissex estão disponíveis');
      } else {
        console.log('❌ ERRO! Nenhuma cor disponível');
      }
    }
    
    // Testar busca com cor existente
    console.log('\n💬 Cliente escolhe: "preto"');
    const respConfirm = await processarAtendimentoJana('preto', testNumber);
    console.log('✅ Confirmação:', typeof respConfirm === 'string' ? respConfirm.substring(0, 100) : '[array]');
    
    // Confirmar busca
    console.log('\n💬 Cliente confirma: "sim"');
    const respBusca = await processarAtendimentoJana('sim', testNumber);
    
    if (Array.isArray(respBusca) && respBusca.length === 3) {
      console.log('\n✅ Busca realizada com 3 mensagens!');
      
      if (respBusca[1].includes('Robe') || respBusca[1].includes('robe')) {
        console.log('✅ PERFEITO! Encontrou produtos robe unissex!');
      } else if (respBusca[1].includes('não encontrei')) {
        console.log('❌ ERRO! Não encontrou produtos (deveria ter encontrado unissex)');
        console.log('Resposta:', respBusca[1].substring(0, 200));
      }
    } else {
      console.log('Resposta:', typeof respBusca === 'string' ? respBusca.substring(0, 200) : '[não array]');
    }
    
    console.log('\n\n' + '='.repeat(60));
    console.log('✅ TESTE FINALIZADO!');
    console.log('='.repeat(60));
    
  } catch (erro) {
    console.error('\n❌ ERRO:', erro);
    console.error(erro.stack);
  }
}

testarRobeUnissex();
