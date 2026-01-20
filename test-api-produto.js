import 'dotenv/config';
import axios from 'axios';

const MAGAZORD_CONFIG = {
    baseURL: process.env.MAGAZORD_URL,
    auth: {
        username: process.env.MAGAZORD_USER,
        password: process.env.MAGAZORD_PASSWORD
    }
};

async function testarProduto() {
    try {
        // Buscar todas as categorias primeiro
        console.log('=== BUSCANDO CATEGORIAS ===');
        const catResponse = await axios.get(`${MAGAZORD_CONFIG.baseURL}/v2/site/categoria`, {
            params: { limit: 100 },
            auth: MAGAZORD_CONFIG.auth
        });
        
        console.log('Total de categorias:', catResponse.data.data.items.length);
        console.log('Primeira categoria:', JSON.stringify(catResponse.data.data.items[0], null, 2));
        
        // Agora buscar o produto
        const response = await axios.get(`${MAGAZORD_CONFIG.baseURL}/v2/site/produto`, {
            params: { nome: 'manuela', limit: 1 },
            auth: MAGAZORD_CONFIG.auth
        });
        
        const produto = response.data.data.items[0];
        console.log('\n=== PRODUTO MANUELA ===');
        console.log(JSON.stringify(produto, null, 2));
        
    } catch (error) {
        console.error('Erro:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
        }
    }
}

testarProduto();
