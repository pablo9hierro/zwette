// Buscar por nome do produto para ver se o catálogo está atualizado

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

async function buscarPorNome() {
  console.log('=== BUSCANDO PRODUTOS DO CATÁLOGO POR NOME NA API ===\n');
  
  const catalogoLocal = JSON.parse(fs.readFileSync('./catalogos/produtos/jaleco.json', 'utf8'));
  
  const produtosTeste = [
    catalogoLocal.produtosOriginais[0], // Marta Branco
    catalogoLocal.produtosOriginais[3]  // Clinic Preto
  ];
  
  for (const produtoLocal of produtosTeste) {
    const nomeLocal = produtoLocal.nome;
    const skuLocal = produtoLocal.sku;
    const idLocal = produtoLocal.codigoProduto;
    
    console.log(`\nProduto Local: ${nomeLocal}`);
    console.log(`ID Local: ${idLocal} | SKU: ${skuLocal}`);
    console.log('─'.repeat(70));
    
    try {
      // Buscar por palavras-chave do nome
      const palavras = nomeLocal.split(' ').slice(0, 3).join(' '); // Pegar primeiras 3 palavras
      
      const response = await axios.get(`${API_URL}/v2/site/produto`, {
        auth,
        params: {
          nome: palavras,
          limit: 5
        }
      });
      
      const items = response.data.data.items;
      
      if (items.length === 0) {
        console.log(`❌ Nenhum produto encontrado com nome "${palavras}"`);
        continue;
      }
      
      console.log(`Encontrados ${items.length} produtos com nome similar:\n`);
      
      items.forEach((produtoAPI, idx) => {
        console.log(`${idx + 1}. ${produtoAPI.nome}`);
        console.log(`   ID: ${produtoAPI.id}`);
        console.log(`   Código: ${produtoAPI.codigo}`);
        console.log(`   Ativo: ${produtoAPI.ativo}`);
        
        // Verificar se algum campo bate com o produto local
        if (produtoAPI.id == idLocal) {
          console.log(`   ✅ ID BATE com codigoProduto do JSON!`);
        }
        if (produtoAPI.codigo === skuLocal) {
          console.log(`   ✅ CÓDIGO BATE com SKU do JSON!`);
        }
        
        // Verificar derivações
        if (produtoAPI.derivacoes) {
          const derivacaoMatch = produtoAPI.derivacoes.find(d => d.codigo === skuLocal);
          if (derivacaoMatch) {
            console.log(`   ✅ SKU encontrado como DERIVAÇÃO!`);
            console.log(`      Derivação: ${derivacaoMatch.nome}`);
            console.log(`      Ativo: ${derivacaoMatch.ativo}`);
          }
        }
        console.log('');
      });
      
    } catch (error) {
      console.log(`❌ Erro: ${error.message}`);
    }
  }
  
  console.log('\n' + '═'.repeat(70));
  console.log('CONCLUSÃO');
  console.log('═'.repeat(70));
  console.log('Se nenhum ID ou SKU bateu:');
  console.log('➡️ O catálogo local está COMPLETAMENTE DESATUALIZADO');
  console.log('➡️ SKUs e IDs do JSON não correspondem à API atual');
  console.log('');
  console.log('Soluções:');
  console.log('1. Re-gerar catálogo usando dados da API Magazord');
  console.log('2. Buscar produtos apenas por NOME (sem validação de SKU)');
  console.log('3. Não fazer validação de disponibilidade');
}

buscarPorNome().catch(console.error);
