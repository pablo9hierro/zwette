import 'dotenv/config';
import axios from 'axios';

const MAGAZORD_CONFIG = {
    baseURL: process.env.MAGAZORD_URL,
    auth: {
        username: process.env.MAGAZORD_USER,
        password: process.env.MAGAZORD_PASSWORD
    }
};

console.log('🔍 BUSCANDO PRODUTOS COM ESTOQUE NO MAGAZORD');
console.log('='.repeat(70));

async function buscarProdutosComEstoque() {
    try {
        console.log('\n📡 Consultando produtos ativos na API...\n');
        
        const response = await axios.get('/v2/site/produto', {
            ...MAGAZORD_CONFIG,
            params: {
                ativo: true,
                limit: 20
            }
        });
        
        const produtos = response.data?.data?.items || [];
        
        console.log(`✅ Encontrados ${produtos.length} produtos ativos\n`);
        console.log('='.repeat(70));
        
        let comEstoque = 0;
        let semEstoque = 0;
        
        produtos.forEach((produto, index) => {
            const estoque = produto.estoque || produto.estoqueDisponivel || 0;
            const temEstoque = estoque > 0;
            
            if (temEstoque) comEstoque++;
            else semEstoque++;
            
            const status = temEstoque ? '✅ COM ESTOQUE' : '❌ SEM ESTOQUE';
            
            console.log(`\n${index + 1}. ${produto.nome}`);
            console.log(`   SKU/Código: ${produto.sku || produto.codigo || 'N/A'}`);
            console.log(`   Estoque: ${estoque}`);
            console.log(`   Status: ${status}`);
            
            if (produto.derivacoes && produto.derivacoes.length > 0) {
                console.log(`   Variações: ${produto.derivacoes.length}`);
                produto.derivacoes.slice(0, 2).forEach((der, i) => {
                    const estDer = der.estoque || der.estoqueDisponivel || 0;
                    console.log(`      ${i + 1}. SKU: ${der.sku} - Estoque: ${estDer}`);
                });
            }
        });
        
        console.log('\n' + '='.repeat(70));
        console.log('📊 RESUMO:');
        console.log('='.repeat(70));
        console.log(`   Total de produtos: ${produtos.length}`);
        console.log(`   ✅ Com estoque: ${comEstoque}`);
        console.log(`   ❌ Sem estoque: ${semEstoque}`);
        console.log('='.repeat(70));
        
        if (comEstoque > 0) {
            console.log('\n💡 Use um dos SKUs com estoque para testar o sistema!');
        } else {
            console.log('\n⚠️  Nenhum produto tem estoque disponível no momento.');
        }
        
    } catch (erro) {
        console.error('\n❌ ERRO:', erro.message);
        if (erro.response?.data) {
            console.error('Detalhes:', erro.response.data);
        }
    }
}

buscarProdutosComEstoque();
