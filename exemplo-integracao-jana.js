/**
 * =====================================================
 * EXEMPLO DE INTEGRAÇÃO - Sistema Jana no WhatsApp
 * Use este código como referência para integrar no seu index.js
 * =====================================================
 */

import processarAtendimentoJana from './atendimento/orquestrador-jana.js';
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';

/**
 * OPÇÃO 1: Integração Simples
 * Copie este código para seu index.js
 */
async function integracaoSimples() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });
  
  sock.ev.on('creds.update', saveCreds);
  
  // 🔥 HANDLER DE MENSAGENS COM JANA
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    
    // Ignorar mensagens do próprio bot
    if (msg.key.fromMe) return;
    
    // Pegar número do remetente
    const numeroUsuario = msg.key.remoteJid;
    
    // Extrair texto da mensagem
    const mensagemTexto = 
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      '';
    
    if (!mensagemTexto) return;
    
    console.log(`📥 Mensagem de ${numeroUsuario}: ${mensagemTexto}`);
    
    try {
      // 🤖 PROCESSAR COM JANA
      const resposta = await processarAtendimentoJana(mensagemTexto, numeroUsuario);
      
      // 📤 ENVIAR RESPOSTA
      await sock.sendMessage(numeroUsuario, { text: resposta });
      
      console.log(`✅ Resposta enviada`);
    } catch (erro) {
      console.error('❌ Erro ao processar:', erro);
      
      // Enviar mensagem de erro amigável
      await sock.sendMessage(numeroUsuario, {
        text: 'Desculpe, ocorreu um erro temporário. Pode tentar novamente? 😊'
      });
    }
  });
  
  console.log('🤖 Jana ativa e aguardando mensagens!');
}

/**
 * OPÇÃO 2: Integração com Filtros
 * Adiciona validações e filtros antes de processar
 */
async function integracaoComFiltros() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });
  
  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    
    // FILTRO 1: Ignorar próprias mensagens
    if (msg.key.fromMe) return;
    
    // FILTRO 2: Apenas conversas privadas (não grupos)
    const numeroUsuario = msg.key.remoteJid;
    if (numeroUsuario.endsWith('@g.us')) {
      console.log('⚠️ Mensagem de grupo ignorada');
      return;
    }
    
    // FILTRO 3: Extrair texto
    const mensagemTexto = 
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      '';
    
    if (!mensagemTexto) {
      console.log('⚠️ Mensagem sem texto ignorada');
      return;
    }
    
    // FILTRO 4: Ignorar comandos internos (opcional)
    if (mensagemTexto.startsWith('/admin')) {
      console.log('⚠️ Comando admin ignorado');
      return;
    }
    
    console.log(`📥 [${new Date().toLocaleTimeString()}] ${numeroUsuario}: ${mensagemTexto}`);
    
    try {
      // 🤖 PROCESSAR COM JANA
      const resposta = await processarAtendimentoJana(mensagemTexto, numeroUsuario);
      
      // 📤 ENVIAR RESPOSTA
      await sock.sendMessage(numeroUsuario, { 
        text: resposta 
      });
      
      console.log(`✅ Resposta enviada com sucesso`);
      
    } catch (erro) {
      console.error('❌ Erro ao processar mensagem:', erro);
      
      // Log detalhado para debug
      console.error('Detalhes:', {
        numeroUsuario,
        mensagemTexto: mensagemTexto.substring(0, 50),
        erro: erro.message
      });
      
      // Mensagem de erro amigável
      await sock.sendMessage(numeroUsuario, {
        text: 'Ops! Tive um probleminha aqui. Pode tentar de novo? 🙏'
      });
    }
  });
  
  // RECONEXÃO AUTOMÁTICA
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      
      console.log('🔄 Conexão fechada. Reconectando:', shouldReconnect);
      
      if (shouldReconnect) {
        integracaoComFiltros(); // Reconectar
      }
    } else if (connection === 'open') {
      console.log('✅ Conexão estabelecida!');
      console.log('🤖 Jana ativa e pronta para atender!');
    }
  });
}

/**
 * OPÇÃO 3: Integração Avançada com Logs e Métricas
 */
async function integracaoAvancada() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });
  
  sock.ev.on('creds.update', saveCreds);
  
  // Métricas simples
  const metricas = {
    mensagensRecebidas: 0,
    mensagensProcessadas: 0,
    erros: 0,
    iniciado: new Date()
  };
  
  // Exibir métricas a cada 5 minutos
  setInterval(() => {
    const uptime = Math.floor((new Date() - metricas.iniciado) / 1000 / 60);
    console.log('\n📊 MÉTRICAS:');
    console.log(`   Uptime: ${uptime} minutos`);
    console.log(`   Mensagens recebidas: ${metricas.mensagensRecebidas}`);
    console.log(`   Mensagens processadas: ${metricas.mensagensProcessadas}`);
    console.log(`   Erros: ${metricas.erros}`);
    console.log(`   Taxa de sucesso: ${((metricas.mensagensProcessadas / metricas.mensagensRecebidas) * 100).toFixed(1)}%\n`);
  }, 5 * 60 * 1000);
  
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    
    if (msg.key.fromMe) return;
    
    const numeroUsuario = msg.key.remoteJid;
    if (numeroUsuario.endsWith('@g.us')) return;
    
    const mensagemTexto = 
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      '';
    
    if (!mensagemTexto) return;
    
    metricas.mensagensRecebidas++;
    
    const timestamp = new Date().toLocaleTimeString();
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📥 [${timestamp}] Nova mensagem`);
    console.log(`👤 De: ${numeroUsuario}`);
    console.log(`💬 Texto: ${mensagemTexto}`);
    
    try {
      const inicioProcessamento = Date.now();
      
      // 🤖 PROCESSAR COM JANA
      const resposta = await processarAtendimentoJana(mensagemTexto, numeroUsuario);
      
      const tempoProcessamento = Date.now() - inicioProcessamento;
      
      // 📤 ENVIAR RESPOSTA
      await sock.sendMessage(numeroUsuario, { 
        text: resposta 
      });
      
      metricas.mensagensProcessadas++;
      
      console.log(`✅ Processado em ${tempoProcessamento}ms`);
      console.log(`📤 Resposta: ${resposta.substring(0, 100)}...`);
      console.log(`${'='.repeat(60)}\n`);
      
    } catch (erro) {
      metricas.erros++;
      
      console.error(`❌ Erro: ${erro.message}`);
      console.error(`Stack: ${erro.stack}`);
      console.log(`${'='.repeat(60)}\n`);
      
      await sock.sendMessage(numeroUsuario, {
        text: 'Desculpe, ocorreu um erro. Nossa equipe foi notificada. Pode tentar novamente? 😊'
      });
    }
  });
  
  // Reconexão
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      
      if (shouldReconnect) {
        console.log('🔄 Reconectando...');
        setTimeout(() => integracaoAvancada(), 3000);
      } else {
        console.log('❌ Desconectado. Execute novamente para reconectar.');
      }
    } else if (connection === 'open') {
      console.log('✅ WhatsApp conectado!');
      console.log('🤖 Sistema Jana ativo e aguardando mensagens...\n');
    }
  });
}

/**
 * ESCOLHER MODO DE INTEGRAÇÃO
 */
const MODO = process.env.JANA_MODE || 'avancada'; // simples | filtros | avancada

switch (MODO) {
  case 'simples':
    console.log('🚀 Iniciando modo SIMPLES');
    integracaoSimples();
    break;
  
  case 'filtros':
    console.log('🚀 Iniciando modo COM FILTROS');
    integracaoComFiltros();
    break;
  
  case 'avancada':
    console.log('🚀 Iniciando modo AVANÇADA');
    integracaoAvancada();
    break;
  
  default:
    console.log('⚠️ Modo desconhecido. Usando AVANÇADA');
    integracaoAvancada();
}

// Tratamento de erros não capturados
process.on('unhandledRejection', (erro) => {
  console.error('❌ Erro não tratado:', erro);
});

process.on('uncaughtException', (erro) => {
  console.error('❌ Exceção não capturada:', erro);
  process.exit(1);
});
