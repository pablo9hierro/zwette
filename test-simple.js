import 'dotenv/config';
import axios from 'axios';

const user = process.env.MAGAZORD_USER;
const senha = process.env.MAGAZORD_PASSWORD;
const url = process.env.MAGAZORD_URL;

console.log('📋 Credenciais carregadas:');
console.log(`User: ${user?.substring(0, 20)}...`);
console.log(`Senha: ${senha}`);
console.log(`URL: ${url}\n`);

console.log('🔍 Testando BasicAuth simples (user + senha)...\n');

axios.get(`${url}/v2/site/produto`, {
    params: { limit: 2 },
    auth: {
        username: user,
        password: senha
    }
})
.then(response => {
    console.log('✅ FUNCIONOU!');
    console.log('📦 Dados retornados:');
    console.log(JSON.stringify(response.data, null, 2));
})
.catch(error => {
    console.log('❌ ERRO!');
    console.log(`Status: ${error.response?.status}`);
    console.log(`Mensagem: ${error.response?.statusText}`);
    console.log(`Dados: ${JSON.stringify(error.response?.data)}`);
    console.log(`\n🔧 Header Authorization enviado:`);
    console.log(`Basic ${Buffer.from(`${user}:${senha}`).toString('base64')}`);
});
