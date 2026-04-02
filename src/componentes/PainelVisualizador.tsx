import { DiffEditor } from "@monaco-editor/react";
import type { RefObject } from "react";
import type {
  FiltroBusca,
  ModoPainelVisualizador,
  ModoVisualizacao,
  NoJson,
  StatusDiferencaNo,
  SubmodoComparacao,
  TemaAplicacao,
} from "../tipos/json";
import { formatarCaminho, serializarJson } from "../utilitarios/json";
import { VisualizadorArvore } from "./VisualizadorArvore";
import { VisualizadorGrafo } from "./VisualizadorGrafo";

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
  termoBusca: string;
  filtroBusca: FiltroBusca;
  buscaAtiva: boolean;
  buscaDisponivel: boolean;
  visualizacaoDisponivel: boolean;
  visualizacaoReferenciaDisponivel: boolean;
  exportacaoDisponivel: boolean;
  editorRecolhido: boolean;
  miniMapaVisivel: boolean;
  resultadosBuscaQuantidade: number;
  jsonBruto: string;
  jsonReferenciaBruto: string;
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
  aoAlternarTelaCheia: () => void;
  aoAlternarEditor: () => void;
  aoAlterarTermoBusca: (termo: string) => void;
  aoAlterarFiltroBusca: (filtro: FiltroBusca) => void;
  aoAlternarMiniMapa: () => void;
  aoIrParaResultadoAnterior: () => void;
  aoIrParaProximoResultado: () => void;
  aoSelecionarCaminhoBreadcrumb: (caminho: Array<string | number>) => void;
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

function classeBotaoCabecalho(ativo = false) {
  return [
    "inline-flex items-center justify-center rounded-full border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45",
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

export function PainelVisualizador({
  visualizadorTelaCheia,
  temaAplicacao,
  modoPainelVisualizador,
  submodoComparacao,
  modoVisualizacao,
  termoBusca,
  filtroBusca,
  buscaAtiva,
  buscaDisponivel,
  visualizacaoDisponivel,
  visualizacaoReferenciaDisponivel,
  exportacaoDisponivel,
  editorRecolhido,
  miniMapaVisivel,
  resultadosBuscaQuantidade,
  jsonBruto,
  jsonReferenciaBruto,
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
  aoAlternarTelaCheia,
  aoAlternarEditor,
  aoAlterarTermoBusca,
  aoAlterarFiltroBusca,
  aoAlternarMiniMapa,
  aoIrParaResultadoAnterior,
  aoIrParaProximoResultado,
  aoSelecionarCaminhoBreadcrumb,
  aoCopiarTexto,
  aoAlternarExpansao,
  aoSelecionarNo,
  aoEditarNo,
}: PropsPainelVisualizador) {
  const modoComparacaoAtivo = modoPainelVisualizador === "comparar";
  const tituloVisualizador = modoComparacaoAtivo
    ? submodoComparacao === "texto"
      ? "Comparacao em Texto"
      : submodoComparacao === "arvore"
        ? "Comparacao em Arvore"
        : "Comparacao em Grafo"
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
                Explorar
              </button>
              <button
                className={classeBotaoCabecalho(modoComparacaoAtivo)}
                onClick={() => aoAlterarModoPainelVisualizador("comparar")}
                type="button"
              >
                Comparar
              </button>
            </div>

            <div className="flex rounded-full border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] p-1">
              {!modoComparacaoAtivo ? (
                <>
                  <button
                    className={classeBotaoCabecalho(modoVisualizacao === "arvore")}
                    onClick={() => aoAlterarModoVisualizacao("arvore")}
                    type="button"
                  >
                    Arvore
                  </button>
                  <button
                    className={classeBotaoCabecalho(modoVisualizacao === "grafo")}
                    onClick={() => aoAlterarModoVisualizacao("grafo")}
                    type="button"
                  >
                    Grafo
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={classeBotaoCabecalho(submodoComparacao === "texto")}
                    onClick={() => aoAlterarSubmodoComparacao("texto")}
                    type="button"
                  >
                    Texto
                  </button>
                  <button
                    className={classeBotaoCabecalho(submodoComparacao === "arvore")}
                    onClick={() => aoAlterarSubmodoComparacao("arvore")}
                    type="button"
                  >
                    Arvore
                  </button>
                  <button
                    className={classeBotaoCabecalho(submodoComparacao === "grafo")}
                    onClick={() => aoAlterarSubmodoComparacao("grafo")}
                    type="button"
                  >
                    Grafo
                  </button>
                </>
              )}
            </div>

            <details className="menu-detalhes relative" ref={menuVisualizadorRef}>
              <summary className={classeBotaoCabecalho()}>
                Mais
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
                {(!modoComparacaoAtivo && modoVisualizacao === "grafo") ||
                (modoComparacaoAtivo && submodoComparacao === "grafo") ? (
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
                ) : null}
                {!modoComparacaoAtivo && modoVisualizacao === "grafo" ? (
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
            O modo texto usa o diff do editor. A busca continua disponivel nos modos arvore e grafo.
          </div>
        )}

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
                      "JSON copiado.",
                    )
                  }
                  type="button"
                >
                  Copiar JSON
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
          modoVisualizacao === "arvore" ? (
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
              raiz={arvoreJson}
              resultadoAtualId={resultadoAtualId}
            />
          )
        ) : submodoComparacao === "texto" ? (
          <div className="h-full overflow-hidden rounded-[26px] border border-[color:var(--cor-borda)]">
            <DiffEditor
              height="100%"
              language="json"
              modified={jsonBruto}
              options={{
                automaticLayout: true,
                fontSize: 14,
                minimap: { enabled: false },
                renderSideBySide: true,
                scrollBeyondLastLine: false,
                wordWrap: "on",
              }}
              original={jsonReferenciaBruto}
              theme={temaAplicacao === "escuro" ? "vs-dark" : "light"}
            />
          </div>
        ) : (
          <div className="grid h-full min-h-0 gap-3 xl:grid-cols-2">
            <section className="flex min-h-0 flex-col rounded-[26px] border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--cor-texto-suave)]">
                    Referencia
                  </p>
                  <h3 className="text-lg font-semibold text-[color:var(--cor-texto)]">
                    JSON base
                  </h3>
                </div>
                {!visualizacaoReferenciaDisponivel ? (
                  <span className="text-xs text-[color:var(--cor-perigo)]">JSON invalido</span>
                ) : null}
              </div>
              <div className="min-h-0 flex-1">
                {submodoComparacao === "arvore" ? (
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
                    raiz={arvoreReferenciaJson}
                  />
                )}
              </div>
            </section>

            <section className="flex min-h-0 flex-col rounded-[26px] border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--cor-texto-suave)]">
                    Atual
                  </p>
                  <h3 className="text-lg font-semibold text-[color:var(--cor-texto)]">
                    JSON em edicao
                  </h3>
                </div>
                {!visualizacaoDisponivel ? (
                  <span className="text-xs text-[color:var(--cor-perigo)]">JSON invalido</span>
                ) : null}
              </div>
              <div className="min-h-0 flex-1">
                {submodoComparacao === "arvore" ? (
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
