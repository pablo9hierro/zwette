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
    process.exit(1);
});
