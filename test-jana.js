/**
 * =====================================================
 * TESTE COMPLETO DO SISTEMA JANA
 * Testa os 4 blocos de atendimento
 * =====================================================
 */

import processarAtendimentoJana from './atendimento/orquestrador-jana.js';

const numeroTeste = '5511999999999'; // Número de teste

/**
 * Simula conversa completa
 */
async function testarConversaCompleta() {
  console.log('🧪 INICIANDO TESTE COMPLETO DO SISTEMA JANA\n');
  
  // Array de mensagens simulando cliente real
  const conversaSimulada = [
    'Olá',
    'Me chamo Maria Silva',
    'Sou enfermeira',
    'Quero ver jalecos',
    '15', // Seleciona modelo 15 da lista
    'feminino',
    'azul',
    'sim, pode buscar',
    'Adorei! Obrigada'
  ];
  
  console.log('📋 Simulando conversa:\n');
  
  for (let i = 0; i < conversaSimulada.length; i++) {
    const mensagemCliente = conversaSimulada[i];
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`RODADA ${i + 1}/${conversaSimulada.length}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`\n👤 CLIENTE: ${mensagemCliente}\n`);
    
    try {
      const respostaJana = await processarAtendimentoJana(mensagemCliente, numeroTeste);
      
      console.log(`🤖 JANA: ${respostaJana}\n`);
      
      // Pausa para simular tempo de leitura
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (erro) {
      console.error('❌ Erro:', erro);
      break;
    }
  }
  
  console.log('\n✅ TESTE COMPLETO FINALIZADO\n');
}

/**
 * Testa Bloco 1: Identificação
 */
async function testarBloco1() {
  console.log('\n🧪 TESTE BLOCO 1: IDENTIFICAÇÃO\n');
  
  const mensagens = [
    'Oi',
    'João',
    'Sou médico'
  ];
  
  for (const msg of mensagens) {
    console.log(`\n👤 Cliente: ${msg}`);
    const resposta = await processarAtendimentoJana(msg, numeroTeste + '1');
    console.log(`🤖 Jana: ${resposta}\n`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

/**
 * Testa Bloco 2: Filtro Dinâmico
 */
async function testarBloco2() {
  console.log('\n🧪 TESTE BLOCO 2: FILTRO DINÂMICO\n');
  
  const numeroTeste2 = numeroTeste + '2';
  
  // Primeiro identificação rápida
  await processarAtendimentoJana('Olá, sou Pedro', numeroTeste2);
  await processarAtendimentoJana('pular', numeroTeste2);
  
  // Agora testar filtro
  const mensagens = [
    'Quero scrub',
    'lista', // Pedir lista de modelos
    '5', // Selecionar modelo 5
    'masculino',
    'preto',
    'sim'
  ];
  
  for (const msg of mensagens) {
    console.log(`\n👤 Cliente: ${msg}`);
    const resposta = await processarAtendimentoJana(msg, numeroTeste2);
    console.log(`🤖 Jana: ${resposta}\n`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

/**
 * Testa com profissão específica
 */
async function testarComProfissao() {
  console.log('\n🧪 TESTE COM PROFISSÃO ESPECÍFICA\n');
  
  const numeroTeste3 = numeroTeste + '3';
  
  const mensagens = [
    'Bom dia',
    'Ana Paula',
    'Fisioterapeuta',
    '1', // Selecionar primeiro produto recomendado
    '8', // Modelo
    'feminino',
    'qualquer cor',
    'pode sim'
  ];
  
  for (const msg of mensagens) {
    console.log(`\n👤 Cliente: ${msg}`);
    const resposta = await processarAtendimentoJana(msg, numeroTeste3);
    console.log(`🤖 Jana: ${resposta}\n`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

/**
 * Testa encerramento
 */
async function testarEncerramento() {
  console.log('\n🧪 TESTE ENCERRAMENTO\n');
  
  const numeroTeste4 = numeroTeste + '4';
  
  // Setup rápido
  await processarAtendimentoJana('Oi, Carlos', numeroTeste4);
  await processarAtendimentoJana('pular', numeroTeste4);
  await processarAtendimentoJana('jaleco', numeroTeste4);
  await processarAtendimentoJana('1', numeroTeste4);
  await processarAtendimentoJana('masculino', numeroTeste4);
  await processarAtendimentoJana('branco', numeroTeste4);
  await processarAtendimentoJana('sim', numeroTeste4);
  
  // Testar satisfação
  console.log('\n👤 Cliente: Perfeito, adorei! Obrigado');
  const resposta = await processarAtendimentoJana('Perfeito, adorei! Obrigado', numeroTeste4);
  console.log(`🤖 Jana: ${resposta}\n`);
}

/**
 * Testa caso problemático: cliente indeciso
 */
async function testarClienteIndeciso() {
  console.log('\n🧪 TESTE CLIENTE INDECISO\n');
  
  const numeroTeste5 = numeroTeste + '5';
  
  await processarAtendimentoJana('Oi, Beatriz', numeroTeste5);
  await processarAtendimentoJana('pular', numeroTeste5);
  
  const mensagens = [
    'não sei o que quero',
    'talvez jaleco',
    'lista',
    'ainda não sei',
    'pode ser o 3',
    'feminino',
    'não sei a cor',
    'tanto faz a cor',
    'pode buscar'
  ];
  
  for (const msg of mensagens) {
    console.log(`\n👤 Cliente: ${msg}`);
    const resposta = await processarAtendimentoJana(msg, numeroTeste5);
    console.log(`🤖 Jana: ${resposta}\n`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

/**
 * Menu de testes
 */
async function menu() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🧪 SISTEMA DE TESTES JANA\n');
    console.log('Uso: node test-jana.js [opcao]\n');
    console.log('Opções:');
    console.log('  completo     - Teste completo de ponta a ponta');
    console.log('  bloco1       - Teste apenas Bloco 1 (Identificação)');
    console.log('  bloco2       - Teste apenas Bloco 2 (Filtro)');
    console.log('  profissao    - Teste com profissão específica');
    console.log('  encerramento - Teste encerramento');
    console.log('  indeciso     - Teste cliente indeciso');
    console.log('  todos        - Executar todos os testes\n');
    return;
  }
  
  const opcao = args[0];
  
  switch (opcao) {
    case 'completo':
      await testarConversaCompleta();
      break;
    case 'bloco1':
      await testarBloco1();
      break;
    case 'bloco2':
      await testarBloco2();
      break;
    case 'profissao':
      await testarComProfissao();
      break;
    case 'encerramento':
      await testarEncerramento();
      break;
    case 'indeciso':
      await testarClienteIndeciso();
      break;
    case 'todos':
      await testarConversaCompleta();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await testarBloco1();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await testarBloco2();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await testarComProfissao();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await testarEncerramento();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await testarClienteIndeciso();
      break;
    default:
      console.log('❌ Opção inválida. Use: completo, bloco1, bloco2, profissao, encerramento, indeciso ou todos');
  }
  
  process.exit(0);
}

// Executar menu
menu().catch(erro => {
  console.error('❌ Erro fatal:', erro);
  process.exit(1);
});
