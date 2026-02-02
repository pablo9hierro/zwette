/**
 * TESTE: Descobrir endpoint correto para cálculo de frete
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const MAGAZORD_URL = process.env.MAGAZORD_URL || 'https://urlmagazord.com.br/api';
const MAGAZORD_USER = process.env.MAGAZORD_USER;
const MAGAZORD_PASSWORD = process.env.MAGAZORD_PASSWORD;
const CEP_TESTE = '58073493';

console.log('🧪 TESTANDO ENDPOINTS DE FRETE MAGAZORD');
console.log('=' .repeat(60));
console.log('CEP:', CEP_TESTE);
console.log('URL Base:', MAGAZORD_URL);
console.log('=' .repeat(60));

// Lista de possíveis endpoints para testar
const endpoints = [
  // Tentativa 1: POST v2/site/frete
  {
    metodo: 'POST',
    url: `${MAGAZORD_URL}/v2/site/frete`,
    body: { cep: CEP_TESTE, produtos: [] }
  },
  // Tentativa 2: GET v2/site/frete com query params
  {
    metodo: 'GET',
    url: `${MAGAZORD_URL}/v2/site/frete?cep=${CEP_TESTE}`,
    body: null
  },
  // Tentativa 3: POST v1/frete
  {
    metodo: 'POST',
    url: `${MAGAZORD_URL}/v1/frete`,
    body: { cep: CEP_TESTE }
  },
  // Tentativa 4: GET v1/frete
  {
    metodo: 'GET',
    url: `${MAGAZORD_URL}/v1/frete?cep=${CEP_TESTE}`,
    body: null
  },
  // Tentativa 5: POST frete/calcular
  {
    metodo: 'POST',
    url: `${MAGAZORD_URL}/frete/calcular`,
    body: { cep: CEP_TESTE }
  },
  // Tentativa 6: GET frete/calcular
  {
    metodo: 'GET',
    url: `${MAGAZORD_URL}/frete/calcular?cep=${CEP_TESTE}`,
    body: null
  },
  // Tentativa 7: POST v2/frete/calcular
  {
    metodo: 'POST',
    url: `${MAGAZORD_URL}/v2/frete/calcular`,
    body: { cep: CEP_TESTE, produtos: [] }
  },
  // Tentativa 8: GET v2/frete
  {
    metodo: 'GET',
    url: `${MAGAZORD_URL}/v2/frete/${CEP_TESTE}`,
    body: null
  },
  // Tentativa 9: POST cep (verificar CEP apenas)
  {
    metodo: 'GET',
    url: `${MAGAZORD_URL}/v2/cep/${CEP_TESTE}`,
    body: null
  }
];

async function testarEndpoint(config) {
  try {
    console.log(`\n🔍 Testando: ${config.metodo} ${config.url}`);
    
    const requestConfig = {
      method: config.metodo,
      url: config.url,
      auth: {
        username: MAGAZORD_USER,
        password: MAGAZORD_PASSWORD
      },
      timeout: 10000,
      validateStatus: () => true // Aceitar qualquer status para ver a resposta
    };

    if (config.body) {
      requestConfig.data = config.body;
      console.log('   Body:', JSON.stringify(config.body));
    }

    const response = await axios(requestConfig);
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 200 || response.status === 201) {
      console.log('   ✅ SUCESSO!');
      console.log('   Resposta:', JSON.stringify(response.data, null, 2));
      return { success: true, config, response: response.data };
    } else if (response.status === 404) {
      console.log('   ❌ Endpoint não encontrado (404)');
    } else if (response.status === 405) {
      console.log('   ❌ Método não permitido (405)');
    } else if (response.status === 401 || response.status === 403) {
      console.log('   ❌ Sem autorização');
    } else {
      console.log('   ⚠️ Status inesperado');
      console.log('   Resposta:', JSON.stringify(response.data, null, 2));
    }
    
    return { success: false, config, status: response.status };
    
  } catch (erro) {
    console.log(`   ❌ Erro: ${erro.message}`);
    return { success: false, config, error: erro.message };
  }
}

async function executarTestes() {
  console.log('\n🚀 Iniciando testes...\n');
  
  const resultados = [];
  
  for (const endpoint of endpoints) {
    const resultado = await testarEndpoint(endpoint);
    resultados.push(resultado);
    
    // Se encontrou sucesso, parar
    if (resultado.success) {
      console.log('\n' + '='.repeat(60));
      console.log('🎉 ENDPOINT CORRETO ENCONTRADO!');
      console.log('='.repeat(60));
      console.log('Método:', resultado.config.metodo);
      console.log('URL:', resultado.config.url);
      if (resultado.config.body) {
        console.log('Body:', JSON.stringify(resultado.config.body, null, 2));
      }
      console.log('\nResposta completa:');
      console.log(JSON.stringify(resultado.response, null, 2));
      console.log('='.repeat(60));
      return;
    }
    
    // Delay entre tentativas
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('❌ NENHUM ENDPOINT FUNCIONOU');
  console.log('='.repeat(60));
  console.log('\nResumo dos testes:');
  resultados.forEach((r, i) => {
    console.log(`${i + 1}. ${r.config.metodo} ${r.config.url}`);
    console.log(`   Status: ${r.status || 'erro'} - ${r.error || 'falhou'}`);
  });
}

// Executar testes
executarTestes().catch(console.error);
