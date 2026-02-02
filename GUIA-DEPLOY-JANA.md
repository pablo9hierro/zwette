# 🚀 GUIA DE DEPLOY - Sistema Jana

## Preparação para Produção

Este guia cobre todos os passos para colocar o Sistema Jana em produção.

---

## ✅ PRÉ-DEPLOY CHECKLIST

### 1. Validação Local
- [ ] Todos os testes passando (`node test-jana.js todos`)
- [ ] Banco de dados configurado
- [ ] Integração WhatsApp funcionando localmente
- [ ] Sem erros no console
- [ ] Checklist de validação completo

### 2. Variáveis de Ambiente
- [ ] `.env` configurado
- [ ] `.env.example` criado (sem valores sensíveis)
- [ ] `.gitignore` inclui `.env`
- [ ] Variáveis documentadas

### 3. Segurança
- [ ] Chaves API não estão no código
- [ ] Apenas `.env` contém segredos
- [ ] `auth_info/` no `.gitignore`
- [ ] Logs não expõem dados sensíveis

---

## 🗄️ PASSO 1: Configurar Banco de Dados (Supabase)

### Criar Projeto
1. Acesse [supabase.com](https://supabase.com)
2. Crie novo projeto
3. Anote credenciais:
   - `SUPABASE_URL`
   - `SUPABASE_KEY` (anon/public)

### Aplicar Schema
```bash
# Localmente, teste primeiro
node migrar-banco.js --verificar

# Aplicar schema
node migrar-banco.js
```

### Validar Tabelas
```bash
node migrar-banco.js --verificar
```

Deve mostrar:
```
✅ conversations: OK
✅ produtos_pesquisados_historico: OK
✅ profissoes_catalogo: OK
✅ mensagens_enumeradas: OK
✅ templates_mensagens: OK
```

---

## 🔐 PASSO 2: Configurar Variáveis de Ambiente

### Criar `.env`
```bash
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-anon-aqui

# OpenAI (opcional)
OPENAI_API_KEY=sk-...

# Gemini (opcional)
GEMINI_API_KEY=...

# Modo Jana
JANA_MODE=avancada

# Ambiente
NODE_ENV=production
```

### Criar `.env.example`
```bash
# Exemplo de variáveis (sem valores reais)
SUPABASE_URL=
SUPABASE_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=
JANA_MODE=avancada
NODE_ENV=production
```

---

## 📦 PASSO 3: Preparar Código

### Atualizar `package.json`
```json
{
  "name": "sistema-jana",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "test": "node test-jana.js completo",
    "migrate": "node migrar-banco.js",
    "validate": "node migrar-banco.js --verificar"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.x.x",
    "@whiskeysockets/baileys": "^6.x.x",
    "dotenv": "^16.x.x"
  }
}
```

### Criar `.gitignore`
```
node_modules/
.env
.env.local
auth_info/
*.log
.DS_Store
```

---

## ☁️ PASSO 4: Deploy em VPS/Servidor

### Opção A: VPS (Ubuntu/Debian)

#### 1. Instalar Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 2. Clonar/Enviar Código
```bash
# Opção 1: Git
git clone seu-repositorio
cd sistema-jana

# Opção 2: SCP/SFTP
scp -r ./zwette usuario@servidor:/home/usuario/
```

#### 3. Instalar Dependências
```bash
npm install
```

#### 4. Configurar `.env`
```bash
nano .env
# Cole as variáveis de ambiente
```

#### 5. Aplicar Schema
```bash
node migrar-banco.js
```

#### 6. Testar
```bash
node test-jana.js completo
```

#### 7. Iniciar com PM2
```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicação
pm2 start index.js --name jana

# Ver logs
pm2 logs jana

# Status
pm2 status

# Reiniciar em caso de crash
pm2 startup
pm2 save
```

---

### Opção B: Docker

#### Criar `Dockerfile`
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

CMD ["node", "index.js"]
```

#### Criar `docker-compose.yml`
```yaml
version: '3.8'

services:
  jana:
    build: .
    restart: unless-stopped
    env_file:
      - .env
    volumes:
      - ./auth_info:/app/auth_info
    ports:
      - "3000:3000"
```

#### Deploy
```bash
# Build
docker-compose build

# Aplicar migrações
docker-compose run jana node migrar-banco.js

# Iniciar
docker-compose up -d

# Logs
docker-compose logs -f jana
```

---

### Opção C: Vercel/Serverless (Não Recomendado para WhatsApp)

WhatsApp precisa de conexão persistente. Não use serverless.

---

## 🔄 PASSO 5: Configurar Monitoramento

### PM2 Monitoring (VPS)
```bash
# Dashboard web
pm2 plus

# Métricas
pm2 monit
```

### Logs Estruturados
Adicione em `index.js`:
```javascript
import fs from 'fs';

const logStream = fs.createWriteStream('jana.log', { flags: 'a' });

function log(mensagem) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${mensagem}\n`;
  console.log(logLine);
  logStream.write(logLine);
}
```

### Alertas (opcional)
Integre com serviços como:
- Sentry
- New Relic
- Datadog

---

## 📊 PASSO 6: Dashboard de Métricas

### Acessar Dashboard no Supabase
```sql
SELECT * FROM dashboard_atendimentos;
```

### Criar Views Customizadas
```sql
-- Taxa de conversão diária
CREATE VIEW metricas_diarias AS
SELECT 
  DATE(created_at) as dia,
  COUNT(*) as total_conversas,
  SUM(CASE WHEN atendimento_encerrado THEN 1 ELSE 0 END) as encerrados,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60) as tempo_medio_minutos
FROM conversations
GROUP BY DATE(created_at)
ORDER BY dia DESC;
```

---

## 🔐 PASSO 7: Segurança

### Firewall
```bash
# Permitir apenas SSH e aplicação
sudo ufw allow 22
sudo ufw allow 3000
sudo ufw enable
```

### SSL/HTTPS (se usar webhooks)
```bash
# Certbot para Let's Encrypt
sudo apt install certbot
sudo certbot certonly --standalone -d seu-dominio.com
```

### Atualizar Dependências
```bash
# Verificar vulnerabilidades
npm audit

# Atualizar
npm update
```

---

## 🔄 PASSO 8: Backup e Recuperação

### Backup do Banco (Supabase)
Supabase faz backup automático. Para backup manual:
```bash
# Exportar dados
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql
```

### Backup do Código
```bash
# Git
git push origin main

# Tar backup
tar -czf backup-jana-$(date +%Y%m%d).tar.gz /caminho/jana/
```

### Plano de Recuperação
1. Código no Git
2. Banco no Supabase (backup automático)
3. `auth_info/` fazer backup manual
4. `.env` guardado com segurança

---

## 📈 PASSO 9: Escala e Performance

### Otimizações
```javascript
// Rate limiting (se necessário)
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10 // 10 mensagens por minuto por usuário
});
```

### Cache (opcional)
```javascript
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutos

// Cache de catálogos
function getCatalogoCache(tipo) {
  const cached = cache.get(`catalogo-${tipo}`);
  if (cached) return cached;
  
  const catalogo = loadCatalogo(tipo);
  cache.set(`catalogo-${tipo}`, catalogo);
  return catalogo;
}
```

---

## 🧪 PASSO 10: Testes em Produção

### Smoke Tests
```bash
# Enviar mensagem de teste
node -e "
import processarAtendimentoJana from './atendimento/orquestrador-jana.js';
const resp = await processarAtendimentoJana('Olá', 'teste-producao');
console.log(resp);
"
```

### Monitorar Primeiras Conversas
- Acompanhe logs em tempo real
- Verifique métricas no Supabase
- Teste todos os 4 blocos

---

## 🚨 Troubleshooting em Produção

### Bot não responde
```bash
# Verificar se está rodando
pm2 status

# Ver logs
pm2 logs jana --lines 100

# Reiniciar
pm2 restart jana
```

### Erro de conexão Supabase
```bash
# Testar conexão
node -e "
import { supabase } from './db/supabase.js';
const { data, error } = await supabase.from('conversations').select('count').limit(1);
console.log(error || 'OK');
"
```

### WhatsApp desconectado
```bash
# Remover auth antiga
rm -rf auth_info/
pm2 restart jana
# Escanear QR code novamente
```

---

## 📞 Suporte Pós-Deploy

### Monitoramento Contínuo
- [ ] Configurar alertas (PM2, Sentry)
- [ ] Revisar logs diariamente
- [ ] Verificar métricas semanalmente
- [ ] Backup mensal de dados

### Manutenção
- [ ] Atualizar dependências mensalmente
- [ ] Revisar feedback de clientes
- [ ] Ajustar mensagens se necessário
- [ ] Adicionar novas profissões conforme demanda

---

## ✅ Checklist Final de Deploy

- [ ] Banco de dados em produção
- [ ] Schema aplicado
- [ ] Testes passando
- [ ] `.env` configurado
- [ ] Código no servidor
- [ ] PM2/Docker rodando
- [ ] Logs funcionando
- [ ] Monitoramento ativo
- [ ] Backup configurado
- [ ] Documentação atualizada
- [ ] Equipe treinada
- [ ] Plano de recuperação pronto

---

## 🎉 Sistema em Produção!

**Parabéns! Seu Sistema Jana está no ar!** 🚀

Para suporte, consulte:
- [README-JANA.md](README-JANA.md) - Documentação completa
- [GUIA-RAPIDO-JANA.md](GUIA-RAPIDO-JANA.md) - Quick reference
- [CHECKLIST-VALIDACAO-JANA.md](CHECKLIST-VALIDACAO-JANA.md) - Validação

---

**Boa sorte com as vendas! 💰**
