-- =====================================================
-- SCHEMA COMPLETO PARA SISTEMA DE ATENDIMENTO JANA
-- Sistema de 4 Blocos com Filtro Dinâmico
-- =====================================================

-- Tabela de conversas (já existe, adicionando campos novos)
ALTER TABLE conversas 
ADD COLUMN IF NOT EXISTS nome_cliente VARCHAR(255),
ADD COLUMN IF NOT EXISTS profissao VARCHAR(100),
ADD COLUMN IF NOT EXISTS fase_atendimento VARCHAR(50) DEFAULT 'identificacao',
ADD COLUMN IF NOT EXISTS atendimento_encerrado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS transferido_humano BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_ultima_interacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS produtos_pesquisados JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS preferencias JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS historico_fases JSONB DEFAULT '[]'::jsonb;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_conversas_fase ON conversas(fase_atendimento);
CREATE INDEX IF NOT EXISTS idx_conversas_profissao ON conversas(profissao);
CREATE INDEX IF NOT EXISTS idx_conversas_encerrado ON conversas(atendimento_encerrado);
CREATE INDEX IF NOT EXISTS idx_conversas_ultima_interacao ON conversas(data_ultima_interacao);

-- Tabela de produtos pesquisados (histórico de buscas)
CREATE TABLE IF NOT EXISTS produtos_pesquisados_historico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversa_id BIGINT REFERENCES conversas(id) ON DELETE CASCADE,
  numero_usuario VARCHAR(50) NOT NULL,
  tipo_produto VARCHAR(100),
  modelo VARCHAR(100),
  cor VARCHAR(100),
  tamanho VARCHAR(20),
  genero VARCHAR(20),
  sku_produto VARCHAR(100),
  link_produto TEXT,
  cliente_interessado BOOLEAN DEFAULT false,
  enviado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_produtos_historico_conversa ON produtos_pesquisados_historico(conversa_id);
CREATE INDEX IF NOT EXISTS idx_produtos_historico_usuario ON produtos_pesquisados_historico(numero_usuario);
CREATE INDEX IF NOT EXISTS idx_produtos_historico_tipo ON produtos_pesquisados_historico(tipo_produto);

-- Tabela de profissões e recomendações
CREATE TABLE IF NOT EXISTS profissoes_catalogo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) UNIQUE NOT NULL,
  sinonimos TEXT[], -- Array de sinônimos (ex: ["biomédico", "biomedicina", "biomedica"])
  produtos_recomendados JSONB DEFAULT '[]'::jsonb, -- Lista de tipos de produtos mais vendidos
  arquivo_catalogo VARCHAR(255), -- Nome do arquivo JSON de catálogo
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir profissões padrão
INSERT INTO profissoes_catalogo (nome, sinonimos, arquivo_catalogo, produtos_recomendados, descricao) VALUES
('biomedico', ARRAY['biomédico', 'biomedicina', 'biomedica'], 'biomedico.json', 
  '["jaleco", "scrub"]'::jsonb, 'Profissionais da área de biomedicina'),
('dentista', ARRAY['odontologia', 'odontologo', 'odontólogo'], 'dentista.json', 
  '["jaleco", "touca", "avental"]'::jsonb, 'Profissionais da odontologia'),
('enfermeiro', ARRAY['enfermagem', 'enfermeira', 'técnico de enfermagem', 'auxiliar de enfermagem'], 'enfermeiro.json', 
  '["scrub", "jaleco", "touca"]'::jsonb, 'Profissionais da enfermagem'),
('esteticista', ARRAY['estética', 'estetica', 'esteticismo'], 'esteticista.json', 
  '["jaleco", "avental", "touca"]'::jsonb, 'Profissionais da estética'),
('farmaceutico', ARRAY['farmácia', 'farmacia', 'farmacêutico'], 'farmaceutico.json', 
  '["jaleco"]'::jsonb, 'Profissionais da farmácia'),
('fisioterapeuta', ARRAY['fisioterapia', 'fisio'], 'fisioterapeuta.json', 
  '["scrub", "jaleco"]'::jsonb, 'Profissionais da fisioterapia'),
('medico', ARRAY['médico', 'medicina', 'doutor', 'doutora', 'dr', 'dra'], 'medico.json', 
  '["jaleco", "scrub"]'::jsonb, 'Profissionais da medicina'),
('nutricionista', ARRAY['nutrição', 'nutricao'], 'nutricionista.json', 
  '["jaleco"]'::jsonb, 'Profissionais da nutrição'),
('pediatra', ARRAY['pediatria'], 'pediatra.json', 
  '["jaleco", "scrub"]'::jsonb, 'Profissionais da pediatria'),
('psicologo', ARRAY['psicólogo', 'psicóloga', 'psicologia'], 'psicologo.json', 
  '["jaleco"]'::jsonb, 'Profissionais da psicologia'),
('veterinario', ARRAY['veterinário', 'veterinária', 'veterinaria', 'medicina veterinária', 'med vet'], 'veterinario.json', 
  '["jaleco", "avental", "scrub"]'::jsonb, 'Profissionais da medicina veterinária')
ON CONFLICT (nome) DO NOTHING;

-- Tabela de mensagens enumeradas (listas enviadas ao cliente)
CREATE TABLE IF NOT EXISTS mensagens_enumeradas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversa_id BIGINT REFERENCES conversas(id) ON DELETE CASCADE,
  numero_usuario VARCHAR(50) NOT NULL,
  tipo_lista VARCHAR(50) NOT NULL,
  itens JSONB NOT NULL,
  referente_a VARCHAR(100),
  enviada_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cliente_respondeu BOOLEAN DEFAULT false,
  resposta_cliente TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensagens_enum_conversa ON mensagens_enumeradas(conversa_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_enum_tipo ON mensagens_enumeradas(tipo_lista);

-- Tabela de templates de mensagens (para Jana)
CREATE TABLE IF NOT EXISTS templates_mensagens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fase VARCHAR(50) NOT NULL, -- 'saudacao', 'identificacao', 'filtro', 'confirmacao', 'encerramento'
  tipo_template VARCHAR(100) NOT NULL, -- 'apresentacao', 'pergunta_nome', 'pergunta_profissao', etc
  mensagem TEXT NOT NULL,
  variaveis TEXT[], -- Variáveis que podem ser substituídas {nome}, {produto}, etc
  ativo BOOLEAN DEFAULT true,
  prioridade INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Templates padrão para Jana
INSERT INTO templates_mensagens (fase, tipo_template, mensagem, variaveis, prioridade) VALUES
('saudacao', 'apresentacao', 
  'Olá! 👋 Meu nome é Jana e estou aqui para te ajudar a encontrar o produto perfeito para você em nosso site! Como posso te chamar?', 
  NULL, 100),
('identificacao', 'pergunta_profissao', 
  'Legal, {nome}! 😊 Para te ajudar melhor, você é profissional de qual área? (biomedicina, dentista, enfermagem, estética, farmácia, fisioterapia, medicina, nutrição, pediatria, psicologia, veterinária)', 
  ARRAY['nome'], 90),
('identificacao', 'profissao_opcional', 
  'Tudo bem se não quiser informar, {nome}! Posso te ajudar do mesmo jeito. Que tipo de produto você está procurando?', 
  ARRAY['nome'], 80),
('filtro', 'pergunta_tipo_produto', 
  'Legal! Temos diversos produtos disponíveis. Você está procurando: jaleco, scrub, gorro, touca, robe, avental, macacão ou outros?', 
  NULL, 100),
('filtro', 'pergunta_modelo', 
  'Ótima escolha! Para {tipo_produto}, temos os seguintes modelos disponíveis:', 
  ARRAY['tipo_produto'], 90),
('filtro', 'pergunta_cor', 
  'Perfeito! Você tem preferência de cor ou gostaria de ver todas as opções disponíveis?', 
  NULL, 85),
('filtro', 'pergunta_genero', 
  'Entendi! Você prefere modelo masculino, feminino ou unissex?', 
  NULL, 80),
('confirmacao', 'confirmar_busca', 
  'Perfeito! Então vou buscar {tipo_produto} modelo {modelo} na cor {cor} para você. Posso prosseguir? 🔍', 
  ARRAY['tipo_produto', 'modelo', 'cor'], 100),
('encerramento', 'satisfeito', 
  'Que ótimo que você gostou, {nome}! 😊 Vou transferir nossa conversa para um atendente humano que vai te ajudar a finalizar a compra. Foi um prazer te atender!', 
  ARRAY['nome'], 100),
('encerramento', 'inatividade', 
  'Oi {nome}! Vi que você ficou um tempo sem responder. Vou transferir nossa conversa para um atendente humano que pode te ajudar melhor. Até logo! 👋', 
  ARRAY['nome'], 90)
ON CONFLICT DO NOTHING;

-- Função para verificar inatividade (12 horas)
CREATE OR REPLACE FUNCTION verificar_inatividade_atendimento()
RETURNS TABLE(numero_cliente TEXT, nome_cliente VARCHAR, tempo_inativo INTERVAL) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.numero_cliente,
    c.nome_cliente,
    NOW() - c.data_ultima_interacao as tempo_inativo
  FROM conversas c
  WHERE 
    c.atendimento_encerrado = false
    AND c.transferido_humano = false
    AND c.data_ultima_interacao < NOW() - INTERVAL '12 hours';
END;
$$ LANGUAGE plpgsql;

-- Função para obter catálogo por profissão
CREATE OR REPLACE FUNCTION obter_catalogo_profissao(profissao_input VARCHAR)
RETURNS TABLE(
  nome VARCHAR,
  arquivo_catalogo VARCHAR,
  produtos_recomendados JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.nome,
    p.arquivo_catalogo,
    p.produtos_recomendados
  FROM profissoes_catalogo p
  WHERE 
    p.ativo = true
    AND (
      LOWER(p.nome) = LOWER(profissao_input)
      OR profissao_input = ANY(p.sinonimos)
    )
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- View para dashboard de atendimentos
CREATE OR REPLACE VIEW dashboard_atendimentos AS
SELECT 
  c.id,
  c.numero_cliente,
  c.nome_cliente,
  c.profissao,
  c.fase_atendimento,
  c.atendimento_encerrado,
  c.transferido_humano,
  c.data_ultima_interacao,
  c.timestamp as created_at,
  EXTRACT(EPOCH FROM (NOW() - c.data_ultima_interacao))/3600 as horas_inativo,
  (SELECT COUNT(*) FROM produtos_pesquisados_historico WHERE conversa_id = c.id) as total_produtos_pesquisados,
  (SELECT COUNT(*) FROM produtos_pesquisados_historico WHERE conversa_id = c.id AND cliente_interessado = true) as produtos_interesse
FROM conversas c
ORDER BY c.data_ultima_interacao DESC;

COMMENT ON TABLE conversas IS 'Tabela principal de conversas com sistema de 4 blocos';
COMMENT ON TABLE produtos_pesquisados_historico IS 'Histórico de produtos pesquisados por cada cliente';
COMMENT ON TABLE profissoes_catalogo IS 'Catálogo de profissões com recomendações personalizadas';
COMMENT ON TABLE mensagens_enumeradas IS 'Listas enumeradas enviadas ao cliente para facilitar escolha';
COMMENT ON TABLE templates_mensagens IS 'Templates de mensagens da Jana por fase de atendimento';
