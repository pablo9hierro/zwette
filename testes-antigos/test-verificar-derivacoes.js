// Verificar derivações específicas para entender o padrão de SKU

import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const API_URL = process.env.MAGAZORD_URL;
const TOKEN = process.env.MAGAZORD_USER;
const PASSWORD = process.env.MAGAZORD_PASSWORD;

const auth = {
  username: TOKEN,
  password: PASSWORD
};

async function verificarDerivacoes() {
  console.log('=== VERIFICANDO PADRÃO DE SKUs NAS DERIVAÇÕES ===\n');
  
  // Buscar o produto "Jaleco Feminino Clinic Preto"
  // que tem código 383-SD-012-000-F na API (ID 4739)
  const response = await axios.get(`${API_URL}/v2/site/produto/383-SD-012-000-F`, {
    auth
  });
  
  const produto = response.data.data;
  
  console.log(`Produto: ${produto.nome}`);
  console.log(`Código Pai: ${produto.codigo}`);
  console.log(`Ativo: ${produto.ativo}`);
  console.log(`\nDerivações (${produto.derivacoes.length}):\n`);
  
  produto.derivacoes.forEach(der => {
    console.log(`${der.codigo} - ${der.nome} - Ativo: ${der.ativo}`);
  });
  
  console.log('\n' + '═'.repeat(70));
  console.log('PADRÃO IDENTIFICADO');
  console.log('═'.repeat(70));
  console.log('Produto Pai: 383-SD-012-000-F');
  console.log('Derivações:  383-SD-012-000-F-XXX (onde XXX = tamanho)');
  console.log('');
  console.log('SKU do Catálogo Local: 383-SD-012-000-F5');
  console.log('');
  console.log('CONCLUSÃO:');
  console.log('- Removendo "-5" do SKU do catálogo → Temos o código do produto PAI');
  console.log('- Para verificar disponibilidade: buscar produto pai e ver se está ativo');
  console.log('- Estratégia: remover últimos 1-2 caracteres do SKU e buscar na API');
}

verificarDerivacoes().catch(console.error);
