import 'dotenv/config';
import axios from 'axios';

console.log('🔐 TESTE DETALHADO - API MAGAZORD');
console.log('='.repeat(60));
console.log('📍 Credenciais carregadas:');
console.log('   URL:', process.env.MAGAZORD_URL);
console.log('   User:', process.env.MAGAZORD_USER?.substring(0, 30) + '...');
console.log('   Pass:', process.env.MAGAZORD_PASSWORD);
console.log('='.repeat(60));

async function testarVariasFormas() {
    const token = process.env.MAGAZORD_USER;
    const senha = process.env.MAGAZORD_PASSWORD;
    const baseURL = process.env.MAGAZORD_URL;
    
    // TESTE 1: Com /v2 na URL base
    console.log('\n1️⃣ Teste com BasicAuth (axios auth)');
    try {
        const resp = await axios.get('/v2/site/produto', {
            baseURL: baseURL,
            params: { limit: 2 },
            auth: {
                username: token,
                password: senha
            }
        });
        console.log('✅ SUCESSO!');
        console.log('   Status:', resp.status);
        console.log('   Produtos:', resp.data?.data?.items?.length || 0);
        return;
    } catch (erro) {
        console.log('❌ Falhou:', erro.response?.status, erro.message);
    }
    
    // TESTE 2: URL completa sem baseURL
    console.log('\n2️⃣ Teste com URL completa');
    try {
        const resp = await axios.get(`${baseURL}/v2/site/produto`, {
            params: { limit: 2 },
            auth: {
                username: token,
                password: senha
            }
        });
        console.log('✅ SUCESSO!');
        console.log('   Status:', resp.status);
        console.log('   Produtos:', resp.data?.data?.items?.length || 0);
        return;
    } catch (erro) {
        console.log('❌ Falhou:', erro.response?.status, erro.message);
    }
    
    // TESTE 3: Header Authorization manual
    console.log('\n3️⃣ Teste com Authorization Header Base64');
    try {
        const base64 = Buffer.from(`${token}:${senha}`).toString('base64');
        console.log('   Base64:', base64.substring(0, 50) + '...');
        
        const resp = await axios.get(`${baseURL}/v2/site/produto`, {
            params: { limit: 2 },
            headers: {
                'Authorization': `Basic ${base64}`
            }
        });
        console.log('✅ SUCESSO!');
        console.log('   Status:', resp.status);
        console.log('   Produtos:', resp.data?.data?.items?.length || 0);
        return;
    } catch (erro) {
        console.log('❌ Falhou:', erro.response?.status, erro.message);
    }
    
    // TESTE 4: Sem /v2 no path
    console.log('\n4️⃣ Teste sem /v2 no path');
    try {
        const resp = await axios.get(`${baseURL}/site/produto`, {
            params: { limit: 2 },
            auth: {
                username: token,
                password: senha
            }
        });
        console.log('✅ SUCESSO!');
        console.log('   Status:', resp.status);
        console.log('   Produtos:', resp.data?.data?.items?.length || 0);
        return;
    } catch (erro) {
        console.log('❌ Falhou:', erro.response?.status, erro.message);
    }
    
    // TESTE 5: Endpoint de teste/status
    console.log('\n5️⃣ Teste endpoint raiz');
    try {
        const resp = await axios.get(baseURL, {
            auth: {
                username: token,
                password: senha
            }
        });
        console.log('✅ SUCESSO!');
        console.log('   Status:', resp.status);
        console.log('   Resposta:', resp.data);
        return;
    } catch (erro) {
        console.log('❌ Falhou:', erro.response?.status, erro.message);
    }
    
    console.log('\n❌ Nenhum teste funcionou!');
    console.log('💡 Verifique:');
    console.log('   1. Se o token está ativo no painel Magazord');
    console.log('   2. Se a API REST está habilitada');
    console.log('   3. Se as credenciais foram copiadas corretamente');
}

testarVariasFormas();
