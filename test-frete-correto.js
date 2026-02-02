/**
 * TESTE: Endpoint CORRETO de cálculo de frete Magazord
 * Endpoint: POST /v2/site/transporte/simulacao
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const MAGAZORD_URL = process.env.MAGAZORD_URL || 'https://urlmagazord.com.br/api';
const MAGAZORD_USER = process.env.MAGAZORD_USER;
const MAGAZORD_PASSWORD = process.env.MAGAZORD_PASSWORD;

console.log('🧪 TESTANDO ENDPOINT CORRETO DE FRETE');
console.log('=' .repeat(60));
console.log('URL:', `${MAGAZORD_URL}/v2/site/transporte/simulacao`);
console.log('Método: POST');
console.log('=' .repeat(60));

async function testarFreteCorreto() {
  try {
    const CEP_TESTE = '58073493'; // João Pessoa - PB
    
    console.log('\n📦 Teste 1: Frete SEM produtos (apenas CEP)');
    console.log('CEP:', CEP_TESTE);
    
    const payload1 = {
      cep: CEP_TESTE,
      consideraRegraFrete: true,
      produtos: []
    };
    
    console.log('📝 Payload:', JSON.stringify(payload1, null, 2));
    
    const response1 = await axios.post(
      `${MAGAZORD_URL}/v2/site/transporte/simulacao`,
      payload1,
      {
        auth: {
          username: MAGAZORD_USER,
          password: MAGAZORD_PASSWORD
        },
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    console.log('✅ Status:', response1.status);
    console.log('📊 Resposta:', JSON.stringify(response1.data, null, 2));
    
    // Teste 2: Com produtos
    console.log('\n\n📦 Teste 2: Frete COM produtos');
    
    const payload2 = {
      cep: CEP_TESTE,
      consideraRegraFrete: true,
      produtos: [
        {
          sku: '3303',
          quantidade: 1
        }
      ]
    };
    
    console.log('📝 Payload:', JSON.stringify(payload2, null, 2));
    
    const response2 = await axios.post(
      `${MAGAZORD_URL}/v2/site/transporte/simulacao`,
      payload2,
      {
        auth: {
          username: MAGAZORD_USER,
          password: MAGAZORD_PASSWORD
        },
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    console.log('✅ Status:', response2.status);
    console.log('📊 Resposta:', JSON.stringify(response2.data, null, 2));
    
    console.log('\n\n✅ SUCESSO! Endpoint funciona corretamente!');
    console.log('=' .repeat(60));
    console.log('Endpoint correto: POST /v2/site/transporte/simulacao');
    console.log('=' .repeat(60));
    
  } catch (erro) {
    console.error('\n❌ ERRO:', erro.message);
    if (erro.response) {
      console.error('Status:', erro.response.status);
      console.error('Dados:', JSON.stringify(erro.response.data, null, 2));
    }
  }
}

testarFreteCorreto();
