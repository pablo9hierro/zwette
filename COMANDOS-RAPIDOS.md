# ⚡ COMANDOS RÁPIDOS - JANA

## 🚀 Iniciar Sistema

```bash
npm start
```

Aguarde ver:
```
🚀 Servidor rodando na porta 3000
✅ Conectado ao WhatsApp!
📱 Número: 558387516699
```

---

## 🧪 Executar Testes

```bash
node teste-final.js
```

Deve mostrar:
```
🎉 TODOS OS TESTES PASSARAM!
✅ Sistema validado e pronto para produção
🎯 Taxa de sucesso: 100.0%
```

---

## 📊 Verificar Estrutura

### Ver arquivos principais
```bash
ls -la
```

### Ver catálogos
```bash
ls catalogos/produtos/
```

Deve mostrar:
```
jaleco.json          (202 produtos)
scrub.json           (89 produtos)
dolma-avental.json   (26 produtos)
infantil.json        (10 produtos)
macacao.json         (9 produtos)
robe.json            (3 produtos)
gorro.json           (181 produtos)
nao-texteis.json     (6 produtos)
outros.json          (6 produtos)
```

### Ver testes antigos (movidos)
```bash
ls testes-antigos/ | wc -l
```

Deve mostrar: `79` arquivos

---

## 🔍 Debug

### Ver logs em tempo real
```bash
npm start | tee logs.txt
```

### Verificar conexão Magazord
Abrir `tools/magazord-api.js` e ver logs no console quando o teste rodar.

### Testar conversão de SKU específico
```bash
node -e "const { converterSKUParaCodigoAPI } = require('./tools/magazord-api.js'); console.log(converterSKUParaCodigoAPI('372-SD-008-000-F5'));"
```

---

## 📝 Git

### Status
```bash
git status
```

### Adicionar mudanças
```bash
git add .
```

### Commit
```bash
git commit -m "Sistema Jana pronto para produção - 100% testado"
```

### Push
```bash
git push origin main
```

---

## 🗑️ Limpeza (Já feito)

### Arquivos de teste movidos
```bash
# JÁ EXECUTADO - NÃO PRECISA RODAR NOVAMENTE
mv test-*.js testes-antigos/
```

79 arquivos já foram movidos para `testes-antigos/`

---

## 🔧 Manutenção

### Atualizar dependências
```bash
npm update
```

### Verificar versões
```bash
node -v     # Node.js versão
npm -v      # npm versão
```

### Reinstalar dependências (se necessário)
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 Testar Produção

### 1. Enviar "simitarra" para o WhatsApp
```
Número: 558387516699
Mensagem: simitarra
```

### 2. Informar nome
```
Mensagem: [seu nome]
```

### 3. Pedir produtos
```
Mensagem: quero um jaleco feminino azul
```

### 4. Confirmar
```
Mensagem: pode
```

Deve receber:
- Lista com 21 produtos
- Cada um com link direto
- Todos verificados no Magazord (silenciosamente)

---

## ⚠️ Troubleshooting

### Erro: "Cannot connect to WhatsApp"
1. Verificar `EVOLUTION_API_URL` no `.env`
2. Verificar `EVOLUTION_API_KEY` no `.env`
3. Verificar se instância Evolution está rodando

### Erro: "Magazord API failed"
1. Verificar `MAGAZORD_API_URL` no `.env`
2. Verificar `MAGAZORD_TOKEN` no `.env`
3. Verificar `MAGAZORD_PASSWORD` (deve ter aspas: `"senha#123"`)

### Erro: "Supabase connection failed"
1. Verificar `SUPABASE_URL` no `.env`
2. Verificar `SUPABASE_KEY` no `.env`
3. Verificar se banco está acessível

### Erro: "Gemini API failed"
1. Verificar `GEMINI_API_KEY` no `.env`
2. Verificar quota da API
3. Testar com: `curl https://generativelanguage.googleapis.com/v1beta/models?key=SUA_CHAVE`

---

## 📊 Monitoramento

### Ver processos Node.js rodando
```bash
ps aux | grep node
```

### Matar processo (se necessário)
```bash
pkill -f "node index.js"
```

### Verificar porta 3000
```bash
lsof -i :3000        # macOS/Linux
netstat -ano | findstr :3000   # Windows
```

---

## 🎯 Checklist Rápido

Antes de colocar em produção:
- [ ] `node teste-final.js` → 100% ✅
- [ ] `.env` configurado com todas as variáveis
- [ ] `npm install` executado
- [ ] `npm start` rodando sem erros
- [ ] WhatsApp conectado
- [ ] Teste real: enviar "simitarra"

---

## 📦 Backup

### Fazer backup do banco
```bash
# Supabase tem backup automático
# Ver em: Dashboard > Database > Backups
```

### Fazer backup dos catálogos
```bash
tar -czf catalogos-backup-$(date +%Y%m%d).tar.gz catalogos/
```

### Fazer backup do código
```bash
tar -czf jana-backup-$(date +%Y%m%d).tar.gz \
  index.js atendimento/ tools/ db/ ia/ whatsapp/ \
  package.json .env.example
```

---

## 🚀 Deploy Rápido

### Servidor (VPS/Cloud)
```bash
# 1. Clonar repositório
git clone [seu-repo] jana

# 2. Entrar na pasta
cd jana

# 3. Instalar dependências
npm install

# 4. Configurar .env
cp .env.example .env
nano .env  # Editar com credenciais

# 5. Testar
node teste-final.js

# 6. Iniciar
npm start
```

### PM2 (Produção - manter rodando)
```bash
# Instalar PM2
npm install -g pm2

# Iniciar com PM2
pm2 start index.js --name jana

# Ver status
pm2 status

# Ver logs
pm2 logs jana

# Restart
pm2 restart jana

# Stop
pm2 stop jana

# Iniciar automaticamente no boot
pm2 startup
pm2 save
```

---

## 📈 Estatísticas Rápidas

```bash
# Total de produtos
find catalogos/produtos -name "*.json" -exec jq '.produtosOriginais | length' {} \; | awk '{s+=$1} END {print s}'

# Arquivos de código
find . -name "*.js" -not -path "./node_modules/*" -not -path "./testes-antigos/*" | wc -l

# Linhas de código
find . -name "*.js" -not -path "./node_modules/*" -not -path "./testes-antigos/*" -exec wc -l {} \; | awk '{s+=$1} END {print s}'
```

---

## ✅ Sistema Pronto!

Tudo testado e validado. Use os comandos acima conforme necessário.

**Status**: 🟢 PRODUCTION READY
