import 'dotenv/config';
import OpenAI from 'openai';
import { carregarPromptEntenderMensagem } from '../prompts/prompt-entender-mensagem.js';
import { executarRequisicaoMagazord } from '../tools/magazord-api.js';

const openai = new OpenAI({
    apiKey: process.env.CHATGPT_API_KEY
});

/**
 * Processa a mensagem recebida e retorna a resposta completa
 */
async function processarMensagemRecebida(mensagemUsuario, numeroUsuario) {
    try {
        console.log('\n╔══════════════════════════════════════════════╗');
        console.log('║  🧠 INICIANDO PROCESSAMENTO COM IA           ║');
        console.log('╚══════════════════════════════════════════════╝');
        console.log('📥 Mensagem:', mensagemUsuario);
        console.log('👤 Usuário:', numeroUsuario);
        
        console.log('\n🤖 Etapa 1: Interpretando intenção do usuário...');
        
        // Etapa 1: IA interpreta a intenção e monta a estrutura da requisição
        const promptSistema = carregarPromptEntenderMensagem();
        
        console.log('🔑 Modelo:', 'gpt-4o-mini');
        console.log('📤 Enviando para ChatGPT...');
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: promptSistema },
                { role: "user", content: mensagemUsuario }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const intencaoIA = JSON.parse(completion.choices[0].message.content);
        
        console.log('✅ Resposta ChatGPT recebida!');
        console.log('📊 Intenção identificada:', JSON.stringify(intencaoIA, null, 2));

        // Se não conseguiu identificar intenção válida
        if (!intencaoIA.acao || intencaoIA.acao === 'conversa') {
            console.log('💬 Tipo: Conversa (sem busca API)');
            console.log('╚══════════════════════════════════════════════╝\n');
            return intencaoIA.resposta || 'Olá! Sou o assistente da Dana Jalecos. Como posso ajudá-lo? Você pode me perguntar sobre jalecos ou gorros disponíveis!';
        }

        // Etapa 2: Executar requisição no Magazord com os dados estruturados
        console.log('\n🔧 Etapa 2: Executando requisição na API Magazord...');
        console.log('🎯 Ação:', intencaoIA.acao);
        
        let dadosMagazord;
        try {
            dadosMagazord = await executarRequisicaoMagazord(intencaoIA);
            console.log('✅ Dados recebidos do Magazord');
            console.log('📦 Tipo resposta:', typeof dadosMagazord);
        } catch (error) {
            console.error('⚠️ Erro ao acessar API Magazord:', error.message);
            console.log('╚══════════════════════════════════════════════╝\n');
            
            // Resposta de fallback quando API não está disponível
            return `Desculpe, estou com dificuldade para acessar nosso catálogo neste momento. 😔

Por favor, tente novamente em alguns instantes ou entre em contato diretamente conosco.

📞 WhatsApp: +55 83 98751-6699
🌐 Site: danajalecos.com.br

Como alternativa, me diga exatamente o que você procura (modelo, cor, tamanho) e tentarei ajudar de outra forma!`;
        }

        // Etapa 3: IA formata a resposta com os dados reais
        console.log('\n💬 Etapa 3: Formatando resposta com IA...');
        const respostaFormatada = await formatarRespostaParaUsuario(
            mensagemUsuario, 
            intencaoIA, 
            dadosMagazord
        );

        console.log('✅ Resposta formatada com sucesso!');
        console.log('╚══════════════════════════════════════════════╝\n');
        
        return respostaFormatada;

    } catch (error) {
        console.error('\n❌ ERRO CRÍTICO ao processar mensagem:');
        console.error('   Tipo:', error.name);
        console.error('   Mensagem:', error.message);
        console.error('   Stack:', error.stack);
        console.log('╚══════════════════════════════════════════════╝\n');
        throw error;
    }
}

/**
 * Formata a resposta da IA com os dados do Magazord
 */
async function formatarRespostaParaUsuario(mensagemOriginal, intencao, dadosMagazord) {
    console.log('🎨 Formatando resposta final...');
    
    const { carregarPromptFormatarResposta } = await import('../prompts/prompt-formatar-resposta.js');
    const promptSistema = carregarPromptFormatarResposta();
    
    const promptUsuario = `
Mensagem original do cliente: "${mensagemOriginal}"

Intenção identificada: ${JSON.stringify(intencao, null, 2)}

Dados retornados do Magazord:
${JSON.stringify(dadosMagazord, null, 2)}

Formate uma resposta clara e útil para o cliente.
`;

    console.log('📤 Enviando para ChatGPT formatação...');

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: promptSistema },
            { role: "user", content: promptUsuario }
        ],
        temperature: 0.8
    });

    console.log('✅ Formatação concluída!');
    return completion.choices[0].message.content;
}

export { processarMensagemRecebida };
