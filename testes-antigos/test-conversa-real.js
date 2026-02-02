import 'dotenv/config';
import { entenderMensagem } from './atendimento/entender_mensagem_IA.js';

// Simular conversa real do WhatsApp
const conversaReal = [
  { role: 'bot', mensagem: 'Estou aqui para ajudar! Você está procurando jalecos, scrubs, aventais ou outro produto?' },
  { role: 'cliente', mensagem: 'quais produtos você tem na loja?' },
  { role: 'bot', mensagem: 'Estou aqui para ajudar! Você está procurando jalecos, scrubs, aventais ou outro produto?' },
  { role: 'cliente', mensagem: 'outro produto' },
  { role: 'bot', mensagem: 'Estou aqui para ajudar! Você está procurando jalecos, scrubs, aventais ou outro produto?' },
  { role: 'cliente', mensagem: 'jaleco' },
  { role: 'bot', mensagem: 'tem qual modelo?' },
  { role: 'cliente', mensagem: 'tem qual modelo?' }
];

console.log('🧪 Testando fluxo REAL do WhatsApp...\n');

let contexto = {};
let historico = [];

for (const msg of conversaReal) {
  if (msg.role === 'cliente') {
    console.log(`\n👤 Cliente: "${msg.mensagem}"`);
    console.log(`📋 Contexto antes: ${JSON.stringify(contexto)}`);
    
    try {
      const resultado = await entenderMensagem(msg.mensagem, contexto, historico);
      
      console.log(`✅ Intenção: ${resultado.intencao}`);
      console.log(`💡 IA deduziu: ${resultado.explicacao || 'sem explicação'}`);
      console.log(`📦 Dados extraídos:`, resultado.dadosExtraidos);
      
      // Atualizar contexto com dados extraídos
      Object.keys(resultado.dadosExtraidos).forEach(key => {
        if (resultado.dadosExtraidos[key]) {
          contexto[key] = resultado.dadosExtraidos[key];
        }
      });
      
      console.log(`📋 Contexto depois: ${JSON.stringify(contexto)}`);
      
    } catch (erro) {
      console.error(`❌ Erro: ${erro.message}`);
    }
  }
  
  historico.push(msg);
}

console.log('\n✅ Teste concluído!');
console.log(`\n🎯 Contexto final: ${JSON.stringify(contexto, null, 2)}`);
