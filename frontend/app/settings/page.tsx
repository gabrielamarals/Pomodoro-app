"use client";

import { useEffect, useState } from "react";
import { AppNavigation } from "../components/AppNavigation";

const THEME_STORAGE_KEY = "pomodoro-theme";

const THEMES = [
  {
    id: "natural",
    name: "Natural",
    description: "A paleta clara e acolhedora original.",
    colors: ["#f4f1e9", "#18332e", "#e9654b"],
  },
  {
    id: "ember",
    name: "Ember",
    description: "Preto e vermelho para uma experiência mais intensa.",
    colors: ["#0c0b0b", "#201a1a", "#e04437"],
  },
  {
    id: "ocean",
    name: "Oceano",
    description: "Azul profundo e tons frios para estudar com calma.",
    colors: ["#edf3f6", "#142d40", "#3979ae"],
  },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

function isThemeId(value: string | undefined): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

export default function SettingsPage() {
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>("natural");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeId(savedTheme ?? undefined)) {
      setSelectedTheme(savedTheme);
    }
  }, []);

  function selectTheme(theme: ThemeId) {
    setSelectedTheme(theme);
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  return (
    <main className="app-shell">
      <AppNavigation activePage="settings" />

      <section className="workspace settings-workspace">
        <header className="topbar settings-topbar">
          <div>
            <p className="eyebrow">Preferências</p>
            <h1>Configurações.</h1>
          </div>
          <span className="demo-badge">salvo neste dispositivo</span>
        </header>

        <section className="appearance-card" aria-labelledby="appearance-title">
          <div className="appearance-heading">
            <div>
              <p className="eyebrow">Aparência</p>
              <h2 id="appearance-title">Tema da interface</h2>
            </div>
            <p>
              A preferência é aplicada em todas as telas e pode ser alterada a
              qualquer momento.
            </p>
          </div>

          <div className="theme-options" role="radiogroup" aria-label="Tema da interface">
            {THEMES.map((theme) => {
              const isSelected = selectedTheme === theme.id;

              return (
                <button
                  aria-checked={isSelected}
                  className={`theme-option ${isSelected ? "selected" : ""}`}
                  key={theme.id}
                  onClick={() => selectTheme(theme.id)}
                  role="radio"
                  type="button"
                >
                  <span className="theme-preview" aria-hidden="true">
                    {theme.colors.map((color) => (
                      <i key={color} style={{ background: color }} />
                    ))}
                  </span>
                  <span className="theme-copy">
                    <strong>{theme.name}</strong>
                    <small>{theme.description}</small>
                  </span>
                  <span className="theme-check" aria-hidden="true">
                    {isSelected ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <p className="data-note">
          Aparência é a primeira seção desta página. Durações padrão, metas, sons e
          notificações serão adicionados aqui nas próximas etapas. Quando houver
          contas de usuário, as preferências poderão ser sincronizadas pela API.
        </p>
      </section>
    </main>
  );
}
