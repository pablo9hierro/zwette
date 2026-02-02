/**
 * TESTE FRETE FINAL - Com dados reais
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const MAGAZORD_URL = process.env.MAGAZORD_URL;
const MAGAZORD_USER = process.env.MAGAZORD_USER;
const MAGAZORD_PASSWORD = process.env.MAGAZORD_PASSWORD;

console.log('🧪 TESTE FRETE - SÓ COM CEP\n');

async function testarFrete() {
  const CEP = '58073493';
  
  // Payload com produto genérico (necessário pela API)
  const payload = {
    cep: CEP,
    loja: 1,
    consideraRegraFrete: true,
    produtos: [
      {
        sku: '002-SD-102-000-M',
        quantidade: 1,
        valor: 35.00,
        peso: 0.5,
        altura: 4,
        largura: 29,
        comprimento: 38
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
    
    console.log('✅ SUCESSO!', response.status);
    console.log('📦 Resposta:', JSON.stringify(response.data, null, 2));
    
  } catch (erro) {
    console.error('❌ ERRO:', erro.message);
    if (erro.response) {
      console.error('Status:', erro.response.status);
      console.error('Data:', JSON.stringify(erro.response.data, null, 2));
    }
  }
}

testarFrete();
