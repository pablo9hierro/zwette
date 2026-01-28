import 'dotenv/config';
import { entenderMensagem } from './atendimento/entender_mensagem_IA.js';

console.log('🧪 Testando casos PROBLEMÁTICOS do WhatsApp...\n');

const testes = [
  {
    nome: 'Cliente pergunta quais produtos tem',
    mensagem: 'quais produtos tem na loja?',
    contexto: {},
    historico: [
      { role: 'bot', mensagem: 'Estou aqui para ajudar! Você está procurando jalecos, scrubs, aventais ou outro produto?' }
    ],
    esperado: { intencao: 'perguntar_disponibilidade', tipo: null }
  },
  {
    nome: 'Cliente pergunta "tem gorro?"',
    mensagem: 'tem gorro?',
    contexto: {},
    historico: [
      { role: 'bot', mensagem: 'Estou aqui para ajudar! Você está procurando jalecos, scrubs, aventais ou outro produto?' }
    ],
    esperado: { intencao: 'perguntar_disponibilidade', tipo: 'gorro' }
  },
  {
    nome: 'Cliente pergunta "tem dolma?"',
    mensagem: 'tem dolma?',
    contexto: {},
    historico: [
      { role: 'bot', mensagem: 'Estou aqui para ajudar! Você está procurando jalecos, scrubs, aventais ou outro produto?' }
    ],
    esperado: { intencao: 'perguntar_disponibilidade', tipo: 'dolma' }
  },
  {
    nome: 'Cliente responde "jaleco" depois de "outro produto"',
    mensagem: 'jaleco',
    contexto: {},
    historico: [
      { role: 'cliente', mensagem: 'outro produto' },
      { role: 'bot', mensagem: 'Estou aqui para ajudar! Você está procurando jalecos, scrubs, aventais ou outro produto?' }
    ],
    esperado: { intencao: 'confirmar_busca', tipo: 'jaleco' }
  }
];

for (const teste of testes) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📝 ${teste.nome}`);
  console.log(`👤 Cliente: "${teste.mensagem}"`);
  
  try {
    const resultado = await entenderMensagem(teste.mensagem, teste.contexto, teste.historico);
    
    const acertouIntencao = resultado.intencao === teste.esperado.intencao;
    const acertouTipo = teste.esperado.tipo ? resultado.dadosExtraidos.tipo === teste.esperado.tipo : true;
    
    console.log(`\n✅ Resultado:`);
    console.log(`   Intenção: ${resultado.intencao} ${acertouIntencao ? '✓' : '✗ (esperado: ' + teste.esperado.intencao + ')'}`);
    console.log(`   Tipo extraído: ${resultado.dadosExtraidos.tipo || 'null'} ${acertouTipo ? '✓' : '✗ (esperado: ' + teste.esperado.tipo + ')'}`);
    console.log(`   Explicação: ${resultado.explicacao}`);
    
  } catch (erro) {
    console.error(`❌ Erro: ${erro.message}`);
  }
}

console.log('\n\n✅ Testes concluídos!');
