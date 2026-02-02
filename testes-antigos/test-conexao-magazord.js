import 'dotenv/config';
import axios from 'axios';

const MAGAZORD_CONFIG = {
    baseURL: process.env.MAGAZORD_URL,
    auth: {
        username: process.env.MAGAZORD_USER,
        password: process.env.MAGAZORD_PASSWORD
    },
    headers: {
        'Content-Type': 'application/json'
    }
};

console.log('🔐 TESTE DE CONEXÃO - API MAGAZORD');
console.log('='.repeat(60));
console.log('📍 URL:', MAGAZORD_CONFIG.baseURL);
console.log('👤 User:', MAGAZORD_CONFIG.auth.username?.substring(0, 20) + '...');
console.log('='.repeat(60));

async function testarConexao() {
    try {
        console.log('\n1️⃣ Testando endpoint /v2/site/categoria...');
        
        const respCat = await axios.get('/v2/site/categoria', {
            ...MAGAZORD_CONFIG,
            params: { limit: 5 }
        });
        
        console.log('✅ Categorias:', respCat.status);
        console.log('   Total:', respCat.data?.data?.items?.length || 0);
        
        console.log('\n2️⃣ Testando endpoint /v2/site/produto...');
        
        const respProd = await axios.get('/v2/site/produto', {
            ...MAGAZORD_CONFIG,
            params: {
                ativo: true,
                limit: 5
            }
        });
        
        console.log('✅ Produtos:', respProd.status);
        console.log('   Total:', respProd.data?.data?.items?.length || 0);
        
        if (respProd.data?.data?.items?.length > 0) {
            const produto = respProd.data.data.items[0];
            console.log('\n📦 Exemplo de produto:');
            console.log('   Nome:', produto.nome);
            console.log('   SKU:', produto.sku);
            console.log('   Ativo:', produto.ativo);
            console.log('   Estoque:', produto.estoque || produto.estoqueDisponivel || 'N/A');
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ CONEXÃO COM MAGAZORD: FUNCIONANDO!');
        console.log('='.repeat(60));
        
    } catch (erro) {
        console.error('\n❌ ERRO NA CONEXÃO:');
        console.error('   Status:', erro.response?.status);
        console.error('   Mensagem:', erro.message);
        console.error('   Dados:', erro.response?.data);
        console.log('\n' + '='.repeat(60));
        console.log('❌ CONEXÃO COM MAGAZORD: FALHOU!');
        console.log('='.repeat(60));
    }
}

testarConexao();
