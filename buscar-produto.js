import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const MAGAZORD_URL = process.env.MAGAZORD_URL;
const MAGAZORD_USER = process.env.MAGAZORD_USER;
const MAGAZORD_PASSWORD = process.env.MAGAZORD_PASSWORD;

// Buscar SKU (variação/derivação) diretamente
axios.get(`${MAGAZORD_URL}/v2/site/sku/3971`, {
  auth: { username: MAGAZORD_USER, password: MAGAZORD_PASSWORD }
}).then(r => {
  const sku = r.data.data;
  console.log('✅ SKU encontrado!');
  console.log('SKU:', sku.codigo);
  console.log('Nome:', sku.nome);
  console.log('Preço:', sku.preco);
  console.log('Peso:', sku.peso);
  console.log('Dimensões:', `${sku.altura}x${sku.largura}x${sku.comprimento}`);
  console.log('\nJSON:');
  console.log(JSON.stringify(sku, null, 2));
}).catch(e => {
  console.error('Erro:', e.message);
  if (e.response) console.error('Data:', JSON.stringify(e.response.data, null, 2));
});
