#!/usr/bin/env node
/**
 * Script para migrar novos catálogos para o formato esperado pelo sistema
 * Adiciona campos: sexo, coresDisponiveis
 */

import fs from 'fs/promises';
import path from 'path';

const CATALOGOS_PATH = path.join(process.cwd(), 'catalogos', 'produtos');

/**
 * Detecta gênero do produto baseado no nome
 */
function detectarGenero(nome, nomeCompleto) {
  const texto = `${nome} ${nomeCompleto}`.toLowerCase();
  
  if (texto.includes('feminino') || texto.includes('feminina')) {
    return 'Feminino';
  }
  if (texto.includes('masculino') || texto.includes('masculina')) {
    return 'Masculino';
  }
  if (texto.includes('unissex')) {
    return 'Unissex';
  }
  
  // Produtos sem gênero específico são considerados Unissex
  return 'Unissex';
}

/**
 * Extrai cores disponíveis do array cores
 */
function extrairCoresDisponiveis(cores) {
  if (!cores || !Array.isArray(cores)) {
    return [];
  }
  
  return cores.map(cor => {
    // Extrair nome da cor do campo nome ou tituloCompleto
    const nomeCompleto = cor.tituloCompleto || cor.nome || '';
    
    // Tentar extrair a cor principal (última palavra geralmente)
    const palavras = nomeCompleto.split(' ');
    
    // Cores compostas comuns
    const coresCompostas = [
      'Azul Marinho', 'Azul Bebê', 'Azul Médio', 'Azul Claro',
      'Rosa Pink', 'Rosa Nude', 'Rosa Bebê',
      'Verde Claro', 'Verde Escuro',
      'Off White'
    ];
    
    for (const corComposta of coresCompostas) {
      if (nomeCompleto.includes(corComposta)) {
        return corComposta;
      }
    }
    
    // Cores simples - pegar última ou penúltima palavra
    const coresPossiveis = ['Branco', 'Preto', 'Azul', 'Verde', 'Rosa', 'Bege', 
                            'Bordô', 'Bordo', 'Chumbo', 'Cinza', 'Lilás', 'Amarelo',
                            'Vermelho', 'Roxo', 'Marrom', 'Caramelo', 'Natural', 
                            'Ferrugem', 'Areia', 'Jeans', 'Coral', 'Tangerina'];
    
    for (const palavra of palavras.reverse()) {
      for (const cor of coresPossiveis) {
        if (palavra.toLowerCase() === cor.toLowerCase()) {
          return cor;
        }
      }
    }
    
    // Se não encontrou, retornar o nome original da cor
    return cor.nome || 'Sem Cor';
  });
}

/**
 * Migra um catálogo
 */
async function migrarCatalogo(nomeArquivo) {
  try {
    const caminhoArquivo = path.join(CATALOGOS_PATH, nomeArquivo);
    const conteudo = await fs.readFile(caminhoArquivo, 'utf-8');
    const catalogo = JSON.parse(conteudo);
    
    console.log(`\n📦 Migrando ${nomeArquivo}...`);
    console.log(`   Total de produtos: ${catalogo.produtosOriginais.length}`);
    
    let produtosMigrados = 0;
    
    // Processar cada produto
    for (const produto of catalogo.produtosOriginais) {
      // 1. Adicionar campo sexo se não existir
      if (!produto.sexo) {
        produto.sexo = detectarGenero(produto.nome, produto.nomeCompleto);
      }
      
      // 2. Adicionar coresDisponiveis se não existir
      if (!produto.coresDisponiveis) {
        produto.coresDisponiveis = extrairCoresDisponiveis(produto.cores);
        
        // Se não tem cores no array, tentar extrair do nome
        if (produto.coresDisponiveis.length === 0) {
          const coresPossiveis = ['Branco', 'Preto', 'Azul', 'Verde', 'Rosa', 'Bege', 
                                  'Bordô', 'Bordo', 'Chumbo', 'Cinza', 'Lilás',
                                  'Marrom', 'Caramelo', 'Natural', 'Ferrugem', 'Areia'];
          
          for (const cor of coresPossiveis) {
            if (produto.nome.includes(cor) || produto.nomeCompleto.includes(cor)) {
              produto.coresDisponiveis.push(cor);
              break;
            }
          }
        }
      }
      
      produtosMigrados++;
    }
    
    // Salvar catalogo atualizado
    await fs.writeFile(
      caminhoArquivo,
      JSON.stringify(catalogo, null, 2),
      'utf-8'
    );
    
    console.log(`   ✅ ${produtosMigrados} produtos migrados`);
    
    // Mostrar amostra
    const amostra = catalogo.produtosOriginais[0];
    console.log(`   📋 Amostra:`);
    console.log(`      Nome: ${amostra.nome}`);
    console.log(`      Sexo: ${amostra.sexo}`);
    console.log(`      Cores: ${amostra.coresDisponiveis?.join(', ') || 'Nenhuma'}`);
    
    return produtosMigrados;
    
  } catch (erro) {
    console.error(`   ❌ Erro ao migrar ${nomeArquivo}:`, erro.message);
    return 0;
  }
}

/**
 * Execução principal
 */
async function main() {
  console.log('═'.repeat(80));
  console.log('🔄 MIGRAÇÃO DE CATÁLOGOS - NOVOS PARA FORMATO JANA');
  console.log('═'.repeat(80));
  
  try {
    // Listar todos os arquivos JSON
    const arquivos = await fs.readdir(CATALOGOS_PATH);
    const catalogos = arquivos.filter(f => f.endsWith('.json'));
    
    console.log(`\n📚 Encontrados ${catalogos.length} catálogos\n`);
    
    let totalProdutos = 0;
    
    for (const catalogo of catalogos) {
      const produtos = await migrarCatalogo(catalogo);
      totalProdutos += produtos;
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log(`✅ MIGRAÇÃO CONCLUÍDA`);
    console.log(`📊 Total: ${totalProdutos} produtos migrados em ${catalogos.length} catálogos`);
    console.log('═'.repeat(80));
    
  } catch (erro) {
    console.error('❌ Erro na migração:', erro);
    process.exit(1);
  }
}

main();
