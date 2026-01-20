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
