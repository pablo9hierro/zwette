/**
 * =====================================================
 * BLOCO 1: SAUDAÇÃO E IDENTIFICAÇÃO - JANA
 * Sistema de apresentação e captura de dados do cliente
 * =====================================================
 */

import { supabase } from '../db/supabase.js';

/**
 * Gerencia o Bloco 1: Saudação e Identificação
 * - Apresenta a Jana
 * - Captura nome do cliente
 * - Captura profissão (opcional)
 */

/**
 * Gera mensagem de apresentação inicial
 */
export function gerarMensagemApresentacao() {
  return `Olá! 👋 Meu nome é *Jana* e estou aqui para te ajudar a encontrar o produto perfeito para você em nosso site!

Como posso te chamar? 😊`;
}

/**
 * Processa resposta do nome do cliente
 */
export function processarNomeCliente(mensagem) {
  // Extrair nome da mensagem
  // Remove saudações comuns
  const mensagemLimpa = mensagem
    .toLowerCase()
    .replace(/^(oi|olá|ola|e ai|eai|bom dia|boa tarde|boa noite),?\s*/i, '')
    .replace(/meu nome é|me chamo|sou|pode me chamar de/gi, '')
    .trim();
  
  // Pegar primeira palavra como nome (ou até 2 palavras para nomes compostos)
  const palavras = mensagemLimpa.split(' ');
  const nome = palavras.slice(0, 2).join(' ');
  
  // Capitalizar primeira letra
  return nome
    .split(' ')
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
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
 * Salvar identificação no banco de dados
 */
export async function salvarIdentificacao(numeroUsuario, nomeCliente, profissao = null) {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .update({
        nome_cliente: nomeCliente,
        profissao: profissao,
        fase_atendimento: profissao ? 'filtro' : 'filtro', // Vai para filtro de qualquer forma
        data_ultima_interacao: new Date().toISOString()
      })
      .eq('numero_usuario', numeroUsuario)
      .select();
    
    if (error) {
      console.error('Erro ao salvar identificação:', error);
      return false;
    }
    
    console.log('✅ Identificação salva:', nomeCliente, profissao);
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
    const nome = processarNomeCliente(mensagem);
    
    if (nomeValido(nome)) {
      resultado.contextoAtualizado.nomeCliente = nome;
      resultado.contextoAtualizado.caracteristicasMencionadas.push('nome');
      
      // Perguntar profissão
      resultado.mensagem = gerarMensagemProfissao(nome);
      resultado.contextoAtualizado.aguardandoResposta = 'profissao';
      resultado.contextoAtualizado.ultimaPergunta = 'profissao';
      
      return resultado;
    } else {
      resultado.mensagem = 'Desculpe, não entendi seu nome. Pode repetir, por favor? 😅';
      return resultado;
    }
  }
  
  // ETAPA 2: Tem nome, mas não tem profissão ainda
  if (contexto.nomeCliente && !contexto.profissaoConfirmada) {
    // Verificar se quer pular
    if (querPularProfissao(mensagem)) {
      resultado.contextoAtualizado.profissaoConfirmada = true;
      resultado.mensagem = gerarMensagemSemProfissao(contexto.nomeCliente);
      resultado.proximaFase = 'filtro';
      resultado.contextoAtualizado.faseAtual = 'filtro';
      
      await salvarIdentificacao(numeroUsuario, contexto.nomeCliente, null);
      
      return resultado;
    }
    
    // Tentar detectar profissão
    const profissaoDetectada = await detectarProfissao(mensagem);
    
    if (profissaoDetectada) {
      resultado.contextoAtualizado.profissao = profissaoDetectada.nome;
      resultado.contextoAtualizado.profissaoConfirmada = true;
      resultado.contextoAtualizado.caracteristicasMencionadas.push('profissao');
      resultado.mensagem = gerarMensagemProfissaoIdentificada(
        contexto.nomeCliente, 
        profissaoDetectada
      );
      resultado.proximaFase = 'filtro';
      resultado.contextoAtualizado.faseAtual = 'filtro';
      
      await salvarIdentificacao(
        numeroUsuario, 
        contexto.nomeCliente, 
        profissaoDetectada.nome
      );
      
      return resultado;
    } else {
      // Não conseguiu detectar, perguntar novamente ou oferecer pular
      resultado.mensagem = `Hmm, não encontrei essa profissão na nossa lista. 🤔

Você pode:
1️⃣ Me dizer de outra forma (biomedicina, enfermagem, medicina, etc)
2️⃣ Ou digitar *"pular"* para continuar sem informar

O que prefere?`;
      return resultado;
    }
  }
  
  // ETAPA 3: Já tem nome e profissão, encaminhar para próxima fase
  if (contexto.nomeCliente && contexto.profissaoConfirmada) {
    resultado.proximaFase = 'filtro';
    resultado.contextoAtualizado.faseAtual = 'filtro';
    return resultado;
  }
  
  return resultado;
}
