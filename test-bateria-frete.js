/**
 * ================================================================
 * BATERIA DE TESTES: Cálculo de Frete
 * Garante que o cálculo de frete está funcionando corretamente
 * ================================================================
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const MAGAZORD_URL = process.env.MAGAZORD_URL;
const MAGAZORD_USER = process.env.MAGAZORD_USER;
const MAGAZORD_PASSWORD = process.env.MAGAZORD_PASSWORD;

console.log('\n╔═══════════════════════════════════════════════════╗');
console.log('║      🧪 BATERIA DE TESTES: CÁLCULO DE FRETE       ║');
console.log('╚═══════════════════════════════════════════════════╝\n');

let testesPassados = 0;
let testesFalhados = 0;
const erros = [];

// ═══════════════════════════════════════════════════════════
// TESTE 1: Validar configurações
// ═══════════════════════════════════════════════════════════
async function teste1_ValidarConfiguracoes() {
  console.log('🧪 TESTE 1: Validar Configurações\n');
  
  try {
    if (!MAGAZORD_URL) {
      throw new Error('MAGAZORD_URL não configurado no .env');
    }
    if (!MAGAZORD_USER) {
      throw new Error('MAGAZORD_USER não configurado no .env');
    }
    if (!MAGAZORD_PASSWORD) {
      throw new Error('MAGAZORD_PASSWORD não configurado no .env');
    }
    
    console.log('✅ Configurações OK');
    console.log(`   URL: ${MAGAZORD_URL}`);
    console.log(`   User: ${MAGAZORD_USER}`);
    console.log(`   Password: ${MAGAZORD_PASSWORD ? '***' : 'NÃO CONFIGURADO'}\n`);
    
    testesPassados++;
    return true;
  } catch (erro) {
    console.log(`❌ FALHOU: ${erro.message}\n`);
    erros.push({ teste: 'Configurações', erro: erro.message });
    testesFalhados++;
    return false;
  }
}

// ═══════════════════════════════════════════════════════════
// TESTE 2: Testar API de Frete DIRETAMENTE
// ═══════════════════════════════════════════════════════════
async function teste2_TestarAPIFreteMinimal() {
  console.log('🧪 TESTE 2: Testar API de Frete (Payload Mínimo)\n');
  
  try {
    const payload = {
      cep: "58073493",
      loja: 1,
      produtos: [{
        sku: "070-SD-002-002-M5",
        quantidade: 1,
        valor: 80
      }]
    };
    
    console.log('📦 Payload enviado:');
    console.log(JSON.stringify(payload, null, 2));
    
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
        timeout: 10000
      }
    );
    
    console.log('\n✅ API respondeu com sucesso!');
    console.log(`   Status: ${response.status}`);
    console.log(`   Resposta:`, JSON.stringify(response.data, null, 2));
    
    testesPassados++;
    return response.data;
  } catch (erro) {
    console.log(`\n❌ FALHOU: ${erro.message}`);
    if (erro.response) {
      console.log(`   Status: ${erro.response.status}`);
      console.log(`   Dados:`, JSON.stringify(erro.response.data, null, 2));
    }
    erros.push({ 
      teste: 'API Frete Minimal', 
      erro: erro.message,
      status: erro.response?.status,
      dados: erro.response?.data
    });
    testesFalhados++;
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// TESTE 3: Testar com consideraRegraFrete
// ═══════════════════════════════════════════════════════════
async function teste3_TestarComRegraFrete() {
  console.log('\n🧪 TESTE 3: Testar com consideraRegraFrete\n');
  
  try {
    const payload = {
      cep: "58073493",
      loja: 1,
      consideraRegraFrete: true,
      produtos: [{
        sku: "070-SD-002-002-M5",
        quantidade: 1,
        valor: 80
      }]
    };
    
    console.log('📦 Payload enviado:');
    console.log(JSON.stringify(payload, null, 2));
    
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
        timeout: 10000
      }
    );
    
    console.log('\n✅ API respondeu com sucesso!');
    console.log(`   Cidade: ${response.data?.data?.cidade || 'N/A'}`);
    
    if (response.data?.data?.entrega && response.data.data.entrega[0]) {
      const agencias = response.data.data.entrega[0].agencias || [];
      console.log(`   Agências: ${agencias.length}`);
      
      agencias.forEach((agencia, i) => {
        console.log(`\n   Agência ${i + 1}:`);
        if (agencia.servico) {
          agencia.servico.forEach((servico, j) => {
            console.log(`      ${j + 1}. ${servico.nome || 'N/A'}`);
            console.log(`         💰 R$ ${servico.valor || 0}`);
            console.log(`         📅 ${servico.prazoFinal || 0} dias úteis`);
          });
        }
      });
    }
    
    testesPassados++;
    return response.data;
  } catch (erro) {
    console.log(`\n❌ FALHOU: ${erro.message}`);
    if (erro.response) {
      console.log(`   Status: ${erro.response.status}`);
      console.log(`   Dados:`, JSON.stringify(erro.response.data, null, 2));
    }
    erros.push({ 
      teste: 'API com RegraFrete', 
      erro: erro.message,
      status: erro.response?.status,
      dados: erro.response?.data
    });
    testesFalhados++;
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// TESTE 4: Testar com SKU sem sufixo de tamanho
// ═══════════════════════════════════════════════════════════
async function teste4_TestarSKUSemSufixo() {
  console.log('\n🧪 TESTE 4: Testar SKU sem sufixo de tamanho\n');
  
  try {
    const payload = {
      cep: "58073493",
      loja: 1,
      consideraRegraFrete: true,
      produtos: [{
        sku: "070-SD-002-002-M",  // SEM O "5" NO FINAL
        quantidade: 1,
        valor: 80
      }]
    };
    
    console.log('📦 Payload enviado:');
    console.log(JSON.stringify(payload, null, 2));
    
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
        timeout: 10000
      }
    );
    
    console.log('\n✅ API respondeu com sucesso!');
    console.log(`   Resposta:`, JSON.stringify(response.data, null, 2));
    
    testesPassados++;
    return response.data;
  } catch (erro) {
    console.log(`\n❌ FALHOU: ${erro.message}`);
    if (erro.response) {
      console.log(`   Status: ${erro.response.status}`);
      console.log(`   Dados:`, JSON.stringify(erro.response.data, null, 2));
    }
    erros.push({ 
      teste: 'SKU sem sufixo', 
      erro: erro.message,
      status: erro.response?.status,
      dados: erro.response?.data
    });
    testesFalhados++;
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// TESTE 5: Testar diferentes CEPs
// ═══════════════════════════════════════════════════════════
async function teste5_TestarDiferentesCEPs() {
  console.log('\n🧪 TESTE 5: Testar diferentes CEPs\n');
  
  const ceps = [
    "58073493", // João Pessoa - PB
    "01310100", // São Paulo - SP
    "20040020"  // Rio de Janeiro - RJ
  ];
  
  let sucessos = 0;
  
  for (const cep of ceps) {
    try {
      console.log(`   Testando CEP: ${cep}`);
      
      const payload = {
        cep,
        loja: 1,
        consideraRegraFrete: true,
        produtos: [{
          sku: "070-SD-002-002-M5",
          quantidade: 1,
          valor: 80
        }]
      };
      
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
          timeout: 10000
        }
      );
      
      console.log(`   ✅ ${cep}: ${response.data?.data?.cidade || 'OK'}`);
      sucessos++;
      
    } catch (erro) {
      console.log(`   ❌ ${cep}: ${erro.message}`);
    }
  }
  
  if (sucessos === ceps.length) {
    console.log(`\n✅ Todos os ${ceps.length} CEPs funcionaram!`);
    testesPassados++;
  } else {
    console.log(`\n⚠️ Apenas ${sucessos}/${ceps.length} CEPs funcionaram`);
    erros.push({ teste: 'Diferentes CEPs', erro: `Só ${sucessos}/${ceps.length} funcionaram` });
    testesFalhados++;
  }
}

// ═══════════════════════════════════════════════════════════
// EXECUTAR TODOS OS TESTES
// ═══════════════════════════════════════════════════════════
async function executarTodos() {
  console.log('🚀 Iniciando bateria de testes...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const config = await teste1_ValidarConfiguracoes();
  if (!config) {
    console.log('\n⛔ Não é possível continuar sem configurações válidas!\n');
    return;
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  await teste2_TestarAPIFreteMinimal();
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  await teste3_TestarComRegraFrete();
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  await teste4_TestarSKUSemSufixo();
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  await teste5_TestarDiferentesCEPs();
  
  // ═══════════════════════════════════════════════════════════
  // RESULTADO FINAL
  // ═══════════════════════════════════════════════════════════
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║              📊 RESULTADO FINAL                    ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');
  
  console.log(`✅ Testes Passados: ${testesPassados}`);
  console.log(`❌ Testes Falhados: ${testesFalhados}`);
  
  const total = testesPassados + testesFalhados;
  const taxa = ((testesPassados / total) * 100).toFixed(1);
  console.log(`📊 Taxa de Sucesso: ${taxa}%\n`);
  
  if (testesFalhados > 0) {
    console.log('❌ ERROS ENCONTRADOS:\n');
    erros.forEach((erro, i) => {
      console.log(`${i + 1}. ${erro.teste}`);
      console.log(`   Erro: ${erro.erro}`);
      if (erro.status) {
        console.log(`   Status: ${erro.status}`);
      }
      if (erro.dados) {
        console.log(`   Dados:`, JSON.stringify(erro.dados, null, 2));
      }
      console.log('');
    });
    
    console.log('\n⚠️ CORRIJA OS ERROS ACIMA PARA GARANTIR O FUNCIONAMENTO!\n');
  } else {
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ O cálculo de frete está funcionando corretamente!\n');
  }
}

// Executar
executarTodos().catch(erro => {
  console.error('\n💥 ERRO FATAL:', erro.message);
  console.error(erro.stack);
});
