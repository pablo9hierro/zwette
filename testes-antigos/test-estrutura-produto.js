import 'dotenv/config';
import axios from 'axios';

const MAGAZORD_CONFIG = {
    baseURL: process.env.MAGAZORD_URL,
    auth: {
        username: process.env.MAGAZORD_USER,
        password: process.env.MAGAZORD_PASSWORD
    }
};

console.log('🔍 TESTE - Verificando estrutura dos produtos na API');
console.log('='.repeat(70));

async function analisarEstruturaProdutos() {
    try {
        console.log('\n📡 Consultando 3 produtos da API...\n');
        
        const response = await axios.get('/v2/site/produto', {
            ...MAGAZORD_CONFIG,
            params: {
                limit: 3
            }
        });
        
        const produtos = response.data?.data?.items || [];
        
        produtos.forEach((produto, index) => {
            console.log(`\n${'='.repeat(70)}`);
            console.log(`PRODUTO ${index + 1}:`);
            console.log('='.repeat(70));
            console.log('Nome:', produto.nome);
            console.log('ID:', produto.id);
            console.log('Código:', produto.codigo);
            console.log('Ativo:', produto.ativo);
            
            if (produto.derivacoes && produto.derivacoes.length > 0) {
                console.log('\n📦 DERIVAÇÕES (variações):');
                produto.derivacoes.forEach((der, i) => {
                    console.log(`\n   Derivação ${i + 1}:`);
                    console.log('   - ID:', der.id);
                    console.log('   - Código:', der.codigo);
                    console.log('   - Nome:', der.nome);
                    if (der.sku) console.log('   - SKU:', der.sku);
                    if (der.ativo !== undefined) console.log('   - Ativo:', der.ativo);
                });
            }
            
            console.log('\n📋 CAMPOS DISPONÍVEIS:', Object.keys(produto).join(', '));
        });
        
    } catch (erro) {
        console.error('\n❌ ERRO:', erro.message);
    }
}

analisarEstruturaProdutos();
