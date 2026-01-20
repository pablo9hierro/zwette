import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

console.log('🔑 Testando chave Gemini...');
console.log(`API Key: ${apiKey?.substring(0, 20)}...`);
console.log('');

const genAI = new GoogleGenerativeAI(apiKey);

// Testar com diferentes versões de modelo
const modelos = [
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'models/gemini-pro'
];

for (const modeloNome of modelos) {
    console.log(`\n📡 Testando: ${modeloNome}`);
    try {
        const model = genAI.getGenerativeModel({ model: modeloNome });
        const result = await model.generateContent('Diga apenas: OK');
        console.log(`✅ FUNCIONOU! Resposta: ${result.response.text()}`);
        break;
    } catch (error) {
        console.log(`❌ Erro: ${error.message.substring(0, 150)}...`);
    }
}
