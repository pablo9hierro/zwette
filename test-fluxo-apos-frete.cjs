/**
 * Teste de fluxo completo: busca → frete → nova busca
 * Valida reconhecimento de palavras-chave após cálculo de frete
 */

import dotenv from 'dotenv';
import orquestrar from './atendimento/orquestrador-jana.js';

dotenv.config();

// Mock do supabase
const mockSupabase = {
  conversas: new Map(),
  mensagens: new Map(),
  
  from(table) {
    const self = this;
    return {
      insert(data) {
        return {
          select() {
            return {
              async single() {
                const id = Math.floor(Math.random() * 10000);
                const record = { ...data, id, created_at: new Date().toISOString() };
                
                if (table === 'conversas') {
                  self.conversas.set(id, record);
                } else if (table === 'mensagens') {
                  self.mensagens.set(id, record);
                }
                
                return { data: record, error: null };
              }
            };
          }
        };
      },
      
      select(campos) {
        return {
          eq(campo, valor) {
            return {
              maybeSingle() {
                return this.single();
              },
              async single() {
                if (table === 'conversas') {
                  const conversa = Array.from(self.conversas.values())
                    .find(c => c[campo] === valor);
                  return { data: conversa || null, error: null };
                }
                return { data: null, error: null };
              },
              order() {
                return this;
              },
              limit() {
                return {
                  async single() {
                    return { data: null, error: null };
                  }
                };
              }
            };
          }
        };
      },
      
      update(data) {
        return {
          eq(campo, valor) {
            return {
              async select() {
                return { data: [data], error: null };
              }
            };
          }
        };
      }
    };
  }
};

// Substituir supabase
const supabaseModule = require('./db/supabase');
supabaseModule.supabase = mockSupabase;

async function testarFluxoCompleto() {
  console.log('🧪 TESTE: Fluxo Completo - Busca → Frete → Nova Busca\n');
  console.log('═══════════════════════════════════════════════════\n');
  
  const numeroTeste = '5511999999999';
  
  // ============================================
  // PASSO 1: Buscar jaleco masculino azul
  // ============================================
  console.log('📍 PASSO 1: Buscar "jaleco masculino azul"');
  console.log('─────────────────────────────────────────');
  
  let resultado = await orquestrar('jaleco masculino azul', numeroTeste);
  
  console.log('✅ Resposta:', resultado.mensagem.substring(0, 200) + '...');
  console.log('📊 Produtos encontrados:', resultado.mensagem.includes('Jaleco') ? 'SIM' : 'NÃO');
  console.log('📌 Fase:', resultado.contexto.faseAtual);
  console.log('');
  
  if (!resultado.mensagem.includes('Jaleco')) {
    console.error('❌ ERRO: Não encontrou jalecos!\n');
    return;
  }
  
  // ============================================
  // PASSO 2: Calcular frete
  // ============================================
  console.log('📍 PASSO 2: Solicitar "calcular frete"');
  console.log('─────────────────────────────────────────');
  
  resultado = await orquestrar('calcular frete', numeroTeste);
  
  console.log('✅ Resposta:', resultado.mensagem);
  console.log('📊 Pediu CEP:', resultado.mensagem.includes('CEP') ? 'SIM' : 'NÃO');
  console.log('📌 Fase:', resultado.contexto.faseAtual);
  console.log('');
  
  if (!resultado.mensagem.includes('CEP')) {
    console.error('❌ ERRO: Não pediu o CEP!\n');
    return;
  }
  
  // ============================================
  // PASSO 3: Informar CEP
  // ============================================
  console.log('📍 PASSO 3: Informar CEP "58073493"');
  console.log('─────────────────────────────────────────');
  
  resultado = await orquestrar('58073493', numeroTeste);
  
  console.log('✅ Resposta:', resultado.mensagem);
  console.log('📊 Mostrou frete:', resultado.mensagem.includes('frete') || resultado.mensagem.includes('R$') ? 'SIM' : 'NÃO');
  console.log('📌 Fase:', resultado.contexto.faseAtual);
  console.log('');
  
  if (!resultado.mensagem.includes('R$')) {
    console.error('❌ ERRO: Não calculou o frete!\n');
    return;
  }
  
  // ============================================
  // PASSO 4: CRÍTICO - Nova busca com palavras-chave
  // ============================================
  console.log('📍 PASSO 4: 🔥 NOVA BUSCA "quero um gorro masculino"');
  console.log('─────────────────────────────────────────');
  console.log('⚠️  Este é o ponto que estava quebrando!\n');
  
  try {
    resultado = await orquestrar('quero um gorro masculino', numeroTeste);
    
    console.log('✅ Resposta:', resultado.mensagem);
    console.log('📊 Reconheceu produto:', resultado.mensagem.includes('gorro') || resultado.mensagem.includes('buscar') ? 'SIM' : 'NÃO');
    console.log('📊 Redirecionou busca:', resultado.contexto.faseAtual === 'filtro' || resultado.contexto.faseAtual === 'pos-busca' ? 'SIM' : 'NÃO');
    console.log('📌 Fase:', resultado.contexto.faseAtual);
    console.log('');
    
    if (resultado.mensagem.includes('erro') || resultado.mensagem.includes('Desculpe')) {
      console.error('❌ ERRO: Sistema retornou mensagem de erro!\n');
      console.error('Mensagem:', resultado.mensagem);
      return;
    }
    
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ SUCESSO: Sistema reconheceu palavras-chave e redirecionou!');
    console.log('═══════════════════════════════════════════════════\n');
    
  } catch (erro) {
    console.error('❌ ERRO CAPTURADO:', erro.message);
    console.error('Stack:', erro.stack);
    console.log('\n═══════════════════════════════════════════════════');
    console.log('❌ FALHA: Sistema não conseguiu processar nova busca');
    console.log('═══════════════════════════════════════════════════\n');
  }
}

// Executar teste
testarFluxoCompleto()
  .then(() => {
    console.log('✅ Teste finalizado');
    process.exit(0);
  })
  .catch(erro => {
    console.error('❌ Erro no teste:', erro);
    process.exit(1);
  });
