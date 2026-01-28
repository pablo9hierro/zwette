/**
 * TIMEOUT DE CONVERSA
 * Limpa memória após 2 minutos de inatividade
 * Mantém apenas o nome do cliente
 */

const TIMEOUT_MS = 2 * 60 * 1000; // 2 minutos em milissegundos
const timers = new Map(); // telefone → timer ID

/**
 * Inicia ou reinicia o timer de timeout para um cliente
 */
export function iniciarTimeout(telefone, payload, supabase) {
  // ⚠️ TIMEOUT DESABILITADO - MEMÓRIA CONTÍNUA
  console.log(`✅ Timer desabilitado - memória contínua para ${telefone}`);
  return;
  
  // Código antigo comentado
  /*
  // Cancelar timer anterior se existir
  if (timers.has(telefone)) {
    clearTimeout(timers.get(telefone));
  }

  // Criar novo timer
  const timerId = setTimeout(async () => {
    console.log(`⏰ TIMEOUT: 2 minutos sem interação de ${telefone}`);
    await limparMemoriaConversa(telefone, payload, supabase);
    timers.delete(telefone);
  }, TIMEOUT_MS);

  timers.set(telefone, timerId);
  console.log(`⏱️  Timer iniciado para ${telefone} (2 minutos)`);
  */
}

/**
 * Cancela o timer de um cliente (quando conversa termina)
 */
export function cancelarTimeout(telefone) {
  if (timers.has(telefone)) {
    clearTimeout(timers.get(telefone));
    timers.delete(telefone);
    console.log(`⏱️  Timer cancelado para ${telefone}`);
  }
}

/**
 * Limpa memória da conversa mantendo apenas o nome
 */
async function limparMemoriaConversa(telefone, payload, supabase) {
  const nomeCliente = payload.nome;
  
  // Limpar payload mantendo apenas o nome
  payload.fase = 'identificacao';
  payload.preferencias = {
    tipoProduto: null,
    genero: null,
    cor: null
  };
  payload.contexto = [`Cliente voltou após timeout - Nome mantido: ${nomeCliente}`];
  payload.produtosEncontrados = [];
  payload.ultimaBusca = null;

  console.log(`🧹 MEMÓRIA LIMPA (timeout): ${telefone}`);
  console.log(`   ✅ Nome mantido: ${nomeCliente}`);
  console.log(`   ❌ Preferências apagadas (tipo, genero, cor)`);
  console.log(`   ❌ Contexto resetado`);

  // Atualizar no banco
  if (supabase) {
    try {
      const { error } = await supabase
        .from('conversas')
        .update({
          payload: payload,
          updated_at: new Date().toISOString()
        })
        .eq('telefone', telefone);

      if (error) {
        console.error('❌ Erro ao atualizar payload no banco:', error.message);
      } else {
        console.log('✅ Payload atualizado no banco (timeout)');
      }
    } catch (erro) {
      console.error('❌ Erro ao salvar timeout:', erro.message);
    }
  }
}

/**
 * Retorna tempo restante do timer (em segundos)
 */
export function tempoRestante(telefone) {
  if (!timers.has(telefone)) return 0;
  
  // Não temos como saber exatamente, mas podemos retornar que existe timer
  return 120; // Simplificação: retorna 2 minutos se timer existe
}

/**
 * Lista todos os timers ativos (debug)
 */
export function listarTimersAtivos() {
  console.log(`\n⏱️  TIMERS ATIVOS: ${timers.size}`);
  timers.forEach((timerId, telefone) => {
    console.log(`   • ${telefone}`);
  });
}
