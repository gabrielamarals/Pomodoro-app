type AppNavigationProps = {
  activePage: "timer" | "progress" | "history";
};

export function AppNavigation({ activePage }: AppNavigationProps) {
  return (
    <aside className="sidebar" aria-label="Navegação principal">
      <a className="brand" href="/" aria-label="Página inicial do Foco">
        <span className="brand-mark">F</span>
        <span>foco.</span>
      </a>

      <nav className="main-nav">
        <a
          className={`nav-item ${activePage === "timer" ? "active" : ""}`}
          href="/"
          aria-current={activePage === "timer" ? "page" : undefined}
        >
          <span className="nav-dot" /> Temporizador
        </a>
        <a
          className={`nav-item ${activePage === "progress" ? "active" : ""}`}
          href="/progress"
          aria-current={activePage === "progress" ? "page" : undefined}
        >
          <span className="nav-dot" /> Progresso
        </a>
        <span className="nav-item muted" title="Disponível em uma próxima etapa">
          Calendário <small>em breve</small>
        </span>
        <a
          className={`nav-item ${activePage === "history" ? "active" : ""}`}
          href="/history"
          aria-current={activePage === "history" ? "page" : undefined}
        >
          <span className="nav-dot" /> Histórico
        </a>
      </nav>

      <p className="sidebar-note">Um passo de cada vez.</p>
    </aside>
  );
}
