import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

console.log('🧪 Testando Gemini API...\n');

// Teste 1: Modelo básico
console.log('📡 TESTE 1: Modelo básico (sem configuração JSON)');
const model1 = genAI.getGenerativeModel({ model: 'gemini-pro' });

try {
    const result1 = await model1.generateContent('Responda apenas: OK');
    console.log('✅ Funcionou!');
    console.log('Resposta:', result1.response.text());
} catch (error) {
    console.log('❌ Erro:', error.message);
}

console.log('\n📡 TESTE 2: Pedindo JSON na resposta');
const prompt = `Retorne apenas um JSON válido com esta estrutura:
{
  "acao": "buscar_produtos",
  "parametros": {
    "nome": "jaleco"
  }
}`;

try {
    const result2 = await model1.generateContent(prompt);
    const texto = result2.response.text();
    console.log('✅ Resposta recebida:', texto);
    
    // Tenta parsear o JSON
    const json = JSON.parse(texto);
    console.log('✅ JSON parseado com sucesso!', json);
} catch (error) {
    console.log('❌ Erro:', error.message);
}

console.log('\n🎉 Teste concluído!');
