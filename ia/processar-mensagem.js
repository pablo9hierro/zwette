import 'dotenv/config';
import OpenAI from 'openai';
import { promptAtendimentoHumanizado } from './prompt-atendimento-humanizado.js';
import { executarBuscarProdutoCatalogo, executarBuscarSimilares, executarListarCoresTamanhos } from '../tools/buscar-produto-catalogo/executar-buscar-produto-catalogo.js';
import { buscarHistoricoConversa, salvarMensagemConversa, encerrarConversa } from '../db/memoria-conversa.js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.CHATGPT_API_KEY
});

/**
 * Filtra produtos por COR (busca em nome do produto e derivações)
 */
function filtrarPorCor(dadosMagazord, cor) {
    if (!cor) return dadosMagazord;
    
    const corLower = cor.toLowerCase();
    const produtosFiltrados = dadosMagazord.data.items.filter(produto => {
        // Verifica nome do produto
        if (produto.nome?.toLowerCase().includes(corLower)) return true;
        
        // Verifica derivações
        if (produto.derivacoes) {
            return produto.derivacoes.some(deriv => 
                deriv.nome?.toLowerCase().includes(corLower)
            );
        }
        return false;
    });
    
    return {
        ...dadosMagazord,
        data: {
            ...dadosMagazord.data,
            items: produtosFiltrados
        }
    };
}

/**
 * Filtra produtos por TAMANHO
 */
function filtrarPorTamanho(dadosMagazord, tamanho) {
    if (!tamanho) return dadosMagazord;
    
    const tamanhoUpper = tamanho.toUpperCase();
    const produtosFiltrados = dadosMagazord.data.items.filter(produto => {
        if (produto.nome?.toUpperCase().includes(tamanhoUpper)) return true;
        
        if (produto.derivacoes) {
            return produto.derivacoes.some(deriv => 
                deriv.nome?.toUpperCase().includes(tamanhoUpper)
            );
        }
        return false;
    });
    
    return {
        ...dadosMagazord,
        data: {
            ...dadosMagazord.data,
            items: produtosFiltrados
        }
    };
}

/**
 * Filtra produtos por SEXO (masculino, feminino, unissex)
 */
function filtrarPorSexo(dadosMagazord, sexo) {
    if (!sexo) return dadosMagazord;
    
    const sexoLower = sexo.toLowerCase();
    const produtosFiltrados = dadosMagazord.data.items.filter(produto => {
        if (produto.nome?.toLowerCase().includes(sexoLower)) return true;
        
        if (produto.derivacoes) {
            return produto.derivacoes.some(deriv => 
                deriv.nome?.toLowerCase().includes(sexoLower)
            );
        }
        return false;
    });
    
    return {
        ...dadosMagazord,
        data: {
            ...dadosMagazord.data,
            items: produtosFiltrados
        }
    };
}
/**
 * Processa a mensagem recebida COM SISTEMA DE MEMÓRIA
 * @param {string} mensagemUsuario - Mensagem do cliente
 * @param {string} numeroUsuario - Número WhatsApp do cliente
 * @returns {Promise<string>} Resposta formatada
 */
async function processarMensagemRecebida(mensagemUsuario, numeroUsuario) {
    try {
        console.log('\n╔══════════════════════════════════════════════╗');
        console.log('║  🧠 PROCESSAMENTO COM MEMÓRIA + IA + TOOLS  ║');
        console.log('╚══════════════════════════════════════════════╝');
        console.log('📥 Mensagem:', mensagemUsuario);
        console.log('👤 Usuário:', numeroUsuario);
        
        // ===================================================================
        // ETAPA 0: BUSCAR HISTÓRICO DE CONVERSA (MEMÓRIA)
        // ===================================================================
        console.log('\n💾 Etapa 0: Buscando memória da conversa...');
        const { eNovaConversa, historico, resumo, conversaId } = await buscarHistoricoConversa(numeroUsuario);
        
        if (eNovaConversa) {
            console.log('✨ Nova conversa iniciada!');
        } else {
            console.log(`📚 Conversa em andamento (${historico.length} mensagens no contexto)`);
            if (resumo) {
                console.log(`📝 Resumo: ${resumo.substring(0, 100)}...`);
            }
        }

        // ===================================================================
        // ETAPA 1: INTERPRETAR INTENÇÃO COM CONTEXTO (PROMPT HUMANIZADO)
        // ===================================================================
        console.log('\n🤖 Etapa 1: Interpretando intenção com atendimento humanizado...');
        
        // EXTRAIR produtos já mostrados do histórico (para não repetir)
        const produtosJaMostrados = [];
        for (const msg of historico) {
            if (msg.tipo === 'assistente') {
                const conteudo = msg.conteudo;
                // Buscar padrões como "✅ *Jaleco Masculino Manoel Bege*"
                const regexProdutos = /(?:✅|\d+\.)\s*\*?([^*\n]+(?:Jaleco|Scrub|Gorro|Touca)[^*\n]+)\*?/gi;
                let match;
                while ((match = regexProdutos.exec(conteudo)) !== null) {
                    const nomeProduto = match[1].trim();
                    if (!produtosJaMostrados.includes(nomeProduto)) {
                        produtosJaMostrados.push(nomeProduto);
                    }
                }
            }
        }
        
        if (produtosJaMostrados.length > 0) {
            console.log('📝 Produtos já mostrados nesta conversa:', produtosJaMostrados);
        }
        
        const promptHumanizado = promptAtendimentoHumanizado(mensagemUsuario, historico, resumo);
        
        const completionIntencao = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: promptHumanizado }
            ],
            temperature: 1.2,  // AUMENTADO de 0.8 para 1.2 - mais criativo!
            response_format: { type: "json_object" }
        });

        const analise = JSON.parse(completionIntencao.choices[0].message.content);
        
        console.log('✅ Análise:', {
            estadoConversa: analise.estadoConversa,
            acao: analise.acao,
            contexto: analise.contexto,
            tom: analise.tom
        });

        // ===================================================================
        // ETAPA 2: PROCESSAR AÇÃO (NOVO FLUXO HUMANIZADO)
        // ===================================================================
        let respostaFinal;

        // Se cliente quer encerrar
        if (analise.querEncerrar && conversaId) {
            console.log('\n👋 Encerrando conversa...');
            await encerrarConversa(conversaId);
            respostaFinal = analise.mensagemParaCliente || 
                'Foi um prazer atendê-lo! 😊\n\nFique à vontade para voltar sempre que precisar.\n\n👔 Dana Jalecos - Qualidade em roupas profissionais!';
        }
        // Se é apenas conversa (coleta de informações)
        else if (analise.acao === 'conversar') {
            console.log('\n💬 Etapa 2: Continuando conversa...');
            respostaFinal = analise.mensagemParaCliente;
        }
        // Se cliente quer listar tipos/modelos disponíveis (SEM busca completa)
        else if (analise.acao === 'listar_tipos_produtos') {
            console.log('\n📋 Etapa 2: Listando tipos de produtos...');
            
            const tipoProduto = analise.parametros?.tipoProduto?.toLowerCase() || 'produto';
            
            // Listar tipos disponíveis no catálogo SEM fazer busca completa
            let listaTipos = '';
            if (tipoProduto.includes('gorro') || tipoProduto.includes('touca')) {
                listaTipos = `Temos vários tipos de gorros:\n\n` +
                    `• Gorro simples (liso)\n` +
                    `• Gorro com pregas\n` +
                    `• Gorro estampado\n` +
                    `• Touca cirúrgica\n\n` +
                    `Qual desses você se interessou mais? Posso pesquisar o mais adequado para você! 😊`;
            } else if (tipoProduto.includes('jaleco')) {
                listaTipos = `Temos vários modelos de jalecos masculinos:\n\n` +
                    `• Jaleco clássico\n` +
                    `• Jaleco manga curta\n` +
                    `• Jaleco manga longa\n` +
                    `• Jaleco com gola\n` +
                    `• Jaleco estilo avental\n\n` +
                    `Qual estilo você prefere? Posso buscar as melhores opções! 😊`;
            } else if (tipoProduto.includes('scrub')) {
                listaTipos = `Temos vários estilos de scrubs:\n\n` +
                    `• Scrub tradicional\n` +
                    `• Scrub cirúrgico\n` +
                    `• Scrub estampado\n` +
                    `• Conjunto completo\n\n` +
                    `Qual você prefere? Posso pesquisar para você! 😊`;
            } else {
                listaTipos = `Temos vários produtos disponíveis:\n\n` +
                    `• Jalecos (diversos modelos)\n` +
                    `• Scrubs (vários estilos)\n` +
                    `• Gorros e toucas\n\n` +
                    `Qual produto te interessa mais?`;
            }
            
            respostaFinal = analise.mensagemParaCliente 
                ? `${analise.mensagemParaCliente}\n\n${listaTipos}`
                : listaTipos;
        }
        // Se precisa buscar produto no catálogo
        else if (analise.acao === 'buscar_produto_catalogo') {
            console.log('\n🛠️ Etapa 2: Buscando no catálogo...');
            
            try {
                const resultado = await executarBuscarProdutoCatalogo(analise.parametros, produtosJaMostrados);
                
                if (resultado.sucesso) {
                    // Adicionar mensagem personalizada antes dos produtos
                    respostaFinal = analise.mensagemParaCliente 
                        ? `${analise.mensagemParaCliente}\n\n${resultado.mensagem}`
                        : resultado.mensagem;
                } else {
                    // Usar mensagem de erro do resultado ou mensagem do prompt
                    respostaFinal = resultado.mensagem || analise.mensagemParaCliente || 
                        '😕 Não encontrei esse produto. Posso ajudar com outro?';
                }
                
            } catch (error) {
                console.error('⚠️ Erro ao buscar produtos:', error.message);
                respostaFinal = '😕 Ops, tive um problema ao buscar. Pode tentar novamente?';
            }
        }
        // Se precisa buscar produtos similares
        else if (analise.acao === 'buscar_similares') {
            console.log('\n🔍 Etapa 2: Buscando similares...');
            
            try {
                const resultado = await executarBuscarSimilares(analise.parametros);
                
                if (resultado.sucesso) {
                    respostaFinal = analise.mensagemParaCliente 
                        ? `${analise.mensagemParaCliente}\n\n${resultado.mensagem}`
                        : resultado.mensagem;
                } else {
                    respostaFinal = resultado.mensagem || '😕 Não encontrei produtos similares no momento.';
                }
                
            } catch (error) {
                console.error('⚠️ Erro ao buscar similares:', error.message);
                respostaFinal = '😕 Ops, tive um problema. Pode tentar novamente?';
            }
        }
        // Ação desconhecida
        else {
            console.log('⚠️ Ação desconhecida, usando mensagem do prompt');
            respostaFinal = analise.mensagemParaCliente || 
                'Olá! Sou o assistente da Dana Jalecos. 👔\n\nPosso ajudá-lo a encontrar jalecos e roupas profissionais!\n\nO que você procura?';
        }

        // ===================================================================
        // ETAPA 3: SALVAR NA MEMÓRIA
        // ===================================================================
        console.log('\n💾 Etapa 3: Salvando na memória...');
        const novoResumo = analise.contexto || 'Cliente em atendimento';
        
        await salvarMensagemConversa(
            numeroUsuario,
            mensagemUsuario,
            respostaFinal,
            novoResumo,
            conversaId
        );
        
        console.log('✅ Conversa salva!');
        console.log('╚══════════════════════════════════════════════╝\n');
        
        return respostaFinal;

    } catch (error) {
        console.error('\n❌ ERRO CRÍTICO ao processar mensagem:');
        console.error('   Tipo:', error.name);
        console.error('   Mensagem:', error.message);
        console.error('   Stack:', error.stack);
        console.log('╚══════════════════════════════════════════════╝\n');
        throw error;
    }
}

export { processarMensagemRecebida };
