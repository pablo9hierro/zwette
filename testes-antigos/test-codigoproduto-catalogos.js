// Teste para verificar se codigoProduto do JSON funciona na API

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

async function testarCodigoProduto() {
  console.log('=== TESTANDO codigoProduto DO CATÁLOGO LOCAL ===\n');
  
  // Ler o catálogo de jalecos
  const catalogoJaleco = JSON.parse(fs.readFileSync('./catalogos/produtos/jaleco.json', 'utf8'));
  
  // Pegar os primeiros produtos que têm codigoProduto
  const produtos = catalogoJaleco.produtosOriginais.slice(0, 5);
  
  console.log('Testando 5 primeiros produtos do catálogo:\n');
  
  for (const produto of produtos) {
    const codigoProduto = produto.codigoProduto;
    const sku = produto.sku;
    const nome = produto.nome;
    
    console.log(`Produto: ${nome}`);
    console.log(`codigoProduto: ${codigoProduto}`);
    console.log(`SKU: ${sku}`);
    console.log('─'.repeat(50));
    
    // Testar busca por codigoProduto como path param
    try {
      const response = await axios.get(`${API_URL}/v2/site/produto/${codigoProduto}`, {
        auth
      });
      
      console.log('✅ ENCONTRADO na API!');
      console.log(`Nome API: ${response.data.data.nome}`);
      console.log(`Código API: ${response.data.data.codigo}`);
      console.log(`Ativo: ${response.data.data.ativo}`);
      console.log(`Derivações: ${response.data.data.derivacoes?.length || 0}`);
      
      // Verificar se alguma derivação tem o SKU do catálogo
      const derivacaoComSKU = response.data.data.derivacoes?.find(d => d.codigo === sku);
      if (derivacaoComSKU) {
        console.log(`✅ Derivação com SKU "${sku}" encontrada!`);
        console.log(`   Ativo: ${derivacaoComSKU.ativo}`);
      } else {
        console.log(`⚠️ Nenhuma derivação com SKU "${sku}"`);
      }
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('❌ NÃO encontrado na API (404)');
      } else {
        console.log(`❌ Erro: ${error.message}`);
      }
    }
    
    console.log('');
  }
  
  console.log('\n' + '═'.repeat(50));
  console.log('CONCLUSÃO');
  console.log('═'.repeat(50));
}

testarCodigoProduto().catch(console.error);
