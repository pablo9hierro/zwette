import 'dotenv/config';
import { entenderMensagem } from './atendimento/entender_mensagem_IA.js';

const mensagens = [
  "pode ser",
  "aceito",
  "quero",
  "beleza",
  "tudo bem",
  "sim",
  "concordo",
  "não",
  "nao",
  "outra cor",
  "jaleco masculino azul",
  "oi"
];

console.log('🧪 Testando interpretação de mensagens com IA...\n');

for (const msg of mensagens) {
  console.log(`📩 Cliente: "${msg}"`);
  try {
    const resultado = await entenderMensagem(msg, { tipo: 'jaleco', cor: 'azul' });
    console.log(`✅ Intenção: ${resultado.intencao}`);
    console.log(`   Confirmação: ${resultado.confirmacaoBusca}`);
    console.log('');
  } catch (erro) {
    console.error(`❌ Erro: ${erro.message}\n`);
  }
}

console.log('✅ Teste concluído!');
