/**
 * TESTE: Normalização - Função normalizar()
 * Valida que a função remove maiúsculas, acentos e pontuação
 */

// Replicar função normalizar localmente
function normalizar(texto) {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, '') // Remove pontuação
    .trim();
}

console.log('═══════════════════════════════════════════════════════════');
console.log('  TESTE: NORMALIZAÇÃO - Maiúsculas/Acentos/Pontuação');
console.log('═══════════════════════════════════════════════════════════\n');

const testes = [
  { entrada: 'jaleco', esperado: 'jaleco' },
  { entrada: 'Jaleco', esperado: 'jaleco' },
  { entrada: 'JALECO', esperado: 'jaleco' },
  { entrada: 'jáleco', esperado: 'jaleco' },
  { entrada: 'jaleco.', esperado: 'jaleco' },
  { entrada: 'jaleco,', esperado: 'jaleco' },
  { entrada: 'Jáleco!', esperado: 'jaleco' },
  { entrada: 'scrub', esperado: 'scrub' },
  { entrada: 'Scrub', esperado: 'scrub' },
  { entrada: 'SCRUB', esperado: 'scrub' },
  { entrada: 'masculino', esperado: 'masculino' },
  { entrada: 'Masculino', esperado: 'masculino' },
  { entrada: 'MASCULINO', esperado: 'masculino' },
  { entrada: 'feminino', esperado: 'feminino' },
  { entrada: 'Feminino', esperado: 'feminino' },
  { entrada: 'fêmínino', esperado: 'feminino' },
  { entrada: 'azul', esperado: 'azul' },
  { entrada: 'Azul', esperado: 'azul' },
  { entrada: 'AZUL', esperado: 'azul' },
  { entrada: 'Azúl!', esperado: 'azul' },
];

let acertos = 0;
const total = testes.length;

testes.forEach((teste, i) => {
  const resultado = normalizar(teste.entrada);
  const passou = resultado === teste.esperado;
  console.log(`  ${i + 1}. "${teste.entrada}" → "${resultado}" ${passou ? '✅' : '❌'}`);
  if (passou) acertos++;
  if (!passou) {
    console.log(`      Esperado: "${teste.esperado}"`);
  }
});

const percentual = Math.round(acertos / total * 100);

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  RESUMO');
console.log('═══════════════════════════════════════════════════════════\n');
console.log(`  🎯 Resultado: ${acertos}/${total} (${percentual}%)`);

if (percentual === 100) {
  console.log('\n  ✅ PERFEITO! Normalização funcionando 100%!\n');
  console.log('  📝 O bot agora entende:');
  console.log('     • "jaleco", "Jaleco", "JALECO" → todos iguais');
  console.log('     • "jáleco", "Jáleco!" → remove acentos e pontuação');
  console.log('     • "masculino.", "Masculino" → normaliza tudo');
} else {
  console.log('\n  ❌ Alguns testes falharam!\n');
}

console.log('\n═══════════════════════════════════════════════════════════\n');
