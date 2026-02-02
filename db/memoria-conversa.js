import { supabase } from './supabase.js';

const JANELA_CONTEXTO_MINUTOS = 30;
const MAX_MENSAGENS_CONTEXTO = 5;

/**
 * Busca o histórico de conversa do usuário
 * @param {string} numeroUsuario - Número do WhatsApp do usuário
 * @returns {Promise<Object>} - { eNovaConversa, historico, resumo }
 */
export async function buscarHistoricoConversa(numeroUsuario) {
  try {
    const agoraMinutos = new Date();
    agoraMinutos.setMinutes(agoraMinutos.getMinutes() - JANELA_CONTEXTO_MINUTOS);

    // Buscar últimas conversas nos últimos 30 minutos
    const { data, error } = await supabase
      .from('conversas')
      .select('*')
      .eq('numero_cliente', numeroUsuario)
      .gte('timestamp', agoraMinutos.toISOString())
      .order('timestamp', { ascending: false })
      .limit(MAX_MENSAGENS_CONTEXTO);

    if (error) {
      console.error('Erro ao buscar histórico:', error);
      return {
        eNovaConversa: true,
        historico: [],
        resumo: null
      };
    }

    if (!data || data.length === 0) {
      // Nova conversa
      return {
        eNovaConversa: true,
        historico: [],
        resumo: null
      };
    }

    // CRÍTICO: Pegar contexto ANTES de reverter (data está DESC por timestamp)
    // Buscar a mensagem mais recente que tenha contexto (qualquer tipo)
    let resumo = null;
    for (const msg of data) {
      if (msg.contexto) {
        resumo = msg.contexto;
        console.log(`✅ Contexto encontrado no id ${msg.id} (tipo: ${msg.metadados?.tipo})`);
        break;
      }
    }
    
    // Se contexto é string JSON, parsear
    if (resumo && typeof resumo === 'string') {
      try {
        resumo = JSON.parse(resumo);
      } catch (e) {
        console.log('⚠️ Contexto não é JSON válido, mantendo como string');
      }
    }
    
    // Converter para formato esperado (ordem cronológica)
    const historico = data.reverse().map(msg => ({
      tipo: msg.metadados?.tipo === 'bot' ? 'bot' : 'usuario',
      conteudo: msg.mensagem_cliente,
      timestamp: msg.timestamp,
      metadados: msg.metadados
    }));
    
    console.log('📚 Histórico recuperado:', historico.length, 'mensagens');
    console.log('📝 Contexto recuperado:', JSON.stringify(resumo, null, 2));

    return {
      eNovaConversa: false,
      historico,
      resumo,
      conversaId: null
    };

  } catch (erro) {
    console.error('Erro ao buscar histórico:', erro);
    return {
      eNovaConversa: true,
      historico: [],
      resumo: null
    };
  }
}

/**
 * Salva uma mensagem na conversa
 * @param {string} numeroUsuario - Número do WhatsApp
 * @param {string} mensagemUsuario - Mensagem enviada pelo usuário
 * @param {string} respostaIA - Resposta da IA
 * @param {string} resumoAtual - Resumo atual da conversa
 * @param {string|null} conversaId - ID da conversa (ignorado neste schema)
 */
export async function salvarMensagemConversa(numeroUsuario, mensagemUsuario, respostaIA, resumoAtual, conversaId = null) {
  try {
    // Salvar mensagem do cliente
    console.log('💾 Salvando mensagem cliente:', mensagemUsuario.substring(0, 50));
    const { data: dataCliente, error: erroCliente } = await supabase
      .from('conversas')
      .insert({
        numero_cliente: numeroUsuario,
        mensagem_cliente: mensagemUsuario,
        contexto: typeof resumoAtual === 'string' ? resumoAtual : JSON.stringify(resumoAtual),
        acao: 'buscar_produto',
        metadados: {
          tipo: 'cliente',
          timestamp: new Date().toISOString()
        }
      })
      .select();

    if (erroCliente) {
      console.error('❌ Erro ao salvar mensagem do cliente:', erroCliente.message);
    } else {
      console.log('✅ Cliente salvo');
    }

    // Salvar resposta do bot
    console.log('💾 Salvando resposta bot:', respostaIA.substring(0, 50));
    const { data: dataBot, error: erroBot } = await supabase
      .from('conversas')
      .insert({
        numero_cliente: numeroUsuario,
        mensagem_cliente: respostaIA,
        contexto: typeof resumoAtual === 'string' ? resumoAtual : JSON.stringify(resumoAtual),
        acao: 'buscar_produto',
        metadados: {
          tipo: 'bot',
          resposta_ia: respostaIA,
          timestamp: new Date().toISOString()
        }
      })
      .select();

    if (erroBot) {
      console.error('❌ Erro ao salvar resposta do bot:', erroBot.message);
    } else {
      console.log('✅ Bot salvo');
    }

  } catch (erro) {
    console.error('Erro ao salvar mensagem:', erro);
  }
}

/**
 * Marca uma conversa como encerrada
 * @param {string} conversaId - ID da conversa (não usado neste schema)
 */
export async function encerrarConversa(conversaId) {
  console.log('Conversa encerrada (sem persistência no schema atual)');
}
