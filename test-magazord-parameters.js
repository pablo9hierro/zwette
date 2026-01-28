import 'dotenv/config';
import axios from 'axios';

/**
 * Script de teste completo para descobrir TODOS os parâmetros da API Magazord
 * e testar busca de produtos específicos
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

// Exemplo de produto do masculino.json para teste
const exemplosProdutos = [
    {
        nome: "Jaleco Masculino Branco",
        descricao: "Jaleco branco profissional"
    },
    {
        nome: "Scrub",
        descricao: "Conjunto cirúrgico"
    }
];

/**
 * 1. Teste para descobrir estrutura completa de retorno
 */
async function testarRetornoCompleto() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📋 TESTE 1: RETORNO COMPLETO DE UM PRODUTO');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    try {
        const response = await axios.get('/v2/site/produto?limit=1', MAGAZORD_CONFIG);
        
        if (response.data?.data?.items?.[0]) {
            const produto = response.data.data.items[0];
            console.log('✅ Produto retornado com TODOS os campos:');
            console.log(JSON.stringify(produto, null, 2));
            console.log('\n📊 Campos disponíveis:');
            Object.keys(produto).forEach(campo => {
                console.log(`  - ${campo}: ${typeof produto[campo]}`);
            });
        }
    } catch (error) {
        console.error('❌ Erro:', error.response?.data || error.message);
    }
    console.log('\n');
}

/**
 * 2. Teste de todos os parâmetros de busca possíveis
 */
async function testarParametrosBusca() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 TESTE 2: PARÂMETROS DE BUSCA POSSÍVEIS');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const parametros = [
        // Parâmetros básicos
        { nome: 'limit', valor: '5', descricao: 'Limite de resultados' },
        { nome: 'offset', valor: '0', descricao: 'Offset para paginação' },
        { nome: 'page', valor: '1', descricao: 'Página' },
        
        // Busca por texto
        { nome: 'nome', valor: 'jaleco', descricao: 'Busca por nome do produto' },
        { nome: 'descricao', valor: 'branco', descricao: 'Busca por descrição' },
        { nome: 'sku', valor: '', descricao: 'Busca por SKU' },
        { nome: 'codigo', valor: '', descricao: 'Busca por código' },
        { nome: 'referencia', valor: '', descricao: 'Busca por referência' },
        { nome: 'busca', valor: 'jaleco', descricao: 'Busca geral' },
        { nome: 'q', valor: 'jaleco', descricao: 'Query geral' },
        { nome: 'search', valor: 'jaleco', descricao: 'Search geral' },
        
        // Filtros por categoria e tipo
        { nome: 'categoria', valor: '', descricao: 'Filtrar por categoria' },
        { nome: 'categoria_id', valor: '', descricao: 'Filtrar por ID da categoria' },
        { nome: 'tipo', valor: '', descricao: 'Tipo de produto' },
        
        // Filtros de estoque e disponibilidade
        { nome: 'disponivel', valor: 'true', descricao: 'Apenas produtos disponíveis' },
        { nome: 'estoque', valor: 'true', descricao: 'Com estoque' },
        { nome: 'ativo', valor: 'true', descricao: 'Produtos ativos' },
        { nome: 'visivel', valor: 'true', descricao: 'Produtos visíveis' },
        
        // Filtros de preço
        { nome: 'preco_min', valor: '0', descricao: 'Preço mínimo' },
        { nome: 'preco_max', valor: '1000', descricao: 'Preço máximo' },
        
        // Filtros de características
        { nome: 'cor', valor: '', descricao: 'Filtrar por cor' },
        { nome: 'tamanho', valor: '', descricao: 'Filtrar por tamanho' },
        { nome: 'marca', valor: '', descricao: 'Filtrar por marca' },
        
        // Ordenação
        { nome: 'ordem', valor: 'nome', descricao: 'Ordenar resultados' },
        { nome: 'sort', valor: 'nome', descricao: 'Ordenar resultados' },
        { nome: 'order_by', valor: 'nome', descricao: 'Ordenar resultados' },
        
        // Campos específicos
        { nome: 'fields', valor: 'id,nome,preco', descricao: 'Campos específicos para retornar' },
    ];
    
    console.log('Testando cada parâmetro individualmente:\n');
    
    for (const param of parametros) {
        if (!param.valor) continue; // Pula parâmetros sem valor de teste
        
        const queryString = `?${param.nome}=${encodeURIComponent(param.valor)}&limit=3`;
        
        try {
            const response = await axios.get(`/v2/site/produto${queryString}`, MAGAZORD_CONFIG);
            const count = response.data?.data?.items?.length || 0;
            console.log(`✅ ${param.nome.padEnd(20)} - ${param.descricao.padEnd(40)} - ${count} resultados`);
        } catch (error) {
            const status = error.response?.status || 'N/A';
            console.log(`❌ ${param.nome.padEnd(20)} - ${param.descricao.padEnd(40)} - Erro ${status}`);
        }
    }
    console.log('\n');
}

/**
 * 3. Teste de busca por nome específico
 */
async function testarBuscaPorNome(nomeProduto) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`🎯 TESTE 3: BUSCA POR NOME ESPECÍFICO: "${nomeProduto}"`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const variacoesBusca = [
        `?nome=${encodeURIComponent(nomeProduto)}`,
        `?busca=${encodeURIComponent(nomeProduto)}`,
        `?q=${encodeURIComponent(nomeProduto)}`,
        `?search=${encodeURIComponent(nomeProduto)}`,
        `?nome=${encodeURIComponent(nomeProduto)}&disponivel=true`,
    ];
    
    for (const query of variacoesBusca) {
        try {
            console.log(`📡 Testando: /v2/site/produto${query}`);
            const response = await axios.get(`/v2/site/produto${query}&limit=5`, MAGAZORD_CONFIG);
            const items = response.data?.data?.items || [];
            
            console.log(`✅ Encontrou ${items.length} produtos`);
            
            if (items.length > 0) {
                console.log('\n📦 Produtos encontrados:');
                items.forEach((produto, index) => {
                    console.log(`\n  ${index + 1}. ${produto.nome || 'Sem nome'}`);
                    console.log(`     ID: ${produto.id || 'N/A'}`);
                    console.log(`     SKU: ${produto.sku || 'N/A'}`);
                    console.log(`     Preço: R$ ${produto.preco || 'N/A'}`);
                    console.log(`     Disponível: ${produto.disponivel || produto.estoque > 0 ? 'Sim' : 'Não'}`);
                    if (produto.variacoes) {
                        console.log(`     Variações: ${produto.variacoes.length || 0}`);
                    }
                    if (produto.cores) {
                        console.log(`     Cores: ${JSON.stringify(produto.cores)}`);
                    }
                });
            }
            console.log('\n' + '─'.repeat(70) + '\n');
        } catch (error) {
            console.error(`❌ Erro: ${error.response?.status || error.message}`);
            if (error.response?.data) {
                console.log('Detalhes:', JSON.stringify(error.response.data, null, 2));
            }
            console.log('\n' + '─'.repeat(70) + '\n');
        }
    }
}

/**
 * 4. Teste de obtenção de detalhes completos por ID
 */
async function testarDetalhesPorId(produtoId) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`🔎 TESTE 4: DETALHES COMPLETOS DO PRODUTO ID: ${produtoId}`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    try {
        const response = await axios.get(`/v2/site/produto/${produtoId}`, MAGAZORD_CONFIG);
        console.log('✅ Produto completo com TODOS os detalhes:');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('❌ Erro:', error.response?.data || error.message);
    }
    console.log('\n');
}

/**
 * 5. Teste para verificar parâmetros obrigatórios
 */
async function testarParametrosObrigatorios() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('⚠️  TESTE 5: PARÂMETROS OBRIGATÓRIOS');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const testes = [
        { url: '/v2/site/produto', descricao: 'Sem parâmetros' },
        { url: '/v2/site/produto?limit=5', descricao: 'Apenas com limit' },
        { url: '/v2/site/produto?nome=teste', descricao: 'Apenas com nome' },
    ];
    
    for (const teste of testes) {
        try {
            console.log(`📡 ${teste.descricao}: ${teste.url}`);
            const response = await axios.get(teste.url, MAGAZORD_CONFIG);
            console.log(`✅ Sucesso! Retornou ${response.data?.data?.items?.length || 0} itens`);
        } catch (error) {
            console.log(`❌ Erro ${error.response?.status}: ${JSON.stringify(error.response?.data)}`);
        }
        console.log('');
    }
}

/**
 * 6. Simular busca baseada no masculino.json
 */
async function simularBuscaDoJSON() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🧪 TESTE 6: SIMULAÇÃO DE BUSCA BASEADA EM masculino.json');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // Simulando estrutura do masculino.json
    const produtosJSON = [
        { nome: "Jaleco Masculino Branco", cor: "Branco" },
        { nome: "Scrub Azul Marinho", cor: "Azul" },
        { nome: "Camisa Polo Médica", cor: "Branco" }
    ];
    
    console.log('🔍 Buscando produtos do JSON no Magazord:\n');
    
    for (const produtoJSON of produtosJSON) {
        console.log(`\n📌 Produto do JSON: "${produtoJSON.nome}" - Cor: ${produtoJSON.cor}`);
        console.log('─'.repeat(70));
        
        try {
            // Tenta buscar por nome exato
            let response = await axios.get(
                `/v2/site/produto?nome=${encodeURIComponent(produtoJSON.nome)}&limit=5`,
                MAGAZORD_CONFIG
            );
            
            let items = response.data?.data?.items || [];
            
            // Se não encontrar, tenta busca por palavras-chave
            if (items.length === 0) {
                const palavrasChave = produtoJSON.nome.split(' ').filter(p => p.length > 3).join(' ');
                console.log(`   ℹ️  Tentando busca por palavras-chave: "${palavrasChave}"`);
                response = await axios.get(
                    `/v2/site/produto?busca=${encodeURIComponent(palavrasChave)}&limit=5`,
                    MAGAZORD_CONFIG
                );
                items = response.data?.data?.items || [];
            }
            
            if (items.length > 0) {
                console.log(`   ✅ Encontrou ${items.length} produto(s) similar(es):`);
                items.forEach((prod, idx) => {
                    console.log(`\n   ${idx + 1}. ${prod.nome}`);
                    console.log(`      ID: ${prod.id}`);
                    console.log(`      Preço: R$ ${prod.preco || 'N/A'}`);
                    console.log(`      Estoque: ${prod.estoque || 'N/A'}`);
                    if (prod.variacoes) {
                        console.log(`      Variações/Cores: ${prod.variacoes.length} disponíveis`);
                        prod.variacoes.forEach(v => {
                            if (v.cor) console.log(`        - ${v.cor}: ${v.estoque || 0} unid.`);
                        });
                    }
                });
            } else {
                console.log('   ❌ Produto não encontrado no Magazord');
            }
        } catch (error) {
            console.log(`   ❌ Erro na busca: ${error.message}`);
        }
    }
}

/**
 * Função principal
 */
async function executarTestes() {
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║         TESTE COMPLETO DA API MAGAZORD - PARÂMETROS          ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('\n');
    
    try {
        // 1. Ver estrutura completa de um produto
        await testarRetornoCompleto();
        
        // 2. Testar todos os parâmetros de busca
        await testarParametrosBusca();
        
        // 3. Testar busca por nome específico
        await testarBuscaPorNome('Jaleco');
        
        // 4. Testar parâmetros obrigatórios
        await testarParametrosObrigatorios();
        
        // 5. Simular busca do masculino.json
        await simularBuscaDoJSON();
        
        console.log('\n');
        console.log('╔═══════════════════════════════════════════════════════════════╗');
        console.log('║                    TESTES CONCLUÍDOS!                         ║');
        console.log('╚═══════════════════════════════════════════════════════════════╝');
        console.log('\n');
        
    } catch (error) {
        console.error('❌ Erro geral:', error);
    }
}

// Executar todos os testes
executarTestes();
