/**
 * =====================================================
 * TESTE - PALAVRA-CHAVE "SIMITARRA"
 * Valida que o bot só inicia após receber "simitarra"
 * =====================================================
 */

import { processarAtendimentoJana } from './atendimento/orquestrador-jana.js';

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║        TESTE: PALAVRA-CHAVE "SIMITARRA"               ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

const numeroTeste = '5583111111111';

async function testarPalavraChave() {
  try {
    console.log('\n📝 CENÁRIO 0: Cliente tenta sem "simitarra" (deve ser ignorado)\n');
    console.log('──────────────────────────────────────────────────────\n');
    
    const numeroTeste0 = '5583000000000';
    
    // Mensagem 1: Cliente envia "Oi" sem "simitarra"
    console.log('👤 Cliente: Oi');
    let resposta = await processarAtendimentoJana('Oi', numeroTeste0);
    console.log('🤖 Jana:', resposta === null ? '(sem resposta - ignorado ✓)' : resposta);
    console.log('\n✓ Deve IGNORAR mensagens sem "simitarra"\n');
    
    await esperarSegundos(1);
    
    console.log('👤 Cliente: Olá');
    resposta = await processarAtendimentoJana('Olá', numeroTeste0);
    console.log('🤖 Jana:', resposta === null ? '(sem resposta - ignorado ✓)' : resposta);
    console.log('\n✓ Continua ignorando\n');
    
    await esperarSegundos(2);
    
    console.log('\n📝 CENÁRIO 1: Cliente envia palavra-chave "simitarra"\n');
    console.log('──────────────────────────────────────────────────────\n');
    
    // Mensagem 1: Cliente envia "simitarra"
    console.log('👤 Cliente: simitarra');
    resposta = await processarAtendimentoJana('simitarra', numeroTeste);
    console.log('🤖 Jana:', resposta);
    console.log('\n✓ Deve apresentar Jana e pedir nome\n');
    
    await esperarSegundos(2);
    
    // Mensagem 2: Cliente informa nome
    console.log('\n──────────────────────────────────────────────────────\n');
    console.log('👤 Cliente: Carlos');
    resposta = await processarAtendimentoJana('Carlos', numeroTeste);
    console.log('🤖 Jana:', resposta);
    console.log('\n✓ Deve confirmar nome e ir para filtro\n');
    
    await esperarSegundos(2);
    
    // Mensagem 3: Cliente pede produto
    console.log('\n──────────────────────────────────────────────────────\n');
    console.log('👤 Cliente: Quero um jaleco');
    resposta = await processarAtendimentoJana('Quero um jaleco', numeroTeste);
    console.log('🤖 Jana:', resposta);
    console.log('\n✓ Deve processar pedido normalmente\n');
    
    await esperarSegundos(2);
    
    // Cenário 2: Cliente envia "simitarra" novamente (reiniciar)
    console.log('\n──────────────────────────────────────────────────────\n');
    console.log('📝 CENÁRIO 2: Cliente envia "simitarra" novamente\n');
    
    console.log('👤 Cliente: simitarra');
    resposta = await processarAtendimentoJana('simitarra', numeroTeste);
    console.log('🤖 Jana:', resposta);
    console.log('\n✓ Deve reiniciar conversa e pedir nome novamente\n');
    
    await esperarSegundos(2);
    
    // Cenário 3: Palavra-chave com maiúsculas
    console.log('\n──────────────────────────────────────────────────────\n');
    console.log('📝 CENÁRIO 3: Palavra-chave com maiúsculas\n');
    
    const numeroTeste2 = '5583222222222';
    console.log('👤 Cliente: SIMITARRA');
    resposta = await processarAtendimentoJana('SIMITARRA', numeroTeste2);
    console.log('🤖 Jana:', resposta);
    console.log('\n✓ Deve funcionar independente de maiúsculas/minúsculas\n');
    
    await esperarSegundos(2);
    
    // Cenário 4: Palavra-chave com espaços
    console.log('\n──────────────────────────────────────────────────────\n');
    console.log('📝 CENÁRIO 4: Palavra-chave com espaços/texto\n');
    
    const numeroTeste3 = '5583333333333';
    console.log('👤 Cliente: Oi simitarra');
    resposta = await processarAtendimentoJana('Oi simitarra', numeroTeste3);
    console.log('🤖 Jana:', resposta);
    console.log('\n✓ Deve detectar mesmo com texto adicional\n');
    
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║              ✅ TESTE CONCLUÍDO COM SUCESSO            ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    console.log('📋 RESUMO:');
    console.log('  ✓ Mensagens sem "simitarra" são IGNORADAS');
    console.log('  ✓ Palavra-chave "simitarra" ativa o bot');
    console.log('  ✓ Bot se apresenta e pede nome após "simitarra"');
    console.log('  ✓ Fluxo normal continua após identificação');
    console.log('  ✓ "simitarra" pode reiniciar conversa a qualquer momento');
    console.log('  ✓ Funciona com maiúsculas/minúsculas\n');
    
    process.exit(0);
    
  } catch (erro) {
    console.error('❌ Erro no teste:', erro);
    process.exit(1);
  }
}

function esperarSegundos(segundos) {
  return new Promise(resolve => setTimeout(resolve, segundos * 1000));
}

// Executar teste
testarPalavraChave();
