import 'dotenv/config';
import axios from 'axios';

/**
 * Script de teste para descobrir endpoints da API Magazord
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

async function testarEndpoints() {
    console.log('🔍 Testando conexão com API Magazord v2...\n');
    
    const endpoints = [
        '/v2/site/produto?limit=5',
        '/v2/site/produto?nome=jaleco&limit=3',
        '/v2/site/categoria?limit=10'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`📡 Testando: ${endpoint}`);
            const response = await axios.get(endpoint, MAGAZORD_CONFIG);
            console.log(`✅ Sucesso! Status: ${response.status}`);
            console.log(`📊 Itens retornados:`, response.data?.data?.items?.length || 0);
            console.log(`📄 Amostra:`, JSON.stringify(response.data, null, 2).substring(0, 300));
            console.log('\n' + '─'.repeat(80) + '\n');
        } catch (error) {
            console.log(`❌ Erro: ${error.response?.status || error.message}`);
            if (error.response?.data) {
                console.log('Detalhes:', error.response.data);
            }
            console.log('\n' + '─'.repeat(80) + '\n');
        }
    }
}

testarEndpoints();
