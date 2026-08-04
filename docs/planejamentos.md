# Roadmap do Study Tracker Pomodoro

Este documento organiza a evolução do projeto. Os nomes das funções e rotas
futuras são propostas de contrato e poderão ser ajustados antes da
implementação.

## Responsabilidades

- **Gabriel:** Python, SQLite, SQL, modelagem, API, validação e testes do
  back-end.
- **Codex:** interface, experiência do usuário, componentes, responsividade e
  integração HTTP do front-end.
- O front-end nunca acessa o SQLite diretamente.
- Mudanças no back-end só são implementadas pelo Codex quando Gabriel solicitar
  explicitamente.

## Visão do produto

O produto não deve ser apenas um cronômetro. Sua proposta principal é combinar:

1. Pomodoro;
2. acompanhamento de consistência;
3. intenção antes do estudo;
4. reflexão rápida depois da sessão;
5. análises sobre a qualidade do foco;
6. recomendações respeitosas, sem culpa.

Posicionamento pretendido:

> Um Pomodoro que não registra apenas quanto você estudou, mas ajuda a entender
> como você estuda melhor.

---

## Estado atual

### Back-end concluído

- [x] `initialize_database()`
- [x] `save_session()`
- [x] `get_daily_summary()`
- [x] `get_monthly_summary()`
- [x] `get_sessions_by_date()`
- [x] `get_recent_sessions(limit=20)`
- [x] tabela SQLite `sessions`
- [x] protótipo de terminal

### API concluída

- [x] `GET /health`
- [x] `GET /sessions/daily?date=YYYY-MM-DD`
- [x] `GET /sessions/monthly?month=YYYY-MM`
- [x] CORS para o front-end local

### Front-end concluído

- [x] interface do temporizador
- [x] controles de iniciar, pausar, continuar e cancelar
- [x] configuração de foco e descanso
- [x] painel de progresso
- [x] mapa mensal de constância
- [x] tela inicial de histórico
- [x] integração real do resumo diário
- [x] integração real do resumo mensal
- [x] integração real do histórico recente
- [x] mocks isolados para funcionalidades ainda sem API

### Ainda demonstrativo

- [ ] resumo semanal
- [ ] comparação entre semanas
- [ ] sequência de dias
- [x] salvamento de uma sessão iniciada pelo site

---

# Fase 1 — Concluir a API básica

**Objetivo:** permitir que todas as telas atuais usem o banco real.

## 1.1 Histórico recente

Função já existente:

```python
get_recent_sessions(limit=20)
```

Rota proposta:

```text
GET /sessions/recent?limit=20
```

Resposta:

```json
[
  {
    "id": 2,
    "work_time": 25,
    "rest_time": 5,
    "session_date": "2026-07-24"
  }
]
```

Tarefas:

- [x] criar a rota;
- [ ] validar `limit`;
- [x] conectar a tela de histórico;
- [x] adicionar estado vazio, carregamento e erro;
- [x] substituir o mock de histórico.

## 1.2 Detalhes de um dia

Função já existente:

```python
get_sessions_by_date(session_date)
```

Rota proposta:

```text
GET /sessions/by-date?date=YYYY-MM-DD
```

Uso:

- clicar em um dia do calendário;
- mostrar cada sessão daquele dia;
- exibir foco e descanso individualmente.

Tarefas:

- [x] criar a rota;
- [x] conectar o clique do mapa;
- [x] criar painel com sessões individuais.

## 1.3 Salvar uma sessão pelo site

Função já existente:

```python
save_session(work_time, rest_time, session_date)
```

Rota proposta:

```text
POST /sessions
```

Corpo esperado:

```json
{
  "work_time": 25,
  "rest_time": 5,
  "session_date": "2026-07-29"
}
```

Resposta esperada:

```json
{
  "id": 4,
  "work_time": 25,
  "rest_time": 5,
  "session_date": "2026-07-29"
}
```

Tarefas:

- [x] aprender diferença entre `GET` e `POST`;
- [x] criar modelo de entrada com validação;
- [x] criar a rota;
- [x] salvar somente uma sessão concluída;
- [x] conectar o término do temporizador ao `POST`;
- [x] atualizar resumo, mapa e histórico após salvar;
- [x] impedir cliques duplicados de criarem duas sessões.

## 1.4 Validação básica

- [ ] validar datas no formato correto;
- [ ] validar mês no formato `YYYY-MM`;
- [ ] aceitar apenas tempos positivos;
- [ ] definir limites razoáveis para foco e descanso;
- [ ] devolver mensagens de erro compreensíveis;
- [ ] estudar códigos HTTP `200`, `201`, `404` e `422`.

### Critério para concluir a Fase 1

Uma pessoa deve conseguir:

```text
abrir o site
→ concluir um Pomodoro
→ salvar no SQLite
→ ver o resumo atualizado
→ encontrar a sessão no mapa e no histórico
```

---

# Fase 2 — Progresso semanal e calendário

**Objetivo:** retirar os mocks restantes do painel.

## Funções de back-end propostas

```python
get_weekly_summary(start_date)
get_progress_overview(reference_date)
calculate_current_streak(reference_date)
```

Os nomes não são definitivos. Antes de implementar, será decidido quais
cálculos pertencem ao SQL e quais pertencem à camada de serviço Python.

## Rotas propostas

```text
GET /sessions/weekly?start_date=YYYY-MM-DD
GET /progress/overview?date=YYYY-MM-DD
```

O resumo poderá fornecer:

```json
{
  "current_streak": 4,
  "weekly_total": 200,
  "previous_week_total": 170,
  "monthly_total": 540
}
```

Tarefas:

- [ ] definir regra exata de sequência;
- [ ] decidir como dias de descanso afetam a sequência;
- [ ] calcular semana atual e anterior;
- [ ] conectar gráfico semanal;
- [ ] conectar comparação;
- [ ] criar calendário mensal completo;
- [ ] permitir avançar e voltar entre meses.

### Decisão de produto importante

A sequência não deve punir o usuário. Futuramente deverão existir dias de
descanso planejados ou uma métrica de consistência menos agressiva.

---

# Fase 3 — Diferencial: intenção e reflexão

**Objetivo:** registrar qualidade, não apenas quantidade.

## 3.1 Intenção antes da sessão

Antes de iniciar, o usuário poderá informar opcionalmente:

- o que deseja realizar;
- matéria, projeto ou categoria.

Exemplo:

```text
Intenção: finalizar o endpoint de histórico
Categoria: Projeto Pomodoro
```

Campos futuros possíveis:

```text
goal
category_id
started_at
completed_at
```

Estado atual:

- [x] coluna `goal` adicionada com migração;
- [x] `goal` opcional integrado ao `POST /sessions`;
- [x] campo de objetivo adicionado antes do foco;
- [x] objetivo exibido no histórico e nos detalhes do calendário;
- [x] categorias de estudo integradas ao banco e à API;
- [x] seletor e criação de categoria no temporizador;
- [x] categoria exibida no histórico e nos detalhes do calendário.

## 3.2 Reflexão rápida depois da sessão

Primeira versão:

- qualidade do foco de 1 a 5;
- objetivo concluído, parcial ou não concluído;
- observação opcional;
- botão evidente para pular.

Segunda versão:

- distração principal;
- categoria;
- histórico detalhado.

Possíveis campos:

```text
focus_quality
completion_status
distraction
notes
```

## Funções de back-end propostas

```python
update_session_reflection(...)
get_session_by_id(session_id)
```

Rota proposta:

```text
PATCH /sessions/{session_id}/reflection
```

Exemplo de corpo:

```json
{
  "focus_quality": 4,
  "completion_status": "completed",
  "distraction": "none",
  "notes": "Consegui conectar o calendário à API."
}
```

## Componentes de front-end planejados

- `SessionIntentionForm`
- `SessionReflectionModal`
- `FocusQualitySelector`
- `CompletionStatusSelector`
- `DistractionSelector`
- `SessionNotesInput`
- `SessionSummaryCard`

## Regras de experiência

- [ ] reflexão rápida;
- [ ] partes opcionais;
- [ ] possível concluir em poucos segundos;
- [ ] nunca bloquear o descanso;
- [ ] nunca usar mensagens de culpa;
- [ ] observações privadas por padrão.

### Critério para concluir a Fase 3

O histórico deve responder:

```text
quanto tempo estudei?
o que eu pretendia fazer?
como foi meu foco?
consegui concluir?
o que me atrapalhou?
```

---

# Fase 4 — Relatórios de qualidade

**Objetivo:** transformar reflexões em informação útil.

## Análises determinísticas primeiro

Antes de usar IA, SQL e Python deverão calcular:

- [ ] qualidade média por semana;
- [ ] porcentagem de objetivos concluídos;
- [ ] distração mais frequente;
- [ ] categoria mais estudada;
- [ ] qualidade por horário;
- [ ] qualidade por duração;
- [ ] comparação entre tempo e qualidade;
- [ ] melhor período do dia;
- [ ] quantidade mínima de dados antes de afirmar uma tendência.

## Funções propostas

```python
get_quality_summary(start_date, end_date)
get_distraction_summary(start_date, end_date)
get_category_summary(start_date, end_date)
get_time_of_day_summary(start_date, end_date)
```

## Rotas propostas

```text
GET /insights/quality
GET /insights/distractions
GET /insights/categories
GET /insights/time-of-day
```

## Regras dos insights

- usar linguagem probabilística;
- informar o tamanho da amostra;
- não confundir correlação com causa;
- não julgar produtividade;
- não inventar conclusões quando faltarem dados.

Exemplo adequado:

> Nas últimas 8 sessões, suas avaliações de foco foram maiores pela manhã.

---

# Fase 5 — Preferências e identidade visual

**Objetivo:** personalizar sem comprometer legibilidade.

## Temas

- [x] Natural — paleta clara original;
- [x] Oceano — azul profundo e tons frios;
- [x] Ember — preto e vermelho, tema pessoal do Gabriel;
- [ ] outros temas poderão ser adicionados depois de testes com usuários.

Primeira implementação:

- [x] preferência salva no navegador;
- [x] temas definidos por variáveis CSS;
- [x] contraste e acessibilidade preservados.

Depois de autenticação:

- preferência sincronizada entre dispositivos.

## Outras configurações

- [ ] duração padrão de foco;
- [ ] duração padrão de descanso;
- [ ] meta diária;
- [ ] sons;
- [ ] notificações;
- [ ] reduzir animações.

---

# Fase 6 — Qualidade técnica e portfólio

**Objetivo:** transformar o projeto funcional em produto confiável.

## Back-end

- [ ] testes das consultas;
- [ ] testes da API;
- [ ] tratamento seguro de conexões;
- [ ] variáveis de ambiente;
- [ ] logs;
- [ ] documentação automática revisada;
- [ ] estratégia de migração do banco;
- [ ] exportação CSV ou JSON.

## Front-end

- [ ] testes dos fluxos principais;
- [ ] estados de carregamento, erro e vazio;
- [ ] acessibilidade por teclado;
- [ ] responsividade revisada;
- [ ] mensagens de confirmação;
- [ ] prevenção de envios duplicados.

## Projeto

- [ ] README atualizado;
- [ ] screenshots;
- [ ] diagrama de arquitetura;
- [ ] documentação para executar;
- [ ] histórico de decisões;
- [ ] publicação da versão de portfólio.

### Versão de portfólio recomendada

A primeira versão pública não precisa de login nem IA. Ela deve possuir:

- timer funcional;
- API conectada;
- banco real;
- histórico;
- calendário;
- reflexão básica;
- relatórios simples;
- boa documentação.

---

# Fase 7 — Autenticação e perfil

**Objetivo:** evoluir de aplicação pessoal para multiusuário.

Esta fase modifica praticamente todas as consultas, porque cada sessão deverá
pertencer a um usuário.

Necessidades futuras:

- [ ] tabela de usuários;
- [ ] `user_id` associado às sessões;
- [ ] cadastro;
- [ ] login e logout;
- [ ] senha protegida por hash;
- [ ] recuperação de conta;
- [ ] autorização das rotas;
- [ ] sessões filtradas pelo usuário;
- [ ] perfil;
- [ ] exclusão e exportação dos dados pessoais.

Autenticação será implementada somente depois do fluxo single-user estar
estável.

---

# Fase 8 — IA e personalização

**Objetivo:** explicar padrões já calculados, sem usar IA como enfeite.

## Pré-requisitos

- dados suficientes;
- métricas determinísticas confiáveis;
- consentimento;
- política de privacidade;
- controle de custo;
- proteção das observações pessoais;
- avaliação das respostas.

## Primeira versão possível

Gerar um resumo semanal baseado somente em métricas fornecidas pelo back-end:

```text
Você estudou por 8h40 nesta semana.
Suas melhores avaliações ocorreram pela manhã.
O celular foi a distração mais frequente.
```

A IA não deverá receber liberdade para inventar números. O back-end calcula os
fatos; a IA apenas ajuda a apresentá-los.

## Evoluções possíveis

- [ ] recomendações de duração por categoria;
- [ ] sugestão de melhor horário;
- [ ] identificação de padrões pessoais;
- [ ] planejamento semanal assistido;
- [ ] resumo de observações;
- [ ] modelo de machine learning quando existir volume de dados suficiente.

---

# Ordem imediata de trabalho

1. ~~`GET /sessions/recent`~~
2. ~~conectar histórico real~~
3. ~~`GET /sessions/by-date`~~
4. ~~conectar detalhes do calendário~~
5. ~~aprender `POST`~~
6. ~~criar `POST /sessions`~~
7. ~~salvar a sessão concluída pelo site~~
8. ~~atualizar automaticamente todas as telas~~
9. implementar resumo semanal e sequência
10. iniciar intenção e reflexão

## Próximo marco

O próximo marco é a primeira sessão completamente integrada:

```text
usuário inicia no front
→ temporizador termina
→ front envia POST
→ API valida
→ database.py salva
→ SQLite persiste
→ painel, mapa e histórico mostram a nova sessão
```
