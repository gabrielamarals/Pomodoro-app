# Front-end do Study Tracker Pomodoro

Interface web do projeto, mantida separada do back-end Python.

## Responsabilidades desta pasta

- componentes visuais;
- navegação e responsividade;
- estado visual do temporizador;
- dados simulados durante o desenvolvimento;
- futura comunicação HTTP com a API.

O front-end não acessa diretamente o SQLite e não contém consultas SQL.

## Executar localmente

```bash
pnpm install
pnpm dev
```

Durante a primeira etapa, o resumo diário usa dados temporários localizados em
`lib/mocks`. Eles serão substituídos por um serviço HTTP quando a API estiver
disponível.
