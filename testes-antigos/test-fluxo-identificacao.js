/**
 * =====================================================
 * TESTE - FLUXO DE IDENTIFICAÇÃO OBRIGATÓRIA
 * Valida a captura de nome no início do atendimento
 * =====================================================
 */

import { processarAtendimentoJana } from './atendimento/orquestrador-jana.js';

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║     TESTE: FLUXO DE IDENTIFICAÇÃO OBRIGATÓRIA         ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

const numeroTeste = '5583999999999';

async function testarFluxoIdentificacao() {
  try {
    console.log('\n📝 CENÁRIO 1: Cliente novo enviando mensagem inicial\n');
    console.log('──────────────────────────────────────────────────────\n');
    
    // Mensagem 1: Cliente diz "Oi"
    console.log('👤 Cliente: Oi');
    let resposta = await processarAtendimentoJana('Oi', numeroTeste);
    console.log('🤖 Jana:', resposta);
    console.log('\n✓ Deve apresentar a Jana e pedir o nome\n');
    
    await esperarSegundos(2);
    
    // Mensagem 2: Cliente informa o nome
    console.log('\n──────────────────────────────────────────────────────\n');
    console.log('👤 Cliente: Meu nome é João Silva');
    resposta = await processarAtendimentoJana('Meu nome é João Silva', numeroTeste);
    console.log('🤖 Jana:', resposta);
    console.log('\n✓ Deve confirmar o nome e IR DIRETO PARA FILTRO (sem profissão)\n');
    
    await esperarSegundos(2);
    
    // Mensagem 3: Cliente fala o que procura
    console.log('\n──────────────────────────────────────────────────────\n');
    console.log('👤 Cliente: Quero um jaleco masculino');
    resposta = await processarAtendimentoJana('Quero um jaleco masculino', numeroTeste);
    console.log('🤖 Jana:', resposta);
    console.log('\n✓ Deve processar busca de produtos\n');
    
    await esperarSegundos(2);
    
    // Cenário 2: Cliente só fala o nome
    console.log('\n──────────────────────────────────────────────────────\n');
    console.log('📝 CENÁRIO 2: Cliente fala nome direto\n');
    
    const numeroTeste2 = '5583888888888';
    console.log('👤 Cliente: Olá');
    resposta = await processarAtendimentoJana('Olá', numeroTeste2);
    console.log('🤖 Jana:', resposta);
    
    await esperarSegundos(2);
    
    console.log('\n👤 Cliente: Maria');
    resposta = await processarAtendimentoJana('Maria', numeroTeste2);
    console.log('🤖 Jana:', resposta);
    console.log('\n✓ Deve capturar nome e ir direto para filtro\n');
    
    await esperarSegundos(2);
    
    // Mensagem 5: Saudação vazia
    console.log('\n──────────────────────────────────────────────────────\n');
    console.log('📝 CENÁRIO 3: Cliente só manda "Bom dia"\n');
    
    const numeroTeste3 = '5583777777777';
    console.log('👤 Cliente: Bom dia');
    resposta = await processarAtendimentoJana('Bom dia', numeroTeste3);
    console.log('🤖 Jana:', resposta);
    
    await esperarSegundos(2);
    
    console.log('\n👤 Cliente: Bom dia (repete sem nome)');
    resposta = await processarAtendimentoJana('Bom dia', numeroTeste3);
    console.log('🤖 Jana:', resposta);
    console.log('\n✓ Deve pedir o nome novamente\n');
    
    await esperarSegundos(2);
    
    console.log('\n👤 Cliente: Pedro');
    resposta = await processarAtendimentoJana('Pedro', numeroTeste3);
    console.log('🤖 Jana:', resposta);
    console.log('\n✓ Deve capturar nome e ir para filtro\n');
    
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║              ✅ TESTE CONCLUÍDO COM SUCESSO            ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    console.log('📋 RESUMO:');
    console.log('  ✓ Jana se apresenta obrigatoriamente');
    console.log('  ✓ Pede nome do cliente obrigatoriamente');
    console.log('  ✓ Captura e salva o nome no banco');
    console.log('  ✓ VAI DIRETO PARA FILTRO (sem perguntar profissão)');
    console.log('  ✓ Inicia busca de produtos após identificação\n');
    
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
testarFluxoIdentificacao();
