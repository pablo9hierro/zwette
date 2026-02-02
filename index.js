import 'dotenv/config';
import { conectarWhatsApp } from './whatsapp/escutar-mensagens.js';

console.log('╔════════════════════════════════════════════╗');
console.log('║   🤖 ZWETTE - AGENTE IA WHATSAPP          ║');
console.log('║   Dana Jalecos - E-commerce Assistant      ║');
console.log('╚════════════════════════════════════════════╝\n');

console.log('📋 Configurações:');
console.log(`   ✓ Magazord API: ${process.env.MAGAZORD_URL ? 'Configurado' : '❌ Faltando'}`);
console.log(`   ✓ ChatGPT: ${process.env.CHATGPT_API_KEY ? 'Configurado' : '❌ Faltando'}`);
console.log(`   ✓ WhatsApp: +${process.env.MEU_NUMERO || '5583987516699'}\n`);

console.log('🚀 Iniciando sistema...\n');

// Iniciar conexão WhatsApp
conectarWhatsApp().catch(err => {
    console.error('❌ Erro fatal ao conectar:', err);
    console.log('🔄 Tentando reconectar em 10 segundos...');
    setTimeout(() => {
        console.log('🔄 Reiniciando conexão...');
        conectarWhatsApp();
    }, 10000);
});

// Manter processo vivo
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error);
    console.log('⚠️ Processo continua rodando...');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada não tratada:', reason);
    console.log('⚠️ Processo continua rodando...');
});
