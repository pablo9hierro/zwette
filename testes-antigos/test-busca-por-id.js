// Testar busca por ID do produto (codigoProduto do JSON)

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

async function testarBuscaPorID() {
  console.log('=== TESTANDO BUSCA POR ID (codigoProduto do JSON) ===\n');
  
  const catalogoLocal = JSON.parse(fs.readFileSync('./catalogos/produtos/jaleco.json', 'utf8'));
  
  const produtosTeste = catalogoLocal.produtosOriginais.slice(0, 5);
  
  for (const produtoLocal of produtosTeste) {
    const id = produtoLocal.codigoProduto;
    const nomeLocal = produtoLocal.nome;
    const skuLocal = produtoLocal.sku;
    
    console.log(`\nProduto Local: ${nomeLocal}`);
    console.log(`ID: ${id} | SKU: ${skuLocal}`);
    console.log('─'.repeat(60));
    
    try {
      // Tentar buscar por ID como path param
      const response = await axios.get(`${API_URL}/v2/site/produto/${id}`, {
        auth
      });
      
      console.log('✅ ENCONTRADO na API por ID!');
      console.log(`Nome API: ${response.data.data.nome}`);
      console.log(`Código API: ${response.data.data.codigo}`);
      console.log(`Ativo: ${response.data.data.ativo}`);
      console.log(`Derivações: ${response.data.data.derivacoes?.length || 0}`);
      
      // Verificar se SKU do catálogo está nas derivações
      if (response.data.data.derivacoes) {
        const derivacaoMatch = response.data.data.derivacoes.find(d => d.codigo === skuLocal);
        if (derivacaoMatch) {
          console.log(`✅ SKU "${skuLocal}" encontrado nas derivações!`);
          console.log(`   Ativo Derivação: ${derivacaoMatch.ativo}`);
        } else {
          console.log(`⚠️ SKU "${skuLocal}" NÃO encontrado nas derivações`);
          console.log(`   Códigos das derivações:`);
          response.data.data.derivacoes.slice(0, 3).forEach(d => {
            console.log(`   - ${d.codigo}`);
          });
        }
      }
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`❌ ID "${id}" não encontrado na API`);
      } else {
        console.log(`❌ Erro: ${error.message}`);
      }
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('CONCLUSÃO');
  console.log('═'.repeat(60));
}

testarBuscaPorID().catch(console.error);
