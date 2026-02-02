import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

async function testarGemini() {
  try {
    console.log('\n🧪 TESTANDO GEMINI...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    const result = await model.generateContent('Responda apenas "OK" se você receber esta mensagem');
    const resposta = result.response.text();
    
    console.log('✅ GEMINI FUNCIONANDO!');
    console.log('   Resposta:', resposta);
    return true;
  } catch (erro) {
    console.error('❌ GEMINI FALHOU:', erro.message);
    if (erro.message.includes('429')) {
      console.error('   Erro: Sem créditos ou limite excedido');
    } else if (erro.message.includes('403')) {
      console.error('   Erro: API key inválida ou sem permissão');
    }
    return false;
  }
}

async function testarOpenAI() {
  try {
    console.log('\n🧪 TESTANDO OPENAI...');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "user", content: "Responda apenas OK" }
      ],
      max_tokens: 10
    });
    
    console.log('✅ OPENAI FUNCIONANDO!');
    console.log('   Resposta:', completion.choices[0].message.content);
    return true;
  } catch (erro) {
    console.error('❌ OPENAI FALHOU:', erro.message);
    if (erro.message.includes('insufficient_quota')) {
      console.error('   Erro: Sem créditos na conta');
    } else if (erro.message.includes('invalid_api_key')) {
      console.error('   Erro: API key inválida');
    }
    return false;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  🔍 TESTE DE TOKENS DE API            ║');
  console.log('╚════════════════════════════════════════╝');
  
  const geminiOk = await testarGemini();
  const openaiOk = await testarOpenAI();
  
  console.log('\n📊 RESULTADO:');
  console.log('   Gemini:', geminiOk ? '✅ OK' : '❌ FALHOU');
  console.log('   OpenAI:', openaiOk ? '✅ OK' : '❌ FALHOU');
  
  if (geminiOk || openaiOk) {
    console.log('\n✅ Pelo menos 1 API está funcionando!');
    console.log('   Pode implementar no servidor.');
  } else {
    console.log('\n❌ NENHUMA API está funcionando!');
    console.log('   Verifique os créditos/tokens.');
  }
}

main();
