import { toPng } from "html-to-image";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { BarraDeBusca } from "./componentes/BarraDeBusca";
import { BarraFerramentas } from "./componentes/BarraFerramentas";
import { EditorJson } from "./componentes/EditorJson";
import { ModalNo } from "./componentes/ModalNo";
import { VisualizadorArvore } from "./componentes/VisualizadorArvore";
import { VisualizadorGrafo } from "./componentes/VisualizadorGrafo";
import { useBuscaJson } from "./hooks/useBuscaJson";
import { useJsonParseado } from "./hooks/useJsonParseado";
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

export default function App() {
  const [jsonBruto, setJsonBruto] = useState(EXEMPLO_INICIAL);
  const [modoVisualizacao, setModoVisualizacao] =
    useState<ModoVisualizacao>("arvore");
  const [temaAplicacao, setTemaAplicacao] = useState<TemaAplicacao>("claro");
  const [termoBusca, setTermoBusca] = useState("");
  const [indiceResultadoAtual, setIndiceResultadoAtual] = useState(0);
  const [nosExpandidos, setNosExpandidos] = useState<Set<string>>(
    () => new Set(["raiz"]),
  );
  const [noSelecionadoParaEdicao, setNoSelecionadoParaEdicao] =
    useState<NoEditavel | null>(null);
  const [larguraPainelEsquerdo, setLarguraPainelEsquerdo] = useState(44);
  const [redimensionando, setRedimensionando] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const graficoRef = useRef<HTMLDivElement>(null);

  const { jsonParseado, arvoreJson, erroJson } = useJsonParseado(jsonBruto);
  const { resultadosBusca, idsCorrespondentes, idsAncestres } = useBuscaJson(
    arvoreJson,
    termoBusca,
  );

  useTema(temaAplicacao);

  const indiceResultadoNormalizado =
    resultadosBusca.length === 0
      ? 0
      : Math.min(indiceResultadoAtual, resultadosBusca.length - 1);
  const resultadoAtual = resultadosBusca[indiceResultadoNormalizado];

  const nosExpandidosEfetivos = useMemo(() => {
    const proximo = new Set<string>();
    const idsPermitidos = arvoreJson ? new Set(coletarIdsExpansiveis(arvoreJson)) : new Set<string>();

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

  useEffect(() => {
    if (!redimensionando) {
      return;
    }

    function aoMoverMouse(evento: MouseEvent) {
      if (!containerRef.current) {
        return;
      }

      const limites = containerRef.current.getBoundingClientRect();
      const porcentagem =
        ((evento.clientX - limites.left) / limites.width) * 100;
      const valorLimitado = Math.min(68, Math.max(32, porcentagem));
      setLarguraPainelEsquerdo(valorLimitado);
    }

    function aoSoltarMouse() {
      setRedimensionando(false);
    }

    window.addEventListener("mousemove", aoMoverMouse);
    window.addEventListener("mouseup", aoSoltarMouse);

    return () => {
      window.removeEventListener("mousemove", aoMoverMouse);
      window.removeEventListener("mouseup", aoSoltarMouse);
    };
  }, [redimensionando]);

  const exportacaoDisponivel = modoVisualizacao === "grafo" && Boolean(arvoreJson);

  const cartoesContexto = useMemo(
    () => [
      {
        rotulo: "Modo atual",
        valor: modoVisualizacao === "arvore" ? "Arvore" : "Grafo",
      },
      {
        rotulo: "Resultados",
        valor: String(resultadosBusca.length),
      },
      {
        rotulo: "Tema",
        valor: temaAplicacao === "claro" ? "Claro" : "Escuro",
      },
    ],
    [modoVisualizacao, resultadosBusca.length, temaAplicacao],
  );

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

  const painelEsquerdoStyle = {
    "--largura-painel-esquerdo": `clamp(320px, ${larguraPainelEsquerdo}%, 780px)`,
  } as CSSProperties;

  const aoAbrirEdicaoNo = (no: NoJson) => {
    setNoSelecionadoParaEdicao(criarNoEditavel(no));
  };

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-4">
        <section className="painel-vidro overflow-hidden rounded-[36px] border border-[color:var(--cor-borda)] p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--cor-texto-suave)]">
                React + TypeScript + Tailwind + React Flow
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[color:var(--cor-texto)] sm:text-5xl">
                Visualizador de JSON com editor, arvore e grafo no mesmo fluxo
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--cor-texto-suave)]">
                Cole um JSON, procure trechos relevantes, edite qualquer no inline e exporte
                o grafo como imagem sem perder o estado da sua sessao.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {cartoesContexto.map((item) => (
                <div
                  className="rounded-[24px] border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] px-4 py-3"
                  key={item.rotulo}
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--cor-texto-suave)]">
                    {item.rotulo}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[color:var(--cor-texto)]">
                    {item.valor}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <BarraFerramentas
          aoAlterarModoVisualizacao={setModoVisualizacao}
          aoAlternarTema={() =>
            setTemaAplicacao((temaAtual) =>
              temaAtual === "claro" ? "escuro" : "claro",
            )
          }
          aoExpandirTudo={aoExpandirTudo}
          aoExportarPng={() => {
            void aoExportarPng();
          }}
          aoRecolherTudo={aoRecolherTudo}
          exportacaoDisponivel={exportacaoDisponivel}
          modoVisualizacao={modoVisualizacao}
          temaAplicacao={temaAplicacao}
          visualizacaoDisponivel={Boolean(arvoreJson)}
        />

        <BarraDeBusca
          aoAlterarTermoBusca={setTermoBusca}
          aoIrParaProximoResultado={() => {
            if (resultadosBusca.length === 0) {
              return;
            }
            setIndiceResultadoAtual(
              (indiceAnterior) => (indiceAnterior + 1) % resultadosBusca.length,
            );
          }}
          aoIrParaResultadoAnterior={() => {
            if (resultadosBusca.length === 0) {
              return;
            }
            setIndiceResultadoAtual(
              (indiceAnterior) =>
                (indiceAnterior - 1 + resultadosBusca.length) % resultadosBusca.length,
            );
          }}
          indiceResultadoAtual={indiceResultadoNormalizado}
          termoBusca={termoBusca}
          totalResultados={resultadosBusca.length}
        />

        <section className="flex flex-col gap-4 xl:flex-row" ref={containerRef}>
          <div
            className="w-full shrink-0 xl:max-w-none xl:w-[var(--largura-painel-esquerdo)]"
            style={painelEsquerdoStyle}
          >
            <EditorJson
              aoAlterarJsonBruto={setJsonBruto}
              aoCarregarArquivo={aoCarregarArquivo}
              erroJson={erroJson}
              jsonBruto={jsonBruto}
              temaAplicacao={temaAplicacao}
            />
          </div>

          <div
            className="hidden w-3 shrink-0 cursor-col-resize items-center justify-center xl:flex"
            onMouseDown={() => setRedimensionando(true)}
            role="separator"
          >
            <div className="h-32 w-1 rounded-full bg-[color:var(--cor-borda-forte)]" />
          </div>

          <div className="min-w-0 flex-1">
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
      </div>

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
