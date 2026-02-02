/**
 * TESTE: Descobrir ID da loja e testar frete com 1 produto genérico
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const MAGAZORD_URL = process.env.MAGAZORD_URL || 'https://urlmagazord.com.br/api';
const MAGAZORD_USER = process.env.MAGAZORD_USER;
const MAGAZORD_PASSWORD = process.env.MAGAZORD_PASSWORD;

console.log('🔍 Descobrindo ID da loja...\n');

async function buscarIdLoja() {
  try {
    // Tentar endpoint de lojas
    const response = await axios.get(
      `${MAGAZORD_URL}/v2/site/loja`,
      {
        auth: {
          username: MAGAZORD_USER,
          password: MAGAZORD_PASSWORD
        }
      }
    );
    
    console.log('✅ Loja encontrada!');
    console.log('Dados:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.data && response.data.data.items) {
      const lojaId = response.data.data.items[0].id;
      console.log('\n🏪 ID da Loja:', lojaId);
      return { lojaId, produtoId: null };
    }
    
  } catch (erro) {
    console.error('❌ Erro ao buscar loja:', erro.message);
  }
  
  // Se não funcionar, tentar buscar um produto para pegar o ID da loja
  try {
    console.log('\n📦 Tentando buscar produtos para descobrir ID da loja...');
    
    const response = await axios.get(
      `${MAGAZORD_URL}/v2/site/produto`,
      {
        auth: {
          username: MAGAZORD_USER,
          password: MAGAZORD_PASSWORD
        },
        params: {
          limite: 1
        }
      }
    );
    
    console.log('Produto encontrado:', JSON.stringify(response.data.data[0], null, 2));
    
    if (response.data && response.data.data && response.data.data[0]) {
      const produto = response.data.data[0];
      const lojaId = produto.idLoja || produto.loja || 1;
      console.log('\n🏪 ID da Loja (do produto):', lojaId);
      return { lojaId, produtoId: produto.id };
    }
    
  } catch (erro) {
    console.error('❌ Erro ao buscar produtos:', erro.message);
  }
  
  // Fallback: usar ID 1
  console.log('\n⚠️ Usando ID padrão: 1');
  return { lojaId: 1, produtoId: null };
}

async function testarFreteComLoja() {
  const info = await buscarIdLoja();
  const lojaId = info.lojaId || info || 1;
  const produtoId = info.produtoId || 1;
  
  console.log('\n═══════════════════════════════════════════════');
  console.log('🧪 TESTANDO FRETE COM ID DA LOJA');
  console.log('═══════════════════════════════════════════════\n');
  
  const CEP = '58073493';
  
  // Buscar dados reais de um produto
  let produtoReal = null;
  
  if (produtoId) {
    try {
      console.log(`🔍 Buscando dados completos do produto ${produtoId}...`);
      const resp = await axios.get(
        `${MAGAZORD_URL}/v2/site/produto/${produtoId}`,
        {
          auth: {
            username: MAGAZORD_USER,
            password: MAGAZORD_PASSWORD
          }
        }
      );
      
      if (resp.data && resp.data.data) {
        produtoReal = resp.data.data;
        console.log('✅ Produto encontrado:', produtoReal.nome);
        console.log('   SKU:', produtoReal.sku);
        console.log('   Valor:', produtoReal.preco);
      }
    } catch (e) {
      console.log('⚠️ Não conseguiu buscar produto, usando dados genéricos');
    }
  }
  
  // Teste com produto real ou dados genéricos
  const payload = {
    cep: CEP,
    loja: lojaId,
    consideraRegraFrete: true,
    produtos: [
      {
        sku: produtoReal?.sku || 'TESTE-001',
        quantidade: 1,
        valor: produtoReal?.preco || 50.00,
        peso: produtoReal?.peso || 0.3,
        altura: produtoReal?.altura || 5,
        largura: produtoReal?.largura || 30,
        comprimento: produtoReal?.comprimento || 40
      }
    ]
  };
  
  console.log('📝 Payload:', JSON.stringify(payload, null, 2));
  console.log('');
  
  try {
    const response = await axios.post(
      `${MAGAZORD_URL}/v2/site/transporte/simulacao`,
      payload,
      {
        auth: {
          username: MAGAZORD_USER,
          password: MAGAZORD_PASSWORD
        },
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );
    
    console.log('✅ SUCESSO! Status:', response.status);
    console.log('📦 Opções de frete:\n');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.data) {
      console.log('\n📊 Resumo das opções:');
      response.data.data.forEach((opcao, i) => {
        console.log(`   ${i+1}. ${opcao.nome || opcao.tipo}`);
        console.log(`      💰 R$ ${opcao.valor}`);
        console.log(`      📅 ${opcao.prazo} dias`);
      });
    }
    
    return true;
    
  } catch (erro) {
    console.error('❌ ERRO:', erro.message);
    
    if (erro.response) {
      console.error('Status:', erro.response.status);
      console.error('Dados:', JSON.stringify(erro.response.data, null, 2));
    }
    
    return false;
  }
}

// Executar
testarFreteComLoja()
  .then(sucesso => {
    if (sucesso) {
      console.log('\n✅ Teste CONCLUÍDO com sucesso!');
    } else {
      console.log('\n❌ Teste FALHOU');
    }
    process.exit(0);
  })
  .catch(erro => {
    console.error('\n💥 Erro fatal:', erro);
    process.exit(1);
  });
