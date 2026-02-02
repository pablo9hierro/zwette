import 'dotenv/config';
import axios from 'axios';

const MAGAZORD_CONFIG = {
    baseURL: process.env.MAGAZORD_URL,
    auth: {
        username: process.env.MAGAZORD_USER,
        password: process.env.MAGAZORD_PASSWORD
    }
};

console.log('🔍 BUSCANDO JALECOS NA API MAGAZORD');
console.log('='.repeat(70));

async function buscarJalecos() {
    try {
        console.log('\n📡 Buscando produtos com "jaleco" no nome...\n');
        
        const response = await axios.get('/v2/site/produto', {
            ...MAGAZORD_CONFIG,
            params: {
                nome: 'jaleco',
                limit: 50
            }
        });
        
        const produtos = response.data?.data?.items || [];
        
        console.log(`✅ Encontrados ${produtos.length} jalecos\n`);
        console.log('='.repeat(70));
        
        const ativos = produtos.filter(p => p.ativo);
        const inativos = produtos.filter(p => !p.ativo);
        
        console.log(`\n✅ Produtos ATIVOS: ${ativos.length}`);
        console.log(`❌ Produtos INATIVOS: ${inativos.length}\n`);
        
        if (ativos.length > 0) {
            console.log('📦 JALECOS ATIVOS (primeiros 10):');
            console.log('='.repeat(70));
            
            ativos.slice(0, 10).forEach((produto, index) => {
                console.log(`\n${index + 1}. ${produto.nome}`);
                console.log(`   Código: ${produto.codigo}`);
                console.log(`   Ativo: ✅ SIM`);
                
                if (produto.derivacoes && produto.derivacoes.length > 0) {
                    console.log(`   Variações: ${produto.derivacoes.length}`);
                    produto.derivacoes.slice(0, 2).forEach((der, i) => {
                        console.log(`      ${i + 1}. ${der.nome}`);
                        console.log(`         Código: ${der.codigo}`);
                    });
                }
            });
        }
        
    } catch (erro) {
        console.error('\n❌ ERRO:', erro.message);
    }
}

buscarJalecos();
