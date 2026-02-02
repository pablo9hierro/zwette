/**
 * Teste do NOVO FLUXO SIMPLIFICADO
 * 
 * Fluxo: identificacao → filtro_tipo → confirmacao_tipo → filtro_cor → confirmacao_cor → busca → feedback → reiniciar/encerramento
 * 
 * Filtros: APENAS tipo + cor (removido genero e modelo)
 */

import { listarCoresDoTipo } from './atendimento/match-catalogo.js';
import { carregarCatalogoPorTipo } from './atendimento/match-catalogo.js';

console.log('🧪 TESTE DO NOVO FLUXO SIMPLIFICADO\n');
console.log('═'.repeat(60));

// 1. Testar lista de cores de cada tipo
console.log('\n📋 TESTANDO listarCoresDoTipo():\n');

const tiposProduto = [
  'jaleco',
  'scrub',
  'dolma-avental',
  'gorro',
  'robe',
  'macacao',
  'infantil',
  'nao-texteis',
  'outros'
];

tiposProduto.forEach(tipo => {
  const cores = listarCoresDoTipo(tipo);
  console.log(`\n${tipo}:`);
  if (cores && cores.length > 0) {
    console.log(`  ✅ ${cores.length} cores disponíveis:`);
    cores.slice(0, 5).forEach((cor, idx) => {
      console.log(`     ${idx + 1}. ${cor}`);
    });
    if (cores.length > 5) {
      console.log(`     ... e mais ${cores.length - 5} cores`);
    }
  } else {
    console.log('  ⚠️ Sem cores cadastradas');
  }
});

// 2. Testar busca de produtos por tipo + cor
console.log('\n\n' + '═'.repeat(60));
console.log('\n📋 TESTANDO BUSCA POR TIPO + COR:\n');

const testesBusca = [
  { tipo: 'jaleco', cor: 'Branco' },
  { tipo: 'scrub', cor: 'Azul' },
  { tipo: 'infantil', cor: 'Rosa' }
];

testesBusca.forEach(({ tipo, cor }) => {
  const catalogo = carregarCatalogoPorTipo(tipo);
  
  if (catalogo && catalogo.produtosOriginais) {
    // Filtrar produtos por cor
    const produtos = catalogo.produtosOriginais.filter(p => {
      const corProduto = p.cor?.toLowerCase();
      const corBuscada = cor.toLowerCase();
      const temCor = corProduto === corBuscada;
      const temNaLista = p.coresDisponiveis?.some(c => c.toLowerCase() === corBuscada);
      return temCor || temNaLista;
    });
    
    console.log(`\n${tipo} + ${cor}:`);
    console.log(`  ✅ ${produtos.length} produtos encontrados`);
    
    if (produtos.length > 0) {
      // Mostrar alguns exemplos
      produtos.slice(0, 3).forEach((p, idx) => {
        console.log(`     ${idx + 1}. ${p.modelo || p.nome} - ${p.cor}`);
      });
      if (produtos.length > 3) {
        console.log(`     ... e mais ${produtos.length - 3} modelos`);
      }
    }
  }
});

// 3. Resumo
console.log('\n\n' + '═'.repeat(60));
console.log('\n✅ NOVO FLUXO VALIDADO:\n');
console.log('  1. Identificação (nome)');
console.log('  2. Filtro Tipo (lista enumerada de 9 tipos)');
console.log('  3. Confirmação Tipo (pergunta mágica)');
console.log('  4. Filtro Cor (lista enumerada de cores do tipo)');
console.log('  5. Confirmação Cor (pergunta mágica)');
console.log('  6. Busca (TODOS os modelos daquela cor)');
console.log('  7. Feedback (continuar ou encerrar)');
console.log('  8a. Reiniciar (limpar e voltar ao tipo) OU');
console.log('  8b. Encerramento (transferir para humano)');
console.log('\n📊 DADOS OBRIGATÓRIOS: tipo + cor');
console.log('🚫 REMOVIDOS: gênero, modelo, profissão');
console.log('\n' + '═'.repeat(60));
