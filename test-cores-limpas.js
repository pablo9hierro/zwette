/**
 * Teste: Validar detecção de cores e limpeza de nomes
 */

import { carregarCoresProduto } from './atendimento/lista-enumerada.js';

// Simular função detectarCor (copiada de bloco2-filtro.js)
function detectarCor(mensagem, coresDisponiveis) {
  const mensagemLower = mensagem.toLowerCase().trim();
  const coresOrdenadas = [...coresDisponiveis].sort((a, b) => b.length - a.length);
  
  // 1. Match exato
  for (const cor of coresOrdenadas) {
    if (mensagemLower === cor.toLowerCase()) return cor;
  }
  
  // 2. Match palavra completa
  for (const cor of coresOrdenadas) {
    const regex = new RegExp(`\\b${cor.toLowerCase()}\\b`, 'i');
    if (regex.test(mensagemLower)) return cor;
  }
  
  // 3. Match parcial bidirecional
  for (const cor of coresOrdenadas) {
    const corLower = cor.toLowerCase();
    if (mensagemLower.includes(corLower) || corLower.includes(mensagemLower)) {
      return cor;
    }
  }
  
  // 4. Match por palavras individuais
  for (const cor of coresOrdenadas) {
    const palavrasCor = cor.toLowerCase().split(/\s+/);
    const palavrasMensagem = mensagemLower.split(/\s+/);
    
    for (const palavraMensagem of palavrasMensagem) {
      if (palavraMensagem.length >= 4) {
        for (const palavraCor of palavrasCor) {
          if (palavraCor === palavraMensagem || palavraCor.startsWith(palavraMensagem)) {
            return cor;
          }
        }
      }
    }
  }
  
  return null;
}

async function testarCoresCracha() {
  console.log('🧪 TESTE: Cores do crachá (antes poluídas)\n');
  
  // Carregar cores de crachá
  const cores = await carregarCoresProduto('cracha', null, 'unissex');
  
  console.log('📊 Cores disponíveis:');
  cores.forEach((cor, i) => console.log(`   ${i + 1}. ${cor}`));
  
  // Validar que cores foram limpas
  console.log('\n✅ Validações:');
  
  const temPoluicao = cores.some(c => 
    c.includes('Crachá') || 
    c.includes('Magnético') || 
    c.includes('Regulável')
  );
  
  if (!temPoluicao) {
    console.log('   ✅ Nomes limpos: SEM "Crachá", "Magnético", "Regulável"');
  } else {
    console.log('   ❌ ERRO: Ainda tem palavras redundantes!');
    return false;
  }
  
  const temDourado = cores.some(c => c.toLowerCase().includes('dourado'));
  const temPrata = cores.some(c => c.toLowerCase().includes('prata'));
  const temPreto = cores.some(c => c.toLowerCase().includes('preto'));
  
  if (temDourado && temPrata && temPreto) {
    console.log('   ✅ Cores corretas: Dourado, Prata, Preto presentes');
  } else {
    console.log('   ❌ ERRO: Faltando cores essenciais!');
    return false;
  }
  
  return true;
}

async function testarDeteccaoCor() {
  console.log('\n\n🧪 TESTE: Detecção de cores do cliente\n');
  
  const cores = ['Dourado', 'Prata', 'Preto'];
  
  const testes = [
    { mensagem: 'dourado', esperado: 'Dourado' },
    { mensagem: 'prata', esperado: 'Prata' },
    { mensagem: 'preto', esperado: 'Preto' },
    { mensagem: 'cracha magnetico dourado', esperado: 'Dourado' },
    { mensagem: 'cracha magnetico prata', esperado: 'Prata' },
    { mensagem: 'quero o dourado', esperado: 'Dourado' },
  ];
  
  let passou = true;
  
  for (const teste of testes) {
    const corCapturada = detectarCor(teste.mensagem, cores);
    
    if (corCapturada === teste.esperado) {
      console.log(`✅ "${teste.mensagem}" → ${corCapturada}`);
    } else {
      console.log(`❌ "${teste.mensagem}" → ${corCapturada || 'NÃO DETECTOU'} (esperado: ${teste.esperado})`);
      passou = false;
    }
  }
  
  return passou;
}

async function testarAvental() {
  console.log('\n\n🧪 TESTE: Cores do avental (Linho Regulável)\n');
  
  const cores = await carregarCoresProduto('avental', null, 'unissex');
  
  console.log('📊 Cores disponíveis:');
  cores.slice(0, 5).forEach((cor, i) => console.log(`   ${i + 1}. ${cor}`));
  console.log(`   ... (${cores.length} cores no total)\n`);
  
  const temRegulavel = cores.some(c => c.includes('Regulável'));
  const temLinho = cores.some(c => c.includes('Linho') && c.includes('Regulável'));
  
  if (!temRegulavel) {
    console.log('✅ Nomes limpos: SEM "Regulável"');
    return true;
  } else {
    console.log('❌ ERRO: Ainda tem "Regulável" nas cores!');
    console.log(`   Exemplo: ${cores.find(c => c.includes('Regulável'))}`);
    return false;
  }
}

// Executar todos os testes
(async () => {
  console.log('═'.repeat(60));
  console.log('🔬 TESTE: Limpeza de cores e detecção melhorada');
  console.log('═'.repeat(60) + '\n');
  
  const teste1 = await testarCoresCracha();
  const teste2 = await testarDeteccaoCor();
  const teste3 = await testarAvental();
  
  console.log('\n' + '═'.repeat(60));
  if (teste1 && teste2 && teste3) {
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    console.log('   → Nomes de cores limpos (sem redundâncias)');
    console.log('   → Detecção reconhece "dourado", "prata", etc.');
    console.log('   → Cliente não verá mais "Crachá Magnético Dourado"');
    console.log('   → Cliente verá apenas "Dourado" ✅');
  } else {
    console.log('❌ ALGUNS TESTES FALHARAM');
  }
  console.log('═'.repeat(60));
  
  process.exit(teste1 && teste2 && teste3 ? 0 : 1);
})();
