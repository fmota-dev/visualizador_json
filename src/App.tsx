import { toPng, toSvg } from "html-to-image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { EditorJson } from "./componentes/EditorJson";
import { ModalNo } from "./componentes/ModalNo";
import { PainelVisualizador } from "./componentes/PainelVisualizador";
import { useBuscaJson } from "./hooks/useBuscaJson";
import { useJsonParseado } from "./hooks/useJsonParseado";
import {
  carregarWorkspacePersistido,
  usePersistenciaWorkspace,
} from "./hooks/usePersistenciaWorkspace";
import { useTema } from "./hooks/useTema";
import type {
  FiltroBusca,
  ModoPainelVisualizador,
  ModoVisualizacao,
  NoEditavel,
  NoJson,
  SubmodoComparacao,
  TemaAplicacao,
  ValorJson,
} from "./tipos/json";
import { compararJsonEstruturalmente } from "./utilitarios/comparacao";
import {
  adicionarItemEmArray,
  adicionarPropriedadeEmObjeto,
  atualizarValorPorCaminho,
  coletarIdsExpansiveis,
  criarIdNo,
  determinarTipoNo,
  duplicarItemPorCaminho,
  encontrarNoPorId,
  obterValorPorCaminho,
  removerValorPorCaminho,
  renomearChavePorCaminho,
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

function criarNoEditavel(no: NoJson, jsonParseado: ValorJson | null): NoEditavel {
  const caminhoPai = no.caminho.slice(0, -1);
  const tipoPai =
    jsonParseado && no.caminho.length > 0
      ? determinarTipoNo(obterValorPorCaminho(jsonParseado, caminhoPai))
      : null;
  const chavesDoPai =
    jsonParseado && tipoPai === "object"
      ? Object.keys(
          obterValorPorCaminho(jsonParseado, caminhoPai) as Record<string, ValorJson>,
        )
      : [];

  return {
    id: no.id,
    caminho: no.caminho,
    chave: no.chave,
    tipo: no.tipo,
    tipoPai,
    chavesDoPai,
    valor: no.valor,
  };
}

function prepararSvgDoVisualizadorParaExportacao(container: HTMLElement) {
  const seletores = [
    ".react-flow__edge-path",
    ".react-flow__edge-interaction",
    ".react-flow__connection-path",
    ".react-flow__background-pattern line",
    ".react-flow__background-pattern path",
  ].join(", ");
  const atributos = [
    ["stroke", "stroke"],
    ["stroke-width", "strokeWidth"],
    ["stroke-opacity", "strokeOpacity"],
    ["stroke-linecap", "strokeLinecap"],
    ["stroke-linejoin", "strokeLinejoin"],
    ["stroke-dasharray", "strokeDasharray"],
    ["fill", "fill"],
    ["fill-opacity", "fillOpacity"],
    ["opacity", "opacity"],
  ] as const;

  const restauracoes: Array<() => void> = [];

  container.querySelectorAll<SVGElement>(seletores).forEach((elemento) => {
    const estiloCalculado = window.getComputedStyle(elemento);
    const anteriores = atributos.map(([atributo]) => [
      atributo,
      elemento.getAttribute(atributo),
    ] as const);

    atributos.forEach(([atributo, propriedade]) => {
      const valor = estiloCalculado[propriedade];
      if (!valor) {
        return;
      }

      elemento.setAttribute(atributo, valor);
    });

    restauracoes.push(() => {
      anteriores.forEach(([atributo, valorAnterior]) => {
        if (valorAnterior === null) {
          elemento.removeAttribute(atributo);
          return;
        }

        elemento.setAttribute(atributo, valorAnterior);
      });
    });
  });

  return () => {
    restauracoes.reverse().forEach((restaurar) => restaurar());
  };
}

export default function App() {
  const [workspaceInicial] = useState(() => carregarWorkspacePersistido());

  const [jsonBruto, setJsonBruto] = useState(
    workspaceInicial.jsonBruto || EXEMPLO_INICIAL,
  );
  const [jsonReferenciaBruto, setJsonReferenciaBruto] = useState(
    workspaceInicial.jsonReferenciaBruto || EXEMPLO_INICIAL,
  );
  const [modoVisualizacao, setModoVisualizacao] =
    useState<ModoVisualizacao>(workspaceInicial.modoVisualizacao);
  const [modoPainelVisualizador, setModoPainelVisualizador] =
    useState<ModoPainelVisualizador>(workspaceInicial.modoPainelVisualizador);
  const [submodoComparacao, setSubmodoComparacao] =
    useState<SubmodoComparacao>(workspaceInicial.submodoComparacao);
  const [temaAplicacao, setTemaAplicacao] = useState<TemaAplicacao>(
    workspaceInicial.temaAplicacao,
  );
  const [termoBusca, setTermoBusca] = useState(workspaceInicial.termoBusca);
  const [filtroBusca, setFiltroBusca] = useState<FiltroBusca>(
    workspaceInicial.filtroBusca,
  );
  const [indiceResultadoAtual, setIndiceResultadoAtual] = useState(0);
  const [nosExpandidos, setNosExpandidos] = useState<Set<string>>(
    () => new Set(workspaceInicial.nosExpandidos),
  );
  const [noAtivoId, setNoAtivoId] = useState<string | null>(null);
  const [noSelecionadoParaEdicao, setNoSelecionadoParaEdicao] =
    useState<NoEditavel | null>(null);
  const [editorRecolhido, setEditorRecolhido] = useState(
    workspaceInicial.editorRecolhido,
  );
  const [visualizadorTelaCheia, setVisualizadorTelaCheia] = useState(false);
  const [larguraPainelEditor, setLarguraPainelEditor] = useState(
    workspaceInicial.larguraPainelEditor,
  );
  const [alturaPainelReferencia, setAlturaPainelReferencia] = useState(42);
  const [redimensionandoEditor, setRedimensionandoEditor] = useState(false);
  const [redimensionandoReferencia, setRedimensionandoReferencia] = useState(false);
  const [feedbackCopia, setFeedbackCopia] = useState("");
  const [editorReferenciaRecolhido, setEditorReferenciaRecolhido] = useState(false);
  const [miniMapaVisivel, setMiniMapaVisivel] = useState(
    workspaceInicial.miniMapaVisivel,
  );
  const [presetLayoutGrafo, setPresetLayoutGrafo] = useState(
    workspaceInicial.presetLayoutGrafo,
  );
  const [painelComparacaoAtivo, setPainelComparacaoAtivo] = useState<"referencia" | "atual">(
    "atual",
  );
  const [abaEditorComparacao, setAbaEditorComparacao] = useState<"atual" | "referencia">(
    "atual",
  );

  const areaPrincipalRef = useRef<HTMLElement>(null);
  const painelEditoresComparacaoRef = useRef<HTMLDivElement>(null);
  const graficoRef = useRef<HTMLDivElement>(null);
  const graficoComparacaoAtualRef = useRef<HTMLDivElement>(null);
  const graficoComparacaoReferenciaRef = useRef<HTMLDivElement>(null);
  const menuVisualizadorRef = useRef<HTMLDetailsElement>(null);
  const larguraPainelEditorRef = useRef(larguraPainelEditor);
  const alturaPainelReferenciaRef = useRef(alturaPainelReferencia);
  const quadroAnimacaoRedimensionamentoRef = useRef<number | null>(null);
  const quadroAnimacaoReferenciaRef = useRef<number | null>(null);

  const { jsonParseado, arvoreJson, erroJson } = useJsonParseado(jsonBruto);
  const {
    jsonParseado: jsonReferenciaParseado,
    arvoreJson: arvoreReferenciaJson,
    erroJson: erroJsonReferencia,
  } = useJsonParseado(jsonReferenciaBruto);
  const { resultadosBusca, idsCorrespondentes, idsAncestres } = useBuscaJson(
    arvoreJson,
    termoBusca,
    filtroBusca,
  );
  const { mapaAtual: mapaDiferencasAtual, mapaReferencia: mapaDiferencasReferencia } =
    useMemo(
      () => compararJsonEstruturalmente(jsonParseado, jsonReferenciaParseado),
      [jsonParseado, jsonReferenciaParseado],
    );

  useTema(temaAplicacao);

  usePersistenciaWorkspace({
    jsonBruto,
    jsonReferenciaBruto,
    temaAplicacao,
    modoVisualizacao,
    modoPainelVisualizador,
    submodoComparacao,
    termoBusca,
    filtroBusca,
    nosExpandidos: Array.from(nosExpandidos),
    larguraPainelEditor,
    editorRecolhido,
    presetLayoutGrafo,
    miniMapaVisivel,
  });

  useEffect(() => {
    larguraPainelEditorRef.current = larguraPainelEditor;
  }, [larguraPainelEditor]);

  useEffect(() => {
    alturaPainelReferenciaRef.current = alturaPainelReferencia;
  }, [alturaPainelReferencia]);

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

  useEffect(() => {
    if (
      !redimensionandoReferencia ||
      editorRecolhido ||
      visualizadorTelaCheia ||
      modoPainelVisualizador !== "comparar" ||
      editorReferenciaRecolhido
    ) {
      return;
    }

    document.body.style.userSelect = "none";
    document.body.style.cursor = "row-resize";

    function aplicarAlturaNoLayout() {
      if (!painelEditoresComparacaoRef.current) {
        return;
      }

      painelEditoresComparacaoRef.current.style.setProperty(
        "--altura-editor-referencia",
        `${alturaPainelReferenciaRef.current}%`,
      );
    }

    function aoMoverMouse(evento: MouseEvent) {
      if (!painelEditoresComparacaoRef.current) {
        return;
      }

      const limites = painelEditoresComparacaoRef.current.getBoundingClientRect();
      const porcentagem = ((limites.bottom - evento.clientY) / limites.height) * 100;
      alturaPainelReferenciaRef.current = Math.min(68, Math.max(24, porcentagem));

      if (quadroAnimacaoReferenciaRef.current !== null) {
        return;
      }

      quadroAnimacaoReferenciaRef.current = window.requestAnimationFrame(() => {
        quadroAnimacaoReferenciaRef.current = null;
        aplicarAlturaNoLayout();
      });
    }

    function aoSoltarMouse() {
      if (quadroAnimacaoReferenciaRef.current !== null) {
        window.cancelAnimationFrame(quadroAnimacaoReferenciaRef.current);
        quadroAnimacaoReferenciaRef.current = null;
      }

      aplicarAlturaNoLayout();
      setAlturaPainelReferencia(alturaPainelReferenciaRef.current);
      setRedimensionandoReferencia(false);
    }

    window.addEventListener("mousemove", aoMoverMouse);
    window.addEventListener("mouseup", aoSoltarMouse);

    return () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";

      if (quadroAnimacaoReferenciaRef.current !== null) {
        window.cancelAnimationFrame(quadroAnimacaoReferenciaRef.current);
        quadroAnimacaoReferenciaRef.current = null;
      }

      window.removeEventListener("mousemove", aoMoverMouse);
      window.removeEventListener("mouseup", aoSoltarMouse);
    };
  }, [
    editorRecolhido,
    editorReferenciaRecolhido,
    modoPainelVisualizador,
    redimensionandoReferencia,
    visualizadorTelaCheia,
  ]);

  const indiceResultadoNormalizado =
    resultadosBusca.length === 0
      ? 0
      : Math.min(indiceResultadoAtual, resultadosBusca.length - 1);
  const resultadoAtual = resultadosBusca[indiceResultadoNormalizado];
  const noAtivo = useMemo(
    () =>
      arvoreJson && noAtivoId ? encontrarNoPorId(arvoreJson, noAtivoId) : null,
    [arvoreJson, noAtivoId],
  );
  const noEmFoco =
    noAtivo ??
    (arvoreJson && resultadoAtual ? encontrarNoPorId(arvoreJson, resultadoAtual.id) : null);
  const itensBreadcrumb = useMemo(() => {
    if (!noEmFoco) {
      return [];
    }

    return [
      {
        id: "raiz",
        rotulo: "raiz",
        caminho: [] as Array<string | number>,
      },
      ...noEmFoco.caminho.map((segmento, indice) => {
        const caminho = noEmFoco.caminho.slice(0, indice + 1);
        return {
          id: criarIdNo(caminho),
          rotulo: typeof segmento === "number" ? `[${segmento}]` : segmento,
          caminho,
        };
      }),
    ];
  }, [noEmFoco]);

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
  const visualizacaoReferenciaDisponivel = Boolean(arvoreReferenciaJson);
  const buscaAtiva = termoBusca.trim().length > 0;
  const modoComparacaoAtivo = modoPainelVisualizador === "comparar";
  const buscaDisponivel =
    !modoComparacaoAtivo || submodoComparacao === "arvore" || submodoComparacao === "grafo";
  const exportacaoDisponivel = !modoComparacaoAtivo
    ? modoVisualizacao === "grafo" && visualizacaoDisponivel
    : submodoComparacao === "grafo" &&
      (painelComparacaoAtivo === "atual"
        ? visualizacaoDisponivel
        : visualizacaoReferenciaDisponivel);

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

  const aoAdicionarFilho = (chaveNova: string, novoValor: ValorJson) => {
    if (!jsonParseado || !noSelecionadoParaEdicao) {
      return;
    }

    const caminhoPai = noSelecionadoParaEdicao.caminho;
    const proximoJson =
      noSelecionadoParaEdicao.tipo === "object"
        ? adicionarPropriedadeEmObjeto(jsonParseado, caminhoPai, chaveNova, novoValor)
        : adicionarItemEmArray(jsonParseado, caminhoPai, novoValor);
    const proximoCaminho =
      noSelecionadoParaEdicao.tipo === "object"
        ? [...caminhoPai, chaveNova]
        : [...caminhoPai, (noSelecionadoParaEdicao.valor as ValorJson[]).length];

    setJsonBruto(serializarJson(proximoJson));
    setNoAtivoId(criarIdNo(proximoCaminho));
    setNoSelecionadoParaEdicao(null);
  };

  const aoRenomearChave = (novaChave: string) => {
    if (!jsonParseado || !noSelecionadoParaEdicao) {
      return;
    }

    const proximoJson = renomearChavePorCaminho(
      jsonParseado,
      noSelecionadoParaEdicao.caminho,
      novaChave,
    );
    const proximoCaminho = [
      ...noSelecionadoParaEdicao.caminho.slice(0, -1),
      novaChave,
    ];

    setJsonBruto(serializarJson(proximoJson));
    setNoAtivoId(criarIdNo(proximoCaminho));
    setNoSelecionadoParaEdicao(null);
  };

  const aoRemoverNo = () => {
    if (!jsonParseado || !noSelecionadoParaEdicao) {
      return;
    }

    const caminhoPai = noSelecionadoParaEdicao.caminho.slice(0, -1);
    const proximoJson = removerValorPorCaminho(jsonParseado, noSelecionadoParaEdicao.caminho);

    setJsonBruto(serializarJson(proximoJson));
    setNoAtivoId(criarIdNo(caminhoPai));
    setNoSelecionadoParaEdicao(null);
  };

  const aoDuplicarNo = () => {
    if (!jsonParseado || !noSelecionadoParaEdicao) {
      return;
    }

    const proximoJson = duplicarItemPorCaminho(jsonParseado, noSelecionadoParaEdicao.caminho);
    const ultimoSegmento = noSelecionadoParaEdicao.caminho[
      noSelecionadoParaEdicao.caminho.length - 1
    ];
    const proximoCaminho = [
      ...noSelecionadoParaEdicao.caminho.slice(0, -1),
      typeof ultimoSegmento === "number" ? ultimoSegmento + 1 : ultimoSegmento,
    ];

    setJsonBruto(serializarJson(proximoJson));
    setNoAtivoId(criarIdNo(proximoCaminho));
    setNoSelecionadoParaEdicao(null);
  };

  const aoCarregarArquivo = (arquivo: File) => {
    const leitor = new FileReader();
    leitor.onload = () => {
      setJsonBruto(String(leitor.result ?? ""));
    };
    leitor.readAsText(arquivo, "utf-8");
  };

  const aoCarregarArquivoReferencia = (arquivo: File) => {
    const leitor = new FileReader();
    leitor.onload = () => {
      setJsonReferenciaBruto(String(leitor.result ?? ""));
    };
    leitor.readAsText(arquivo, "utf-8");
  };

  const aoExportarVisualizador = async (formato: "png" | "svg") => {
    const refAtiva = !modoComparacaoAtivo
      ? graficoRef
      : painelComparacaoAtivo === "atual"
        ? graficoComparacaoAtualRef
        : graficoComparacaoReferenciaRef;

    if (!refAtiva.current) {
      return;
    }

    const estilos = getComputedStyle(document.documentElement);
    const opcoesExportacao = {
      backgroundColor: estilos.getPropertyValue("--cor-fundo").trim(),
      cacheBust: true,
      pixelRatio: 2,
    };
    const restaurarSvg =
      formato === "svg"
        ? prepararSvgDoVisualizadorParaExportacao(refAtiva.current)
        : null;

    try {
      const dataUrl =
        formato === "png"
          ? await toPng(refAtiva.current, opcoesExportacao)
          : await toSvg(refAtiva.current, opcoesExportacao);

      const link = document.createElement("a");
      link.download = `visualizador-json-grafo.${formato}`;
      link.href = dataUrl;
      link.click();
    } finally {
      restaurarSvg?.();
    }
  };
  const aoExportarPng = () => aoExportarVisualizador("png");
  const aoExportarSvg = () => aoExportarVisualizador("svg");

  const aoAbrirEdicaoNo = (no: NoJson) => {
    setNoAtivoId(no.id);
    setNoSelecionadoParaEdicao(criarNoEditavel(no, jsonParseado));
  };

  const aoSelecionarNo = (no: NoJson) => {
    setNoAtivoId(no.id);
  };

  const aoIrParaProximoResultado = () => {
    if (resultadosBusca.length === 0) {
      return;
    }

    const proximoIndice = (indiceResultadoNormalizado + 1) % resultadosBusca.length;
    setIndiceResultadoAtual(proximoIndice);
    setNoAtivoId(resultadosBusca[proximoIndice]?.id ?? null);
  };

  const aoIrParaResultadoAnterior = () => {
    if (resultadosBusca.length === 0) {
      return;
    }

    const proximoIndice =
      (indiceResultadoNormalizado - 1 + resultadosBusca.length) % resultadosBusca.length;
    setIndiceResultadoAtual(proximoIndice);
    setNoAtivoId(resultadosBusca[proximoIndice]?.id ?? null);
  };

  const aoSelecionarCaminhoBreadcrumb = (caminho: Array<string | number>) => {
    setNoAtivoId(criarIdNo(caminho));
    setNosExpandidos((anterior) => {
      const proximo = new Set(anterior);
      proximo.add("raiz");
      caminho.forEach((_, indice) => {
        proximo.add(criarIdNo(caminho.slice(0, indice + 1)));
      });
      return proximo;
    });
  };

  const aoCopiarTexto = async (texto: string, mensagem: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setFeedbackCopia(mensagem);
      window.setTimeout(() => {
        setFeedbackCopia("");
      }, 1600);
    } catch {
      setFeedbackCopia("Nao foi possivel copiar.");
      window.setTimeout(() => {
        setFeedbackCopia("");
      }, 1600);
    }
  };

  const painelVisualizador = (
    <PainelVisualizador
      aoAlterarFiltroBusca={(filtro) => {
        setFiltroBusca(filtro);
        setIndiceResultadoAtual(0);
        setNoAtivoId(null);
      }}
      aoAlterarModoPainelVisualizador={setModoPainelVisualizador}
      aoAlterarModoVisualizacao={setModoVisualizacao}
      aoAlterarSubmodoComparacao={setSubmodoComparacao}
      aoAlterarTema={setTemaAplicacao}
      aoAlterarTermoBusca={(termo) => {
        setTermoBusca(termo);
        setIndiceResultadoAtual(0);
        setNoAtivoId(null);
      }}
      aoAlternarEditor={() => setEditorRecolhido((valorAtual) => !valorAtual)}
      aoAlternarExpansao={aoAlternarExpansao}
      aoAlternarTelaCheia={() => setVisualizadorTelaCheia((valorAtual) => !valorAtual)}
      aoCopiarTexto={aoCopiarTexto}
      aoEditarNo={aoAbrirEdicaoNo}
      aoExpandirTudo={aoExpandirTudo}
      aoExportarPng={aoExportarPng}
      aoExportarSvg={aoExportarSvg}
      aoIrParaProximoResultado={aoIrParaProximoResultado}
      aoIrParaResultadoAnterior={aoIrParaResultadoAnterior}
      aoRecolherTudo={aoRecolherTudo}
      aoSelecionarCaminhoBreadcrumb={aoSelecionarCaminhoBreadcrumb}
      aoSelecionarNo={aoSelecionarNo}
      aoSelecionarPainelComparacao={setPainelComparacaoAtivo}
      arvoreJson={arvoreJson}
      arvoreReferenciaJson={arvoreReferenciaJson}
      buscaAtiva={buscaAtiva}
      buscaDisponivel={buscaDisponivel}
      editorRecolhido={editorRecolhido}
      exportacaoDisponivel={exportacaoDisponivel}
      feedbackCopia={feedbackCopia}
      filtroBusca={filtroBusca}
      graficoComparacaoAtualRef={graficoComparacaoAtualRef}
      graficoComparacaoReferenciaRef={graficoComparacaoReferenciaRef}
      graficoRef={graficoRef}
      idsAncestres={idsAncestres}
      idsCorrespondentes={idsCorrespondentes}
      itensBreadcrumb={itensBreadcrumb}
      jsonBruto={jsonBruto}
      jsonReferenciaBruto={jsonReferenciaBruto}
      mapaDiferencasAtual={mapaDiferencasAtual}
      mapaDiferencasReferencia={mapaDiferencasReferencia}
      menuVisualizadorRef={menuVisualizadorRef}
      miniMapaVisivel={miniMapaVisivel}
      modoPainelVisualizador={modoPainelVisualizador}
      modoVisualizacao={modoVisualizacao}
      noAtivoId={noAtivoId}
      noEmFoco={noEmFoco}
      nosExpandidos={nosExpandidosEfetivos}
      painelComparacaoAtivo={painelComparacaoAtivo}
      presetLayoutGrafo={presetLayoutGrafo}
      resultadoAtualId={resultadoAtual?.id}
      resultadosBuscaQuantidade={resultadosBusca.length}
      submodoComparacao={submodoComparacao}
      temaAplicacao={temaAplicacao}
      termoBusca={termoBusca}
      aoAlternarMiniMapa={() => setMiniMapaVisivel((valorAtual) => !valorAtual)}
      aoAlterarPresetLayoutGrafo={setPresetLayoutGrafo}
      visualizacaoDisponivel={visualizacaoDisponivel}
      visualizacaoReferenciaDisponivel={visualizacaoReferenciaDisponivel}
      visualizadorTelaCheia={visualizadorTelaCheia}
    />
  );

  const estiloPainelEditor = {
    "--largura-painel-editor": `clamp(320px, ${larguraPainelEditor}%, 680px)`,
  } as CSSProperties;
  const estiloPainelEditoresComparacao = {
    "--altura-editor-referencia": `${alturaPainelReferencia}%`,
  } as CSSProperties;

  return (
    <main className="min-h-screen px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
      <div className="mx-auto flex w-full max-w-430 flex-col gap-3">
        {!visualizadorTelaCheia ? (
          <section
            className="flex min-h-0 flex-col gap-3 xl:flex-row"
            ref={areaPrincipalRef}
            style={estiloPainelEditor}
          >
            <div
              className={`shrink-0 transition-all duration-300 xl:w-(--largura-painel-editor) ${
                editorRecolhido ? "hidden" : "block"
              }`}
            >
              {modoPainelVisualizador !== "comparar" ? (
                <EditorJson
                  aoAlterarJsonBruto={setJsonBruto}
                  aoAlternarEditor={() => setEditorRecolhido((valorAtual) => !valorAtual)}
                  aoCarregarArquivo={aoCarregarArquivo}
                  erroJson={erroJson}
                  jsonBruto={jsonBruto}
                  recolhido={editorRecolhido}
                  temaAplicacao={temaAplicacao}
                />
              ) : (
                <>
                  <div className="flex gap-2 xl:hidden">
                    <button
                      className={`flex-1 ${abaEditorComparacao === "atual" ? "bg-(--cor-destaque) text-white" : "bg-(--cor-fundo-elevado) text-(--cor-texto)"} rounded-full border border-(--cor-borda) px-4 py-2 text-sm font-medium transition`}
                      onClick={() => setAbaEditorComparacao("atual")}
                      type="button"
                    >
                      Atual
                    </button>
                    <button
                      className={`flex-1 ${abaEditorComparacao === "referencia" ? "bg-(--cor-destaque) text-white" : "bg-(--cor-fundo-elevado) text-(--cor-texto)"} rounded-full border border-(--cor-borda) px-4 py-2 text-sm font-medium transition`}
                      onClick={() => setAbaEditorComparacao("referencia")}
                      type="button"
                    >
                      Referencia
                    </button>
                  </div>

                  <div
                    className="hidden h-[calc(100dvh-1.5rem)] min-h-130 flex-col gap-3 sm:h-[calc(100dvh-2rem)] xl:flex"
                    ref={painelEditoresComparacaoRef}
                    style={estiloPainelEditoresComparacao}
                  >
                    <div
                      className={`min-h-0 ${editorReferenciaRecolhido ? "flex-1" : "h-[calc(100%-var(--altura-editor-referencia)-0.75rem)]"}`}
                    >
                      <EditorJson
                        aoAlterarJsonBruto={setJsonBruto}
                        aoAlternarEditor={() => setEditorRecolhido((valorAtual) => !valorAtual)}
                        aoCarregarArquivo={aoCarregarArquivo}
                        classeContainer="h-full"
                        erroJson={erroJson}
                        jsonBruto={jsonBruto}
                        legenda="Atual"
                        recolhido={false}
                        temaAplicacao={temaAplicacao}
                        titulo="JSON em edicao"
                        usarAlturaCompleta={false}
                      />
                    </div>

                    {!editorReferenciaRecolhido ? (
                      <div
                        className="flex h-3 shrink-0 cursor-row-resize items-center justify-center"
                        onMouseDown={() => setRedimensionandoReferencia(true)}
                        role="separator"
                      >
                        <div className="h-1 w-28 rounded-full bg-(--cor-borda-forte)" />
                      </div>
                    ) : null}

                    {editorReferenciaRecolhido ? (
                      <button
                        className="rounded-3xl border border-(--cor-borda) bg-(--cor-fundo-elevado) px-4 py-3 text-sm font-semibold text-(--cor-texto) transition hover:border-(--cor-borda-forte) hover:bg-(--cor-destaque-suave)"
                        onClick={() => setEditorReferenciaRecolhido(false)}
                        type="button"
                      >
                        Mostrar referencia
                      </button>
                    ) : (
                      <div className="h-(--altura-editor-referencia) min-h-0">
                        <EditorJson
                          aoAlterarJsonBruto={setJsonReferenciaBruto}
                          aoAlternarEditor={() => setEditorReferenciaRecolhido(true)}
                          aoCarregarArquivo={aoCarregarArquivoReferencia}
                          classeContainer="h-full"
                          erroJson={erroJsonReferencia}
                          jsonBruto={jsonReferenciaBruto}
                          legenda="Referencia"
                          recolhido={false}
                          rotuloRecolher="Ocultar referencia"
                          temaAplicacao={temaAplicacao}
                          titulo="JSON base"
                          usarAlturaCompleta={false}
                        />
                      </div>
                    )}
                  </div>

                  <div className="xl:hidden">
                    {abaEditorComparacao === "atual" ? (
                      <EditorJson
                        aoAlterarJsonBruto={setJsonBruto}
                        aoAlternarEditor={() => setEditorRecolhido((valorAtual) => !valorAtual)}
                        aoCarregarArquivo={aoCarregarArquivo}
                        erroJson={erroJson}
                        jsonBruto={jsonBruto}
                        legenda="Atual"
                        recolhido={false}
                        temaAplicacao={temaAplicacao}
                        titulo="JSON em edicao"
                      />
                    ) : (
                      <EditorJson
                        aoAlterarJsonBruto={setJsonReferenciaBruto}
                        aoAlternarEditor={() => setAbaEditorComparacao("atual")}
                        aoCarregarArquivo={aoCarregarArquivoReferencia}
                        erroJson={erroJsonReferencia}
                        jsonBruto={jsonReferenciaBruto}
                        legenda="Referencia"
                        recolhido={false}
                        rotuloRecolher="Voltar"
                        temaAplicacao={temaAplicacao}
                        titulo="JSON base"
                      />
                    )}
                  </div>
                </>
              )}
            </div>

            {!editorRecolhido ? (
              <div
                className="hidden w-3 shrink-0 cursor-col-resize items-center justify-center xl:flex"
                onMouseDown={() => setRedimensionandoEditor(true)}
                role="separator"
              >
                <div className="h-28 w-1 rounded-full bg-(--cor-borda-forte)" />
              </div>
            ) : null}

            {editorRecolhido ? (
              <button
                className="painel-vidro hidden h-[calc(100dvh-1.5rem)] min-h-130 w-16 shrink-0 rounded-[28px] border border-(--cor-borda) px-2 py-4 text-center text-sm font-semibold text-(--cor-texto) transition hover:border-(--cor-borda-forte) hover:bg-(--cor-destaque-suave) sm:h-[calc(100dvh-2rem)] xl:flex xl:flex-col xl:items-center xl:justify-between"
                onClick={() => setEditorRecolhido(false)}
                type="button"
              >
                <span className="[writing-mode:vertical-rl]">Abrir editor</span>
                <span className="rounded-full border border-(--cor-borda) px-2 py-1 text-xs">
                  {"</>"}
                </span>
              </button>
            ) : null}

            <div className="min-h-0 min-w-0 flex-1">{painelVisualizador}</div>
          </section>
        ) : null}
      </div>

      {visualizadorTelaCheia ? (
        <div className="fixed inset-0 z-40 bg-[rgba(12,18,24,0.28)] p-2 backdrop-blur-sm sm:p-4">
          {painelVisualizador}
        </div>
      ) : null}

      <ModalNo
        aberto={Boolean(noSelecionadoParaEdicao)}
        aoAdicionarFilho={aoAdicionarFilho}
        aoConfirmar={aoConfirmarEdicao}
        aoDuplicarNo={aoDuplicarNo}
        aoFechar={() => setNoSelecionadoParaEdicao(null)}
        aoRemoverNo={aoRemoverNo}
        aoRenomearChave={aoRenomearChave}
        key={noSelecionadoParaEdicao?.id ?? "modal-fechado"}
        noEditavel={noSelecionadoParaEdicao}
      />
    </main>
  );
}
