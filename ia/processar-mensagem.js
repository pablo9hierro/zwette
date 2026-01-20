import 'dotenv/config';
import OpenAI from 'openai';
import { carregarPromptInterpretarIntencao } from './prompt-interpretar-intencao.js';
import { carregarPromptBuscarProduto } from '../tools/buscar-produto/prompt-buscar-produto.js';
import { executarBuscarProduto } from '../tools/buscar-produto/executar-buscar-produto.js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.CHATGPT_API_KEY
});

/**
 * Processa a mensagem recebida e retorna a resposta completa
 * ARQUITETURA MODULAR COM TOOLS
 */
async function processarMensagemRecebida(mensagemUsuario, numeroUsuario) {
    try {
        console.log('\n╔══════════════════════════════════════════════╗');
        console.log('║  🧠 PROCESSAMENTO MODULAR COM IA + TOOLS     ║');
        console.log('╚══════════════════════════════════════════════╝');
        console.log('📥 Mensagem:', mensagemUsuario);
        console.log('👤 Usuário:', numeroUsuario);
        
        // ===================================================================
        // ETAPA 1: IDENTIFICAR INTENÇÃO (qual ação executar)
        // ===================================================================
        console.log('\n🤖 Etapa 1: Identificando intenção...');
        
        const promptIntencao = carregarPromptInterpretarIntencao();
        
        const completionIntencao = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: promptIntencao },
                { role: "user", content: mensagemUsuario }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" }
        });

        const intencao = JSON.parse(completionIntencao.choices[0].message.content);
        
        console.log('✅ Intenção:', intencao.acao);
        console.log('🎯 Confiança:', intencao.confianca);

        // Se for apenas conversa
        if (intencao.acao === 'conversa') {
            console.log('💬 Tipo: Conversa simples');
            console.log('╚══════════════════════════════════════════════╝\n');
            return 'Olá! Sou o assistente da Dana Jalecos. 👔\n\nPosso ajudá-lo a encontrar jalecos e gorros profissionais!\n\nO que você procura?';
        }

        // ===================================================================
        // ETAPA 2: TOOL MONTA REQUISIÇÃO DINAMICAMENTE
        // ===================================================================
        console.log('\n🛠️ Etapa 2: Tool montando requisição...');
        
        let requisicaoMontada;
        
        if (intencao.acao === 'buscar_produto') {
            const promptBusca = carregarPromptBuscarProduto();
            
            console.log('📤 IA montando parâmetros da busca...');
            
            const completionBusca = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: promptBusca },
                    { role: "user", content: mensagemUsuario }
                ],
                temperature: 0.5,
                response_format: { type: "json_object" }
            });
            
            requisicaoMontada = JSON.parse(completionBusca.choices[0].message.content);
            console.log('✅ Requisição montada:', JSON.stringify(requisicaoMontada, null, 2));
        } else {
            throw new Error(`Ação não suportada: ${intencao.acao}`);
        }

        // ===================================================================
        // ETAPA 3: EXECUTAR TOOL ESPECÍFICA
        // ===================================================================
        console.log('\n⚡ Etapa 3: Executando tool...');
        
        let dadosMagazord;
        try {
            if (intencao.acao === 'buscar_produto') {
                dadosMagazord = await executarBuscarProduto(requisicaoMontada);
                console.log('✅ Tool executada com sucesso!');
                console.log(`📦 ${dadosMagazord.data.items.length} produtos retornados`);
            }
        } catch (error) {
            console.error('⚠️ Erro ao executar tool:', error.message);
            console.log('╚══════════════════════════════════════════════╝\n');
            
            return `Desculpe, estou com dificuldade para acessar nosso catálogo neste momento. 😔\n\nPor favor, tente novamente em alguns instantes ou entre em contato diretamente conosco.\n\n📞 WhatsApp: +55 83 98751-6699\n🌐 Site: danajalecos.com.br`;
        }

        // ===================================================================
        // ETAPA 4: IA FORMATA RESPOSTA HUMANIZADA COM LINKS
        // ===================================================================
        console.log('\n💬 Etapa 4: Formatando resposta...');
        const respostaFormatada = await formatarRespostaComLinks(
            mensagemUsuario, 
            requisicaoMontada,
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
 * Formata resposta com produtos e links do site
 */
async function formatarRespostaComLinks(mensagemOriginal, requisicao, dadosMagazord) {
    console.log('🎨 Formatando resposta final com links...');
    
    const promptSistema = `Você é um assistente de vendas da Dana Jalecos, especializado em produtos profissionais.

## SUA TAREFA
Formate uma resposta amigável e profissional para WhatsApp com os produtos encontrados.

## REGRAS IMPORTANTES:
1. **SEMPRE inclua os links** dos produtos usando os dados fornecidos
2. Mostre até 3 produtos com: nome, link
3. Use emojis para deixar amigável
4. Seja conciso e direto
5. Incentive o cliente a clicar nos links

## FORMATO DA RESPOSTA:
[Saudação baseada no que o cliente pediu]

🔹 [Nome do Produto 1]
🔗 [Link do produto 1]

🔹 [Nome do Produto 2]
🔗 [Link do produto 2]

📱 Qualquer dúvida, estou à disposição!

## DADOS IMPORTANTES:
- NÃO invente produtos ou links
- USE APENAS os dados fornecidos
- Se não houver produtos, seja educado e sugira alternativas
`;
    
    const promptUsuario = `Mensagem do cliente: "${mensagemOriginal}"

Produtos encontrados:
${JSON.stringify(dadosMagazord.data.items.slice(0, 3), null, 2)}

Formate a resposta incluindo os links (campo "link" de cada produto).`;

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: promptSistema },
            { role: "user", content: promptUsuario }
        ],
        temperature: 0.7
    });

    return completion.choices[0].message.content;
}

export { processarMensagemRecebida };
