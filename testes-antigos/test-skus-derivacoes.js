// Teste para verificar se SKUs locais correspondem às derivações

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

async function testarSKUsLocais() {
  console.log('=== TESTANDO SKUs DO CATÁLOGO LOCAL NA API ===\n');
  
  // SKUs do catálogo local
  const skusLocais = [
    '490-SD-089-000-F-PFa',  // Dolma/Avental
    '350-SD-008-000-MFa',    // Dolma/Avental
    '492-DT-083-090-UFa'     // Dolma/Avental
  ];
  
  for (const sku of skusLocais) {
    console.log(`\nTestando SKU: ${sku}`);
    console.log('─'.repeat(50));
    
    try {
      // Testar como produto pai (path param)
      const response = await axios.get(`${API_URL}/v2/site/produto/${sku}`, {
        auth
      });
      
      console.log('✅ Encontrado como PRODUTO PAI');
      console.log(`Nome: ${response.data.data.nome}`);
      console.log(`Código: ${response.data.data.codigo}`);
      console.log(`Ativo: ${response.data.data.ativo}`);
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('❌ NÃO encontrado como produto pai');
        
        // Buscar se existe como derivação
        console.log('Procurando nas derivações...');
        
        try {
          const response = await axios.get(`${API_URL}/v2/site/produto`, {
            auth,
            params: {
              codigo: sku,
              limit: 10
            }
          });
          
          if (response.data.data.items.length > 0) {
            const produto = response.data.data.items[0];
            const derivacao = produto.derivacoes?.find(d => d.codigo === sku);
            
            if (derivacao) {
              console.log('✅ Encontrado como DERIVAÇÃO');
              console.log(`Produto Pai: ${produto.nome}`);
              console.log(`Código Pai: ${produto.codigo}`);
              console.log(`Derivação: ${derivacao.codigo}`);
              console.log(`Ativo Derivação: ${derivacao.ativo}`);
            } else {
              console.log('⚠️ Encontrado mas código não é exato');
            }
          } else {
            console.log('❌ NÃO encontrado nem como derivação');
          }
        } catch (err) {
          console.log('❌ Erro ao buscar:', err.message);
        }
      }
    }
  }
  
  console.log('\n' + '═'.repeat(50));
  console.log('RESUMO DOS TESTES');
  console.log('═'.repeat(50));
  console.log('Se SKUs não são encontrados:');
  console.log('- Catálogo local está desatualizado');
  console.log('- Precisa sincronizar com códigos da API Magazord');
  console.log('\nOpções:');
  console.log('1. Atualizar catálogo com códigos reais da API');
  console.log('2. Buscar por nome do produto (menos preciso)');
  console.log('3. Não filtrar e mostrar todos produtos');
}

testarSKUsLocais().catch(console.error);
