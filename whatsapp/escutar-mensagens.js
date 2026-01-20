import 'dotenv/config';
import makeWASocket, { 
    DisconnectReason, 
    useMultiFileAuthState,
    fetchLatestBaileysVersion 
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { processarMensagemRecebida } from '../ia/processar-mensagem.js';
import { enviarResposta } from './enviar-resposta.js';

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
            console.log('❌ Conexão fechada. Reconectando:', shouldReconnect);
            
            if (shouldReconnect) {
                setTimeout(() => conectarWhatsApp(), 3000);
            }
        } else if (connection === 'open') {
            console.log('✅ Conectado ao WhatsApp!');
            console.log('🤖 Agente IA pronto para atender!\n');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Escutar mensagens recebidas
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        
        for (const msg of messages) {
            // Ignorar mensagens enviadas por você
            if (msg.key.fromMe) continue;
            
            const remetente = msg.key.remoteJid;
            const nomeContato = msg.pushName || 'Cliente';
            
            // Extrair texto da mensagem
            const textoMensagem = msg.message?.conversation || 
                                 msg.message?.extendedTextMessage?.text || 
                                 '';
            
            if (!textoMensagem) continue;
            
            console.log('\n📨 MENSAGEM RECEBIDA:');
            console.log(`👤 De: ${nomeContato} (${remetente})`);
            console.log(`💬 Texto: ${textoMensagem}`);
            console.log('🔄 Processando com IA...\n');

            try {
                // Processar mensagem com IA e obter resposta
                const resposta = await processarMensagemRecebida(textoMensagem, remetente);
                
                // Enviar resposta de volta
                await enviarResposta(sock, remetente, resposta);
                
                console.log('✅ Resposta enviada com sucesso!\n');
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
