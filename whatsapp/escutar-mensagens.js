import 'dotenv/config';
import makeWASocket, { 
    DisconnectReason, 
    useMultiFileAuthState,
    fetchLatestBaileysVersion 
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { processarAtendimentoJana } from '../atendimento/orquestrador-jana.js';
import { enviarResposta } from './enviar-resposta.js';
import { adicionarAoBuffer, normalizarPortuguesBR } from '../atendimento/buffer-mensagens.js';

let socketGlobal = null;

async function conectarWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();
    
    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        browser: ['Zwette Agente IA', 'Chrome', '1.0.0']
    });

    socketGlobal = sock;

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('\n📱 Escaneie o QR Code abaixo com seu WhatsApp:');
            qrcode.generate(qr, { small: true });
        }
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            
            console.log('❌ Conexão fechada.');
            console.log('   Código:', statusCode);
            console.log('   Reconectar:', shouldReconnect);
            
            if (shouldReconnect) {
                console.log('🔄 Reconectando em 5 segundos...');
                setTimeout(() => {
                    console.log('🔄 Tentando reconectar...');
                    conectarWhatsApp();
                }, 5000);
            } else {
                console.log('🚫 Logout detectado. Escaneie o QR code novamente.');
                console.log('💡 Execute: npm start');
            }
        } else if (connection === 'open') {
            console.log('✅ Conectado ao WhatsApp!');
            
            // Mostrar número conectado
            const myNumber = sock.user?.id || 'Desconhecido';
            console.log(`📱 Número conectado: ${myNumber}`);
            console.log('🤖 Agente IA pronto para atender!\n');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // DEBUG: Ver TODOS os eventos que chegam
    sock.ev.on('*', (event) => {
        if (event && typeof event === 'object' && !event.messages) {
            console.log('🔔 Evento genérico:', Object.keys(event)[0] || 'desconhecido');
        }
    });

    // Escutar mensagens recebidas
    console.log('👂 Listener de mensagens registrado - aguardando mensagens...\n');
    
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        console.log('\n' + '='.repeat(60));
        console.log(`🔔 EVENTO RECEBIDO! Tipo: ${type} | Mensagens: ${messages.length}`);
        console.log('='.repeat(60));
        
        if (type !== 'notify') {
            console.log(`⚠️ Tipo "${type}" ignorado (só processamos "notify")`);
            return;
        }
        
        for (const msg of messages) {
            console.log('\n🔍 Analisando mensagem...');
            console.log('   fromMe:', msg.key.fromMe);
            console.log('   remoteJid:', msg.key.remoteJid);
            
            // Ignorar mensagens enviadas por você
            if (msg.key.fromMe) {
                console.log('⏭️ Ignorando: mensagem enviada por mim');
                continue;
            }
            
            const remetente = msg.key.remoteJid;
            const nomeContato = msg.pushName || 'Cliente';
            
            console.log('📋 Estrutura da mensagem:', JSON.stringify(msg.message, null, 2));
            
            // Extrair texto da mensagem
            const textoMensagem = msg.message?.conversation || 
                                 msg.message?.extendedTextMessage?.text || 
                                 '';
            
            if (!textoMensagem) {
                console.log('⚠️ Ignorando: sem texto na mensagem');
                continue;
            }
            
            console.log('\n📨 MENSAGEM RECEBIDA:');
            console.log(`👤 De: ${nomeContato} (${remetente})`);
            console.log(`💬 Texto original: ${textoMensagem}`);
            
            // NORMALIZAR português BR com erros
            const textoNormalizado = normalizarPortuguesBR(textoMensagem);
            console.log(`✨ Texto normalizado: ${textoNormalizado}`);
            
            // BUFFER: Aguarda 3s para concatenar mensagens
            console.log('⏳ Aguardando 3s para ver se tem mais mensagens...');
            const textoFinal = await adicionarAoBuffer(remetente, textoNormalizado);
            
            console.log(`📦 Texto final (concatenado): ${textoFinal}`);
            console.log('🔄 Processando com IA...\n');

            try {
                // Processar mensagem com IA e obter resposta
                const resposta = await processarAtendimentoJana(textoFinal, remetente);
                
                // Se resposta for null, significa que bot ignorou (aguardando "simitarra")
                if (resposta === null) {
                    console.log('🔕 Mensagem ignorada - aguardando palavra-chave de ativação\n');
                    continue;
                }
                
                // Verificar se resposta é um array (múltiplas mensagens)
                if (Array.isArray(resposta)) {
                    console.log(`📨 Enviando ${resposta.length} mensagens sequencialmente...`);
                    
                    for (let i = 0; i < resposta.length; i++) {
                        const mensagem = resposta[i];
                        console.log(`📤 Mensagem ${i + 1}/${resposta.length}: ${mensagem.substring(0, 50)}...`);
                        
                        await enviarResposta(sock, remetente, mensagem);
                        
                        // Aguardar 1 segundo entre mensagens para não parecer spam
                        if (i < resposta.length - 1) {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    }
                    
                    console.log('✅ Todas as mensagens enviadas com sucesso!\n');
                } else {
                    // Resposta única (comportamento padrão)
                    await enviarResposta(sock, remetente, resposta);
                    console.log('✅ Resposta enviada com sucesso!\n');
                }
            } catch (error) {
                console.error('❌ Erro ao processar mensagem:', error.message);
                
                // Enviar mensagem de erro amigável
                await enviarResposta(
                    sock, 
                    remetente, 
                    'Desculpe, estou com dificuldades técnicas no momento. Tente novamente em instantes. 🙏'
                );
            }
        }
    });

    return sock;
}

export { conectarWhatsApp, socketGlobal };
