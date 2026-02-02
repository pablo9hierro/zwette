// Extrair links dos produtos não encontrados na API

import fs from 'fs';
import path from 'path';

const skusProblematicos = [
  { sku: '490-SD-089-000-F-PFa', arquivo: 'dolma-avental.json' },
  { sku: '002-SD-202-000-FFa', arquivo: 'gorro.json' },
  { sku: '002-SD-135-000-F5', arquivo: 'gorro.json' },
  { sku: '002-SD-157-000-F-PFa', arquivo: 'gorro.json' },
  { sku: '002-SD-149-000-F-PFa', arquivo: 'gorro.json' },
  { sku: '002-SD-105-000-FFa', arquivo: 'gorro.json' },
  { sku: '301-BD-000Fa', arquivo: 'nao-texteis.json' },
  { sku: '801-OD-000Fa', arquivo: 'nao-texteis.json' },
  { sku: '901-CD-000Fa', arquivo: 'nao-texteis.json' },
  { sku: '217773-PFa', arquivo: 'robe.json' },
  { sku: '217772-PFa', arquivo: 'robe.json' }
];

console.log('═'.repeat(80));
console.log('🔗 LINKS DOS PRODUTOS NÃO ENCONTRADOS NA API MAGAZORD');
console.log('═'.repeat(80));
console.log('');

const catalogoDir = './catalogos/produtos';
const produtosEncontrados = [];

for (const item of skusProblematicos) {
  const caminhoArquivo = path.join(catalogoDir, item.arquivo);
  
  try {
    const conteudo = JSON.parse(fs.readFileSync(caminhoArquivo, 'utf8'));
    
    // Buscar produto pelo SKU
    let produtos = [];
    if (conteudo.produtosOriginais) {
      produtos = conteudo.produtosOriginais;
    } else if (conteudo.produtos) {
      produtos = conteudo.produtos;
    } else if (Array.isArray(conteudo)) {
      produtos = conteudo;
    }
    
    const produto = produtos.find(p => p.sku === item.sku);
    
    if (produto) {
      produtosEncontrados.push({
        ...item,
        nome: produto.nome || produto.nomeCompleto || 'SEM NOME',
        link: produto.link || produto.linkPrincipal || 'SEM LINK'
      });
    } else {
      console.log(`⚠️  SKU ${item.sku} não encontrado no arquivo ${item.arquivo}`);
    }
  } catch (error) {
    console.log(`❌ Erro ao ler ${item.arquivo}: ${error.message}`);
  }
}

console.log('\n');
console.log('📋 LISTA DE PRODUTOS PARA VERIFICAÇÃO MANUAL:');
console.log('─'.repeat(80));
console.log('');

// Agrupar por arquivo
const porArquivo = {};
produtosEncontrados.forEach(p => {
  if (!porArquivo[p.arquivo]) {
    porArquivo[p.arquivo] = [];
  }
  porArquivo[p.arquivo].push(p);
});

Object.keys(porArquivo).sort().forEach(arquivo => {
  console.log(`\n📁 ${arquivo.toUpperCase()}`);
  console.log('─'.repeat(80));
  
  porArquivo[arquivo].forEach((produto, idx) => {
    console.log(`\n${idx + 1}. ${produto.nome}`);
    console.log(`   SKU: ${produto.sku}`);
    console.log(`   🔗 ${produto.link}`);
  });
  
  console.log('');
});

console.log('\n' + '═'.repeat(80));
console.log('💡 INSTRUÇÕES:');
console.log('─'.repeat(80));
console.log('');
console.log('1. Abra cada link no navegador');
console.log('2. Verifique se o produto está disponível para compra');
console.log('3. Se estiver INDISPONÍVEL ou DESCONTINUADO:');
console.log('   → Remover do catálogo local (não adianta manter)');
console.log('4. Se estiver DISPONÍVEL:');
console.log('   → Produto existe mas SKU está diferente na API');
console.log('   → Considerar re-gerar catálogo com dados atualizados da API');
console.log('');
console.log('═'.repeat(80));

// Gerar arquivo de texto para fácil compartilhamento
const output = [];
output.push('PRODUTOS NÃO ENCONTRADOS NA API MAGAZORD');
output.push('');
output.push('Para verificação manual:');
output.push('');

Object.keys(porArquivo).sort().forEach(arquivo => {
  output.push('');
  output.push(`=== ${arquivo.toUpperCase()} ===`);
  output.push('');
  
  porArquivo[arquivo].forEach((produto, idx) => {
    output.push(`${idx + 1}. ${produto.nome}`);
    output.push(`   SKU: ${produto.sku}`);
    output.push(`   Link: ${produto.link}`);
    output.push('');
  });
});

fs.writeFileSync('produtos-nao-encontrados-links.txt', output.join('\n'));
console.log('');
console.log('✅ Lista salva em: produtos-nao-encontrados-links.txt');
console.log('');
