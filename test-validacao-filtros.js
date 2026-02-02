/**
 * ================================================================
 * TESTE: Validação de Filtros e Listas de Sugestões
 * Verifica se as cores sugeridas realmente existem nos produtos
 * ================================================================
 */

import { carregarCoresProduto } from './atendimento/lista-enumerada.js';
import { buscarProdutosFiltrado } from './atendimento/bloco3-magazord.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Normaliza texto (mesma função usada no sistema)
 */
function normalizarTexto(texto) {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .trim();
}

/**
 * Teste 1: Verificar cores disponíveis para scrub masculino
 */
async function testarCoresScrubMasculino() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('TESTE 1: Cores disponíveis para SCRUB MASCULINO');
  console.log('═══════════════════════════════════════════════════');
  
  const cores = await carregarCoresProduto('scrub', null, 'masculino');
  
  console.log(`\n✅ Total de cores encontradas: ${cores.length}`);
  console.log('\n📋 Lista de cores:');
  cores.forEach((cor, i) => {
    console.log(`   ${i + 1}. ${cor} (normalizado: "${normalizarTexto(cor)}")`);
  });
  
  // Verificar se "Bordo" ou "Bordô" está na lista
  const temBordo = cores.some(cor => 
    normalizarTexto(cor) === 'bordo' || 
    normalizarTexto(cor) === 'bordô'
  );
  
  console.log(`\n🔍 Tem "Bordo" na lista? ${temBordo ? '✅ SIM' : '❌ NÃO'}`);
  
  return { cores, temBordo };
}

/**
 * Teste 2: Verificar produtos no catálogo scrub.json
 */
async function verificarProdutosNoArquivo() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('TESTE 2: Produtos no arquivo scrub.json');
  console.log('═══════════════════════════════════════════════════');
  
  const catalogoPath = path.join(process.cwd(), 'catalogos', 'produtos', 'scrub.json');
  const conteudo = await fs.readFile(catalogoPath, 'utf-8');
  const catalogo = JSON.parse(conteudo);
  
  const produtosOriginais = catalogo.produtosOriginais || [];
  
  console.log(`\n✅ Total de produtos no catálogo: ${produtosOriginais.length}`);
  
  // Filtrar por masculino
  const produtosMasculinos = produtosOriginais.filter(p => {
    if (!p.sexo) return false;
    const sexo = p.sexo.toLowerCase();
    return sexo === 'masculino' || sexo === 'unissex';
  });
  
  console.log(`✅ Produtos masculinos/unissex: ${produtosMasculinos.length}`);
  
  // Extrair todas as cores disponíveis
  const todasCores = new Set();
  const coresPorProduto = {};
  
  produtosMasculinos.forEach(p => {
    if (p.coresDisponiveis && Array.isArray(p.coresDisponiveis)) {
      p.coresDisponiveis.forEach(cor => {
        todasCores.add(cor);
        const corNorm = normalizarTexto(cor);
        if (!coresPorProduto[corNorm]) {
          coresPorProduto[corNorm] = [];
        }
        coresPorProduto[corNorm].push(p.nome || p.nomeCompleto);
      });
    }
  });
  
  console.log(`\n✅ Cores únicas encontradas: ${todasCores.size}`);
  
  // Verificar produtos com "Bordo" ou "Bordô"
  const produtosComBordo = produtosMasculinos.filter(p => {
    if (!p.coresDisponiveis) return false;
    return p.coresDisponiveis.some(cor => {
      const corNorm = normalizarTexto(cor);
      return corNorm === 'bordo' || corNorm === 'bordô';
    });
  });
  
  console.log(`\n🔍 Produtos SCRUB MASCULINO com cor "Bordo/Bordô": ${produtosComBordo.length}`);
  
  if (produtosComBordo.length > 0) {
    console.log('\n📦 Produtos encontrados:');
    produtosComBordo.forEach((p, i) => {
      console.log(`\n   ${i + 1}. ${p.nome || p.nomeCompleto}`);
      console.log(`      Sexo: ${p.sexo}`);
      console.log(`      Cores: ${p.coresDisponiveis.join(', ')}`);
      console.log(`      SKU: ${p.sku || p.codigo}`);
    });
  } else {
    console.log('\n❌ PROBLEMA: Nenhum produto scrub masculino tem cor Bordo/Bordô!');
    console.log('\n🔍 Todas as cores disponíveis para scrub masculino:');
    Array.from(todasCores).slice(0, 20).forEach(cor => {
      console.log(`   - ${cor} (normalizado: "${normalizarTexto(cor)}")`);
    });
  }
  
  return { produtosComBordo, todasCores };
}

/**
 * Teste 3: Testar busca com filtros (scrub + masculino + bordo)
 */
async function testarBuscaComFiltros() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('TESTE 3: Busca com filtros (scrub + masculino + Bordo)');
  console.log('═══════════════════════════════════════════════════');
  
  const contexto = {
    tipoProduto: 'scrub',
    genero: 'masculino',
    cor: 'Bordo'
  };
  
  try {
    const resultado = await buscarProdutosFiltrado(contexto);
    
    console.log(`\n✅ Busca concluída!`);
    console.log(`📦 Produtos encontrados: ${resultado.produtos.length}`);
    
    if (resultado.produtos.length > 0) {
      console.log('\n📋 Lista de produtos:');
      resultado.produtos.forEach((p, i) => {
        console.log(`\n   ${i + 1}. ${p.nome || p.nomeCompleto}`);
        console.log(`      Sexo: ${p.sexo}`);
        console.log(`      Cor principal: ${p.coresDisponiveis[0]}`);
        console.log(`      SKU: ${p.sku || p.codigo}`);
      });
    } else {
      console.log('\n❌ PROBLEMA: Busca não retornou produtos!');
    }
    
    return resultado;
  } catch (erro) {
    console.error('\n❌ ERRO na busca:', erro.message);
    return null;
  }
}

/**
 * Teste 4: Verificar normalização de cores
 */
async function testarNormalizacao() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('TESTE 4: Normalização de cores');
  console.log('═══════════════════════════════════════════════════');
  
  const testeCores = [
    'Bordo',
    'Bordô',
    'bordo',
    'bordô',
    'BORDO',
    'BORDÔ',
    'Azul Marinho',
    'Azul-Marinho',
    'azul marinho'
  ];
  
  console.log('\n📋 Teste de normalização:');
  testeCores.forEach(cor => {
    const normalizada = normalizarTexto(cor);
    console.log(`   "${cor}" → "${normalizada}"`);
  });
  
  // Verificar se variações são iguais
  const bordoVariacoes = ['Bordo', 'Bordô', 'bordo', 'bordô'];
  const normalizadas = bordoVariacoes.map(normalizarTexto);
  const todasIguais = normalizadas.every(n => n === normalizadas[0]);
  
  console.log(`\n🔍 Todas as variações de "Bordo/Bordô" normalizam igual? ${todasIguais ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`   Resultado: "${normalizadas[0]}"`);
}

/**
 * Executar todos os testes
 */
async function executarTestes() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║   TESTE DE VALIDAÇÃO: FILTROS E SUGESTÕES        ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  
  try {
    // Teste 1: Cores sugeridas
    const teste1 = await testarCoresScrubMasculino();
    
    // Teste 2: Produtos no arquivo
    const teste2 = await verificarProdutosNoArquivo();
    
    // Teste 3: Busca com filtros
    const teste3 = await testarBuscaComFiltros();
    
    // Teste 4: Normalização
    await testarNormalizacao();
    
    // Resumo final
    console.log('\n═══════════════════════════════════════════════════');
    console.log('RESUMO DOS TESTES');
    console.log('═══════════════════════════════════════════════════');
    
    console.log('\n✅ Cores sugeridas:', teste1.cores.length);
    console.log(`${teste1.temBordo ? '✅' : '❌'} "Bordo" na lista de sugestões`);
    console.log(`${teste2.produtosComBordo.length > 0 ? '✅' : '❌'} Produtos com "Bordo" no catálogo: ${teste2.produtosComBordo.length}`);
    console.log(`${teste3?.produtos.length > 0 ? '✅' : '❌'} Busca retornou produtos: ${teste3?.produtos.length || 0}`);
    
    if (teste1.temBordo && teste2.produtosComBordo.length === 0) {
      console.log('\n⚠️ INCONSISTÊNCIA DETECTADA:');
      console.log('   Sistema sugere "Bordo" mas NÃO há produtos scrub masculino com essa cor!');
    }
    
    if (!teste1.temBordo && teste2.produtosComBordo.length > 0) {
      console.log('\n⚠️ INCONSISTÊNCIA DETECTADA:');
      console.log('   Há produtos com "Bordo" mas sistema NÃO sugere essa cor!');
    }
    
    if (teste1.temBordo && teste2.produtosComBordo.length > 0 && (!teste3 || teste3.produtos.length === 0)) {
      console.log('\n⚠️ PROBLEMA NA BUSCA:');
      console.log('   Cor existe, produtos existem, mas busca NÃO encontra!');
      console.log('   Possível problema na normalização ou comparação.');
    }
    
  } catch (erro) {
    console.error('\n❌ ERRO ao executar testes:', erro);
    console.error(erro.stack);
  }
}

// Executar
executarTestes().then(() => {
  console.log('\n✅ Testes concluídos!\n');
  process.exit(0);
}).catch(erro => {
  console.error('\n❌ Erro fatal:', erro);
  process.exit(1);
});
