# Seazone Video Engine v2

Sistema de geração de vídeos imobiliários cinematográficos usando IA (Kling AI). Transforma imagens reais de empreendimentos em vídeos prontos para redes sociais.

## Objetivo

Automatizar a criação de vídeos de divulgação imobiliária a partir de imagens reais, produzindo conteúdo profissional para Stories, Reels, Feed e YouTube.

**Tipos de vídeo suportados:**
- **Fachada** — Tilt-up cinematográfico revelando o empreendimento
- **Interior** — Tour suave pelos ambientes internos
- **Construção** — Visualização do progresso da obra
- **Unidade** — Walkthrough elegante por uma unidade

## Arquitetura

Pipeline linear baseada em agentes com responsabilidades claras:

```
VideoStrategistAgent → PromptBuilderAgent → VideoGenerationAgent → VideoStatusAgent → VideoValidatorAgent
```

| Agente | Responsabilidade |
|--------|-----------------|
| `VideoStrategistAgent` | Define tipo de vídeo e abordagem com base na imagem |
| `PromptBuilderAgent` | Gera prompt otimizado para a API de geração |
| `VideoGenerationAgent` | Envia requisição para a API Kling |
| `VideoStatusAgent` | Acompanha progresso da geração |
| `VideoValidatorAgent` | Valida integridade do vídeo final |

## Fluxo do Sistema

```
1. Criar Projeto → 2. Upload de Imagens → 3. Selecionar Tipo → 4. Gerar Vídeo → 5. Resultado
        ↓                    ↓                     ↓                  ↓               ↓
   Nome/Descrição    Categorizar por       Fachada/Interior     Pipeline de      Vídeo + Validação
                     tipo (fachada,        /Construção/         Agentes          + Download
                     interior, drone...)   Unidade              executa
```

## Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── upload/         # Upload de imagens
│   │   └── video/
│   │       ├── generate/   # Inicia geração
│   │       └── status/     # Consulta progresso
│   ├── projeto/            # Página de projeto
│   ├── upload/             # Página de upload
│   ├── gerar/              # Página de geração
│   └── resultados/         # Página de resultados
├── components/             # Componentes React
├── lib/
│   ├── agents/             # Agentes do pipeline
│   ├── services/           # Serviços (API client, video, prompt)
│   ├── prompts/            # Templates de prompt por tipo
│   └── types/              # TypeScript types
```

## Stack

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Kling AI API

## Execução Local

### Pré-requisitos

- Node.js 18+
- API Key do Kling AI

### Setup

```bash
# Clonar repositório
git clone https://github.com/seazone/seazone-video-engine-v2.git
cd seazone-video-engine-v2

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com sua API key

# Rodar em desenvolvimento
npm run dev
```

Acesse `http://localhost:3000`

### Variáveis de Ambiente

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `KLING_API_KEY` | API key do Kling AI | Sim |
| `FREEPIK_API_KEY` | API key do Freepik (futuro) | Não |

## Formatos de Vídeo

| Formato | Uso |
|---------|-----|
| 9:16 | Stories / Reels (padrão) |
| 4:5 | Feed Instagram |
| 16:9 | YouTube |
