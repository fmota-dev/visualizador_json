import type { ModoVisualizacao, TemaAplicacao } from "../tipos/json";

export interface PropsBarraFerramentas {
  modoVisualizacao: ModoVisualizacao;
  temaAplicacao: TemaAplicacao;
  visualizacaoDisponivel: boolean;
  exportacaoDisponivel: boolean;
  aoAlterarModoVisualizacao: (modo: ModoVisualizacao) => void;
  aoExpandirTudo: () => void;
  aoRecolherTudo: () => void;
  aoAlternarTema: () => void;
  aoExportarPng: () => void;
}

function classeBotao(ativo = false) {
  return [
    "inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition",
    ativo
      ? "border-[color:var(--cor-destaque)] bg-[color:var(--cor-destaque)] text-white shadow-lg shadow-[color:var(--cor-destaque-suave)]"
      : "border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] text-[color:var(--cor-texto)] hover:border-[color:var(--cor-borda-forte)] hover:bg-[color:var(--cor-destaque-suave)]",
  ].join(" ");
}

export function BarraFerramentas({
  modoVisualizacao,
  temaAplicacao,
  visualizacaoDisponivel,
  exportacaoDisponivel,
  aoAlterarModoVisualizacao,
  aoExpandirTudo,
  aoRecolherTudo,
  aoAlternarTema,
  aoExportarPng,
}: PropsBarraFerramentas) {
  return (
    <div className="painel-vidro flex flex-col gap-3 rounded-[28px] border border-[color:var(--cor-borda)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--cor-texto-suave)]">
            Ferramentas
          </p>
          <h2 className="text-lg font-semibold text-[color:var(--cor-texto)]">
            Explore o JSON do jeito que fizer mais sentido
          </h2>
        </div>
        <button className={classeBotao()} onClick={aoAlternarTema} type="button">
          Tema: {temaAplicacao === "claro" ? "Claro" : "Escuro"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className={classeBotao(modoVisualizacao === "arvore")}
          onClick={() => aoAlterarModoVisualizacao("arvore")}
          type="button"
        >
          Arvore
        </button>
        <button
          className={classeBotao(modoVisualizacao === "grafo")}
          onClick={() => aoAlterarModoVisualizacao("grafo")}
          type="button"
        >
          Grafo
        </button>
        <button
          className={classeBotao()}
          disabled={!visualizacaoDisponivel}
          onClick={aoExpandirTudo}
          type="button"
        >
          Expandir Tudo
        </button>
        <button
          className={classeBotao()}
          disabled={!visualizacaoDisponivel}
          onClick={aoRecolherTudo}
          type="button"
        >
          Recolher Tudo
        </button>
        <button
          className={classeBotao()}
          disabled={!exportacaoDisponivel}
          onClick={aoExportarPng}
          type="button"
        >
          Exportar PNG
        </button>
      </div>
    </div>
  );
}
