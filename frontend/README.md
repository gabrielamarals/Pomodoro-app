# Front-end do Foco

Interface web em React, TypeScript e Vinext. O front-end controla apresentação,
interações e o temporizador; os dados persistentes são enviados à API FastAPI
por meio do proxy de mesma origem `/api`.

## Desenvolvimento local

```powershell
pnpm install
pnpm run dev
```

Por padrão, o Worker local encaminha `/api` para `http://127.0.0.1:8000`.
O back-end precisa estar rodando separadamente.

## Build e preview

```powershell
pnpm run build
pnpm run preview
```

## Deploy

```powershell
pnpm run deploy
```

O deploy direto usa `wrangler.jsonc`. Em produção, `API_ORIGIN` é configurada
como variável protegida no Cloudflare e não deve ser escrita no repositório.

Beta público: <https://foco-pomodoro.gabrielamarals.workers.dev>
