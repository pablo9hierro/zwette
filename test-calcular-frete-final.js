/**
 * TESTE FINAL - Usar função calcularFrete diretamente
 */

import { calcularFrete, formatarMensagemFrete } from './atendimento/calcular-frete.js';

console.log('🧪 TESTE FINAL - Função calcularFrete()\n');

async function testar() {
  const cep = '58073493';
  
  console.log(`📍 CEP: ${cep}`);
  console.log('📦 Produtos: [] (vazio - vai usar produto genérico)\n');
  
  const resultado = await calcularFrete(cep, []);
  
  console.log('\n📊 RESULTADO:');
  console.log('Sucesso:', resultado.sucesso);
  console.log('Cidade:', resultado.cidade);
  console.log('Opções:', resultado.opcoes?.length || 0);
  
  if (resultado.sucesso) {
    console.log('\n💬 MENSAGEM FORMATADA:');
    console.log('━'.repeat(60));
    console.log(formatarMensagemFrete(resultado));
    console.log('━'.repeat(60));
  }
}

testar().catch(console.error);
