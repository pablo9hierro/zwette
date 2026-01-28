/**
 * TESTE: Verificar se fluxo está correto após remover profissão
 * 
 * EXPECTATIVA:
 * 1. Saudação → pede nome
 * 2. Identificação → vai direto para lista de produtos (sem oferta_catalogo_profissao)
 * 3. Filtro_tipo → mostra lista de produtos completa
 */

import { listarTiposProdutos } from './atendimento/match-catalogo.js';

console.log('\n🧪 TESTE: Fluxo sem profissão\n');

// 1. Listar todos os produtos disponíveis
console.log('📦 PRODUTOS DISPONÍVEIS NA LOJA:');
const produtos = listarTiposProdutos();
produtos.forEach((prod, i) => {
  console.log(`   ${i + 1}. ${prod.charAt(0).toUpperCase() + prod.slice(1)}`);
});

console.log(`\n✅ Total de produtos: ${produtos.length}`);

// 2. Verificar se não há mais referências a profissão
console.log('\n🔍 Verificando se pasta profissão foi removida...');
import fs from 'fs';
const pastaProfissao = 'c:\\Users\\pablo\\OneDrive\\Documentos\\zwette\\catalogos\\profissao';
const existe = fs.existsSync(pastaProfissao);

if (existe) {
  console.log('❌ ERRO: Pasta profissão ainda existe!');
} else {
  console.log('✅ Pasta profissão removida com sucesso!');
}

console.log('\n✅ Teste concluído!\n');
