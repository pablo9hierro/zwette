// Analisar os produtos que falharam

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

async function analisarFalhas() {
  console.log('=== ANALISANDO PRODUTOS QUE FALHARAM ===\n');
  
  const falhas = [
    { sku: '378-ZI-013-000-FFa', nome: 'Jaleco Feminino Chloe Cinza' },
    { sku: '700-SD-077-000-FFa', nome: 'Jaleco Feminino Tec Easy Clara Branco' }
  ];
  
  for (const falha of falhas) {
    console.log(`\n${falha.nome}`);
    console.log(`SKU: ${falha.sku}`);
    console.log('─'.repeat(70));
    
    // Padrão: termina em "FFa" (feminino + letra)
    // Testar variações possíveis:
    const variacoes = [
      falha.sku.replace(/Fa$/, ''),       // Remove "Fa" → 378-ZI-013-000-F
      falha.sku.replace(/FFa$/, 'F'),     // Remove "FFa" → 378-ZI-013-000-F
      falha.sku.replace(/a$/, ''),        // Remove "a" → 378-ZI-013-000-FF
      falha.sku.replace(/FFa$/, 'FF'),    // Mantém FF → 378-ZI-013-000-FF
    ];
    
    console.log('Testando variações:');
    
    for (const codigo of variacoes) {
      try {
        const response = await axios.get(`${API_URL}/v2/site/produto/${codigo}`, { auth });
        console.log(`✅ ENCONTRADO: ${codigo}`);
        console.log(`   Nome: ${response.data.data.nome}`);
        console.log(`   Ativo: ${response.data.data.ativo}`);
        break; // Encontrou, não precisa testar outras variações
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`❌ Não encontrado: ${codigo}`);
        }
      }
    }
    
    // Buscar por nome para ver se existe
    console.log('\nBuscando por nome na API:');
    const palavras = falha.nome.split(' ').slice(0, 3).join(' ');
    try {
      const response = await axios.get(`${API_URL}/v2/site/produto`, {
        auth,
        params: { nome: palavras, limit: 3 }
      });
      
      response.data.data.items.forEach(p => {
        console.log(`   ${p.codigo} - ${p.nome} (Ativo: ${p.ativo})`);
      });
    } catch (error) {
      console.log('   Erro ao buscar por nome');
    }
  }
  
  console.log('\n' + '═'.repeat(70));
  console.log('ANÁLISE DOS PADRÕES');
  console.log('═'.repeat(70));
}

analisarFalhas().catch(console.error);
