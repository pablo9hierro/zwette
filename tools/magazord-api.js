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

/**
 * Executa requisição na API do Magazord baseado na intenção da IA
 */
async function executarRequisicaoMagazord(intencao) {
    try {
        const { acao, parametros } = intencao;

        switch (acao) {
            case 'buscar_produtos':
                return await buscarProdutos(parametros);
            
            case 'verificar_estoque':
                return await verificarEstoque(parametros);
            
            case 'buscar_produto_especifico':
                return await buscarProdutoEspecifico(parametros);
            
            case 'listar_categorias':
                return await listarCategorias(parametros);
            
            default:
                throw new Error(`Ação não suportada: ${acao}`);
        }
    } catch (error) {
        console.error('❌ Erro ao executar requisição Magazord:', error.message);
        throw error;
    }
}

/**
 * Busca produtos com filtros dinâmicos - Endpoint oficial Magazord v2
 */
async function buscarProdutos(parametros) {
    const queryParams = construirQueryParams(parametros);
    
    console.log('\n=== DEBUG: BUSCAR PRODUTOS ===');
    console.log('🔍 Parâmetros recebidos:', JSON.stringify(parametros, null, 2));
    console.log('📋 Query params construídos:', JSON.stringify(queryParams, null, 2));
    
    try {
        console.log('📡 Endpoint: /v2/site/produto');
        console.log('🔐 Autenticação:', MAGAZORD_CONFIG.auth.username ? 'Configurada' : 'Faltando');
        
        const response = await axios.get('/v2/site/produto', {
            ...MAGAZORD_CONFIG,
            params: queryParams
        });
        
        console.log('✅ Resposta recebida - Status:', response.status);
        console.log('📊 Quantidade de produtos:', response.data?.data?.items?.length || 0);
        console.log('=== FIM DEBUG BUSCAR PRODUTOS ===\n');
        
        return response.data;
    } catch (error) {
        console.error('❌ ERRO na busca de produtos:');
        console.error('   Status:', error.response?.status);
        console.error('   Mensagem:', error.message);
        console.error('   Dados:', error.response?.data);
        console.log('=== FIM DEBUG (COM ERRO) ===\n');
        throw error;
    }
}

/**
 * Verifica estoque de produto específico
 */
async function verificarEstoque(parametros) {
    const { produto_id, sku } = parametros;
    
    console.log(`📦 Verificando estoque: ${produto_id || sku}`);
    
    const endpoint = produto_id ? `/produtos/${produto_id}/estoque` : `/produtos/sku/${sku}/estoque`;
    
    const response = await axios.get(endpoint, MAGAZORD_CONFIG);
    
    return response.data;
}

/**
 * Busca produto específico por ID ou SKU
 */
async function buscarProdutoEspecifico(parametros) {
    const { produto_id, sku } = parametros;
    
    console.log(`🔎 Buscando produto específico: ${produto_id || sku}`);
    
    const endpoint = produto_id ? `/produtos/${produto_id}` : `/produtos/sku/${sku}`;
    
    const response = await axios.get(endpoint, MAGAZORD_CONFIG);
    
    return response.data;
}

/**
 * Lista categorias disponíveis - Endpoint oficial Magazord v2
 */
async function listarCategorias(parametros = {}) {
    console.log('\n=== DEBUG: LISTAR CATEGORIAS ===');
    console.log('📂 Parâmetros:', JSON.stringify(parametros, null, 2));
    
    try {
        console.log('📡 Endpoint: /v2/site/categoria');
        
        const response = await axios.get('/v2/site/categoria', {
            ...MAGAZORD_CONFIG,
            params: { limit: 100, ...parametros }
        });
        
        console.log('✅ Categorias recebidas:', response.data?.data?.items?.length || 0);
        console.log('=== FIM DEBUG CATEGORIAS ===\n');
        
        return response.data;
    } catch (error) {
        console.error('❌ ERRO ao listar categorias:', error.message);
        console.log('=== FIM DEBUG (COM ERRO) ===\n');
        throw error;
    }
}

/**
 * Constrói query params baseado na documentação oficial Magazord OpenAPI
 */
function construirQueryParams(parametros) {
    console.log('\n=== DEBUG: CONSTRUIR QUERY PARAMS ===');
    console.log('🔧 Parâmetros entrada:', JSON.stringify(parametros, null, 2));
    
    const queryParams = {};
    
    // Filtros baseados na documentação Magazord
    if (parametros.nome) {
        queryParams.nome = parametros.nome;
        console.log('✓ Filtro nome:', parametros.nome);
    }
    
    if (parametros.categoria) {
        // categoria deve ser o ID da categoria
        queryParams.categoria = parametros.categoria;
        console.log('✓ Filtro categoria:', parametros.categoria);
    }
    
    if (parametros.marca) {
        queryParams.marca = parametros.marca;
        console.log('✓ Filtro marca:', parametros.marca);
    }
    
    if (parametros.codigo) {
        queryParams.codigo = parametros.codigo;
        console.log('✓ Filtro codigo:', parametros.codigo);
    }
    
    if (parametros.ean) {
        queryParams.ean = parametros.ean;
        console.log('✓ Filtro EAN:', parametros.ean);
    }
    
    // Paginação (API Magazord usa limit e page)
    queryParams.limit = parametros.limite || 10;
    queryParams.page = parametros.pagina || 1;
    
    // Ordenação
    if (parametros.ordenar_por) {
        queryParams.order = parametros.ordenar_por;
        queryParams.orderDirection = 'asc';
        console.log('✓ Ordenação:', parametros.ordenar_por);
    }
    
    console.log('📋 Query params final:', JSON.stringify(queryParams, null, 2));
    console.log('=== FIM DEBUG QUERY PARAMS ===\n');
    
    return queryParams;
}

/**
 * Converte SKU do catálogo local para código da API Magazord
 * Remove sufixos variáveis do catálogo:
 * - 372-SD-008-000-F5 → 372-SD-008-000-F (remove número após letra)
 * - 378-ZI-013-000-FFa → 378-ZI-013-000-F (remove "Fa" no final)
 * - 217774Fa → 217774 (robes sem hífen)
 * - 301-DD-0005 → 301-DD-000 (números extras no final)
 */
function converterSKUParaCodigoAPI(sku) {
    if (!sku) return sku;
    
    let codigoAPI = sku;
    
    // Padrão 1: Robes sem hífen (217774Fa → 217774)
    // Remove letras maiúsculas + "a" no final de códigos sem hífen
    if (!codigoAPI.includes('-')) {
        codigoAPI = codigoAPI.replace(/[A-Z]+a?$/i, '');
    } else {
        // Padrão 2: Remove "Fa", "Ma", "Ua" no final (feminino/masculino/unissex + variante)
        // Exemplo: 378-ZI-013-000-FFa → 378-ZI-013-000-F
        codigoAPI = codigoAPI.replace(/([FMU])[FMU]?a$/, '$1');
        
        // Padrão 3: Remove dígitos finais após letra maiúscula
        // Exemplo: 372-SD-008-000-F5 → 372-SD-008-000-F
        codigoAPI = codigoAPI.replace(/([A-Z])(\d+)$/, '$1');
        
        // Padrão 4: Remove dígitos extras no final (301-DD-0005 → 301-DD-000)
        // Mantém apenas 3 dígitos no último segmento
        codigoAPI = codigoAPI.replace(/(\d{3})\d+$/, '$1');
    }
    
    if (codigoAPI !== sku) {
        console.log(`  🔄 Convertendo SKU: ${sku} → ${codigoAPI}`);
    }
    
    return codigoAPI;
}

/**
 * Verifica disponibilidade de produto por SKU
 * Retorna true se o produto está ATIVO para venda no e-commerce
 * (ignora estoque, apenas verifica se está ativo)
 */
async function verificarDisponibilidadePorSKU(sku) {
    try {
        console.log(`🔍 Verificando disponibilidade: SKU ${sku}`);
        
        // Converter SKU do catálogo para código da API
        const codigoAPI = converterSKUParaCodigoAPI(sku);
        
        // Buscar produto diretamente pelo código (path param - mais preciso)
        const response = await axios.get(`/v2/site/produto/${codigoAPI}`, {
            ...MAGAZORD_CONFIG
        });
        
        const produto = response.data?.data;
        
        if (!produto) {
            console.log(`  ⚠️ SKU ${sku}: Produto não retornado pela API (considerando disponível)`);
            return true;
        }
        
        // Verificar apenas se o produto está ATIVO para venda
        const estaAtivo = produto.ativo === true || produto.ativo === 1;
        
        if (estaAtivo) {
            console.log(`  ✅ SKU ${sku}: ATIVO e disponível para venda`);
            return true;
        } else {
            console.log(`  ❌ SKU ${sku}: INATIVO (não disponível para venda)`);
            return false;
        }
        
    } catch (erro) {
        // Erros esperados:
        // - 401: Credenciais não configuradas
        // - 404: Produto não encontrado (pode ser SKU desatualizado)
        // - Timeout: API lenta
        
        if (erro.response?.status === 401) {
            console.log(`  ⚠️ SKU ${sku}: API não configurada (considerando disponível)`);
        } else if (erro.response?.status === 404) {
            console.log(`  ⚠️ SKU ${sku}: Não encontrado na API (considerando disponível)`);
        } else {
            console.log(`  ⚠️ SKU ${sku}: Erro ${erro.message} (considerando disponível)`);
        }
        
        // Em caso de erro, considerar como disponível para não bloquear vendas
        return true;
    }
}

/**
 * Filtra lista de produtos mantendo apenas os disponíveis no Magazord
 * Verifica cada SKU e remove os indisponíveis
 */
async function filtrarProdutosDisponiveis(produtos) {
    console.log(`\n🔍 Verificando disponibilidade de ${produtos.length} produtos no Magazord...`);
    
    const produtosDisponiveis = [];
    
    for (const produto of produtos) {
        const sku = produto.sku;
        
        if (!sku) {
            console.log(`  ⚠️ Produto sem SKU, mantendo: ${produto.nome}`);
            produtosDisponiveis.push(produto);
            continue;
        }
        
        const disponivel = await verificarDisponibilidadePorSKU(sku);
        
        if (disponivel) {
            produtosDisponiveis.push(produto);
        }
    }
    
    console.log(`✅ Filtrados: ${produtosDisponiveis.length} de ${produtos.length} disponíveis\n`);
    
    return produtosDisponiveis;
}

export { executarRequisicaoMagazord, verificarDisponibilidadePorSKU, filtrarProdutosDisponiveis };
