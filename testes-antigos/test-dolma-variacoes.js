import { processarAtendimentoJana } from './atendimento/orquestrador-jana.js';

const testNumber = `test-dolma-${Date.now()}@s.whatsapp.net`;

console.log('🧪 TESTE - Variações de "Dolma" e Erros de Digitação');
console.log('='.repeat(60));

async function testarVariacoesDolma() {
  try {
    console.log('\n📍 TESTE 1: "dolma feminina" (usuário disse feminina)');
    console.log('='.repeat(60));
    
    await processarAtendimentoJana('simitarra', testNumber);
    await processarAtendimentoJana('Carlos', testNumber);
    
    const resp1 = await processarAtendimentoJana('dolma feminina', testNumber);
    
    console.log('\n✅ RESPOSTA BOT:');
    if (Array.isArray(resp1) && resp1.length >= 2) {
      console.log('Msg 1:', resp1[0].substring(0, 100));
      
      if (resp1[0].includes('Dolma') || resp1[0].includes('dolma')) {
        console.log('✅ SUCESSO! Bot reconheceu "dolma feminina" como tipo!');
      } else if (resp1[0].includes('não entendi')) {
        console.log('❌ ERRO! Bot não entendeu "dolma feminina"');
      }
    } else if (typeof resp1 === 'string') {
      console.log(resp1.substring(0, 150));
      
      if (resp1.includes('Dolma') || resp1.includes('dolma')) {
        console.log('✅ SUCESSO! Bot reconheceu "dolma feminina"!');
      } else if (resp1.includes('não entendi')) {
        console.log('❌ ERRO! Bot não entendeu "dolma feminina"');
      }
    }
    
    // TESTE 2: Novo usuário com "dolma feminino"
    console.log('\n\n📍 TESTE 2: "dolma feminino" (erro de concordância)');
    console.log('='.repeat(60));
    
    const testNumber2 = `test-dolma2-${Date.now()}@s.whatsapp.net`;
    await processarAtendimentoJana('simitarra', testNumber2);
    await processarAtendimentoJana('Maria', testNumber2);
    
    const resp2 = await processarAtendimentoJana('dolma feminino', testNumber2);
    
    console.log('\n✅ RESPOSTA BOT:');
    if (Array.isArray(resp2) && resp2.length >= 2) {
      console.log('Msg 1:', resp2[0].substring(0, 100));
      
      if (resp2[0].includes('Dolma') || resp2[0].includes('dolma')) {
        console.log('✅ SUCESSO! Bot reconheceu "dolma feminino"!');
      } else if (resp2[0].includes('não entendi')) {
        console.log('❌ ERRO! Bot não entendeu');
      }
    } else if (typeof resp2 === 'string') {
      console.log(resp2.substring(0, 150));
      
      if (resp2.includes('Dolma') || resp2.includes('dolma')) {
        console.log('✅ SUCESSO! Bot reconheceu!');
      } else if (resp2.includes('não entendi')) {
        console.log('❌ ERRO! Bot não entendeu');
      }
    }
    
    // TESTE 3: Apenas "dolma" (sem gênero)
    console.log('\n\n📍 TESTE 3: "dolma" (sem especificar gênero)');
    console.log('='.repeat(60));
    
    const testNumber3 = `test-dolma3-${Date.now()}@s.whatsapp.net`;
    await processarAtendimentoJana('simitarra', testNumber3);
    await processarAtendimentoJana('Pedro', testNumber3);
    
    const resp3 = await processarAtendimentoJana('dolma', testNumber3);
    
    console.log('\n✅ RESPOSTA BOT:');
    if (Array.isArray(resp3)) {
      console.log('Msg 1:', resp3[0].substring(0, 100));
      
      if (resp3[0].includes('Dolma') || resp3[0].includes('dolma')) {
        console.log('✅ SUCESSO! Bot reconheceu "dolma"!');
      }
    } else if (typeof resp3 === 'string') {
      console.log(resp3.substring(0, 150));
      
      if (resp3.includes('Dolma') || resp3.includes('dolma') || resp3.includes('gênero') || resp3.includes('genero')) {
        console.log('✅ SUCESSO! Bot reconheceu "dolma"!');
      }
    }
    
    console.log('\n\n' + '='.repeat(60));
    console.log('✅ TESTES FINALIZADOS!');
    console.log('='.repeat(60));
    
  } catch (erro) {
    console.error('\n❌ ERRO:', erro);
    console.error(erro.stack);
  }
}

testarVariacoesDolma();
