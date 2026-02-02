import { buscarProdutosNoCatalogo, buscarProdutosSimilares } from '../../catalogos/buscar-no-catalogo.js';
import { verificarDisponibilidadeMagazord, extrairCoresTamanhosDisponiveis } from '../../catalogos/verificar-magazord.js';

/**
 * 🛠️ TOOL: BUSCAR PRODUTO NO CATÁLOGO
 * 
 * Busca produtos no catálogo local (masculino.json) e verifica
 * disponibilidade real no sistema Magazord
 */

/**
 * Formata resposta de produtos para o cliente
 */
function formatarRespostaProduto(resultado) {
    const { produto, disponivel, motivo, coresDisponiveis, tamanhosDisponiveis, preco, link, derivacoesCompativeis } = resultado;
    
    if (!disponivel) {
        return {
            sucesso: false,
            mensagem: `❌ ${produto.nome}\n${motivo}`,
            produto
        };
    }
    
    let mensagem = `✅ *${produto.nome}*\n\n`;
    
    if (produto.descricao) {
        mensagem += `📝 ${produto.descricao}\n\n`;
    }
    
    mensagem += `💰 *Preço:* ${preco}\n\n`;
    
    if (coresDisponiveis && coresDisponiveis.length > 0) {
        mensagem += `🎨 *Cores disponíveis:*\n${coresDisponiveis.map(c => `   • ${c}`).join('\n')}\n\n`;
    }
    
    if (tamanhosDisponiveis && tamanhosDisponiveis.length > 0) {
        mensagem += `📏 *Tamanhos disponíveis:*\n${tamanhosDisponiveis.join(', ')}\n\n`;
    }
    
    if (derivacoesCompativeis && derivacoesCompativeis.length > 0) {
        mensagem += `✔️ *Variações disponíveis:* ${derivacoesCompativeis.length}\n\n`;
    }
    
    mensagem += `🔗 *Ver no site:* ${link}`;
    
    return {
        sucesso: true,
        mensagem,
        produto,
        disponibilidade: resultado
    };
}

/**
 * Executa busca de produto no catálogo
 * @param {object} parametros - Parâmetros da busca
 * @param {Array<string>} produtosJaMostrados - Lista de nomes de produtos já mostrados (para não repetir)
 * @returns {Promise<object>} Resultado da busca
 */
export async function executarBuscarProdutoCatalogo(parametros, produtosJaMostrados = []) {
    console.log('\n🔧 TOOL: buscar_produto_catalogo');
    console.log('📥 Parâmetros:', parametros);
    if (produtosJaMostrados.length > 0) {
        console.log('⚠️ Produtos já mostrados (EVITAR):', produtosJaMostrados);
    }
    
    const {
        textoBusca,
        corEspecifica = null,
        tamanhoEspecifico = null,
        limite = 4  // Aumentado de 3 para 4
    } = parametros;
    
    try {
        // 1. Buscar no catálogo local
        console.log(`\n🔍 Buscando "${textoBusca}" no catálogo...`);
        let produtosEncontrados = buscarProdutosNoCatalogo(textoBusca, { limite });
        
        // SE NÃO ENCONTROU NADA, tenta busca mais genérica
        if (produtosEncontrados.length === 0) {
            console.log('⚠️ Nenhum resultado. Tentando busca genérica...');
            
            // Extrair apenas o tipo de produto
            const palavras = textoBusca.toLowerCase().split(' ');
            const tipos = ['jaleco', 'scrub', 'gorro', 'touca', 'uniforme', 'avental', 'calca', 'blusa'];
            
            for (const tipo of tipos) {
                if (palavras.includes(tipo)) {
                    console.log(`🔄 Buscando apenas "${tipo}"...`);
                    produtosEncontrados = buscarProdutosNoCatalogo(tipo, { limite });
                    break;
                }
            }
        }
        
        if (produtosEncontrados.length === 0) {
            return {
                sucesso: false,
                tipo: 'nao_encontrado',
                mensagem: `😕 Não encontrei "${textoBusca}" no catálogo.\n\nTemos jalecos, scrubs e gorros. Quer ver algum desses?`,
                sugestoes: ['jaleco masculino', 'scrub masculino', 'gorro']
            };
        }
        
        console.log(`✅ Encontrados ${produtosEncontrados.length} produtos no catálogo`);
        
        // FILTRAR produtos já mostrados
        if (produtosJaMostrados.length > 0) {
            const produtosOriginais = produtosEncontrados.length;
            produtosEncontrados = produtosEncontrados.filter(produto => {
                // Verifica se o nome do produto já foi mostrado
                const nomeProduto = produto.nome.toLowerCase();
                const jaFoiMostrado = produtosJaMostrados.some(nomeJaMostrado => {
                    const nomeComparacao = nomeJaMostrado.toLowerCase();
                    return nomeProduto.includes(nomeComparacao) || nomeComparacao.includes(nomeProduto);
                });
                return !jaFoiMostrado;
            });
            
            if (produtosEncontrados.length < produtosOriginais) {
                console.log(`🚫 Filtrados ${produtosOriginais - produtosEncontrados.length} produtos já mostrados. Restam ${produtosEncontrados.length}`);
            }
            
            // Se filtrou TODOS, buscar mais produtos
            if (produtosEncontrados.length === 0) {
                console.log('⚠️ Todos produtos já foram mostrados! Buscando mais produtos...');
                produtosEncontrados = buscarProdutosNoCatalogo(textoBusca, { limite: limite * 2 });
                // Filtrar novamente com critério mais restritivo
                produtosEncontrados = produtosEncontrados.filter(produto => 
                    !produtosJaMostrados.some(nome => produto.nome.toLowerCase() === nome.toLowerCase())
                );
            }
        }
        
        if (produtosEncontrados.length === 0) {
            return {
                sucesso: false,
                tipo: 'todos_ja_mostrados',
                mensagem: `😅 Já mostrei todos os produtos disponíveis com essas características!\n\nQuer tentar uma busca diferente? Talvez outra cor ou modelo?`
            };
        }
        
        // 2. Verificar disponibilidade no Magazord (MAS SEMPRE MOSTRAR PRODUTOS DO CATÁLOGO!)
        const resultados = [];
        
        for (const produto of produtosEncontrados) {
            console.log(`\n📦 Verificando: ${produto.nome}...`);
            
            const disponibilidade = await verificarDisponibilidadeMagazord(
                produto,
                corEspecifica,
                tamanhoEspecifico
            );
            
            // SEMPRE adiciona o produto, MESMO SE NÃO ENCONTROU NO MAGAZORD
            // Usamos informações do catálogo como fallback
            if (disponibilidade.disponivel) {
                resultados.push(formatarRespostaProduto(disponibilidade));
            } else {
                // FALLBACK: Mostrar produto do catálogo mesmo sem verificação Magazord
                console.log(`   ⚠️ Magazord: ${disponibilidade.motivo} - Mostrando info do catálogo`);
                resultados.push(formatarRespostaProduto({
                    disponivel: true,  // Considera disponível baseado no catálogo
                    produto,
                    coresDisponiveis: [],
                    tamanhosDisponiveis: produto.tamanhos || [],
                    preco: produto.preco,
                    link: produto.link,
                    imagem: produto.imagem
                }));
            }
        }
        
        if (resultados.length === 0) {
            return {
                sucesso: false,
                tipo: 'sem_disponibilidade',
                mensagem: corEspecifica || tamanhoEspecifico
                    ? `😕 Encontrei o produto mas não está disponível ${corEspecifica ? `na cor ${corEspecifica}` : ''} ${tamanhoEspecifico ? `no tamanho ${tamanhoEspecifico}` : ''}.\n\nQuer ver outras opções?`
                    : `😕 Infelizmente esses produtos não estão disponíveis no momento.\n\nPosso buscar algo diferente?`
            };
        }
        
        // 3. Montar resposta final
        let mensagemFinal = '';
        
        if (resultados.length === 1) {
            mensagemFinal = `Encontrei esse produto disponível:\n\n${resultados[0].mensagem}`;
        } else {
            mensagemFinal = `Encontrei ${resultados.length} opções disponíveis:\n\n`;
            mensagemFinal += resultados.map((r, idx) => `*${idx + 1}.* ${r.mensagem}`).join('\n\n─────────────────\n\n');
        }
        
        return {
            sucesso: true,
            tipo: 'produtos_encontrados',
            mensagem: mensagemFinal,
            produtos: resultados.map(r => r.produto),
            quantidade: resultados.length
        };
        
    } catch (error) {
        console.error('❌ Erro ao buscar produto:', error);
        return {
            sucesso: false,
            tipo: 'erro',
            mensagem: '😕 Ops, tive um problema ao buscar. Pode tentar novamente?',
            erro: error.message
        };
    }
}

/**
 * Executa busca de produtos similares
 * @param {object} parametros - Parâmetros da busca
 * @returns {Promise<object>} Resultado da busca
 */
export async function executarBuscarSimilares(parametros) {
    console.log('\n🔧 TOOL: buscar_similares');
    console.log('📥 Parâmetros:', parametros);
    
    const { produtoReferencia, limite = 3 } = parametros;
    
    try {
        // Buscar o produto de referência
        console.log(`\n🔍 Buscando produto de referência: ${produtoReferencia}`);
        const produtosRef = buscarProdutosNoCatalogo(produtoReferencia, { limite: 1 });
        
        if (produtosRef.length === 0) {
            return {
                sucesso: false,
                mensagem: '😕 Não encontrei o produto de referência.'
            };
        }
        
        const produtoBase = produtosRef[0];
        console.log(`✅ Produto base: ${produtoBase.nome}`);
        
        // Buscar similares
        const similares = buscarProdutosSimilares(produtoBase, limite);
        
        if (similares.length === 0) {
            return {
                sucesso: false,
                mensagem: '😕 Não encontrei produtos similares no momento.'
            };
        }
        
        console.log(`✅ Encontrados ${similares.length} produtos similares`);
        
        // Verificar disponibilidade dos similares
        const resultados = [];
        
        for (const produto of similares) {
            const disponibilidade = await verificarDisponibilidadeMagazord(produto);
            
            if (disponibilidade.disponivel) {
                resultados.push(formatarRespostaProduto(disponibilidade));
            }
        }
        
        if (resultados.length === 0) {
            return {
                sucesso: false,
                mensagem: '😕 Os produtos similares não estão disponíveis no momento.'
            };
        }
        
        let mensagemFinal = `Produtos similares que você pode gostar:\n\n`;
        mensagemFinal += resultados.map((r, idx) => `*${idx + 1}.* ${r.mensagem}`).join('\n\n─────────────────\n\n');
        
        return {
            sucesso: true,
            mensagem: mensagemFinal,
            produtos: resultados.map(r => r.produto),
            quantidade: resultados.length
        };
        
    } catch (error) {
        console.error('❌ Erro ao buscar similares:', error);
        return {
            sucesso: false,
            mensagem: '😕 Ops, tive um problema. Pode tentar novamente?',
            erro: error.message
        };
    }
}

/**
 * Extrai apenas cores ou tamanhos disponíveis
 */
export async function executarListarCoresTamanhos(parametros) {
    console.log('\n🔧 TOOL: listar_cores_tamanhos');
    console.log('📥 Parâmetros:', parametros);
    
    const { textoBusca, tipo = 'ambos' } = parametros; // tipo: 'cores', 'tamanhos', 'ambos'
    
    try {
        const produtosEncontrados = buscarProdutosNoCatalogo(textoBusca, { limite: 1 });
        
        if (produtosEncontrados.length === 0) {
            return {
                sucesso: false,
                mensagem: `😕 Não encontrei "${textoBusca}".`
            };
        }
        
        const produto = produtosEncontrados[0];
        const info = await extrairCoresTamanhosDisponiveis(produto);
        
        if (!info.disponivel) {
            return {
                sucesso: false,
                mensagem: `😕 ${produto.nome} não está disponível no momento.`
            };
        }
        
        let mensagem = `*${produto.nome}*\n\n`;
        
        if (tipo === 'cores' || tipo === 'ambos') {
            if (info.cores.length > 0) {
                mensagem += `🎨 *Cores disponíveis:*\n${info.cores.map(c => `   • ${c}`).join('\n')}\n\n`;
            } else {
                mensagem += `🎨 Sem informação de cores.\n\n`;
            }
        }
        
        if (tipo === 'tamanhos' || tipo === 'ambos') {
            if (info.tamanhos.length > 0) {
                mensagem += `📏 *Tamanhos disponíveis:*\n${info.tamanhos.join(', ')}`;
            } else {
                mensagem += `📏 Sem informação de tamanhos.`;
            }
        }
        
        return {
            sucesso: true,
            mensagem,
            cores: info.cores,
            tamanhos: info.tamanhos
        };
        
    } catch (error) {
        console.error('❌ Erro ao listar cores/tamanhos:', error);
        return {
            sucesso: false,
            mensagem: '😕 Ops, tive um problema.',
            erro: error.message
        };
    }
}
