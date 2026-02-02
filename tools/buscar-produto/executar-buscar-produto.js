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
 * Busca preço ESPECÍFICO de um produto pelo código
 * @param {string} codigoProduto - Código do produto
 * @param {number} tabelaPrecoId - ID da tabela de preço
 * @returns {Promise<Object|null>} Dados de preço ou null
 */
async function buscarPrecoProduto(codigoProduto, tabelaPrecoId) {
    try {
        const response = await axios.get(`${MAGAZORD_CONFIG.baseURL}/v1/listPreco`, {
            params: {
                tabelaPreco: tabelaPrecoId,
                produto: codigoProduto  // FILTRA POR PRODUTO ESPECÍFICO
            },
            auth: MAGAZORD_CONFIG.auth,
            headers: MAGAZORD_CONFIG.headers
        });
        
        // Retorna primeiro item (deve ser único por produto)
        if (response.data && response.data.data && response.data.data.length > 0) {
            const preco = response.data.data[0];
            return {
                precoVenda: preco.precoVenda,
                precoAntigo: preco.precoAntigo,
                percentualDesconto: preco.percentualDesconto
            };
        }
        
        return null;
        
    } catch (error) {
        console.error(`⚠️ Erro ao buscar preço do produto ${codigoProduto}:`, error.message);
        return null;
    }
}

/**
 * Executa busca de produtos no Magazord v2 + preços
 * @param {Object} requisicao - Estrutura montada pela IA com parametros dinâmicos
 * @returns {Promise<Object>} Dados dos produtos com preços
 */
async function executarBuscarProduto(requisicao) {
    const { parametros } = requisicao;
    
    console.log('\n=== EXECUTANDO BUSCA DE PRODUTO ===');
    console.log('Parâmetros recebidos:', JSON.stringify(parametros, null, 2));
    
    try {
        // Remove cores e tamanhos do termo para busca mais ampla
        const cores = ['branco', 'branca', 'preto', 'preta', 'azul', 'verde', 'vermelho', 'vermelha', 
                       'amarelo', 'amarela', 'rosa', 'roxo', 'roxa', 'laranja', 'cinza', 'marrom'];
        const tamanhos = ['pp', 'p', 'm', 'g', 'gg', 'xg', 'eg', 'pequeno', 'medio', 'grande'];
        
        let termoSimplificado = (parametros.nome || '').toLowerCase();
        const termoBuscaOriginal = termoSimplificado;
        
        // Remove cores e tamanhos
        cores.forEach(cor => {
            termoSimplificado = termoSimplificado.replace(new RegExp(`\\b${cor}\\b`, 'g'), '').trim();
        });
        tamanhos.forEach(tamanho => {
            termoSimplificado = termoSimplificado.replace(new RegExp(`\\b${tamanho}\\b`, 'g'), '').trim();
        });
        
        console.log(`🔍 Busca simplificada: "${termoSimplificado}" (original: "${termoBuscaOriginal}")`);
        
        const magazordClient = axios.create(MAGAZORD_CONFIG);
        const response = await magazordClient.get('/v2/site/produto', {
            params: {
                nome: termoSimplificado,
                ativo: 1,
                tipoProduto: 1,
                limit: 50
            }
        });
        
        console.log('✅ Busca de produtos executada com sucesso!');
        console.log(`📦 ${response.data.data.items.length} produtos encontrados`);
        
        // NÃO FILTRAR - mostrar todos os resultados da API
        // A IA que vai formatar e filtrar na resposta
        const produtosLimitados = response.data.data.items.slice(0, 10);
        console.log(`🔍 Retornando ${produtosLimitados.length} produtos`);
        
        // 2. Buscar preços ESPECÍFICOS para cada derivação (EM PARALELO)
        const tabelaPrecoId = process.env.MAGAZORD_TABELA_PRECO_ID || 1;
        console.log(`💰 Usando tabela de preço ID: ${tabelaPrecoId}`);
        
        const promessasPreco = [];
        
        // Para cada produto
        for (const produto of produtosLimitados) {
            if (produto.derivacoes && produto.derivacoes.length > 0) {
                // Para cada derivação, agendar busca de preço
                for (const deriv of produto.derivacoes) {
                    promessasPreco.push(
                        buscarPrecoProduto(deriv.codigo, tabelaPrecoId)
                            .then(preco => ({ codigo: deriv.codigo, preco }))
                            .catch(err => {
                                console.warn(`⚠️ Erro ao buscar preço ${deriv.codigo}:`, err.message);
                                return { codigo: deriv.codigo, preco: null };
                            })
                    );
                }
            }
        }
        
        console.log(`⏳ Buscando preços de ${promessasPreco.length} derivações em paralelo...`);
        
        // Executar TODAS as buscas EM PARALELO
        const resultadosPrecos = await Promise.all(promessasPreco);
        
        // Mapear resultados
        const mapaPrecos = {};
        resultadosPrecos.forEach(({ codigo, preco }) => {
            if (preco) mapaPrecos[codigo] = preco;
        });
        
        // Adicionar preços aos produtos
        let precosEncontrados = 0;
        for (const produto of produtosLimitados) {
            if (produto.derivacoes && produto.derivacoes.length > 0) {
                for (const deriv of produto.derivacoes) {
                    const preco = mapaPrecos[deriv.codigo];
                    if (preco) {
                        deriv.precoVenda = preco.precoVenda;
                        deriv.precoAntigo = preco.precoAntigo;
                        deriv.percentualDesconto = preco.percentualDesconto;
                        precosEncontrados++;
                    }
                }
            }
        }
        
        console.log(`✅ Preços encontrados: ${precosEncontrados}/${promessasPreco.length} derivações`);
        
        // Retornar apenas produtos limitados com preços
        response.data.data.items = produtosLimitados;
        
        return response.data;
        
    } catch (error) {
        console.error('❌ Erro ao buscar produtos:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Dados:', error.response.data);
        }
        throw error;
    }
}

export { executarBuscarProduto };
