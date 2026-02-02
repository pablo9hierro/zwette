/**
 * =====================================================
 * BLOCO 1: SAUDAÇÃO E IDENTIFICAÇÃO - JANA
 * Sistema de apresentação e captura de dados do cliente
 * =====================================================
 */

import { supabase } from '../db/supabase.js';
import { gerarListaTiposProdutosComRecomendacao } from './lista-enumerada.js';

/**
 * Gerencia o Bloco 1: Saudação e Identificação
 * - Apresenta a Jana
 * - Captura nome do cliente
 * - Captura profissão (opcional)
 */

/**
 * Gera mensagem de apresentação inicial (PARTE 1 - Auto apresentação)
 */
export function gerarMensagemApresentacao() {
  return `Olá! 👋 Meu nome é *Jana*, sou a assistente virtual da Dana Jalecos!

Estou aqui para te ajudar a encontrar o produto perfeito para você! 😊`;
}

/**
 * Gera mensagem pedindo o nome (PARTE 2 - Obrigatória)
 */
export function gerarMensagemPedirNome() {
  return `Para te atender melhor e personalizar suas recomendações, me diga:

*Como posso te chamar?* 😊`;
}

/**
 * Processa resposta do nome do cliente
 */
export function processarNomeCliente(mensagem) {
  // Extrair nome da mensagem
  // Remove saudações comuns e expressões de apresentação
  const mensagemLimpa = mensagem
    .toLowerCase()
    .replace(/^(oi|olá|ola|e ai|eai|bom dia|boa tarde|boa noite),?\s*/i, '')
    .replace(/meu nome é|me chamo|sou o|sou a|sou|pode me chamar de|pode chamar de/gi, '')
    .replace(/é o|é a/gi, '')
    .trim();
  
  // Pegar primeira palavra como nome (ou até 2 palavras para nomes compostos)
  const palavras = mensagemLimpa.split(' ').filter(p => p.length > 0);
  const nome = palavras.slice(0, 2).join(' ');
  
  // Capitalizar primeira letra de cada palavra
  return nome
    .split(' ')
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Gera mensagem perguntando profissão
 */
export function gerarMensagemProfissao(nomeCliente) {
  return `Legal, *${nomeCliente}*! 😊

Para te ajudar melhor, você é profissional de qual área?

Por exemplo:
• Biomedicina
• Dentista
• Enfermagem
• Estética
• Farmácia
• Fisioterapia
• Medicina
• Nutrição
• Pediatria
• Psicologia
• Veterinária

_(Ou pode dizer "não sei" / "pular" se preferir não informar)_`;
}

/**
 * Detecta profissão na mensagem do cliente
 */
export async function detectarProfissao(mensagem) {
  const mensagemLower = mensagem.toLowerCase();
  
  // Buscar no banco de dados de profissões
  try {
    const { data: profissoes, error } = await supabase
      .from('profissoes_catalogo')
      .select('nome, sinonimos, arquivo_catalogo, produtos_recomendados');
    
    if (error) {
      console.error('Erro ao buscar profissões:', error);
      return null;
    }
    
    // Procurar match exato ou nos sinônimos
    for (const prof of profissoes) {
      // Check nome
      if (mensagemLower.includes(prof.nome.toLowerCase())) {
        return prof;
      }
      
      // Check sinônimos
      if (prof.sinonimos) {
        for (const sinonimo of prof.sinonimos) {
          if (mensagemLower.includes(sinonimo.toLowerCase())) {
            return prof;
          }
        }
      }
    }
    
    return null;
  } catch (erro) {
    console.error('Erro ao detectar profissão:', erro);
    return null;
  }
}

/**
 * Verifica se cliente quer pular profissão
 */
export function querPularProfissao(mensagem) {
  const palavrasPular = [
    'nao sei',
    'não sei',
    'nao quero dizer',
    'não quero dizer',
    'pular',
    'pule',
    'skip',
    'proximo',
    'próximo',
    'tanto faz',
    'nenhuma',
    'nenhum'
  ];
  
  const mensagemLower = mensagem.toLowerCase();
  return palavrasPular.some(palavra => mensagemLower.includes(palavra));
}

/**
 * Gera mensagem quando profissão foi identificada
 */
export function gerarMensagemProfissaoIdentificada(nomeCliente, profissao) {
  return `Perfeito, *${nomeCliente}*! Vi que você é da área de *${profissao.nome}*! 👏

Vou te mostrar opções que são perfeitas para sua área! Vamos começar?`;
}

/**
 * Gera mensagem quando cliente não informou profissão
 */
export function gerarMensagemSemProfissao(nomeCliente) {
  return `Tudo bem, *${nomeCliente}*! 😊 Posso te ajudar do mesmo jeito!

Que tipo de produto você está procurando hoje?`;
}

/**
 * Identifica se mensagem contém saudação inicial
 */
export function eSaudacaoInicial(mensagem) {
  const saudacoes = [
    'oi',
    'olá',
    'ola',
    'e ai',
    'eai',
    'bom dia',
    'boa tarde',
    'boa noite',
    'opa',
    'hey',
    'hello'
  ];
  
  const mensagemLower = mensagem.toLowerCase().trim();
  return saudacoes.some(saudacao => 
    mensagemLower.startsWith(saudacao) || mensagemLower === saudacao
  );
}

/**
 * Valida se nome é válido
 */
export function nomeValido(nome) {
  if (!nome || nome.length < 2) return false;
  if (nome.length > 50) return false;
  
  // Não aceitar números ou caracteres especiais demais
  const caracteresEspeciais = /[^a-záàâãéèêíïóôõöúçñA-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s]/g;
  if (caracteresEspeciais.test(nome)) return false;
  
  return true;
}

/**
 * Atualiza apenas o nome do cliente no banco
 */
export async function atualizarNomeCliente(numeroUsuario, nomeCliente) {
  try {
    const { error } = await supabase
      .from('conversas')
      .update({
        nome_cliente: nomeCliente,
        data_ultima_interacao: new Date().toISOString()
      })
      .eq('numero_cliente', numeroUsuario)
      .eq('atendimento_encerrado', false);
    
    if (error) {
      console.error('Erro ao atualizar nome do cliente:', error);
      return false;
    }
    
    console.log('✅ Nome do cliente salvo:', nomeCliente);
    return true;
  } catch (erro) {
    console.error('Erro ao atualizar nome:', erro);
    return false;
  }
}

/**
 * Atualiza apenas a fase do atendimento no banco
 */
export async function atualizarFase(numeroUsuario, fase) {
  try {
    const { error } = await supabase
      .from('conversas')
      .update({
        fase_atendimento: fase,
        data_ultima_interacao: new Date().toISOString()
      })
      .eq('numero_cliente', numeroUsuario)
      .eq('atendimento_encerrado', false);
    
    if (error) {
      console.error('Erro ao atualizar fase:', error);
      return false;
    }
    
    console.log('✅ Fase atualizada para:', fase);
    return true;
  } catch (erro) {
    console.error('Erro ao atualizar fase:', erro);
    return false;
  }
}

/**
 * Salvar identificação completa no banco de dados
 */
export async function salvarIdentificacao(numeroUsuario, nomeCliente, profissao = null) {
  try {
    const { data, error } = await supabase
      .from('conversas')
      .update({
        nome_cliente: nomeCliente,
        profissao: profissao,
        fase_atendimento: 'filtro',
        data_ultima_interacao: new Date().toISOString()
      })
      .eq('numero_cliente', numeroUsuario)
      .eq('atendimento_encerrado', false)
      .select();
    
    if (error) {
      console.error('Erro ao salvar identificação:', error);
      return false;
    }
    
    console.log('✅ Identificação completa salva:', nomeCliente, profissao);
    return true;
  } catch (erro) {
    console.error('Erro ao salvar identificação:', erro);
    return false;
  }
}

/**
 * Fluxo completo do Bloco 1
 */
export async function processarBloco1(mensagem, contexto, numeroUsuario) {
  const resultado = {
    mensagem: '',
    contextoAtualizado: { ...contexto },
    proximaFase: 'identificacao'
  };
  
  // ETAPA 1: Se não tem nome ainda, está aguardando nome
  if (!contexto.nomeCliente) {
    // Processar nome diretamente (não responder saudações vazias)
    const nome = processarNomeCliente(mensagem);
    
    if (nomeValido(nome)) {
      resultado.contextoAtualizado.nomeCliente = nome;
      resultado.contextoAtualizado.caracteristicasMencionadas.push('nome');
      
      console.log('🔥 GERANDO LISTA DE PRODUTOS...');
      
      // Gerar lista de produtos
      const { mensagem: listaTipos, lista } = await gerarListaTiposProdutosComRecomendacao(null);
      
      console.log('🔥 Lista gerada:', listaTipos.substring(0, 100));
      console.log('🔥 Total de tipos:', lista.length);
      
      // 📨 MENSAGEM 1: Apresentação personalizada + intenção de ajudar
      const mensagem1 = `Prazer, *${nome}*! 😊\n\n` +
                       `Vou agora te ajudar a escolher o produto que mais combina com você! ✨`;
      
      // 📨 MENSAGEM 2: Lista de produtos
      const mensagem2 = `Aqui está nosso catálogo de produtos:\n\n${listaTipos}`;
      
      // Retornar ARRAY com 2 mensagens sequenciais
      resultado.mensagem = [mensagem1, mensagem2];
      resultado.proximaFase = 'filtro';
      resultado.contextoAtualizado.faseAtual = 'filtro';
      resultado.contextoAtualizado.aguardandoResposta = 'tipo_produto';
      resultado.listaEnumerada = {
        tipo_lista: 'tipos_produto',
        itens: lista.map((t, i) => ({ numero: i + 1, valor: t })),
        referente_a: null
      };
      
      console.log('🔥 Mensagem final: [ARRAY com 2 mensagens]');
      console.log('🔥 Lista enumerada criada:', resultado.listaEnumerada ? 'SIM' : 'NÃO');
      
      // Salvar nome no banco e atualizar fase
      await atualizarNomeCliente(numeroUsuario, nome);
      await atualizarFase(numeroUsuario, 'filtro');
      
      return resultado;
    } else {
      resultado.mensagem = 'Desculpe, não entendi seu nome direito. 😅\n\nPode me falar novamente? (Ex: "Meu nome é João" ou só "João")';
      resultado.contextoAtualizado.aguardandoResposta = 'nome';
      return resultado;
    }
  }
  
  // Se já tem nome, encaminhar para próxima fase
  resultado.proximaFase = 'filtro';
  resultado.contextoAtualizado.faseAtual = 'filtro';
  return resultado;
}
