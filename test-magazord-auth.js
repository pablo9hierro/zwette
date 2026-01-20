import 'dotenv/config';
import axios from 'axios';

const token = process.env.MAGAZORD_USER;
const password = process.env.MAGAZORD_PASSWORD || '';
const baseURL = process.env.MAGAZORD_URL;

console.log('🔍 Testando diferentes formatos de autenticação Magazord...\n');

// TESTE 1: BasicAuth com token como username e senha vazia
async function testeAuth1() {
    console.log('📡 TESTE 1: Token como username, senha vazia');
    try {
        const response = await axios.get(`${baseURL}/v2/site/produto`, {
            params: { limit: 2 },
            auth: {
                username: token,
                password: ''
            }
        });
        console.log('✅ SUCESSO! Retornou:', response.data);
        return true;
    } catch (error) {
        console.log(`❌ Erro ${error.response?.status}: ${error.response?.data || error.message}\n`);
        return false;
    }
}

// TESTE 2: BasicAuth com token como username e password normal
async function testeAuth2() {
    console.log('📡 TESTE 2: Token como username, senha fornecida');
    try {
        const response = await axios.get(`${baseURL}/v2/site/produto`, {
            params: { limit: 2 },
            auth: {
                username: token,
                password: password
            }
        });
        console.log('✅ SUCESSO! Retornou:', response.data);
        return true;
    } catch (error) {
        console.log(`❌ Erro ${error.response?.status}: ${error.response?.data || error.message}\n`);
        return false;
    }
}

// TESTE 3: Authorization header manual Base64
async function testeAuth3() {
    console.log('📡 TESTE 3: Header Authorization manual (Base64)');
    try {
        const base64 = Buffer.from(`${token}:${password}`).toString('base64');
        const response = await axios.get(`${baseURL}/v2/site/produto`, {
            params: { limit: 2 },
            headers: {
                'Authorization': `Basic ${base64}`
            }
        });
        console.log('✅ SUCESSO! Retornou:', response.data);
        return true;
    } catch (error) {
        console.log(`❌ Erro ${error.response?.status}: ${error.response?.data || error.message}\n`);
        return false;
    }
}

// TESTE 4: Apenas token no Authorization sem "Basic"
async function testeAuth4() {
    console.log('📡 TESTE 4: Token direto no Authorization');
    try {
        const response = await axios.get(`${baseURL}/v2/site/produto`, {
            params: { limit: 2 },
            headers: {
                'Authorization': token
            }
        });
        console.log('✅ SUCESSO! Retornou:', response.data);
        return true;
    } catch (error) {
        console.log(`❌ Erro ${error.response?.status}: ${error.response?.data || error.message}\n`);
        return false;
    }
}

// Executar todos os testes
(async () => {
    const resultado1 = await testeAuth1();
    if (resultado1) return;
    
    const resultado2 = await testeAuth2();
    if (resultado2) return;
    
    const resultado3 = await testeAuth3();
    if (resultado3) return;
    
    const resultado4 = await testeAuth4();
    if (resultado4) return;
    
    console.log('❌ Nenhum formato de autenticação funcionou!');
    console.log('💡 Verifique se as credenciais estão corretas com o suporte Magazord.');
})();
