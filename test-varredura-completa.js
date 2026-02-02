// Varredura completa de todos os produtos do catálogo vs API Magazord

import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

dotenv.config();

const API_URL = process.env.MAGAZORD_URL;
const TOKEN = process.env.MAGAZORD_USER;
const PASSWORD = process.env.MAGAZORD_PASSWORD;

const auth = {
  username: TOKEN,
  password: PASSWORD
};

// Função de conversão atualizada
function converterSKUParaCodigoAPI(sku) {
  if (!sku) return sku;
  
  let codigoAPI = sku;
  
  // Padrão 1: Robes sem hífen (217774Fa → 217774)
  if (!codigoAPI.includes('-')) {
    codigoAPI = codigoAPI.replace(/[A-Z]+a?$/i, '');
  } else {
    // Padrão 2: Remove "Fa", "Ma", "Ua" no final
    codigoAPI = codigoAPI.replace(/([FMU])[FMU]?a$/, '$1');
    
    // Padrão 3: Remove dígitos finais após letra maiúscula
    codigoAPI = codigoAPI.replace(/([A-Z])(\d+)$/, '$1');
    
    // Padrão 4: Remove dígitos extras no final (301-DD-0005 → 301-DD-000)
    codigoAPI = codigoAPI.replace(/(\d{3})\d+$/, '$1');
  }
  
  return codigoAPI;
}

async function verificarSKUNaAPI(sku, skuOriginal) {
  try {
    const codigoConvertido = converterSKUParaCodigoAPI(sku);
    
    const response = await axios.get(`${API_URL}/v2/site/produto/${codigoConvertido}`, {
      auth,
      timeout: 5000
    });
    
    return {
      sucesso: true,
      skuOriginal,
      codigoConvertido,
      ativo: response.data.data.ativo,
      nomeAPI: response.data.data.nome
    };
  } catch (error) {
    if (error.response?.status === 404) {
      return {
        sucesso: false,
        skuOriginal,
        codigoConvertido: converterSKUParaCodigoAPI(sku),
        erro: 'NOT_FOUND'
      };
    }
    return {
      sucesso: false,
      skuOriginal,
      codigoConvertido: converterSKUParaCodigoAPI(sku),
      erro: error.message
    };
  }
}

async function varrerCatalogo() {
  console.log('═'.repeat(80));
  console.log('🔍 VARREDURA COMPLETA DO CATÁLOGO vs API MAGAZORD');
  console.log('═'.repeat(80));
  console.log('');
  
  const catalogoDir = './catalogos/produtos';
  const arquivos = fs.readdirSync(catalogoDir).filter(f => f.endsWith('.json'));
  
  console.log(`📁 Encontrados ${arquivos.length} arquivos JSON no catálogo\n`);
  
  const estatisticas = {
    totalArquivos: 0,
    totalProdutos: 0,
    sucessos: 0,
    falhas: 0,
    produtosInativos: 0,
    arquivosComProblemas: [],
    skusProblematicos: []
  };
  
  for (const arquivo of arquivos) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`📄 Processando: ${arquivo}`);
    console.log('─'.repeat(80));
    
    const caminhoCompleto = path.join(catalogoDir, arquivo);
    const conteudo = JSON.parse(fs.readFileSync(caminhoCompleto, 'utf8'));
    
    // Buscar produtos no JSON (estrutura pode variar)
    let produtos = [];
    
    if (conteudo.produtosOriginais) {
      produtos = conteudo.produtosOriginais;
    } else if (conteudo.produtos) {
      produtos = conteudo.produtos;
    } else if (Array.isArray(conteudo)) {
      produtos = conteudo;
    }
    
    if (produtos.length === 0) {
      console.log('⚠️  Nenhum produto encontrado neste arquivo');
      continue;
    }
    
    estatisticas.totalArquivos++;
    estatisticas.totalProdutos += produtos.length;
    
    console.log(`📦 ${produtos.length} produtos encontrados`);
    console.log('🔍 Verificando na API Magazord...\n');
    
    let sucessosArquivo = 0;
    let falhasArquivo = 0;
    
    // Testar amostra (primeiros 5 produtos para não sobrecarregar)
    const amostra = produtos.slice(0, 5);
    
    for (const produto of amostra) {
      const sku = produto.sku;
      if (!sku) {
        console.log(`⚠️  Produto sem SKU: ${produto.nome || 'SEM NOME'}`);
        continue;
      }
      
      const resultado = await verificarSKUNaAPI(sku, sku);
      
      if (resultado.sucesso) {
        if (resultado.ativo) {
          console.log(`✅ ${sku} → ${resultado.codigoConvertido} (${resultado.nomeAPI})`);
          sucessosArquivo++;
          estatisticas.sucessos++;
        } else {
          console.log(`⚠️  ${sku} → INATIVO na API`);
          estatisticas.produtosInativos++;
        }
      } else {
        console.log(`❌ ${sku} → ${resultado.codigoConvertido} (${resultado.erro})`);
        falhasArquivo++;
        estatisticas.falhas++;
        estatisticas.skusProblematicos.push({
          arquivo,
          sku,
          codigoConvertido: resultado.codigoConvertido,
          nomeProduto: produto.nome
        });
      }
      
      // Delay para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    const taxaSucesso = (sucessosArquivo / amostra.length * 100).toFixed(1);
    console.log(`\n📊 Amostra: ${sucessosArquivo}/${amostra.length} sucessos (${taxaSucesso}%)`);
    
    if (falhasArquivo > 0) {
      estatisticas.arquivosComProblemas.push({
        arquivo,
        totalProdutos: produtos.length,
        falhasNaAmostra: falhasArquivo
      });
    }
  }
  
  // Relatório final
  console.log('\n\n');
  console.log('═'.repeat(80));
  console.log('📊 RELATÓRIO FINAL DA VARREDURA');
  console.log('═'.repeat(80));
  console.log('');
  console.log(`📁 Arquivos processados: ${estatisticas.totalArquivos}`);
  console.log(`📦 Total de produtos: ${estatisticas.totalProdutos}`);
  console.log(`✅ Produtos encontrados e ativos: ${estatisticas.sucessos}`);
  console.log(`⚠️  Produtos inativos: ${estatisticas.produtosInativos}`);
  console.log(`❌ Produtos não encontrados: ${estatisticas.falhas}`);
  
  if (estatisticas.sucessos > 0) {
    const taxaSucessoGeral = (estatisticas.sucessos / (estatisticas.sucessos + estatisticas.falhas) * 100).toFixed(1);
    console.log(`\n🎯 Taxa de sucesso: ${taxaSucessoGeral}%`);
  }
  
  if (estatisticas.arquivosComProblemas.length > 0) {
    console.log('\n⚠️  ARQUIVOS COM PROBLEMAS:');
    estatisticas.arquivosComProblemas.forEach(item => {
      console.log(`   - ${item.arquivo}: ${item.falhasNaAmostra} falhas (de ${item.totalProdutos} produtos)`);
    });
  }
  
  if (estatisticas.skusProblematicos.length > 0) {
    console.log('\n❌ SKUs PROBLEMÁTICOS:');
    estatisticas.skusProblematicos.slice(0, 10).forEach(item => {
      console.log(`   - ${item.sku} → ${item.codigoConvertido}`);
      console.log(`     Arquivo: ${item.arquivo}`);
      console.log(`     Produto: ${item.nomeProduto}`);
    });
    
    if (estatisticas.skusProblematicos.length > 10) {
      console.log(`   ... e mais ${estatisticas.skusProblematicos.length - 10} SKUs`);
    }
  }
  
  console.log('\n');
  console.log('═'.repeat(80));
  
  if (estatisticas.falhas === 0) {
    console.log('✅ TODOS OS PRODUTOS ESTÃO COMPATÍVEIS COM A API MAGAZORD!');
  } else if (estatisticas.falhas > estatisticas.sucessos) {
    console.log('❌ MUITOS PRODUTOS INCOMPATÍVEIS - REFATORAÇÃO NECESSÁRIA!');
    console.log('');
    console.log('💡 RECOMENDAÇÃO:');
    console.log('   Os SKUs do catálogo estão muito diferentes da API Magazord.');
    console.log('   Será necessário re-gerar o catálogo com dados da API.');
  } else {
    console.log('⚠️  ALGUNS PRODUTOS INCOMPATÍVEIS - VERIFICAR CASOS ESPECÍFICOS');
  }
  
  console.log('═'.repeat(80));
  
  return estatisticas;
}

varrerCatalogo().catch(console.error);
