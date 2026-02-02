# ✅ CHECKLIST DE VALIDAÇÃO - Sistema Jana

Use este checklist para garantir que tudo está funcionando corretamente.

---

## 📋 Pré-Requisitos

### Ambiente
- [ ] Node.js instalado (v18+)
- [ ] NPM ou Yarn funcionando
- [ ] Variáveis de ambiente configuradas (.env)
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_KEY`
  - [ ] `OPENAI_API_KEY` (opcional para IA avançada)

### Dependências
- [ ] @supabase/supabase-js instalado
- [ ] @whiskeysockets/baileys instalado (WhatsApp)
- [ ] dotenv instalado
- [ ] Outras dependências do package.json

---

## 🗄️ Banco de Dados

### Conexão
- [ ] Supabase acessível
- [ ] Credenciais corretas
- [ ] Sem erros de SSL/firewall

### Schema
- [ ] Executou `node migrar-banco.js`
- [ ] Tabela `conversations` existe
- [ ] Tabela `produtos_pesquisados_historico` existe
- [ ] Tabela `profissoes_catalogo` existe
- [ ] Tabela `mensagens_enumeradas` existe
- [ ] Tabela `templates_mensagens` existe
- [ ] Função `verificar_inatividade_atendimento()` existe
- [ ] View `dashboard_atendimentos` existe

### Dados Iniciais
- [ ] 11 profissões cadastradas em `profissoes_catalogo`
- [ ] Templates de mensagem em `templates_mensagens`
- [ ] Índices criados corretamente

**Verificar:**
```bash
node migrar-banco.js --verificar
```

---

## 📂 Arquivos e Estrutura

### Arquivos Core
- [ ] `atendimento/contexto-avancado.js` existe
- [ ] `atendimento/bloco1-identificacao.js` existe
- [ ] `atendimento/bloco2-filtro.js` existe
- [ ] `atendimento/bloco3-magazord.js` existe
- [ ] `atendimento/bloco4-encerramento.js` existe
- [ ] `atendimento/lista-enumerada.js` existe
- [ ] `atendimento/orquestrador-jana.js` existe

### Arquivos de Suporte
- [ ] `db/schema-atendimento-completo.sql` existe
- [ ] `db/supabase.js` existe (conexão)
- [ ] `test-jana.js` existe
- [ ] `migrar-banco.js` existe

### Catálogos
- [ ] `catalogos/produtos/jaleco.json` existe
- [ ] `catalogos/produtos/scrub.json` existe
- [ ] `catalogos/produtos/gorro.json` existe
- [ ] Outros arquivos de produtos
- [ ] `catalogos/profissao/enfermeiro.json` existe
- [ ] `catalogos/profissao/medico.json` existe
- [ ] Outros arquivos de profissão

---

## 🧪 Testes

### Teste Individual de Blocos
- [ ] Executou `node test-jana.js bloco1`
  - [ ] Jana se apresenta
  - [ ] Captura nome
  - [ ] Captura profissão
  - [ ] Permite pular profissão
  
- [ ] Executou `node test-jana.js bloco2`
  - [ ] Mostra lista de produtos
  - [ ] Cliente escolhe por número
  - [ ] Mostra lista de modelos
  - [ ] Pergunta gênero
  - [ ] Pergunta cor
  - [ ] Gera confirmação

- [ ] Executou `node test-jana.js profissao`
  - [ ] Detecta profissão corretamente
  - [ ] Mostra produtos recomendados com ⭐
  - [ ] Busca catálogo específico

- [ ] Executou `node test-jana.js encerramento`
  - [ ] Detecta satisfação
  - [ ] Gera mensagem de transferência
  - [ ] Salva no banco

### Teste Completo
- [ ] Executou `node test-jana.js completo`
- [ ] Fluxo completo funciona
- [ ] Nenhum erro crítico
- [ ] Resposta final coerente

### Teste de Casos Edge
- [ ] Executou `node test-jana.js indeciso`
- [ ] Cliente indeciso é tratado
- [ ] Oferece opções
- [ ] Não trava o fluxo

---

## 🔍 Funcionalidades

### Bloco 1: Identificação
- [ ] Jana se apresenta corretamente
- [ ] Nome do cliente é extraído
- [ ] Nome é validado (mínimo 2 caracteres)
- [ ] Profissão é detectada do banco
- [ ] Sinônimos de profissão funcionam
- [ ] Cliente pode pular profissão
- [ ] Identificação salva no banco

### Bloco 2: Filtro Dinâmico
- [ ] Lista de tipos de produtos é mostrada
- [ ] Recomendação por profissão funciona (⭐)
- [ ] Cliente escolhe por número OU nome
- [ ] Lista de modelos carrega do JSON
- [ ] Até 20 modelos são mostrados
- [ ] Cliente pode pedir "lista"
- [ ] Gênero é detectado
- [ ] Cor é detectada ou "qualquer cor"
- [ ] Confirmação é gerada corretamente

### Bloco 3: Busca e Apresentação
- [ ] Cliente confirma com "sim"/"pode"/"busca"
- [ ] Busca é realizada no catálogo
- [ ] Filtro por tipo funciona
- [ ] Filtro por modelo funciona
- [ ] Filtro por gênero funciona
- [ ] Filtro por cor funciona (opcional)
- [ ] Até 10 produtos retornados
- [ ] Formato da resposta correto:
  - [ ] Nome do produto
  - [ ] Preço
  - [ ] Tecido
  - [ ] Link
  - [ ] SEM SKU
- [ ] Produtos salvos em `produtos_pesquisados_historico`

### Bloco 4: Encerramento
- [ ] Detecta "obrigado", "adorei", "perfeito"
- [ ] Detecta "encerrar", "tchau"
- [ ] Gera mensagem de transferência
- [ ] Salva `atendimento_encerrado: true`
- [ ] Salva `transferido_humano: true`
- [ ] Resumo da conversa salvo

### Sistemas de Suporte
- [ ] Listas enumeradas funcionam
- [ ] Emojis aparecem (1️⃣, 2️⃣, 3️⃣)
- [ ] Contexto é salvo após cada mensagem
- [ ] Contexto é recuperado corretamente
- [ ] Histórico de produtos funciona
- [ ] Marca produtos interessados

---

## 📊 Validação de Dados

### No Supabase

**1. Verificar conversa criada:**
```sql
SELECT * FROM conversations 
WHERE numero_usuario = '5511999999999'
ORDER BY created_at DESC LIMIT 1;
```
Esperado:
- [ ] Registro existe
- [ ] `nome_cliente` preenchido
- [ ] `profissao` preenchido (ou null se pulou)
- [ ] `fase_atendimento` correto
- [ ] `contexto` é um JSON válido

**2. Verificar produtos pesquisados:**
```sql
SELECT * FROM produtos_pesquisados_historico
WHERE numero_usuario = '5511999999999'
ORDER BY enviado_em DESC;
```
Esperado:
- [ ] Produtos aparecem
- [ ] `tipo_produto` correto
- [ ] `modelo` correto
- [ ] `link_produto` preenchido

**3. Verificar listas enumeradas:**
```sql
SELECT * FROM mensagens_enumeradas
WHERE numero_usuario = '5511999999999'
ORDER BY enviada_em DESC;
```
Esperado:
- [ ] Listas salvas
- [ ] `itens` é array de objetos {numero, valor}
- [ ] `tipo_lista` correto

**4. Verificar profissões:**
```sql
SELECT nome, sinonimos FROM profissoes_catalogo;
```
Esperado:
- [ ] 11 profissões
- [ ] Sinônimos em array
- [ ] Produtos recomendados preenchidos

---

## 🤖 Integração WhatsApp

### Conexão
- [ ] QR Code gerado
- [ ] WhatsApp conectado
- [ ] Sem erros de autenticação

### Fluxo de Mensagens
- [ ] Bot recebe mensagens
- [ ] Ignora próprias mensagens
- [ ] Ignora grupos (se configurado)
- [ ] Processa apenas texto
- [ ] Responde corretamente

### Teste Manual no WhatsApp
Envie estas mensagens e verifique:

1. [ ] "Olá" → Jana se apresenta
2. [ ] "João" → Pergunta profissão
3. [ ] "Sou médico" → Reconhece e vai para filtro
4. [ ] "1" → Escolhe primeiro produto da lista
5. [ ] "5" → Escolhe modelo 5
6. [ ] "masculino" → Confirma gênero
7. [ ] "azul" → Confirma cor
8. [ ] "sim" → Busca e mostra produtos
9. [ ] "Adorei!" → Encerra e transfere

---

## 🔧 Performance

### Tempo de Resposta
- [ ] Apresentação: < 1 segundo
- [ ] Captura de dados: < 1 segundo
- [ ] Lista de produtos: < 2 segundos
- [ ] Lista de modelos: < 2 segundos
- [ ] Busca de produtos: < 3 segundos
- [ ] Encerramento: < 1 segundo

### Uso de Memória
- [ ] Não há memory leaks
- [ ] Contexto não cresce infinitamente
- [ ] Histórico é limitado

### Banco de Dados
- [ ] Queries são rápidas (< 100ms)
- [ ] Índices estão funcionando
- [ ] Sem deadlocks

---

## 📝 Logs e Monitoramento

### Console
- [ ] Logs legíveis
- [ ] Sem erros inesperados
- [ ] Warnings são tratados
- [ ] Cores/emojis funcionam

### Rastreamento
- [ ] Cada fase é logada
- [ ] Filtros são logados
- [ ] Erros têm stack trace
- [ ] Sucessos são confirmados

---

## 🚨 Casos de Erro

### Tratamento de Erros
- [ ] Banco offline → Mensagem amigável
- [ ] Catálogo não encontrado → Mensagem amigável
- [ ] IA falha → Fallback funciona
- [ ] JSON inválido → Não quebra sistema
- [ ] Timeout → Mensagem de erro

### Recuperação
- [ ] Bot reconecta automaticamente
- [ ] Contexto não se perde
- [ ] Cliente pode continuar conversa

---

## 📈 Métricas (Se implementado)

- [ ] Total de conversas
- [ ] Taxa de conclusão
- [ ] Taxa de satisfação
- [ ] Produtos mais buscados
- [ ] Profissões mais comuns
- [ ] Tempo médio de atendimento

---

## 🎨 UX/UI

### Mensagens
- [ ] Tom humanizado
- [ ] Emojis apropriados
- [ ] Textos claros
- [ ] Opções bem formatadas
- [ ] Listas legíveis

### Fluxo
- [ ] Sem loops infinitos
- [ ] Cliente sempre tem próxima ação
- [ ] Pode voltar/mudar
- [ ] Atalhos funcionam (números)

---

## ✅ Validação Final

Se todos os itens acima estão marcados:

- [ ] ✅ Sistema está PRONTO PARA PRODUÇÃO
- [ ] 📝 Documentação está completa
- [ ] 🧪 Testes passando
- [ ] 🚀 Pode fazer deploy

---

## 🐛 Problemas Encontrados

Liste aqui problemas encontrados durante validação:

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

**Data da validação:** _________________  
**Validado por:** _________________  
**Status:** [ ] Aprovado [ ] Pendente [ ] Reprovado  

---

**Sistema pronto para uso! 🎉**
