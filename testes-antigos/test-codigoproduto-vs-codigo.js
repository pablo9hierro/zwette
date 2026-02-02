// Teste para entender diferença entre codigoProduto (path param) vs codigo (query param)

import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const API_URL = process.env.MAGAZORD_URL;
const TOKEN = process.env.MAGAZORD_USER;
const PASSWORD = process.env.MAGAZORD_PASSWORD;

const auth = {
  username: TOKEN,
  password: PASSWORD
};

async function testarEndpoints() {
  console.log('=== TESTE 1: Buscar produto por nome para pegar código real ===\n');
  
  try {
    // Buscar um produto qualquer para pegar um código real da API
    const response1 = await axios.get(`${API_URL}/v2/site/produto`, {
      auth,
      params: {
        nome: 'jaleco',
        limit: 1
      }
    });
    
    const produto = response1.data.data.items[0];
    console.log('Produto encontrado:');
    
    if (!produto) {
      console.log('❌ Nenhum produto encontrado');
      return;
    }
    
    console.log('- Nome:', produto.nome);
    console.log('- Código:', produto.codigo);
    console.log('- Ativo:', produto.ativo);
    
    const codigoReal = produto.codigo;
    
    console.log('\n=== TESTE 2: Buscar usando query param "codigo" ===\n');
    
    // Tentar buscar usando query param codigo
    const response2 = await axios.get(`${API_URL}/v2/site/produto`, {
      auth,
      params: {
        codigo: codigoReal,
        limit: 10
      }
    });
    
    console.log(`Resultados com codigo="${codigoReal}":`, response2.data.data.items?.length || 0);
    if (response2.data.data.items?.length > 0) {
      console.log('- Código retornado:', response2.data.data.items[0].codigo);
      console.log('- Ativo:', response2.data.data.items[0].ativo);
    }
    
    console.log('\n=== TESTE 3: Buscar usando path param {codigoProduto} ===\n');
    
    // Tentar buscar usando path param codigoProduto
    const response3 = await axios.get(`${API_URL}/v2/site/produto/${codigoReal}`, {
      auth
    });
    
    console.log('Produto encontrado via path param:');
    console.log('- Nome:', response3.data.data.nome);
    console.log('- Código:', response3.data.data.codigo);
    console.log('- Ativo:', response3.data.data.ativo);
    
    console.log('\n=== TESTE 4: Testar com SKU do catálogo local ===\n');
    
    const skuLocal = '371-SD-010-000-MFa'; // SKU do catálogo local
    
    try {
      const response4 = await axios.get(`${API_URL}/v2/site/produto/${skuLocal}`, {
        auth
      });
      console.log(`✅ SKU local "${skuLocal}" encontrado na API!`);
      console.log('- Nome:', response4.data.data.nome);
      console.log('- Ativo:', response4.data.data.ativo);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`❌ SKU local "${skuLocal}" NÃO encontrado na API (404)`);
      } else {
        console.log(`❌ Erro ao buscar SKU: ${error.message}`);
      }
    }
    
    console.log('\n=== CONCLUSÃO ===');
    console.log('1. Query param "codigo": Busca produtos que contenham o código');
    console.log('2. Path param "{codigoProduto}": Busca exatamente por aquele SKU/código');
    console.log('3. Path param é mais preciso para verificar produto específico');
    
  } catch (error) {
    console.error('Erro:', error.response?.data || error.message);
  }
}

testarEndpoints();
