import 'dotenv/config';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Carrega catálogos JSON
 */
function carregarCatalogos() {
  const catalogosDir = path.join(process.cwd(), 'catalogos', 'produtos');
  
  const catalogos = {};
  const arquivos = ['jaleco.json', 'scrub.json', 'gorro.json', 'robe.json', 'macacao.json'];
  
  for (const arquivo of arquivos) {
    try {
      const caminho = path.join(catalogosDir, arquivo);
      const dados = JSON.parse(fs.readFileSync(caminho, 'utf-8'));
      const tipo = arquivo.replace('.json', '');
      catalogos[tipo] = dados;
    } catch (erro) {
      console.error(`⚠️ Erro ao carregar ${arquivo}:`, erro.message);
    }
  }
  
  return catalogos;
}

/**
 * Busca inteligente de produtos usando IA + catálogo
 */
export async function buscarProdutosComIA(contexto, historico = []) {
  try {
    console.log('🔍 Iniciando busca inteligente com IA...');
    console.log('📋 Contexto:', JSON.stringify(contexto));
    
    // Carregar catálogo do tipo solicitado
    const catalogos = carregarCatalogos();
    const tipo = contexto.tipo?.toLowerCase();
    
    if (!tipo || !catalogos[tipo]) {
      console.log('❌ Tipo de produto não encontrado ou inválido');
      return {
        sucesso: false,
        erro: 'Tipo de produto não encontrado',
        sugestao: 'Especifique o tipo de produto: jaleco, scrub, gorro, robe ou macacão'
      };
    }
    
    const catalogo = catalogos[tipo];
    console.log(`📚 Catálogo carregado: ${tipo} (${catalogo.produtos?.length || 0} produtos)`);
    
    // Preparar resumo do catálogo para a IA
    const cores = catalogo[`coresDe${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`] || [];
    const modelos = catalogo[`modelosDe${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`] || [];
    
    // Pegar amostra de produtos FILTRADOS (máximo 20 para não estourar tokens)
    let produtosParaIA = catalogo.produtos || [];
    
    // PRÉ-FILTRAR por sexo se especificado
    if (contexto.genero) {
      const sexoFiltro = contexto.genero.toLowerCase() === 'masculino' ? 'Masculino' : 
                         contexto.genero.toLowerCase() === 'feminino' ? 'Feminino' : null;
      if (sexoFiltro) {
        produtosParaIA = produtosParaIA.filter(p => p.sexo === sexoFiltro);
        console.log(`🔍 PRÉ-FILTRO aplicado: sexo=${sexoFiltro} (${produtosParaIA.length} produtos)`);
      }
    }
    
    // PRÉ-FILTRAR por cor se especificada
    if (contexto.cor) {
      const corBuscada = contexto.cor.toLowerCase();
      console.log(`🎨 Buscando cor: "${contexto.cor}"`);
      
      produtosParaIA = produtosParaIA.filter(p => {
        // Verificar nas cores disponíveis do produto
        const temCorExata = p.coresDisponiveis?.some(c => {
          const corNormalizada = c.toLowerCase();
          // Match EXATO prioritário
          if (corNormalizada === corBuscada) return true;
          // Match parcial (mas não pegar verde claro quando busca verde escuro)
          if (corBuscada.includes('claro') || corBuscada.includes('escuro') || 
              corBuscada.includes('bebe') || corBuscada.includes('marinho')) {
            // Para cores específicas, exigir match exato
            return corNormalizada === corBuscada;
          }
          // Para cores simples (azul, verde, etc), aceitar que contenha
          return corNormalizada.includes(corBuscada);
        });
        
        // Verificar no nome do produto
        const temCorNoNome = p.nome?.toLowerCase().includes(corBuscada);
        
        return temCorExata || temCorNoNome;
      });
      
      console.log(`🔍 PRÉ-FILTRO aplicado: cor="${contexto.cor}" → ${produtosParaIA.length} produtos encontrados`);
      
      if (produtosParaIA.length === 0) {
        console.log(`⚠️ NENHUM produto com cor "${contexto.cor}"! Cores disponíveis:`, 
                    [...new Set(catalogo.produtos?.flatMap(p => p.coresDisponiveis || []))].slice(0, 20));
      }
    }
    
    const produtosAmostra = produtosParaIA.slice(0, 20).map(p => ({
      codigo: p.codigoProduto,
      nome: p.nome,
      sexo: p.sexo,
      cores: p.coresDisponiveis,
      modelo: p.modelo,
      preco: p.preco
    }));
    
    // Construir prompt para IA
    const historicoTexto = historico.slice(-5).map(h => 
      `${h.role === 'bot' ? 'Bot' : 'Cliente'}: ${h.mensagem}`
    ).join('\n');
    
    const prompt = `Você é um vendedor EXPERT de produtos médicos.

CONTEXTO DO CLIENTE: ${JSON.stringify(contexto, null, 2)}

HISTÓRICO DA CONVERSA:
${historicoTexto}

CATÁLOGO DISPONÍVEL:
- Tipo: ${tipo}
- Total de produtos: ${catalogo.produtos?.length || 0}
- Cores disponíveis: ${cores.slice(0, 15).join(', ')}
- Modelos: ${modelos.slice(0, 10).join(', ')}

AMOSTRA DE PRODUTOS:
${JSON.stringify(produtosAmostra, null, 2)}

TAREFA:
1. Analise o que o cliente QUER (sexo, cor, manga, etc)
2. Filtre RIGOROSAMENTE por sexo se especificado
3. Filtre RIGOROSAMENTE por cor se especificada
4. Recomende até 3 produtos que REALMENTE SE ENCAIXAM
5. Explique POR QUE recomendou cada um

Retorne JSON:
{
  "produtosRecomendados": [
    {
      "codigoProduto": "código",
      "nome": "nome do produto",
      "motivo": "por que recomendou",
      "match": 95
    }
  ],
  "filtrosAplicados": {
    "sexo": "masculino|feminino|unissex",
    "cor": "cor filtrada ou null",
    "manga": "curta|longa ou null"
  },
  "mensagemCliente": "texto amigável explicando as sugestões",
  "perguntasAdicionais": ["perguntas para refinar busca"]
}

REGRAS ABSOLUTAS:
- Se cliente especificou "masculino", retorne APENAS produtos sexo=Masculino
- Se cliente especificou "feminino", retorne APENAS produtos sexo=Feminino
- Se cliente especificou cor EXATA, filtre APENAS por ela
- Se não especificou sexo, pode sugerir ambos
- Priorize match 100% (todos filtros batem) sobre parcial
- Se não houver match perfeito, retorne os MAIS PRÓXIMOS
- Mensagem deve ser HUMANIZADA, AMIGÁVEL e HONESTA

RETORNE APENAS JSON SEM MARKDOWN.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Você é um assistente que retorna APENAS JSON válido." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const resposta = completion.choices[0].message.content.trim();
    let json = resposta.replace(/```json|```/g, '').trim();
    const resultado = JSON.parse(json);
    
    // Buscar produtos completos do catálogo
    const produtosCompletos = resultado.produtosRecomendados.map(rec => {
      const produtoCompleto = catalogo.produtos.find(p => p.codigoProduto === rec.codigoProduto);
      return produtoCompleto ? { ...produtoCompleto, motivoRecomendacao: rec.motivo, matchScore: rec.match } : null;
    }).filter(Boolean);
    
    console.log(`✅ IA encontrou ${produtosCompletos.length} produtos recomendados`);
    
    return {
      sucesso: true,
      produtos: produtosCompletos,
      filtrosAplicados: resultado.filtrosAplicados,
      mensagemIA: resultado.mensagemCliente,
      perguntasAdicionais: resultado.perguntasAdicionais || []
    };
    
  } catch (erro) {
    console.error('❌ Erro na busca com IA:', erro.message);
    return {
      sucesso: false,
      erro: erro.message,
      produtos: []
    };
  }
}

/**
 * Formata produtos para envio ao cliente
 */
export function formatarProdutosIA(resultadoBusca) {
  if (!resultadoBusca.sucesso || !resultadoBusca.produtos?.length) {
    return '😔 Não encontrei produtos que correspondam às suas preferências.\n\nPoderia me dar mais detalhes sobre o que procura?';
  }
  
  let mensagem = `${resultadoBusca.mensagemIA}\n\n`;
  
  resultadoBusca.produtos.forEach((produto, index) => {
    mensagem += `━━━━━━━━━━━━━━━━━━━━\n`;
    mensagem += `📦 *${index + 1}. ${produto.nome}*\n\n`;
    mensagem += `💡 *Por que recomendei:* ${produto.motivoRecomendacao}\n`;
    mensagem += `🎯 Match: ${produto.matchScore}%\n\n`;
    
    if (produto.descricaoCompleta) {
      const descricao = produto.descricaoCompleta.substring(0, 200);
      mensagem += `📝 ${descricao}...\n\n`;
    }
    
    if (produto.coresDisponiveis?.length) {
      mensagem += `🎨 Cores: ${produto.coresDisponiveis.slice(0, 5).join(', ')}\n`;
    }
    
    if (produto.preco) {
      mensagem += `💰 ${produto.preco}\n`;
    }
    
    mensagem += `🔗 Ver detalhes: ${produto.url || 'https://danajalecos.com.br'}\n`;
  });
  
  if (resultadoBusca.perguntasAdicionais?.length) {
    mensagem += `\n\n❓ *Posso ajudar mais:*\n`;
    resultadoBusca.perguntasAdicionais.forEach(p => {
      mensagem += `• ${p}\n`;
    });
  }
  
  return mensagem;
}
