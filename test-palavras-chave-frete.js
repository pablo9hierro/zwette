/**
 * Teste simples: Valida reconhecimento de palavras-chave após cálculo de frete
 */

import dotenv from 'dotenv';
import orquestrar from './atendimento/orquestrador-jana.js';

dotenv.config();

async function teste() {
  console.log('🧪 TESTE: Palavras-chave após frete\n');
  console.log('═══════════════════════════════════\n');
  
  const numeroTeste = `5511${Date.now().toString().slice(-8)}`;
  
  function extrairTexto(resposta) {
    if (Array.isArray(resposta)) {
      return resposta.join(' ');
    }
    return String(resposta);
  }
  
  try {
    // Passo 0: Iniciar com simitarra
    console.log('📍 0. Iniciar "simitarra"');
    let resposta = await orquestrar('simitarra', numeroTeste);
    let texto = extrairTexto(resposta);
    console.log(`   Resposta: ${texto.substring(0, 80)}...\n`);
    
    // Passo 1: Buscar jaleco
    console.log('📍 1. Buscar "jaleco masculino azul"');
    resposta = await orquestrar('jaleco masculino azul', numeroTeste);
    texto = extrairTexto(resposta);
    console.log(`   Tem produtos: ${texto.includes('Jaleco') ? 'SIM' : 'NÃO'}\n`);
    
    // Passo 2: Pedir frete
    console.log('📍 2. Solicitar "calcular frete"');
    resposta = await orquestrar('calcular frete', numeroTeste);
    texto = extrairTexto(resposta);
    console.log(`   Pediu CEP: ${texto.includes('CEP') ? 'SIM' : 'NÃO'}\n`);
    
    // Passo 3: Informar CEP
    console.log('📍 3. Informar CEP "58073493"');
    resposta = await orquestrar('58073493', numeroTeste);
    texto = extrairTexto(resposta);
    console.log(`   Calculou: ${texto.includes('R$') ? 'SIM' : 'NÃO'}\n`);
    
    // Passo 4: CRÍTICO - Nova busca
    console.log('📍 4. 🔥 NOVA BUSCA "quero um gorro masculino"');
    console.log('   ⚠️  Ponto que estava quebrando...\n');
    
    resposta = await orquestrar('quero um gorro masculino', numeroTeste);
    texto = extrairTexto(resposta);
    
    console.log(`   Resposta: ${texto.substring(0, 150)}...\n`);
    
    if (texto.includes('erro') || texto.includes('Desculpe')) {
      console.log('❌ FALHA: Sistema retornou erro\n');
      console.log('Mensagem completa:', texto);
      return false;
    }
    
    console.log('✅ SUCESSO: Reconheceu palavras-chave!\n');
    return true;
    
  } catch (erro) {
    console.log('❌ ERRO CAPTURADO:', erro.message);
    console.log('Stack:', erro.stack);
    return false;
  }
}

teste()
  .then(sucesso => {
    console.log(sucesso ? '✅ Teste passou!' : '❌ Teste falhou!');
    process.exit(sucesso ? 0 : 1);
  })
  .catch(erro => {
    console.error('❌ Erro:', erro);
    process.exit(1);
  });
