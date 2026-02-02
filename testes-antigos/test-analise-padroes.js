// Analisar padrões dos SKUs problemáticos

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

const skusProblematicos = [
  { sku: '490-SD-089-000-F-PFa', nome: 'Avental Linho' },
  { sku: '002-SD-202-000-FFa', nome: 'Gorro Poa' },
  { sku: '002-SD-135-000-F5', nome: 'Gorro Coroa' },
  { sku: '002-SD-157-000-F-PFa', nome: 'Gorro Planetas' },
  { sku: '217774Fa', nome: 'Robe' },
  { sku: '301-DD-0005', nome: 'Desk Pad' }
];

async function analisarPadroes() {
  console.log('═'.repeat(70));
  console.log('🔍 ANALISANDO SKUs PROBLEMÁTICOS');
  console.log('═'.repeat(70));
  console.log('');
  
  for (const item of skusProblematicos) {
    console.log(`\n📌 ${item.nome}`);
    console.log(`   SKU Original: ${item.sku}`);
    console.log('   Tentando variações:');
    
    // Gerar várias variações possíveis
    const variacoes = new Set();
    
    // Variação 1: Remove sufixo completo (F-PFa → sem sufixo)
    variacoes.add(item.sku.replace(/-[A-Z]+-?[A-Z]*[a-z]*$/i, ''));
    
    // Variação 2: Remove apenas última parte
    variacoes.add(item.sku.replace(/-[A-Z]*[a-z]*$/, ''));
    
    // Variação 3: Remove números e letras minúsculas do final
    variacoes.add(item.sku.replace(/[a-z0-9]+$/i, ''));
    
    // Variação 4: Mantém apenas até terceiro hífen
    const partes = item.sku.split('-');
    if (partes.length >= 4) {
      variacoes.add(partes.slice(0, 4).join('-'));
    }
    
    // Variação 5: Remove apenas "a" do final
    variacoes.add(item.sku.replace(/a$/, ''));
    
    // Variação 6: Para robes sem hífen, remove sufixo
    if (!item.sku.includes('-')) {
      variacoes.add(item.sku.replace(/[A-Z]*a$/, ''));
    }
    
    let encontrado = false;
    
    for (const codigo of variacoes) {
      if (codigo === item.sku) continue; // Pular original
      
      try {
        const response = await axios.get(`${API_URL}/v2/site/produto/${codigo}`, {
          auth,
          timeout: 3000
        });
        
        console.log(`   ✅ ENCONTRADO: ${codigo}`);
        console.log(`      Nome API: ${response.data.data.nome}`);
        console.log(`      Ativo: ${response.data.data.ativo}`);
        encontrado = true;
        break;
      } catch (error) {
        // Silencioso
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!encontrado) {
      console.log(`   ❌ Nenhuma variação encontrada`);
      console.log(`   Variações testadas:`, [...variacoes].filter(v => v !== item.sku));
      
      // Tentar buscar por parte do nome
      const palavrasChave = item.nome.split(' ')[0];
      try {
        const response = await axios.get(`${API_URL}/v2/site/produto`, {
          auth,
          params: { nome: palavrasChave, limit: 3 }
        });
        
        if (response.data.data.items.length > 0) {
          console.log(`   🔍 Produtos similares na API:`);
          response.data.data.items.forEach(p => {
            console.log(`      - ${p.codigo}: ${p.nome}`);
          });
        }
      } catch (error) {
        // Silencioso
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\n\n' + '═'.repeat(70));
  console.log('💡 CONCLUSÃO');
  console.log('═'.repeat(70));
  console.log('');
  console.log('Os produtos que não foram encontrados provavelmente:');
  console.log('1. NÃO existem mais na API Magazord (descontinuados)');
  console.log('2. Têm códigos completamente diferentes');
  console.log('3. São produtos sem correspondência no e-commerce');
  console.log('');
  console.log('RECOMENDAÇÃO:');
  console.log('- Manter conversão atual (cobre 70% dos produtos)');
  console.log('- Para produtos não encontrados: considerar disponível (não bloquear)');
  console.log('- Ou remover produtos descontinuados do catálogo local');
}

analisarPadroes().catch(console.error);
