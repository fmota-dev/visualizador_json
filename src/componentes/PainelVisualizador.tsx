import { DiffEditor } from "@monaco-editor/react";
import type { ReactNode, RefObject } from "react";
import type {
  FiltroBusca,
  FormatoDocumento,
  MetadadosTabelaCsv,
  ModoPainelVisualizador,
  ModoVisualizacao,
  NoJson,
  PresetLayoutGrafo,
  StatusDiferencaNo,
  SubmodoComparacao,
  TemaAplicacao,
} from "../tipos/json";
import { obterRotuloFormato } from "../utilitarios/documentos";
import { formatarCaminho, serializarJson } from "../utilitarios/json";
import { VisualizadorArvore } from "./VisualizadorArvore";
import { VisualizadorGrafo } from "./VisualizadorGrafo";
import { VisualizadorTabela } from "./VisualizadorTabela";

interface ItemBreadcrumb {
  id: string;
  rotulo: string;
  caminho: Array<string | number>;
}

export interface PropsPainelVisualizador {
  visualizadorTelaCheia: boolean;
  temaAplicacao: TemaAplicacao;
  modoPainelVisualizador: ModoPainelVisualizador;
  submodoComparacao: SubmodoComparacao;
  modoVisualizacao: ModoVisualizacao;
  formatoDocumento: FormatoDocumento;
  formatoDocumentoReferencia: FormatoDocumento;
  termoBusca: string;
  filtroBusca: FiltroBusca;
  buscaAtiva: boolean;
  buscaDisponivel: boolean;
  visualizacaoDisponivel: boolean;
  visualizacaoReferenciaDisponivel: boolean;
  exportacaoDisponivel: boolean;
  editorRecolhido: boolean;
  miniMapaVisivel: boolean;
  presetLayoutGrafo: PresetLayoutGrafo;
  comparacaoMesmoFormato: boolean;
  resultadosBuscaQuantidade: number;
  jsonBruto: string;
  jsonReferenciaBruto: string;
  metadadosTabela: MetadadosTabelaCsv | null;
  metadadosTabelaReferencia: MetadadosTabelaCsv | null;
  feedbackCopia: string;
  noEmFoco: NoJson | null;
  itensBreadcrumb: ItemBreadcrumb[];
  arvoreJson: NoJson | null;
  arvoreReferenciaJson: NoJson | null;
  idsAncestres: Set<string>;
  idsCorrespondentes: Set<string>;
  nosExpandidos: Set<string>;
  resultadoAtualId?: string;
  noAtivoId?: string | null;
  mapaDiferencasAtual: Map<string, StatusDiferencaNo>;
  mapaDiferencasReferencia: Map<string, StatusDiferencaNo>;
  painelComparacaoAtivo: "referencia" | "atual";
  graficoRef: RefObject<HTMLDivElement | null>;
  graficoComparacaoAtualRef: RefObject<HTMLDivElement | null>;
  graficoComparacaoReferenciaRef: RefObject<HTMLDivElement | null>;
  menuVisualizadorRef: RefObject<HTMLDetailsElement | null>;
  aoAlterarTema: (tema: TemaAplicacao) => void;
  aoAlterarModoPainelVisualizador: (modo: ModoPainelVisualizador) => void;
  aoAlterarSubmodoComparacao: (modo: SubmodoComparacao) => void;
  aoAlterarModoVisualizacao: (modo: ModoVisualizacao) => void;
  aoExpandirTudo: () => void;
  aoRecolherTudo: () => void;
  aoExportarPng: () => Promise<void>;
  aoExportarSvg: () => Promise<void>;
  aoAlternarTelaCheia: () => void;
  aoAlternarEditor: () => void;
  aoAlterarTermoBusca: (termo: string) => void;
  aoAlterarFiltroBusca: (filtro: FiltroBusca) => void;
  aoAlterarPresetLayoutGrafo: (preset: PresetLayoutGrafo) => void;
  aoAlternarMiniMapa: () => void;
  aoIrParaResultadoAnterior: () => void;
  aoIrParaProximoResultado: () => void;
  aoSelecionarCaminhoBreadcrumb: (caminho: Array<string | number>) => void;
  aoSelecionarPainelComparacao: (painel: "referencia" | "atual") => void;
  aoCopiarTexto: (texto: string, mensagem: string) => Promise<void>;
  aoAlternarExpansao: (id: string) => void;
  aoSelecionarNo: (no: NoJson) => void;
  aoEditarNo: (no: NoJson) => void;
}

const opcoesFiltroBusca: Array<{ valor: FiltroBusca; rotulo: string }> = [
  { valor: "todos", rotulo: "Tudo" },
  { valor: "chave", rotulo: "Chave" },
  { valor: "valor", rotulo: "Valor" },
  { valor: "caminho", rotulo: "Caminho" },
  { valor: "tipo", rotulo: "Tipo" },
];

const itensLegendaDiferenca: Array<{
  status: Exclude<StatusDiferencaNo, "igual">;
  rotulo: string;
  classes: string;
}> = [
  {
    status: "adicionado",
    rotulo: "Adicionado",
    classes:
      "border-[color:rgba(15,118,110,0.3)] bg-[color:rgba(15,118,110,0.14)] text-[color:var(--cor-acao-secundaria)]",
  },
  {
    status: "removido",
    rotulo: "Removido",
    classes:
      "border-[color:rgba(180,35,24,0.28)] bg-[color:rgba(180,35,24,0.12)] text-[color:var(--cor-perigo)]",
  },
  {
    status: "alterado",
    rotulo: "Alterado",
    classes:
      "border-[color:rgba(199,91,18,0.28)] bg-[color:rgba(199,91,18,0.14)] text-[color:var(--cor-destaque-forte)]",
  },
];

function classeBotaoCabecalho(ativo = false) {
  return [
    "inline-flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45",
    ativo
      ? "border-[color:var(--cor-destaque)] bg-[color:var(--cor-destaque)] text-white"
      : "border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] text-[color:var(--cor-texto)] hover:border-[color:var(--cor-borda-forte)] hover:bg-[color:var(--cor-destaque-suave)]",
  ].join(" ");
}

function classeBotaoTema(ativo = false) {
  return [
    "inline-flex h-10 w-10 items-center justify-center rounded-full border transition",
    ativo
      ? "border-[color:var(--cor-destaque)] bg-[color:var(--cor-destaque)] text-white"
      : "border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-painel)] text-[color:var(--cor-texto)] hover:border-[color:var(--cor-borda-forte)] hover:bg-[color:var(--cor-destaque-suave)]",
  ].join(" ");
}

function IconeSol() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.5v2.2M12 19.3v2.2M4.7 4.7l1.6 1.6M17.7 17.7l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.7 19.3l1.6-1.6M17.7 6.3l1.6-1.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconeLua() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M20 14.2A8 8 0 0 1 9.8 4 8.6 8.6 0 1 0 20 14.2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconeExplorar() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m9.2 14.8 1.8-5.1 5.1-1.8-1.8 5.1-5.1 1.8Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" fill="currentColor" r="1.1" />
    </svg>
  );
}

function IconeComparar() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <rect height="12" rx="2.6" stroke="currentColor" strokeWidth="1.8" width="6.8" x="4" y="6" />
      <rect height="12" rx="2.6" stroke="currentColor" strokeWidth="1.8" width="6.8" x="13.2" y="6" />
      <path d="M10.8 12h2.4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function IconeTexto() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M5 7.5h14M8.5 12h7M6.5 16.5h11" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function IconeArvore() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <rect height="4" rx="1.2" stroke="currentColor" strokeWidth="1.8" width="5" x="4" y="4.5" />
      <rect height="4" rx="1.2" stroke="currentColor" strokeWidth="1.8" width="5" x="15" y="9.8" />
      <rect height="4" rx="1.2" stroke="currentColor" strokeWidth="1.8" width="5" x="15" y="15.2" />
      <path d="M9 6.5h3.5a2 2 0 0 1 2 2v8.7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M14.5 11.8H15M14.5 17.2H15" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function IconeGrafo() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle cx="6" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="17" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.2 11.1 15.7 7.9M8.2 12.9l7.5 3.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function IconeMais() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <circle cx="6" cy="12" fill="currentColor" r="1.8" />
      <circle cx="12" cy="12" fill="currentColor" r="1.8" />
      <circle cx="18" cy="12" fill="currentColor" r="1.8" />
    </svg>
  );
}

function ConteudoBotaoCabecalho({
  icone,
  rotulo,
}: {
  icone: ReactNode;
  rotulo: string;
}) {
  return (
    <>
      <span className="shrink-0">{icone}</span>
      <span>{rotulo}</span>
    </>
  );
}

function descreverDisponibilidadeComparacao(
  comparacaoMesmoFormato: boolean,
  formatoDocumento: FormatoDocumento,
) {
  if (!comparacaoMesmoFormato) {
    return "Formato invalido.";
  }

  if (formatoDocumento === "csv") {
    return "Texto, Arvore e Tabela estao disponiveis para CSV x CSV.";
  }

  return "Texto, Arvore e Grafo estao disponiveis para esta combinacao.";
}

export function PainelVisualizador({
  visualizadorTelaCheia,
  temaAplicacao,
  modoPainelVisualizador,
  submodoComparacao,
  modoVisualizacao,
  formatoDocumento,
  formatoDocumentoReferencia,
  termoBusca,
  filtroBusca,
  buscaAtiva,
  buscaDisponivel,
  visualizacaoDisponivel,
  visualizacaoReferenciaDisponivel,
  exportacaoDisponivel,
  editorRecolhido,
  miniMapaVisivel,
  presetLayoutGrafo,
  comparacaoMesmoFormato,
  resultadosBuscaQuantidade,
  jsonBruto,
  jsonReferenciaBruto,
  metadadosTabela,
  metadadosTabelaReferencia,
  feedbackCopia,
  noEmFoco,
  itensBreadcrumb,
  arvoreJson,
  arvoreReferenciaJson,
  idsAncestres,
  idsCorrespondentes,
  nosExpandidos,
  resultadoAtualId,
  noAtivoId,
  mapaDiferencasAtual,
  mapaDiferencasReferencia,
  painelComparacaoAtivo,
  graficoRef,
  graficoComparacaoAtualRef,
  graficoComparacaoReferenciaRef,
  menuVisualizadorRef,
  aoAlterarTema,
  aoAlterarModoPainelVisualizador,
  aoAlterarSubmodoComparacao,
  aoAlterarModoVisualizacao,
  aoExpandirTudo,
  aoRecolherTudo,
  aoExportarPng,
  aoExportarSvg,
  aoAlternarTelaCheia,
  aoAlternarEditor,
  aoAlterarTermoBusca,
  aoAlterarFiltroBusca,
  aoAlterarPresetLayoutGrafo,
  aoAlternarMiniMapa,
  aoIrParaResultadoAnterior,
  aoIrParaProximoResultado,
  aoSelecionarCaminhoBreadcrumb,
  aoSelecionarPainelComparacao,
  aoCopiarTexto,
  aoAlternarExpansao,
  aoSelecionarNo,
  aoEditarNo,
}: PropsPainelVisualizador) {
  const modoComparacaoAtivo = modoPainelVisualizador === "comparar";
  const tabelaDisponivel = formatoDocumento === "csv" && Boolean(metadadosTabela);
  const grafoDisponivel = formatoDocumento !== "csv";
  const tabelaComparacaoDisponivel =
    comparacaoMesmoFormato &&
    formatoDocumento === "csv" &&
    Boolean(metadadosTabela) &&
    Boolean(metadadosTabelaReferencia);
  const grafoComparacaoDisponivel = comparacaoMesmoFormato && formatoDocumento !== "csv";
  const resumoDisponibilidadeComparacao = descreverDisponibilidadeComparacao(
    comparacaoMesmoFormato,
    formatoDocumento,
  );
  const tituloVisualizador = modoComparacaoAtivo
    ? submodoComparacao === "texto"
      ? "Comparacao em Texto"
      : submodoComparacao === "tabela"
        ? "Comparacao em Tabela"
      : submodoComparacao === "arvore"
        ? "Comparacao em Arvore"
        : "Comparacao em Grafo"
    : modoVisualizacao === "tabela"
      ? "Modo Tabela"
    : modoVisualizacao === "arvore"
      ? "Modo Arvore"
      : "Modo Grafo";

  return (
    <section
      className={`painel-vidro painel-visualizador flex min-h-0 flex-col overflow-hidden rounded-[32px] border border-[color:var(--cor-borda)] ${
        visualizadorTelaCheia
          ? "h-full"
          : "h-[calc(100dvh-1.5rem)] min-h-[520px] sm:h-[calc(100dvh-2rem)]"
      }`}
      tabIndex={-1}
    >
      <div className="flex flex-col gap-3 border-b border-[color:var(--cor-borda)] px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--cor-texto-suave)]">
              Visualizador
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[color:var(--cor-texto)]">
              {tituloVisualizador}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-3 rounded-[22px] border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] px-3 py-2">
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--cor-texto-suave)]">
                Tema
              </span>
              <div className="flex rounded-full border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-painel)] p-1">
                <button
                  aria-label="Ativar tema claro"
                  className={classeBotaoTema(temaAplicacao === "claro")}
                  onClick={() => aoAlterarTema("claro")}
                  title="Tema claro"
                  type="button"
                >
                  <IconeSol />
                </button>
                <button
                  aria-label="Ativar tema escuro"
                  className={classeBotaoTema(temaAplicacao === "escuro")}
                  onClick={() => aoAlterarTema("escuro")}
                  title="Tema escuro"
                  type="button"
                >
                  <IconeLua />
                </button>
              </div>
            </div>

            <div className="flex rounded-full border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] p-1">
              <button
                className={classeBotaoCabecalho(!modoComparacaoAtivo)}
                onClick={() => aoAlterarModoPainelVisualizador("explorar")}
                type="button"
              >
                <ConteudoBotaoCabecalho icone={<IconeExplorar />} rotulo="Explorar" />
              </button>
              <button
                className={classeBotaoCabecalho(modoComparacaoAtivo)}
                onClick={() => aoAlterarModoPainelVisualizador("comparar")}
                type="button"
              >
                <ConteudoBotaoCabecalho icone={<IconeComparar />} rotulo="Comparar" />
              </button>
            </div>

            <div className="flex rounded-full border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] p-1">
              {!modoComparacaoAtivo ? (
                <>
                  {tabelaDisponivel ? (
                    <button
                      className={classeBotaoCabecalho(modoVisualizacao === "tabela")}
                      onClick={() => aoAlterarModoVisualizacao("tabela")}
                      type="button"
                    >
                      <ConteudoBotaoCabecalho icone={<IconeTexto />} rotulo="Tabela" />
                    </button>
                  ) : null}
                  <button
                    className={classeBotaoCabecalho(modoVisualizacao === "arvore")}
                    onClick={() => aoAlterarModoVisualizacao("arvore")}
                    type="button"
                  >
                    <ConteudoBotaoCabecalho icone={<IconeArvore />} rotulo="Arvore" />
                  </button>
                  {grafoDisponivel ? (
                    <button
                      className={classeBotaoCabecalho(modoVisualizacao === "grafo")}
                      onClick={() => aoAlterarModoVisualizacao("grafo")}
                      type="button"
                    >
                      <ConteudoBotaoCabecalho icone={<IconeGrafo />} rotulo="Grafo" />
                    </button>
                  ) : null}
                </>
              ) : (
                <>
                  <button
                    className={classeBotaoCabecalho(submodoComparacao === "texto")}
                    disabled={!comparacaoMesmoFormato}
                    onClick={() => aoAlterarSubmodoComparacao("texto")}
                    title={
                      comparacaoMesmoFormato
                        ? "Comparar em texto"
                        : "Formato invalido."
                    }
                    type="button"
                  >
                    <ConteudoBotaoCabecalho icone={<IconeTexto />} rotulo="Texto" />
                  </button>
                  <button
                    className={classeBotaoCabecalho(submodoComparacao === "tabela")}
                    disabled={!tabelaComparacaoDisponivel}
                    onClick={() => aoAlterarSubmodoComparacao("tabela")}
                    title={
                      tabelaComparacaoDisponivel
                        ? "Comparar em tabela"
                        : !comparacaoMesmoFormato
                          ? "Formato invalido."
                          : "Tabela so fica disponivel em CSV x CSV."
                    }
                    type="button"
                  >
                    <ConteudoBotaoCabecalho icone={<IconeTexto />} rotulo="Tabela" />
                  </button>
                  <button
                    className={classeBotaoCabecalho(submodoComparacao === "arvore")}
                    disabled={!comparacaoMesmoFormato}
                    onClick={() => aoAlterarSubmodoComparacao("arvore")}
                    title={
                      comparacaoMesmoFormato
                        ? "Comparar em arvore"
                        : "Formato invalido."
                    }
                    type="button"
                  >
                    <ConteudoBotaoCabecalho icone={<IconeArvore />} rotulo="Arvore" />
                  </button>
                  <button
                    className={classeBotaoCabecalho(submodoComparacao === "grafo")}
                    disabled={!grafoComparacaoDisponivel}
                    onClick={() => aoAlterarSubmodoComparacao("grafo")}
                    title={
                      grafoComparacaoDisponivel
                        ? "Comparar em grafo"
                        : !comparacaoMesmoFormato
                          ? "Formato invalido."
                          : "Grafo so fica disponivel para formatos com grafo."
                    }
                    type="button"
                  >
                    <ConteudoBotaoCabecalho icone={<IconeGrafo />} rotulo="Grafo" />
                  </button>
                </>
              )}
            </div>

            <details className="menu-detalhes relative" ref={menuVisualizadorRef}>
              <summary className={classeBotaoCabecalho()}>
                <ConteudoBotaoCabecalho icone={<IconeMais />} rotulo="Mais" />
              </summary>
              <div className="menu-flutuante absolute right-0 top-[calc(100%+10px)] z-20 flex min-w-56 flex-col gap-1 rounded-[22px] border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-painel)] p-2 shadow-2xl">
                <button
                  className="rounded-2xl px-4 py-3 text-left text-sm text-[color:var(--cor-texto)] transition hover:bg-[color:var(--cor-destaque-suave)] disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={!visualizacaoDisponivel}
                  onClick={() => {
                    aoExpandirTudo();
                    menuVisualizadorRef.current?.removeAttribute("open");
                  }}
                  type="button"
                >
                  Expandir Tudo
                </button>
                <button
                  className="rounded-2xl px-4 py-3 text-left text-sm text-[color:var(--cor-texto)] transition hover:bg-[color:var(--cor-destaque-suave)] disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={!visualizacaoDisponivel}
                  onClick={() => {
                    aoRecolherTudo();
                    menuVisualizadorRef.current?.removeAttribute("open");
                  }}
                  type="button"
                >
                  Recolher Tudo
                </button>
                {(!modoComparacaoAtivo && modoVisualizacao === "grafo" && grafoDisponivel) ||
                (modoComparacaoAtivo &&
                  submodoComparacao === "grafo" &&
                  grafoComparacaoDisponivel) ? (
                  <>
                    <button
                      className="rounded-2xl px-4 py-3 text-left text-sm text-[color:var(--cor-texto)] transition hover:bg-[color:var(--cor-destaque-suave)]"
                      onClick={() => {
                        aoAlternarMiniMapa();
                        menuVisualizadorRef.current?.removeAttribute("open");
                      }}
                      type="button"
                    >
                      {miniMapaVisivel ? "Ocultar mini mapa" : "Mostrar mini mapa"}
                    </button>
                    <div className="rounded-2xl px-4 py-3 text-sm text-[color:var(--cor-texto)]">
                      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--cor-texto-suave)]">
                        Layout do grafo
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(["compacto", "equilibrado", "amplo"] as PresetLayoutGrafo[]).map(
                          (preset) => (
                            <button
                              className={classeBotaoCabecalho(presetLayoutGrafo === preset)}
                              key={preset}
                              onClick={() => {
                                aoAlterarPresetLayoutGrafo(preset);
                                menuVisualizadorRef.current?.removeAttribute("open");
                              }}
                              type="button"
                            >
                              {preset}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  </>
                ) : null}
                {exportacaoDisponivel ? (
                  <>
                    <button
                      className="rounded-2xl px-4 py-3 text-left text-sm text-[color:var(--cor-texto)] transition hover:bg-[color:var(--cor-destaque-suave)] disabled:cursor-not-allowed disabled:opacity-45"
                      disabled={!exportacaoDisponivel}
                      onClick={() => {
                        void aoExportarPng();
                        menuVisualizadorRef.current?.removeAttribute("open");
                      }}
                      type="button"
                    >
                      Exportar PNG
                    </button>
                    <button
                      className="rounded-2xl px-4 py-3 text-left text-sm text-[color:var(--cor-texto)] transition hover:bg-[color:var(--cor-destaque-suave)] disabled:cursor-not-allowed disabled:opacity-45"
                      disabled={!exportacaoDisponivel}
                      onClick={() => {
                        void aoExportarSvg();
                        menuVisualizadorRef.current?.removeAttribute("open");
                      }}
                      type="button"
                    >
                      Exportar SVG
                    </button>
                  </>
                ) : null}
                <button
                  className="rounded-2xl px-4 py-3 text-left text-sm text-[color:var(--cor-texto)] transition hover:bg-[color:var(--cor-destaque-suave)]"
                  onClick={() => {
                    aoAlternarTelaCheia();
                    menuVisualizadorRef.current?.removeAttribute("open");
                  }}
                  type="button"
                >
                  {visualizadorTelaCheia ? "Sair da tela cheia" : "Tela cheia"}
                </button>
                <button
                  className="rounded-2xl px-4 py-3 text-left text-sm text-[color:var(--cor-texto)] transition hover:bg-[color:var(--cor-destaque-suave)]"
                  onClick={() => {
                    aoAlternarEditor();
                    menuVisualizadorRef.current?.removeAttribute("open");
                  }}
                  type="button"
                >
                  {editorRecolhido ? "Abrir editor" : "Recolher editor"}
                </button>
              </div>
            </details>
          </div>
        </div>

        {buscaDisponivel ? (
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
              <input
                className="h-11 flex-1 rounded-2xl border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] px-4 text-[color:var(--cor-texto)] outline-none transition placeholder:text-[color:var(--cor-texto-suave)] focus:border-[color:var(--cor-destaque)]"
                onChange={(evento) => aoAlterarTermoBusca(evento.target.value)}
                placeholder="Buscar por chave, valor, caminho ou tipo..."
                type="search"
                value={termoBusca}
              />

              <label className="flex items-center gap-2 rounded-2xl border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] px-3 text-sm text-[color:var(--cor-texto-suave)]">
                <span className="whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.18em]">
                  Escopo
                </span>
                <select
                  className="h-11 bg-transparent pr-2 text-sm font-medium text-[color:var(--cor-texto)] outline-none"
                  onChange={(evento) =>
                    aoAlterarFiltroBusca(evento.target.value as FiltroBusca)
                  }
                  value={filtroBusca}
                >
                  {opcoesFiltroBusca.map((opcao) => (
                    <option
                      className="bg-[color:var(--cor-fundo-painel)]"
                      key={opcao.valor}
                      value={opcao.valor}
                    >
                      {opcao.rotulo}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {buscaAtiva ? (
              <div className="flex gap-2">
                <button
                  className={classeBotaoCabecalho()}
                  disabled={resultadosBuscaQuantidade === 0}
                  onClick={aoIrParaResultadoAnterior}
                  type="button"
                >
                  Anterior
                </button>
                <button
                  className={classeBotaoCabecalho()}
                  disabled={resultadosBuscaQuantidade === 0}
                  onClick={aoIrParaProximoResultado}
                  type="button"
                >
                  Proximo
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-[24px] border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] px-4 py-3 text-sm text-[color:var(--cor-texto-suave)]">
            {modoComparacaoAtivo && !comparacaoMesmoFormato
              ? "Formato invalido."
              : "O modo texto usa o diff do editor. A busca continua disponivel nas visualizacoes estruturadas."}
          </div>
        )}

        {modoComparacaoAtivo ? (
          <div className="rounded-[24px] border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] px-4 py-3 text-sm text-[color:var(--cor-texto-suave)]">
            <strong className="text-[color:var(--cor-texto)]">
              {obterRotuloFormato(formatoDocumentoReferencia)} x {obterRotuloFormato(formatoDocumento)}
            </strong>{" "}
            • {resumoDisponibilidadeComparacao}
          </div>
        ) : null}

        {modoComparacaoAtivo && comparacaoMesmoFormato && submodoComparacao !== "texto" ? (
          <div className="flex flex-col gap-3 rounded-[24px] border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              {itensLegendaDiferenca.map((item) => (
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${item.classes}`}
                  key={item.status}
                >
                  {item.rotulo}
                </span>
              ))}
            </div>
            <p className="text-sm text-[color:var(--cor-texto-suave)]">
              A coluna <strong className="text-[color:var(--cor-texto)]">Original</strong> destaca o
              que so existe no documento original, e a coluna{" "}
              <strong className="text-[color:var(--cor-texto)]">Modificado</strong> mostra o que entrou
              ou mudou em relacao ao original.
            </p>
          </div>
        ) : null}

        {noEmFoco && buscaDisponivel ? (
          <div className="flex flex-col gap-3 rounded-[24px] border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--cor-texto-suave)]">
                  No em foco
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[color:var(--cor-texto)]">
                  {itensBreadcrumb.map((item, indice) => (
                    <div className="flex items-center gap-2" key={item.id}>
                      {indice > 0 ? (
                        <span className="text-[color:var(--cor-texto-suave)]">/</span>
                      ) : null}
                      <button
                        className="rounded-full border border-[color:var(--cor-borda)] px-3 py-1 transition hover:border-[color:var(--cor-borda-forte)] hover:bg-[color:var(--cor-destaque-suave)]"
                        onClick={() => aoSelecionarCaminhoBreadcrumb(item.caminho)}
                        type="button"
                      >
                        {item.rotulo}
                      </button>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-[color:var(--cor-texto-suave)]">
                  Caminho completo: {formatarCaminho(noEmFoco.caminho)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  className={classeBotaoCabecalho()}
                  onClick={() =>
                    void aoCopiarTexto(
                      formatarCaminho(noEmFoco.caminho),
                      "Caminho copiado.",
                    )
                  }
                  type="button"
                >
                  Copiar caminho
                </button>
                <button
                  className={classeBotaoCabecalho()}
                  onClick={() =>
                    void aoCopiarTexto(
                      serializarJson(noEmFoco.valor),
                      "Valor copiado.",
                    )
                  }
                  type="button"
                >
                  Copiar valor
                </button>
              </div>
            </div>

            {feedbackCopia ? (
              <p className="text-xs font-medium text-[color:var(--cor-acao-secundaria)]">
                {feedbackCopia}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 p-3 sm:p-4">
        {!modoComparacaoAtivo ? (
          modoVisualizacao === "tabela" ? (
            <VisualizadorTabela
              aoEditarNo={aoEditarNo}
              aoSelecionarNo={aoSelecionarNo}
              idsCorrespondentes={idsCorrespondentes}
              metadadosTabela={metadadosTabela}
              noAtivoId={noAtivoId ?? resultadoAtualId}
              raiz={arvoreJson}
              resultadoAtualId={resultadoAtualId}
            />
          ) : modoVisualizacao === "arvore" ? (
            <VisualizadorArvore
              aoAlternarExpansao={aoAlternarExpansao}
              aoSelecionarNo={aoSelecionarNo}
              aoEditarNo={aoEditarNo}
              idsAncestres={idsAncestres}
              idsCorrespondentes={idsCorrespondentes}
              noAtivoId={noAtivoId ?? resultadoAtualId}
              nosExpandidos={nosExpandidos}
              raiz={arvoreJson}
              resultadoAtualId={resultadoAtualId}
              termoBusca={termoBusca}
            />
          ) : (
            <VisualizadorGrafo
              aoAlternarExpansao={aoAlternarExpansao}
              aoSelecionarNo={aoSelecionarNo}
              aoEditarNo={aoEditarNo}
              containerRef={graficoRef}
              idsCorrespondentes={idsCorrespondentes}
              miniMapaVisivel={miniMapaVisivel}
              noAtivoId={noAtivoId ?? resultadoAtualId}
              nosExpandidos={nosExpandidos}
              presetLayout={presetLayoutGrafo}
              raiz={arvoreJson}
              resultadoAtualId={resultadoAtualId}
            />
          )
        ) : !comparacaoMesmoFormato ? (
          <div className="flex h-full min-h-0 items-center justify-center">
            <div className="flex w-full max-w-2xl flex-col gap-3 rounded-[28px] border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] p-6 text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--cor-texto-suave)]">
                Comparacao
              </p>
              <h3 className="text-xl font-semibold text-[color:var(--cor-texto)]">
                Formato invalido.
              </h3>
            </div>
          </div>
        ) : submodoComparacao === "texto" ? (
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[26px] border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--cor-texto-suave)]">
                  Diff textual
                </p>
                <h3 className="text-lg font-semibold text-[color:var(--cor-texto)]">
                  {obterRotuloFormato(formatoDocumentoReferencia)} original x{" "}
                  {obterRotuloFormato(formatoDocumento)} modificado
                </h3>
              </div>
              <p className="text-xs text-[color:var(--cor-texto-suave)]">
                Original a esquerda, modificado a direita.
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden rounded-[22px] border border-[color:var(--cor-borda)]">
              <DiffEditor
                height="100%"
                language="plaintext"
                modified={jsonBruto}
                options={{
                  automaticLayout: true,
                  fontSize: 14,
                  minimap: { enabled: false },
                  originalEditable: false,
                  readOnly: true,
                  renderSideBySide: true,
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                }}
                original={jsonReferenciaBruto}
                theme={temaAplicacao === "escuro" ? "vs-dark" : "light"}
              />
            </div>
          </div>
        ) : (
          <div className="grid h-full min-h-0 gap-3 xl:grid-cols-2">
            <section
              className={`flex min-h-0 flex-col rounded-[26px] border bg-[color:var(--cor-fundo-elevado)] p-3 ${
                painelComparacaoAtivo === "referencia"
                  ? "border-[color:var(--cor-destaque)]"
                  : "border-[color:var(--cor-borda)]"
              }`}
              onClick={() => aoSelecionarPainelComparacao("referencia")}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--cor-texto-suave)]">
                    Original
                  </p>
                  <h3 className="text-lg font-semibold text-[color:var(--cor-texto)]">
                    {obterRotuloFormato(formatoDocumentoReferencia)} original
                  </h3>
                </div>
                {!visualizacaoReferenciaDisponivel ? (
                  <span className="text-xs text-[color:var(--cor-perigo)]">
                    {obterRotuloFormato(formatoDocumentoReferencia)} invalido
                  </span>
                ) : null}
              </div>
              <p className="mb-3 text-xs text-[color:var(--cor-texto-suave)]">
                Vermelho indica o que existe so no original. Laranja marca o que mudou entre os dois
                lados.
              </p>
              <div className="min-h-0 flex-1">
                {submodoComparacao === "tabela" ? (
                  <VisualizadorTabela
                    aoEditarNo={aoEditarNo}
                    aoSelecionarNo={aoSelecionarNo}
                    idsCorrespondentes={new Set<string>()}
                    mapaDiferencas={mapaDiferencasReferencia}
                    metadadosTabela={metadadosTabelaReferencia}
                    permitirEdicao={false}
                    raiz={arvoreReferenciaJson}
                  />
                ) : submodoComparacao === "arvore" ? (
                  <VisualizadorArvore
                    aoAlternarExpansao={aoAlternarExpansao}
                    aoSelecionarNo={aoSelecionarNo}
                    aoEditarNo={aoEditarNo}
                    idsAncestres={new Set<string>()}
                    idsCorrespondentes={new Set<string>()}
                    mapaDiferencas={mapaDiferencasReferencia}
                    nosExpandidos={nosExpandidos}
                    permitirEdicao={false}
                    raiz={arvoreReferenciaJson}
                    termoBusca=""
                  />
                ) : (
                  <VisualizadorGrafo
                    aoAlternarExpansao={aoAlternarExpansao}
                    aoSelecionarNo={aoSelecionarNo}
                    aoEditarNo={aoEditarNo}
                    containerRef={graficoComparacaoReferenciaRef}
                    idsCorrespondentes={new Set<string>()}
                    mapaDiferencas={mapaDiferencasReferencia}
                    miniMapaVisivel={miniMapaVisivel}
                    nosExpandidos={nosExpandidos}
                    permitirEdicao={false}
                    presetLayout={presetLayoutGrafo}
                    raiz={arvoreReferenciaJson}
                  />
                )}
              </div>
            </section>

            <section
              className={`flex min-h-0 flex-col rounded-[26px] border bg-[color:var(--cor-fundo-elevado)] p-3 ${
                painelComparacaoAtivo === "atual"
                  ? "border-[color:var(--cor-destaque)]"
                  : "border-[color:var(--cor-borda)]"
              }`}
              onClick={() => aoSelecionarPainelComparacao("atual")}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--cor-texto-suave)]">
                    Modificado
                  </p>
                  <h3 className="text-lg font-semibold text-[color:var(--cor-texto)]">
                    {obterRotuloFormato(formatoDocumento)} modificado
                  </h3>
                </div>
                {!visualizacaoDisponivel ? (
                  <span className="text-xs text-[color:var(--cor-perigo)]">
                    {obterRotuloFormato(formatoDocumento)} invalido
                  </span>
                ) : null}
              </div>
              <p className="mb-3 text-xs text-[color:var(--cor-texto-suave)]">
                Verde indica o que foi adicionado no modificado. Laranja marca o que mudou em relacao ao
                original.
              </p>
              <div className="min-h-0 flex-1">
                {submodoComparacao === "tabela" ? (
                  <VisualizadorTabela
                    aoEditarNo={aoEditarNo}
                    aoSelecionarNo={aoSelecionarNo}
                    idsCorrespondentes={idsCorrespondentes}
                    mapaDiferencas={mapaDiferencasAtual}
                    metadadosTabela={metadadosTabela}
                    noAtivoId={noAtivoId ?? resultadoAtualId}
                    raiz={arvoreJson}
                    resultadoAtualId={resultadoAtualId}
                  />
                ) : submodoComparacao === "arvore" ? (
                  <VisualizadorArvore
                    aoAlternarExpansao={aoAlternarExpansao}
                    aoSelecionarNo={aoSelecionarNo}
                    aoEditarNo={aoEditarNo}
                    idsAncestres={idsAncestres}
                    idsCorrespondentes={idsCorrespondentes}
                    mapaDiferencas={mapaDiferencasAtual}
                    noAtivoId={noAtivoId ?? resultadoAtualId}
                    nosExpandidos={nosExpandidos}
                    raiz={arvoreJson}
                    resultadoAtualId={resultadoAtualId}
                    termoBusca={termoBusca}
                  />
                ) : (
                  <VisualizadorGrafo
                    aoAlternarExpansao={aoAlternarExpansao}
                    aoSelecionarNo={aoSelecionarNo}
                    aoEditarNo={aoEditarNo}
                    containerRef={graficoComparacaoAtualRef}
                    idsCorrespondentes={idsCorrespondentes}
                    mapaDiferencas={mapaDiferencasAtual}
                    miniMapaVisivel={miniMapaVisivel}
                    noAtivoId={noAtivoId ?? resultadoAtualId}
                    nosExpandidos={nosExpandidos}
                    presetLayout={presetLayoutGrafo}
                    raiz={arvoreJson}
                    resultadoAtualId={resultadoAtualId}
                  />
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </section>
  );
}
