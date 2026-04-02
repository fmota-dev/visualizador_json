import { toPng } from "html-to-image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as EventoTecladoReact,
  type CSSProperties,
} from "react";
import { EditorJson } from "./componentes/EditorJson";
import { ModalNo } from "./componentes/ModalNo";
import { VisualizadorArvore } from "./componentes/VisualizadorArvore";
import { VisualizadorGrafo } from "./componentes/VisualizadorGrafo";
import { useBuscaJson } from "./hooks/useBuscaJson";
import { useJsonParseado } from "./hooks/useJsonParseado";
import {
  carregarWorkspacePersistido,
  usePersistenciaWorkspace,
  workspacePersistidoPadrao,
} from "./hooks/usePersistenciaWorkspace";
import { useTema } from "./hooks/useTema";
import type {
  ModoVisualizacao,
  NoEditavel,
  NoJson,
  TemaAplicacao,
  ValorJson,
} from "./tipos/json";
import {
  atualizarValorPorCaminho,
  coletarIdsExpansiveis,
  serializarJson,
} from "./utilitarios/json";

const EXEMPLO_INICIAL = `{
  "produto": {
    "nome": "Visualizador de JSON",
    "versao": 1,
    "ativo": true,
    "etiquetas": ["react", "tailwind", "grafo"],
    "autor": {
      "nome": "Equipe Frontend",
      "pais": "Brasil"
    },
    "metricas": {
      "usuarios": 1280,
      "tempoMedioMinutos": 14.6,
      "publicadoEm": null
    }
  }
}`;

function criarNoEditavel(no: NoJson): NoEditavel {
  return {
    id: no.id,
    caminho: no.caminho,
    chave: no.chave,
    tipo: no.tipo,
    valor: no.valor,
  };
}

function classeBotaoCabecalho(ativo = false) {
  return [
    "inline-flex items-center justify-center rounded-full border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45",
    ativo
      ? "border-[color:var(--cor-destaque)] bg-[color:var(--cor-destaque)] text-white"
      : "border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] text-[color:var(--cor-texto)] hover:border-[color:var(--cor-borda-forte)] hover:bg-[color:var(--cor-destaque-suave)]",
  ].join(" ");
}

function IconeSol() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
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
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
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

function classeBotaoTema(ativo = false) {
  return [
    "inline-flex h-10 w-10 items-center justify-center rounded-full border transition",
    ativo
      ? "border-[color:var(--cor-destaque)] bg-[color:var(--cor-destaque)] text-white"
      : "border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-painel)] text-[color:var(--cor-texto)] hover:border-[color:var(--cor-borda-forte)] hover:bg-[color:var(--cor-destaque-suave)]",
  ].join(" ");
}

export default function App() {
  const [workspaceInicial] = useState(() => carregarWorkspacePersistido());

  const [jsonBruto, setJsonBruto] = useState(
    workspaceInicial.jsonBruto || EXEMPLO_INICIAL,
  );
  const [modoVisualizacao, setModoVisualizacao] =
    useState<ModoVisualizacao>(workspaceInicial.modoVisualizacao);
  const [temaAplicacao, setTemaAplicacao] = useState<TemaAplicacao>(
    workspaceInicial.temaAplicacao,
  );
  const [termoBusca, setTermoBusca] = useState(workspaceInicial.termoBusca);
  const [indiceResultadoAtual, setIndiceResultadoAtual] = useState(0);
  const [nosExpandidos, setNosExpandidos] = useState<Set<string>>(
    () => new Set(workspaceInicial.nosExpandidos),
  );
  const [noSelecionadoParaEdicao, setNoSelecionadoParaEdicao] =
    useState<NoEditavel | null>(null);
  const [editorRecolhido, setEditorRecolhido] = useState(
    workspaceInicial.editorRecolhido,
  );
  const [visualizadorTelaCheia, setVisualizadorTelaCheia] = useState(false);
  const [larguraPainelEditor, setLarguraPainelEditor] = useState(
    workspaceInicial.larguraPainelEditor,
  );
  const [redimensionandoEditor, setRedimensionandoEditor] = useState(false);

  const areaPrincipalRef = useRef<HTMLElement>(null);
  const graficoRef = useRef<HTMLDivElement>(null);
  const menuVisualizadorRef = useRef<HTMLDetailsElement>(null);
  const larguraPainelEditorRef = useRef(larguraPainelEditor);
  const quadroAnimacaoRedimensionamentoRef = useRef<number | null>(null);

  const { jsonParseado, arvoreJson, erroJson } = useJsonParseado(jsonBruto);
  const { resultadosBusca, idsCorrespondentes, idsAncestres } = useBuscaJson(
    arvoreJson,
    termoBusca,
  );

  useTema(temaAplicacao);

  usePersistenciaWorkspace({
    jsonBruto,
    jsonReferenciaBruto: workspacePersistidoPadrao.jsonReferenciaBruto,
    temaAplicacao,
    modoVisualizacao,
    modoPainelVisualizador: workspacePersistidoPadrao.modoPainelVisualizador,
    submodoComparacao: workspacePersistidoPadrao.submodoComparacao,
    termoBusca,
    filtroBusca: workspacePersistidoPadrao.filtroBusca,
    nosExpandidos: Array.from(nosExpandidos),
    larguraPainelEditor,
    editorRecolhido,
    presetLayoutGrafo: workspacePersistidoPadrao.presetLayoutGrafo,
    miniMapaVisivel: workspacePersistidoPadrao.miniMapaVisivel,
  });

  useEffect(() => {
    larguraPainelEditorRef.current = larguraPainelEditor;
  }, [larguraPainelEditor]);

  useEffect(() => {
    if (!visualizadorTelaCheia) {
      return;
    }

    function aoPressionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setVisualizadorTelaCheia(false);
      }
    }

    window.addEventListener("keydown", aoPressionarTecla);
    return () => {
      window.removeEventListener("keydown", aoPressionarTecla);
    };
  }, [visualizadorTelaCheia]);

  useEffect(() => {
    if (!redimensionandoEditor || editorRecolhido || visualizadorTelaCheia) {
      return;
    }

    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    function aplicarLarguraNoLayout() {
      if (!areaPrincipalRef.current) {
        return;
      }

      areaPrincipalRef.current.style.setProperty(
        "--largura-painel-editor",
        `clamp(320px, ${larguraPainelEditorRef.current}%, 680px)`,
      );
    }

    function aoMoverMouse(evento: MouseEvent) {
      if (!areaPrincipalRef.current) {
        return;
      }

      const limites = areaPrincipalRef.current.getBoundingClientRect();
      const porcentagem = ((evento.clientX - limites.left) / limites.width) * 100;
      const larguraLimitada = Math.min(46, Math.max(22, porcentagem));
      larguraPainelEditorRef.current = larguraLimitada;

      if (quadroAnimacaoRedimensionamentoRef.current !== null) {
        return;
      }

      quadroAnimacaoRedimensionamentoRef.current = window.requestAnimationFrame(() => {
        quadroAnimacaoRedimensionamentoRef.current = null;
        aplicarLarguraNoLayout();
      });
    }

    function aoSoltarMouse() {
      if (quadroAnimacaoRedimensionamentoRef.current !== null) {
        window.cancelAnimationFrame(quadroAnimacaoRedimensionamentoRef.current);
        quadroAnimacaoRedimensionamentoRef.current = null;
      }

      aplicarLarguraNoLayout();
      setLarguraPainelEditor(larguraPainelEditorRef.current);
      setRedimensionandoEditor(false);
    }

    window.addEventListener("mousemove", aoMoverMouse);
    window.addEventListener("mouseup", aoSoltarMouse);

    return () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";

      if (quadroAnimacaoRedimensionamentoRef.current !== null) {
        window.cancelAnimationFrame(quadroAnimacaoRedimensionamentoRef.current);
        quadroAnimacaoRedimensionamentoRef.current = null;
      }

      window.removeEventListener("mousemove", aoMoverMouse);
      window.removeEventListener("mouseup", aoSoltarMouse);
    };
  }, [editorRecolhido, redimensionandoEditor, visualizadorTelaCheia]);

  const indiceResultadoNormalizado =
    resultadosBusca.length === 0
      ? 0
      : Math.min(indiceResultadoAtual, resultadosBusca.length - 1);
  const resultadoAtual = resultadosBusca[indiceResultadoNormalizado];

  const nosExpandidosEfetivos = useMemo(() => {
    const proximo = new Set<string>();
    const idsPermitidos = arvoreJson
      ? new Set(coletarIdsExpansiveis(arvoreJson))
      : new Set<string>();

    nosExpandidos.forEach((id) => {
      if (id === "raiz" || idsPermitidos.has(id)) {
        proximo.add(id);
      }
    });

    idsAncestres.forEach((id) => {
      if (id === "raiz" || idsPermitidos.has(id)) {
        proximo.add(id);
      }
    });

    if (arvoreJson) {
      proximo.add("raiz");
    }

    return proximo;
  }, [arvoreJson, idsAncestres, nosExpandidos]);

  const visualizacaoDisponivel = Boolean(arvoreJson);
  const exportacaoDisponivel = modoVisualizacao === "grafo" && visualizacaoDisponivel;
  const buscaAtiva = termoBusca.trim().length > 0;

  const aoAlternarExpansao = (id: string) => {
    setNosExpandidos((anterior) => {
      const proximo = new Set(anterior);
      if (proximo.has(id)) {
        proximo.delete(id);
      } else {
        proximo.add(id);
      }
      return proximo;
    });
  };

  const aoExpandirTudo = () => {
    if (!arvoreJson) {
      return;
    }

    setNosExpandidos(new Set(coletarIdsExpansiveis(arvoreJson)));
  };

  const aoRecolherTudo = () => {
    setNosExpandidos(new Set(["raiz"]));
  };

  const aoConfirmarEdicao = (novoValor: ValorJson) => {
    if (!jsonParseado || !noSelecionadoParaEdicao) {
      return;
    }

    const proximoJson = atualizarValorPorCaminho(
      jsonParseado,
      noSelecionadoParaEdicao.caminho,
      novoValor,
    );

    setJsonBruto(serializarJson(proximoJson));
    setNoSelecionadoParaEdicao(null);
  };

  const aoCarregarArquivo = (arquivo: File) => {
    const leitor = new FileReader();
    leitor.onload = () => {
      setJsonBruto(String(leitor.result ?? ""));
    };
    leitor.readAsText(arquivo, "utf-8");
  };

  const aoExportarPng = async () => {
    if (!graficoRef.current) {
      return;
    }

    const estilos = getComputedStyle(document.documentElement);
    const dataUrl = await toPng(graficoRef.current, {
      backgroundColor: estilos.getPropertyValue("--cor-fundo").trim(),
      cacheBust: true,
      pixelRatio: 2,
    });

    const link = document.createElement("a");
    link.download = "visualizador-json-grafo.png";
    link.href = dataUrl;
    link.click();
  };

  const aoAbrirEdicaoNo = (no: NoJson) => {
    setNoSelecionadoParaEdicao(criarNoEditavel(no));
  };

  const aoIrParaProximoResultado = () => {
    if (resultadosBusca.length === 0) {
      return;
    }

    setIndiceResultadoAtual(
      (indiceAnterior) => (indiceAnterior + 1) % resultadosBusca.length,
    );
  };

  const aoIrParaResultadoAnterior = () => {
    if (resultadosBusca.length === 0) {
      return;
    }

    setIndiceResultadoAtual(
      (indiceAnterior) =>
        (indiceAnterior - 1 + resultadosBusca.length) % resultadosBusca.length,
    );
  };

  const painelVisualizador = (
    <section
      className={`painel-vidro painel-visualizador flex min-h-0 flex-col overflow-hidden rounded-[32px] border border-[color:var(--cor-borda)] ${
        visualizadorTelaCheia
          ? "h-full"
          : "h-[calc(100dvh-1.5rem)] min-h-[520px] sm:h-[calc(100dvh-2rem)]"
      }`}
      onKeyDown={(evento: EventoTecladoReact<HTMLElement>) => {
        if (evento.key === "Escape" && visualizadorTelaCheia) {
          setVisualizadorTelaCheia(false);
        }
      }}
      tabIndex={-1}
    >
      <div className="flex flex-col gap-3 border-b border-[color:var(--cor-borda)] px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--cor-texto-suave)]">
              Visualizador
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[color:var(--cor-texto)]">
              {modoVisualizacao === "arvore" ? "Modo Arvore" : "Modo Grafo"}
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
                  onClick={() => {
                    if (temaAplicacao !== "claro") {
                      setTemaAplicacao("claro");
                    }
                  }}
                  title="Tema claro"
                  type="button"
                >
                  <IconeSol />
                </button>
                <button
                  aria-label="Ativar tema escuro"
                  className={classeBotaoTema(temaAplicacao === "escuro")}
                  onClick={() => {
                    if (temaAplicacao !== "escuro") {
                      setTemaAplicacao("escuro");
                    }
                  }}
                  title="Tema escuro"
                  type="button"
                >
                  <IconeLua />
                </button>
              </div>
            </div>

            <div className="flex rounded-full border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] p-1">
              <button
                className={classeBotaoCabecalho(modoVisualizacao === "arvore")}
                onClick={() => setModoVisualizacao("arvore")}
                type="button"
              >
                Arvore
              </button>
              <button
                className={classeBotaoCabecalho(modoVisualizacao === "grafo")}
                onClick={() => setModoVisualizacao("grafo")}
                type="button"
              >
                Grafo
              </button>
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
                {modoVisualizacao === "grafo" ? (
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
                    setVisualizadorTelaCheia((valorAtual) => !valorAtual);
                    menuVisualizadorRef.current?.removeAttribute("open");
                  }}
                  type="button"
                >
                  {visualizadorTelaCheia ? "Sair da tela cheia" : "Tela cheia"}
                </button>
                <button
                  className="rounded-2xl px-4 py-3 text-left text-sm text-[color:var(--cor-texto)] transition hover:bg-[color:var(--cor-destaque-suave)]"
                  onClick={() => {
                    setEditorRecolhido((valorAtual) => !valorAtual);
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

        <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
          <input
            className="h-11 flex-1 rounded-2xl border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] px-4 text-[color:var(--cor-texto)] outline-none transition placeholder:text-[color:var(--cor-texto-suave)] focus:border-[color:var(--cor-destaque)]"
            onChange={(evento) => setTermoBusca(evento.target.value)}
            placeholder="Buscar por chave, valor ou tipo..."
            type="search"
            value={termoBusca}
          />

          {buscaAtiva ? (
            <div className="flex gap-2">
              <button
                className={classeBotaoCabecalho()}
                disabled={resultadosBusca.length === 0}
                onClick={aoIrParaResultadoAnterior}
                type="button"
              >
                Anterior
              </button>
              <button
                className={classeBotaoCabecalho()}
                disabled={resultadosBusca.length === 0}
                onClick={aoIrParaProximoResultado}
                type="button"
              >
                Proximo
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 p-3 sm:p-4">
        {modoVisualizacao === "arvore" ? (
          <VisualizadorArvore
            aoAlternarExpansao={aoAlternarExpansao}
            aoEditarNo={aoAbrirEdicaoNo}
            idsAncestres={idsAncestres}
            idsCorrespondentes={idsCorrespondentes}
            nosExpandidos={nosExpandidosEfetivos}
            raiz={arvoreJson}
            resultadoAtualId={resultadoAtual?.id}
            termoBusca={termoBusca}
          />
        ) : (
          <VisualizadorGrafo
            aoAlternarExpansao={aoAlternarExpansao}
            aoEditarNo={aoAbrirEdicaoNo}
            containerRef={graficoRef}
            idsCorrespondentes={idsCorrespondentes}
            nosExpandidos={nosExpandidosEfetivos}
            raiz={arvoreJson}
            resultadoAtualId={resultadoAtual?.id}
          />
        )}
      </div>
    </section>
  );

  const estiloPainelEditor = {
    "--largura-painel-editor": `clamp(320px, ${larguraPainelEditor}%, 680px)`,
  } as CSSProperties;

  return (
    <main className="min-h-screen px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
      <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-3">
        {!visualizadorTelaCheia ? (
          <section
            className="flex min-h-0 flex-col gap-3 xl:flex-row"
            ref={areaPrincipalRef}
            style={estiloPainelEditor}
          >
            <div
              className={`shrink-0 transition-all duration-300 xl:w-[var(--largura-painel-editor)] ${
                editorRecolhido ? "hidden" : "block"
              }`}
            >
              <EditorJson
                aoAlterarJsonBruto={setJsonBruto}
                aoAlternarEditor={() => setEditorRecolhido((valorAtual) => !valorAtual)}
                aoCarregarArquivo={aoCarregarArquivo}
                erroJson={erroJson}
                jsonBruto={jsonBruto}
                recolhido={editorRecolhido}
                temaAplicacao={temaAplicacao}
              />
            </div>

            {!editorRecolhido ? (
              <div
                className="hidden w-3 shrink-0 cursor-col-resize items-center justify-center xl:flex"
                onMouseDown={() => setRedimensionandoEditor(true)}
                role="separator"
              >
                <div className="h-28 w-1 rounded-full bg-[color:var(--cor-borda-forte)]" />
              </div>
            ) : null}

            {editorRecolhido ? (
              <button
                className="painel-vidro hidden h-[calc(100dvh-1.5rem)] min-h-[520px] w-16 shrink-0 rounded-[28px] border border-[color:var(--cor-borda)] px-2 py-4 text-center text-sm font-semibold text-[color:var(--cor-texto)] transition hover:border-[color:var(--cor-borda-forte)] hover:bg-[color:var(--cor-destaque-suave)] sm:h-[calc(100dvh-2rem)] xl:flex xl:flex-col xl:items-center xl:justify-between"
                onClick={() => setEditorRecolhido(false)}
                type="button"
              >
                <span className="[writing-mode:vertical-rl]">Abrir editor</span>
                <span className="rounded-full border border-[color:var(--cor-borda)] px-2 py-1 text-xs">
                  {"</>"}
                </span>
              </button>
            ) : null}

            <div className="min-h-0 min-w-0 flex-1">{painelVisualizador}</div>
          </section>
        ) : null}
      </div>

      {visualizadorTelaCheia ? (
        <div className="fixed inset-0 z-40 bg-[color:rgba(12,18,24,0.28)] p-2 backdrop-blur-sm sm:p-4">
          {painelVisualizador}
        </div>
      ) : null}

      <ModalNo
        aberto={Boolean(noSelecionadoParaEdicao)}
        aoConfirmar={aoConfirmarEdicao}
        aoFechar={() => setNoSelecionadoParaEdicao(null)}
        key={noSelecionadoParaEdicao?.id ?? "modal-fechado"}
        noEditavel={noSelecionadoParaEdicao}
      />
    </main>
  );
}
