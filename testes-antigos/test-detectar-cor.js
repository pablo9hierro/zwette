/**
 * Teste de detecção de cores
 */

// Simular função detectarCor
function detectarCor(mensagem, coresDisponiveis) {
  const mensagemLower = mensagem.toLowerCase().trim();
  
  // Ordenar cores por tamanho (maiores primeiro) para priorizar compostas
  const coresOrdenadas = [...coresDisponiveis].sort((a, b) => b.length - a.length);
  
  // 1. Tentar match exato primeiro
  for (const cor of coresOrdenadas) {
    if (mensagemLower === cor.toLowerCase()) {
      return cor;
    }
  }
  
  // 2. Tentar match de palavra completa
  for (const cor of coresOrdenadas) {
    const regex = new RegExp(`\\b${cor.toLowerCase()}\\b`, 'i');
    if (regex.test(mensagemLower)) {
      return cor;
    }
  }
  
  // 3. Fallback: match parcial (cores compostas primeiro)
  for (const cor of coresOrdenadas) {
    if (mensagemLower.includes(cor.toLowerCase())) {
      return cor;
    }
  }
  
  return null;
}

const coresDisponiveis = [
  'Bordo', 'Branco', 'Rosa', 'Rosa Pink', 'Chumbo', 'Verde',
  'Verde Claro', 'Rosa Nude', 'Nude', 'Azul', 'Azul Bebe', 'Azul Marinho'
];

console.log('🎨 Teste de detecção de cores compostas\n');

const testes = [
  'rosa pink',
  'rosa',
  'azul bebe',
  'azul',
  'verde claro',
  'rosa nude',
  'branco'
];

testes.forEach(teste => {
  const resultado = detectarCor(teste, coresDisponiveis);
  console.log(`"${teste}" → ${resultado}`);
});
