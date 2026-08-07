# Foco — Pomodoro e acompanhamento de estudos

Foco é um Pomodoro bilíngue que registra sessões, metas, categorias e pequenas
reflexões sobre a qualidade do estudo. A proposta é mostrar não apenas quanto
tempo a pessoa estudou, mas ajudá-la a perceber como ela estuda ao longo do
tempo.

## Autoria e colaboração

**Gabriel Augusto Amaral Silva** criou o produto e desenvolveu o back-end como
projeto de aprendizagem em Python, SQL, bancos de dados e APIs. A interface foi
desenvolvida em colaboração com o **OpenAI Codex**. Para preparar o beta público,
o Codex também auxiliou na portabilidade para PostgreSQL, segurança,
infraestrutura, testes e deploy, com as decisões acompanhadas por Gabriel.

## Funcionalidades

- temporizador com foco, descanso, pausa, retomada e modo imersivo;
- recuperação do timer após recarregar a página;
- registro de sessões por usuário;
- check-in opcional de qualidade do foco e distração;
- categorias, objetivos e histórico detalhado;
- resumos diário, semanal e mensal;
- meta diária, sequência de estudos e mapa de constância;
- conta por e-mail/senha e login com Google;
- onboarding e preferências individuais;
- temas Natural, Ember e Ocean;
- interface em português e inglês;
- layout responsivo para desktop e navegador móvel.

## Arquitetura

```text
Navegador
  → Front-end React/Vinext (Cloudflare Worker)
  → proxy de mesma origem /api
  → API FastAPI (Render)
  → PostgreSQL (produção)

Desenvolvimento local
  → mesma API FastAPI
  → SQLite local
```

O front-end nunca acessa o banco diretamente. A seleção do banco é centralizada
em `app/db.py`: sem `DATABASE_URL`, o ambiente local usa SQLite; com uma URL
PostgreSQL, a mesma camada de persistência usa PostgreSQL via SQLAlchemy.

O proxy `/api` mantém os cookies de autenticação como cookies de primeira parte
do site. Isso evita depender de cookies de terceiros entre domínios diferentes,
especialmente em navegadores móveis.

## Tecnologias

### Back-end

- Python 3.10+
- FastAPI e Uvicorn
- SQLAlchemy 2
- Alembic
- SQLite no desenvolvimento local
- PostgreSQL em produção
- Argon2 para hash de senhas
- Google OAuth 2.0 / OpenID Connect

### Front-end

- TypeScript
- React 19
- Vinext / Vite
- Cloudflare Workers (Sites)
- CSS responsivo e i18n centralizado

## Estrutura principal

```text
app/
  api.py          # rotas HTTP, autenticação e configuração web
  auth.py         # usuários, senhas e sessões autenticadas
  database.py     # operações de domínio e consultas
  db.py           # engine e seleção SQLite/PostgreSQL
  schema.py       # esquema SQLAlchemy
frontend/
  app/            # páginas e componentes
  lib/config/     # configuração central da API
  lib/services/   # contratos HTTP
  lib/i18n/       # traduções pt-BR/en
  worker/         # aplicação e proxy /api
migrations/       # migrations Alembic
tests/            # testes automatizados da API
render.yaml       # infraestrutura do back-end e PostgreSQL
```

## Executar localmente

### Requisitos

- Python 3.10 ou superior;
- Node.js 22.13 ou superior;
- pnpm.

### Back-end

Na raiz do projeto:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.api:app --reload
```

Sem `DATABASE_URL`, o SQLite é criado em `app/pomodoro.db`. O arquivo é local e
não deve ser versionado.

### Front-end

Em outro terminal:

```powershell
cd frontend
pnpm install
pnpm run dev
```

Abra `http://localhost:3000`. Em desenvolvimento, o Worker encaminha `/api` para
`http://127.0.0.1:8000`.

No Windows, `run-local.bat` continua disponível para iniciar os dois processos.

## Variáveis de ambiente

Copie `.env.example` para `.env` apenas no ambiente local. Nunca envie o `.env`
ao Git.

### API

| Variável | Uso |
|---|---|
| `DATABASE_URL` | URL PostgreSQL em produção; vazia usa SQLite local |
| `FRONTEND_URL` | URL pública do front-end |
| `CORS_ORIGINS` | origens permitidas, separadas por vírgula |
| `COOKIE_SECURE` | `true` em HTTPS de produção |
| `COOKIE_SAMESITE` | política SameSite do cookie |
| `GOOGLE_CLIENT_ID` | identificador OAuth do Google |
| `GOOGLE_CLIENT_SECRET` | segredo OAuth; somente no back-end |
| `GOOGLE_REDIRECT_URI` | callback autorizado no Google |

### Front-end

| Variável | Uso |
|---|---|
| `NEXT_PUBLIC_API_URL` | caminho usado pelo navegador; padrão `/api` |
| `API_ORIGIN` | origem privada/pública do FastAPI usada pelo Worker |
| `VITE_API_ORIGIN` | origem do FastAPI durante desenvolvimento/build local |

Os arquivos `.env.example` contêm somente nomes e exemplos não sensíveis.

## Banco e migrations

O SQLite preserva a história e continua útil localmente. A produção usa um
PostgreSQL vazio e aplica a migration inicial com:

```bash
alembic upgrade head
```

O `render.yaml` executa a migration antes de iniciar o Uvicorn. O banco local não
é copiado para produção, portanto dados de desenvolvimento não são publicados.

## Testes e build

```powershell
python -m unittest discover -s tests -v
cd frontend
pnpm run build
```

Os testes automatizados cobrem saúde da API, autenticação, onboarding,
preferências e isolamento entre usuários. O fluxo completo também deve ser
validado no navegador após cada deploy.

## Deploy

- **API e PostgreSQL:** Render, usando `render.yaml`.
- **Front-end:** Sites/Cloudflare Worker, pois o projeto Vinext já possui o
  adaptador e o Worker necessários.
- **Google OAuth:** o callback de produção deve apontar para
  `https://URL-DO-FRONTEND/api/auth/google/callback`.

As URLs finais e os valores secretos são configurados nos painéis dos serviços,
nunca no repositório.

## Segurança e multiusuário

- senhas são armazenadas somente como hashes Argon2;
- tokens de sessão aleatórios são armazenados como hashes;
- cookies de produção usam `HttpOnly`, `Secure` e `SameSite`;
- logout revoga a sessão no banco;
- sessões, categorias, metas, perfis e preferências são filtrados pelo usuário
  autenticado;
- o estado local do temporizador também é separado por usuário;
- segredos e bancos locais são ignorados pelo Git.

## Próximos passos após o beta

- reunir feedback de uso real;
- melhorar relatórios de qualidade das sessões;
- adicionar reflexão opcional ao fim de um bloco de estudo;
- estudar insights personalizados somente após haver dados suficientes.
