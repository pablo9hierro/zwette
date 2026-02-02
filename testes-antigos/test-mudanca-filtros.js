import { processarAtendimentoJana } from './atendimento/orquestrador-jana.js';

const testNumber = `test-mudanca-${Date.now()}@s.whatsapp.net`;

console.log('🧪 TESTE - Detecção de Mudança de Filtros');
console.log('='.repeat(60));

async function testarMudancas() {
  try {
    // =================================================================
    // TESTE: Cliente muda de ideia NA CONFIRMAÇÃO
    // =================================================================
    console.log('\n📍 TESTE: Mudança de ideia na confirmação');
    console.log('='.repeat(60));
    
    await processarAtendimentoJana('simitarra', testNumber);
    await processarAtendimentoJana('Pablo', testNumber);
    await processarAtendimentoJana('jaleco', testNumber);
    await processarAtendimentoJana('masculino', testNumber);
    await processarAtendimentoJana('verde', testNumber);
    
    console.log('\n💬 Bot pergunta: "Posso buscar jaleco masculino verde?"');
    console.log('💬 Cliente muda: "quero jaleco feminino"');
    
    const respMudanca = await processarAtendimentoJana('quero jaleco feminino', testNumber);
    
    console.log('\n✅ RESPOSTA DO BOT:');
    if (typeof respMudanca === 'string') {
      console.log(respMudanca.substring(0, 200));
      
      if (respMudanca.includes('feminino') && respMudanca.includes('Cores')) {
        console.log('\n✅ SUCESSO! Bot detectou mudança e perguntou a cor!');
      } else if (respMudanca.includes('masculino')) {
        console.log('\n❌ ERRO! Bot não detectou mudança, manteve "masculino"');
      }
    } else if (Array.isArray(respMudanca)) {
      console.log('Array com', respMudanca.length, 'mensagens');
      console.log('Msg 1:', respMudanca[0].substring(0, 100));
      
      if (respMudanca[0].includes('feminino')) {
        console.log('\n✅ SUCESSO! Bot detectou mudança!');
      }
    }
    
    // Continuar e testar resposta com cor
    console.log('\n💬 Cliente escolhe cor: "branco"');
    const respCor = await processarAtendimentoJana('branco', testNumber);
    console.log('✅ Resposta (confirmação):', typeof respCor === 'string' ? respCor.substring(0, 100) : '[array]');
    
    // Confirmar busca
    console.log('\n💬 Cliente confirma: "sim"');
    const respBusca = await processarAtendimentoJana('sim', testNumber);
    
    if (Array.isArray(respBusca) && respBusca.length === 3) {
      console.log('\n✅ Busca realizada com 3 mensagens!');
      console.log('Verificando se produtos são femininos...');
      
      if (respBusca[1].includes('Feminino') || respBusca[1].toLowerCase().includes('feminino')) {
        console.log('✅ PERFEITO! Produtos são femininos!');
      } else if (respBusca[1].includes('Masculino')) {
        console.log('❌ ERRO! Produtos são masculinos (deveria ser feminino)');
      }
    }
    
    // =================================================================
    // TESTE 2: Cliente especifica filtros na fase de continuação
    // =================================================================
    console.log('\n\n📍 TESTE 2: Especificar filtros na continuação');
    console.log('='.repeat(60));
    
    console.log('\n💬 Bot pergunta: "Quer continuar ou encerrar?"');
    console.log('💬 Cliente responde: "jaleco masculino"');
    
    const respContinuacao = await processarAtendimentoJana('jaleco masculino', testNumber);
    
    console.log('\n✅ RESPOSTA DO BOT:');
    if (Array.isArray(respContinuacao)) {
      console.log('Array com', respContinuacao.length, 'mensagens');
      console.log('Msg 1:', respContinuacao[0].substring(0, 150));
      
      if (respContinuacao[0].includes('masculino') && respContinuacao[1].includes('Cores')) {
        console.log('\n✅ SUCESSO! Bot detectou filtros e perguntou a cor!');
      }
    } else {
      console.log('String:', respContinuacao.substring(0, 200));
    }
    
    console.log('\n\n' + '='.repeat(60));
    console.log('✅ TESTES FINALIZADOS!');
    console.log('='.repeat(60));
    
  } catch (erro) {
    console.error('\n❌ ERRO:', erro);
    console.error(erro.stack);
  }
}

testarMudancas();
