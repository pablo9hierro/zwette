// Testar remover sufixo do SKU do catálogo para encontrar produto pai

import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';

dotenv.config();

const API_URL = process.env.MAGAZORD_URL;
const TOKEN = process.env.MAGAZORD_USER;
const PASSWORD = process.env.MAGAZORD_PASSWORD;

const auth = {
  username: TOKEN,
  password: PASSWORD
};

// Função para converter SKU do catálogo para código da API
function converterSKUParaCodigoAPI(sku) {
  if (!sku) return sku;
  
  let codigoAPI = sku;
  
  // Padrão 1: Remove "Fa", "Ma", "Ua" no final (feminino/masculino/unissex + variante)
  // Exemplo: 378-ZI-013-000-FFa → 378-ZI-013-000-F
  codigoAPI = codigoAPI.replace(/([FMU])[FMU]?a$/, '$1');
  
  // Padrão 2: Remove dígitos finais após letra maiúscula
  // Exemplo: 372-SD-008-000-F5 → 372-SD-008-000-F
  codigoAPI = codigoAPI.replace(/([A-Z])(\d+)$/, '$1');
  
  return codigoAPI;
}

async function testarConversaoSKU() {
  console.log('=== TESTANDO CONVERSÃO DE SKU DO CATÁLOGO ===\n');
  
  const catalogoLocal = JSON.parse(fs.readFileSync('./catalogos/produtos/jaleco.json', 'utf8'));
  
  const produtosTeste = catalogoLocal.produtosOriginais.slice(0, 20);
  
  let sucessos = 0;
  let falhas = 0;
  
  for (const produtoLocal of produtosTeste) {
    const skuLocal = produtoLocal.sku;
    const nomeLocal = produtoLocal.nome;
    const codigoAPI = converterSKUParaCodigoAPI(skuLocal);
    
    console.log(`\nProduto: ${nomeLocal}`);
    console.log(`SKU Local: ${skuLocal} → Código API: ${codigoAPI}`);
    console.log('─'.repeat(70));
    
    try {
      const response = await axios.get(`${API_URL}/v2/site/produto/${codigoAPI}`, {
        auth
      });
      
      console.log(`✅ ENCONTRADO!`);
      console.log(`   Nome API: ${response.data.data.nome}`);
      console.log(`   Ativo: ${response.data.data.ativo}`);
      sucessos++;
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`❌ Não encontrado`);
        falhas++;
      } else {
        console.log(`❌ Erro: ${error.message}`);
        falhas++;
      }
    }
  }
  
  console.log('\n' + '═'.repeat(70));
  console.log(`RESULTADO: ${sucessos} sucessos | ${falhas} falhas`);
  console.log('═'.repeat(70));
  
  if (sucessos > 0) {
    console.log('✅ SOLUÇÃO ENCONTRADA!');
    console.log('');
    console.log('Para verificar disponibilidade:');
    console.log('1. Remover sufixo numérico do SKU (ex: F5 → F, M5 → M)');
    console.log('2. Buscar na API: GET /v2/site/produto/{codigo}');
    console.log('3. Verificar se produto.ativo === true');
    console.log('');
    console.log('Implementação: magazord-api.js precisa converter SKU antes de buscar');
  } else {
    console.log('❌ Conversão não funcionou');
    console.log('Catálogo está muito desatualizado ou usa padrão diferente');
  }
}

testarConversaoSKU().catch(console.error);
