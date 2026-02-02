/**
 * Teste de processarRespostaLista
 */

// Simular função processarRespostaLista
function processarRespostaLista(mensagem, lista) {
  const mensagemLower = mensagem.toLowerCase().trim();
  
  // Verificar se é um número
  const numero = parseInt(mensagemLower);
  if (!isNaN(numero) && numero >= 1 && numero <= lista.length) {
    return lista[numero - 1];
  }
  
  // Ordenar lista por tamanho (maiores primeiro) para priorizar matches compostos
  const listaOrdenada = [...lista].sort((a, b) => b.length - a.length);
  
  // 1. Tentar match exato primeiro
  for (const item of listaOrdenada) {
    if (item.toLowerCase() === mensagemLower) {
      return item;
    }
  }
  
  // 2. Tentar match de palavra completa
  for (const item of listaOrdenada) {
    const regex = new RegExp(`\\b${item.toLowerCase()}\\b`, 'i');
    if (regex.test(mensagemLower)) {
      return item;
    }
  }
  
  // 3. Fallback: match parcial (itens maiores/compostos primeiro)
  for (const item of listaOrdenada) {
    if (item.toLowerCase().includes(mensagemLower) || 
        mensagemLower.includes(item.toLowerCase())) {
      return item;
    }
  }
  
  return null;
}

const coresDisponiveis = [
  'Bordo', 'Branco', 'Rosa', 'Rosa Pink', 'Chumbo', 'Verde',
  'Verde Claro', 'Rosa Nude', 'Nude', 'Azul', 'Azul Bebe', 'Azul Marinho'
];

console.log('🎨 Teste de processarRespostaLista\n');

const testes = [
  { input: 'rosa pink', esperado: 'Rosa Pink' },
  { input: 'rosa', esperado: 'Rosa' },
  { input: 'azul bebe', esperado: 'Azul Bebe' },
  { input: 'azul', esperado: 'Azul' },
  { input: 'verde claro', esperado: 'Verde Claro' },
  { input: 'rosa nude', esperado: 'Rosa Nude' },
  { input: '4', esperado: 'Rosa Pink' },
  { input: '3', esperado: 'Rosa' },
];

testes.forEach(teste => {
  const resultado = processarRespostaLista(teste.input, coresDisponiveis);
  const status = resultado === teste.esperado ? '✅' : '❌';
  console.log(`${status} "${teste.input}" → ${resultado} ${resultado !== teste.esperado ? `(esperado: ${teste.esperado})` : ''}`);
});
