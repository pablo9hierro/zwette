/**
 * TESTE: Buscar dados completos de um SKU no Magazord
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const MAGAZORD_URL = process.env.MAGAZORD_URL;
const MAGAZORD_USER = process.env.MAGAZORD_USER;
const MAGAZORD_PASSWORD = process.env.MAGAZORD_PASSWORD;

const SKU_TESTE = '372-SD-008-000-F5'; // Jaleco Feminino Marta Branco

console.log('🔍 Buscando dados do SKU:', SKU_TESTE);
console.log('');

async function buscarSKU() {
  try {
    // Tentar buscar por SKU
    const response = await axios.get(
      `${MAGAZORD_URL}/v2/site/produto`,
      {
        auth: {
          username: MAGAZORD_USER,
          password: MAGAZORD_PASSWORD
        },
        params: {
          sku: SKU_TESTE
        }
      }
    );
    
    console.log('✅ Resposta:', JSON.stringify(response.data, null, 2));
    
  } catch (erro) {
    console.error('❌ Erro:', erro.message);
    if (erro.response) {
      console.error('Status:', erro.response.status);
      console.error('Data:', JSON.stringify(erro.response.data, null, 2));
    }
  }
}

buscarSKU();
