/**
 * TEST: Verificar se lista de cores filtra por gênero
 */

import { carregarCatalogoPorTipo, normalizar } from './atendimento/match-catalogo.js';

console.log('='.repeat(80));
console.log('🧪 TESTE: CORES FILTRADAS POR GÊNERO');
console.log('='.repeat(80));

const tipoProduto = 'jaleco';
const catalogo = carregarCatalogoPorTipo(tipoProduto);

if (!catalogo || !catalogo.produtosOriginais) {
  console.log('❌ Erro: Catálogo não carregado');
  process.exit(1);
}

// TEST 1: Filtrar produtos MASCULINOS
console.log('\n📋 TESTE 1: Jaleco MASCULINO - Cores e Modelos');
const generoMasculino = 'masculino';
const generoNormMasc = normalizar(generoMasculino);

const produtosMasculinos = catalogo.produtosOriginais.filter(p => {
  const sexoNorm = normalizar(p.sexo || '');
  return sexoNorm === generoNormMasc || sexoNorm === 'unissex';
});

console.log(`   Total produtos masculinos: ${produtosMasculinos.length}`);

const mapaCoresMasc = {};
produtosMasculinos.forEach(produto => {
  const modelo = produto.modelo;
  const cor = produto.cor || '';
  
  const coresEncontradas = new Set();
  
  if (cor && cor.trim() !== '') {
    coresEncontradas.add(cor);
  }
  
  if (produto.coresDisponiveis && Array.isArray(produto.coresDisponiveis)) {
    produto.coresDisponiveis.forEach(c => coresEncontradas.add(c));
  }
  
  coresEncontradas.forEach(corItem => {
    if (!mapaCoresMasc[corItem]) mapaCoresMasc[corItem] = new Set();
    mapaCoresMasc[corItem].add(modelo);
  });
});

const coresMasculinas = Object.keys(mapaCoresMasc).sort();
console.log(`   Total cores disponíveis: ${coresMasculinas.length}`);
console.log('\n   🎨 Primeiras 5 cores:');
coresMasculinas.slice(0, 5).forEach((cor, i) => {
  const modelos = Array.from(mapaCoresMasc[cor]).slice(0, 4).join(', ');
  const total = mapaCoresMasc[cor].size;
  const mais = total > 4 ? ` +${total - 4} mais` : '';
  console.log(`   ${i + 1}. ${cor} → ${modelos}${mais}`);
});

// TEST 2: Filtrar produtos FEMININOS
console.log('\n📋 TESTE 2: Jaleco FEMININO - Cores e Modelos');
const generoFeminino = 'feminino';
const generoNormFem = normalizar(generoFeminino);

const produtosFemininos = catalogo.produtosOriginais.filter(p => {
  const sexoNorm = normalizar(p.sexo || '');
  return sexoNorm === generoNormFem || sexoNorm === 'unissex';
});

console.log(`   Total produtos femininos: ${produtosFemininos.length}`);

const mapaCoresFem = {};
produtosFemininos.forEach(produto => {
  const modelo = produto.modelo;
  const cor = produto.cor || '';
  
  const coresEncontradas = new Set();
  
  if (cor && cor.trim() !== '') {
    coresEncontradas.add(cor);
  }
  
  if (produto.coresDisponiveis && Array.isArray(produto.coresDisponiveis)) {
    produto.coresDisponiveis.forEach(c => coresEncontradas.add(c));
  }
  
  coresEncontradas.forEach(corItem => {
    if (!mapaCoresFem[corItem]) mapaCoresFem[corItem] = new Set();
    mapaCoresFem[corItem].add(modelo);
  });
});

const coresFemininas = Object.keys(mapaCoresFem).sort();
console.log(`   Total cores disponíveis: ${coresFemininas.length}`);
console.log('\n   🎨 Primeiras 5 cores:');
coresFemininas.slice(0, 5).forEach((cor, i) => {
  const modelos = Array.from(mapaCoresFem[cor]).slice(0, 4).join(', ');
  const total = mapaCoresFem[cor].size;
  const mais = total > 4 ? ` +${total - 4} mais` : '';
  console.log(`   ${i + 1}. ${cor} → ${modelos}${mais}`);
});

// VERIFICAÇÃO: Não deve ter modelos femininos na lista masculina
console.log('\n🔍 VERIFICAÇÃO: Modelos na lista MASCULINA');
const modelosFemininosNaListaMasc = [];
for (const [cor, modelos] of Object.entries(mapaCoresMasc)) {
  modelos.forEach(modelo => {
    // Modelos femininos conhecidos
    if (['Marta', 'Manuela', 'Isabel', 'Heloisa', 'Clara', 'Rute', 'Chloe'].includes(modelo)) {
      modelosFemininosNaListaMasc.push({ cor, modelo });
    }
  });
}

if (modelosFemininosNaListaMasc.length > 0) {
  console.log(`   ❌ ERRO: Encontrados ${modelosFemininosNaListaMasc.length} modelos femininos na lista masculina:`);
  modelosFemininosNaListaMasc.slice(0, 5).forEach(({ cor, modelo }) => {
    console.log(`      - ${modelo} (cor: ${cor})`);
  });
} else {
  console.log(`   ✅ OK: Nenhum modelo feminino encontrado na lista masculina`);
}

console.log('\n' + '='.repeat(80));
console.log('✅ TESTE CONCLUÍDO');
console.log('='.repeat(80));
