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
 * Executa busca de produtos no Magazord v2
 * @param {Object} requisicao - Estrutura montada pela IA com parametros dinâmicos
 * @returns {Promise<Object>} Dados dos produtos + links formatados
 */
async function executarBuscarProduto(requisicao) {
    const { parametros } = requisicao;
    
    console.log('\n=== EXECUTANDO BUSCA DE PRODUTO ===');
    console.log('Parâmetros recebidos:', JSON.stringify(parametros, null, 2));
    
    try {
        const response = await axios.get(`${MAGAZORD_CONFIG.baseURL}/v2/site/produto`, {
            params: parametros,
            auth: MAGAZORD_CONFIG.auth,
            headers: MAGAZORD_CONFIG.headers
        });
        
        console.log('✅ Busca executada com sucesso!');
        console.log(`📦 ${response.data.data.items.length} produtos encontrados`);
        
        // Enriquecer produtos com links
        const produtosComLinks = response.data.data.items.map(produto => {
            // Gera URL completa do produto
            const url = gerarUrlProduto(produto);
            
            return {
                ...produto,
                link: url
            };
        });
        
        return {
            ...response.data,
            data: {
                ...response.data.data,
                items: produtosComLinks
            }
        };
        
    } catch (error) {
        console.error('❌ Erro ao buscar produtos:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Dados:', error.response.data);
        }
        throw error;
    }
}

/**
 * Gera URL completa do produto no site
 * Padrão: /shop/{categoria}/{genero}/{modelo}/{slug-simplificado}/
 * Exemplo: /shop/jalecos/feminino/manuela/jaleco-manuela-branco/
 */
function gerarUrlProduto(produto) {
    const nome = produto.nome || '';
    const modelo = produto.modelo || '';
    
    // Extrai gênero do nome (feminino/masculino/unissex)
    let genero = 'unissex';
    const nomeLower = nome.toLowerCase();
    if (nomeLower.includes('feminino')) genero = 'feminino';
    else if (nomeLower.includes('masculino')) genero = 'masculino';
    
    // Extrai modelo específico (palavra após Feminino/Masculino/Unissex)
    let identificadorModelo = modelo.toLowerCase();
    const partes = nome.split(' ');
    for (let i = 0; i < partes.length - 1; i++) {
        const palavra = partes[i].toLowerCase();
        if (palavra === 'feminino' || palavra === 'masculino' || palavra === 'unissex') {
            if (partes[i + 1]) {
                identificadorModelo = partes[i + 1].toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9-]/g, '');
                break;
            }
        }
    }
    
    // Gera slug simplificado: tipo-modelo-cor/características principais
    // Remove palavras genéricas e mantém apenas essenciais
    const palavrasRemover = ['feminino', 'masculino', 'unissex', 'manga', 'curta', 'longa', 'detalhes'];
    const slugProduto = nome
        .toLowerCase()
        .split(' ')
        .filter(palavra => !palavrasRemover.includes(palavra))
        .join('-')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
        .trim()
        .replace(/\s+/g, '-') // Substitui espaços por hífens
        .replace(/-+/g, '-'); // Remove hífens duplicados
    
    // Categoria base (jalecos, gorros, etc)
    let categoriaBase = 'jalecos';
    if (modelo.toLowerCase().includes('gorro')) {
        categoriaBase = 'gorros';
    }
    
    return `https://www.danajalecos.com.br/shop/${categoriaBase}/${genero}/${identificadorModelo}/${slugProduto}/`;
}

function gerarSlugProduto(produto) {
    const nome = produto.nome || '';
    const codigo = produto.codigo || '';
    
    // Pega o nome e converte para slug
    let slug = nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
        .trim()
        .replace(/\s+/g, '-'); // Substitui espaços por hífens
    
    // Se tiver código, adiciona no final
    if (codigo) {
        const codigoSlug = codigo
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-');
        slug = `${slug}-${codigoSlug}`;
    }
    
    return slug;
}

export { executarBuscarProduto };
