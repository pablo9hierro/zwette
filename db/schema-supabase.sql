-- Tabela de conversas
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_usuario VARCHAR(50) NOT NULL,
  ultima_mensagem_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resumo TEXT,
  contexto JSONB DEFAULT '[]'::jsonb,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para buscar conversas por número de usuário
CREATE INDEX IF NOT EXISTS idx_conversations_numero_usuario ON conversations(numero_usuario);
CREATE INDEX IF NOT EXISTS idx_conversations_ultima_mensagem ON conversations(ultima_mensagem_em DESC);

-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
