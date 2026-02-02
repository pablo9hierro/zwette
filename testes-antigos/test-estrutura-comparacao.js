// Comparar estrutura: produtos da API vs catálogo local

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

async function compararEstruturas() {
  console.log('=== PRODUTOS DA API MAGAZORD ===\n');
  
  // Buscar alguns produtos da API para ver a estrutura real
  const response = await axios.get(`${API_URL}/v2/site/produto`, {
    auth,
    params: {
      nome: 'jaleco',
      limit: 3
    }
  });
  
  console.log(`Encontrados ${response.data.data.items.length} produtos\n`);
  
  response.data.data.items.forEach((produto, idx) => {
    console.log(`${idx + 1}. ${produto.nome}`);
    console.log(`   ID: ${produto.id}`);
    console.log(`   Código: ${produto.codigo}`);
    console.log(`   Ativo: ${produto.ativo}`);
    console.log(`   Derivações: ${produto.derivacoes.length}`);
    
    // Mostrar 2 primeiras derivações
    produto.derivacoes.slice(0, 2).forEach(der => {
      console.log(`      - ${der.codigo} (${der.nome}) - Ativo: ${der.ativo}`);
    });
    console.log('');
  });
  
  console.log('\n=== PRODUTOS DO CATÁLOGO LOCAL ===\n');
  
  const catalogoLocal = JSON.parse(fs.readFileSync('./catalogos/produtos/jaleco.json', 'utf8'));
  
  catalogoLocal.produtosOriginais.slice(0, 3).forEach((produto, idx) => {
    console.log(`${idx + 1}. ${produto.nome}`);
    console.log(`   codigoProduto: ${produto.codigoProduto}`);
    console.log(`   SKU: ${produto.sku}`);
    console.log(`   Tamanhos: ${produto.tamanhos?.length || 0}`);
    console.log('');
  });
  
  console.log('\n' + '═'.repeat(60));
  console.log('ANÁLISE');
  console.log('═'.repeat(60));
  console.log('API Magazord:');
  console.log('- Produto Pai tem: id, codigo');
  console.log('- Derivações (variações de tamanho) têm: codigo próprio');
  console.log('');
  console.log('Catálogo Local:');
  console.log('- Tem: codigoProduto, sku');
  console.log('- Parece que codigoProduto = ID do produto (não código)');
  console.log('- SKU pode ser do produto pai ou de derivação');
  console.log('');
  console.log('HIPÓTESE:');
  console.log('- codigoProduto no JSON = produto.id da API (não produto.codigo)');
  console.log('- Precisa usar endpoint /v2/site/produto?id=XXX ou buscar por nome');
}

compararEstruturas().catch(console.error);
