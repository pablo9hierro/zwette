import { carregarGenerosProduto } from './atendimento/carregar-generos.js';
import { carregarCoresProduto } from './atendimento/lista-enumerada.js';

async function testar() {
  console.log('=== TESTE: Scrub ===\n');
  
  const generos = await carregarGenerosProduto('scrub');
  console.log('Gêneros disponíveis:', generos);
  
  for (const genero of generos) {
    const cores = await carregarCoresProduto('scrub', null, genero);
    console.log(`\n${genero}: ${cores.length} cores`);
    if (cores.length > 0) {
      console.log(`  Primeiras 5: ${cores.slice(0, 5).join(', ')}`);
    } else {
      console.log('   Nenhuma cor encontrada');
    }
  }
}

testar().catch(console.error);
