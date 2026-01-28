import 'dotenv/config';
import axios from 'axios';

/**
 * Busca detalhes completos de um produto específico por ID
 */

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

async function buscarDetalhesCompletos() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔎 BUSCANDO DETALHES COMPLETOS DE PRODUTOS');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    try {
        // 1. Pega a lista de produtos
        console.log('📋 1. Listando produtos disponíveis...\n');
        const listaResponse = await axios.get('/v2/site/produto?limit=3', MAGAZORD_CONFIG);
        const produtos = listaResponse.data?.data?.items || [];
        
        console.log(`✅ Encontrados ${produtos.length} produtos\n`);
        
        // 2. Para cada produto, busca os detalhes completos
        for (const produto of produtos) {
            console.log('─'.repeat(70));
            console.log(`\n📦 Produto: ${produto.nome}`);
            console.log(`   ID: ${produto.id}`);
            
            try {
                // Busca detalhes individuais
                const detalhesResponse = await axios.get(`/v2/site/produto/${produto.id}`, MAGAZORD_CONFIG);
                const detalhes = detalhesResponse.data?.data || detalhesResponse.data;
                
                console.log('\n🔍 DETALHES COMPLETOS:');
                console.log(JSON.stringify(detalhes, null, 2));
                
                // Analisa o que veio
                console.log('\n📊 CAMPOS DISPONÍVEIS:');
                if (detalhes) {
                    Object.keys(detalhes).forEach(campo => {
                        const valor = detalhes[campo];
                        const tipo = Array.isArray(valor) ? `array[${valor.length}]` : typeof valor;
                        console.log(`   - ${campo}: ${tipo}`);
                    });
                }
                
            } catch (error) {
                console.log(`   ❌ Erro ao buscar detalhes: ${error.response?.status || error.message}`);
                if (error.response?.data) {
                    console.log('   Detalhes:', JSON.stringify(error.response.data, null, 2));
                }
            }
            
            console.log('\n');
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // 3. Testa buscar derivações (variações/cores)
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('🎨 TESTANDO BUSCA DE DERIVAÇÕES/VARIAÇÕES');
        console.log('═══════════════════════════════════════════════════════════════\n');
        
        const produtoComDerivacao = produtos.find(p => p.derivacoes && p.derivacoes.length > 0);
        
        if (produtoComDerivacao) {
            console.log(`📦 Produto selecionado: ${produtoComDerivacao.nome}`);
            console.log(`   Derivações encontradas: ${produtoComDerivacao.derivacoes?.length || 0}\n`);
            
            if (produtoComDerivacao.derivacoes) {
                for (const derivacao of produtoComDerivacao.derivacoes.slice(0, 2)) {
                    console.log(`\n🔍 Buscando derivação ID: ${derivacao.id} - ${derivacao.nome}`);
                    
                    try {
                        const derivacaoResponse = await axios.get(`/v2/site/produto/${derivacao.id}`, MAGAZORD_CONFIG);
                        const detalhesDerivacao = derivacaoResponse.data?.data || derivacaoResponse.data;
                        
                        console.log('✅ Detalhes da derivação:');
                        console.log(JSON.stringify(detalhesDerivacao, null, 2));
                        
                    } catch (error) {
                        console.log(`❌ Erro: ${error.response?.status || error.message}`);
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }
        }
        
        // 4. Testa endpoint de estoque
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('📊 TESTANDO ENDPOINTS DE ESTOQUE');
        console.log('═══════════════════════════════════════════════════════════════\n');
        
        const endpointsEstoque = [
            '/v2/site/estoque',
            '/v2/site/produto/estoque',
            `/v2/site/produto/${produtos[0].id}/estoque`,
        ];
        
        for (const endpoint of endpointsEstoque) {
            try {
                console.log(`📡 Testando: ${endpoint}`);
                const response = await axios.get(endpoint, MAGAZORD_CONFIG);
                console.log('✅ Sucesso!');
                console.log(JSON.stringify(response.data, null, 2).substring(0, 500));
            } catch (error) {
                console.log(`❌ Erro ${error.response?.status}: ${error.response?.statusText || error.message}`);
            }
            console.log('');
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.response?.data || error.message);
    }
    
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    TESTE CONCLUÍDO!                           ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
}

buscarDetalhesCompletos();
