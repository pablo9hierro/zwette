/**
 * =====================================================
 * SCRIPT DE MIGRAÇÃO - APLICAR SCHEMA NO SUPABASE
 * =====================================================
 */

import { supabase } from './db/supabase.js';
import fs from 'fs/promises';
import path from 'path';

async function aplicarMigracoes() {
  console.log('🔄 INICIANDO MIGRAÇÃO DO BANCO DE DADOS\n');
  
  try {
    // Ler arquivo SQL
    const sqlPath = path.join(process.cwd(), 'db', 'schema-atendimento-completo.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf-8');
    
    console.log('📄 Arquivo SQL carregado');
    console.log(`📏 Tamanho: ${sqlContent.length} caracteres\n`);
    
    // Dividir em comandos individuais (separar por ;)
    const comandos = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📦 Total de comandos: ${comandos.length}\n`);
    
    let sucessos = 0;
    let erros = 0;
    
    for (let i = 0; i < comandos.length; i++) {
      const comando = comandos[i];
      
      // Pular comentários e linhas vazias
      if (comando.startsWith('--') || comando.length < 10) {
        continue;
      }
      
      console.log(`\n[${i + 1}/${comandos.length}] Executando...`);
      
      // Extrair tipo de comando para logging
      const tipoComando = comando.substring(0, 50).replace(/\s+/g, ' ');
      console.log(`   ${tipoComando}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_string: comando });
        
        if (error) {
          // Alguns erros são esperados (ex: tabela já existe)
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate')) {
            console.log('   ⚠️ Já existe (pulando)');
            sucessos++;
          } else {
            console.error('   ❌ Erro:', error.message);
            erros++;
          }
        } else {
          console.log('   ✅ Sucesso');
          sucessos++;
        }
      } catch (erro) {
        console.error('   ❌ Erro de execução:', erro.message);
        erros++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA MIGRAÇÃO');
    console.log('='.repeat(60));
    console.log(`✅ Sucessos: ${sucessos}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`📈 Taxa de sucesso: ${((sucessos / (sucessos + erros)) * 100).toFixed(1)}%`);
    
    if (erros === 0) {
      console.log('\n🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!\n');
    } else {
      console.log('\n⚠️ Migração concluída com alguns erros. Verifique os logs acima.\n');
    }
    
  } catch (erro) {
    console.error('❌ Erro fatal:', erro);
    process.exit(1);
  }
}

/**
 * Verificar conexão com Supabase
 */
async function verificarConexao() {
  console.log('🔌 Verificando conexão com Supabase...');
  
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('count')
      .limit(1);
    
    if (error) {
      // Tabela pode não existir ainda, mas conexão está ok
      if (error.message.includes('does not exist')) {
        console.log('✅ Conexão OK (tabelas serão criadas)\n');
        return true;
      }
      console.error('❌ Erro de conexão:', error.message);
      return false;
    }
    
    console.log('✅ Conexão OK\n');
    return true;
  } catch (erro) {
    console.error('❌ Erro ao verificar conexão:', erro.message);
    return false;
  }
}

/**
 * Verificar tabelas criadas
 */
async function verificarTabelas() {
  console.log('\n🔍 Verificando tabelas criadas...\n');
  
  const tabelas = [
    'conversations',
    'produtos_pesquisados_historico',
    'profissoes_catalogo',
    'mensagens_enumeradas',
    'templates_mensagens'
  ];
  
  for (const tabela of tabelas) {
    try {
      const { data, error } = await supabase
        .from(tabela)
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`   ❌ ${tabela}: NÃO EXISTE`);
      } else {
        console.log(`   ✅ ${tabela}: OK`);
      }
    } catch (erro) {
      console.log(`   ❌ ${tabela}: ERRO (${erro.message})`);
    }
  }
}

/**
 * Menu principal
 */
async function menu() {
  const args = process.argv.slice(2);
  
  if (args.includes('--verificar') || args.includes('-v')) {
    const conexaoOk = await verificarConexao();
    if (conexaoOk) {
      await verificarTabelas();
    }
    process.exit(0);
  }
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('📋 USO DO SCRIPT DE MIGRAÇÃO\n');
    console.log('Uso: node migrar-banco.js [opcoes]\n');
    console.log('Opções:');
    console.log('  (sem opções)  - Aplica todas as migrações');
    console.log('  --verificar   - Apenas verifica conexão e tabelas');
    console.log('  --help        - Mostra esta ajuda\n');
    process.exit(0);
  }
  
  // Executar migração
  const conexaoOk = await verificarConexao();
  
  if (!conexaoOk) {
    console.error('\n❌ Impossível continuar sem conexão com Supabase');
    console.log('\nVerifique:');
    console.log('  1. SUPABASE_URL está configurado no .env');
    console.log('  2. SUPABASE_KEY está configurado no .env');
    console.log('  3. Credenciais estão corretas\n');
    process.exit(1);
  }
  
  await aplicarMigracoes();
  await verificarTabelas();
  
  process.exit(0);
}

// Executar
menu().catch(erro => {
  console.error('❌ Erro fatal:', erro);
  process.exit(1);
});
