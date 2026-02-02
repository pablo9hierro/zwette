/**
 * Teste: Validar que touca retorna APENAS cor Preto
 * 
 * BUG: Sistema estava oferecendo lista genérica de 10 cores
 * CORREÇÃO: Agora deve retornar apenas ["Preto"]
 */

import { carregarCoresProduto } from './atendimento/lista-enumerada.js';

async function testarTouca() {
  console.log('🧪 TESTE: Cores disponíveis para Touca Unissex\n');
  
  try {
    // Cenário exato do bug reportado
    const cores = await carregarCoresProduto('touca', null, 'unissex');
    
    console.log('📊 Resultado:');
    console.log(`   Total de cores: ${cores.length}`);
    console.log(`   Cores: ${cores.join(', ')}`);
    
    // Validação
    if (cores.length === 1 && cores[0] === 'Preto') {
      console.log('\n✅ SUCESSO: Sistema retorna apenas cor Preto (como deveria)');
      console.log('   → Cliente NÃO vai ver opções inexistentes');
      return true;
    } else {
      console.log('\n❌ ERRO: Sistema ainda retorna cores incorretas!');
      console.log(`   → Esperado: ["Preto"]`);
      console.log(`   → Recebido: [${cores.join(', ')}]`);
      return false;
    }
    
  } catch (erro) {
    console.error('❌ Erro ao executar teste:', erro.message);
    return false;
  }
}

// Executar
testarTouca().then(sucesso => {
  console.log('\n' + '='.repeat(60));
  if (sucesso) {
    console.log('🎉 BUG CORRIGIDO!');
    console.log('   → touca.json: coresDisponiveis = ["Preto"]');
    console.log('   → carregarCoresProduto(): Removido fallback genérico');
    console.log('   → Sistema agora NUNCA inventa cores');
  } else {
    console.log('⚠️ Verificar correção');
  }
  console.log('='.repeat(60));
  process.exit(sucesso ? 0 : 1);
});
