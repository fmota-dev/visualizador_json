import {
  Background,
  Controls,
  type Edge,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import {
  memo,
  useEffect,
  useMemo,
  type CSSProperties,
  type MouseEvent as EventoMouseReact,
  type RefObject,
} from "react";
import type {
  DadosNoGrafo,
  NoJson,
  PresetLayoutGrafo,
  StatusDiferencaNo,
} from "../tipos/json";
import {
  ALTURA_CARTAO_GRAFO,
  LARGURA_CARTAO_GRAFO,
  construirElementosDoGrafo,
  obterConfiguracaoLayoutGrafo,
} from "../utilitarios/grafo";
import { encontrarNoPorId } from "../utilitarios/json";

interface PropsVisualizadorGrafo {
  raiz: NoJson | null;
  nosExpandidos: Set<string>;
  idsCorrespondentes: Set<string>;
  resultadoAtualId?: string;
  noAtivoId?: string;
  mapaDiferencas?: Map<string, StatusDiferencaNo>;
  containerRef: RefObject<HTMLDivElement | null>;
  miniMapaVisivel?: boolean;
  permitirEdicao?: boolean;
  presetLayout?: PresetLayoutGrafo;
  aoAlternarExpansao: (id: string) => void;
  aoSelecionarNo: (no: NoJson) => void;
  aoEditarNo: (no: NoJson) => void;
}

interface DadosNoGrafoInterativo extends DadosNoGrafo {
  ativo: boolean;
  statusDiferenca: StatusDiferencaNo;
  permitirEdicao: boolean;
  aoAlternarExpansao: (id: string) => void;
  aoEditar: () => void;
}

interface PropsNoMiniMapa {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style?: CSSProperties;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  className?: string;
  borderRadius?: number;
  selected?: boolean;
  onClick?: (evento: EventoMouseReact<SVGGElement>, id: string) => void;
}

const classesTipoNo: Record<DadosNoGrafo["tipo"], string> = {
  object: "bg-[color:rgba(15,118,110,0.14)] text-[color:var(--cor-acao-secundaria)]",
  array: "bg-[color:rgba(59,130,246,0.14)] text-[color:#2563eb]",
  string: "bg-[color:rgba(168,85,247,0.14)] text-[color:#7c3aed]",
  number: "bg-[color:rgba(249,115,22,0.14)] text-[color:#ea580c]",
  boolean: "bg-[color:rgba(234,179,8,0.16)] text-[color:#a16207]",
  null: "bg-[color:rgba(107,114,128,0.16)] text-[color:#4b5563]",
};

const metadadosDiferenca: Record<
  Exclude<StatusDiferencaNo, "igual">,
  { rotulo: string; classes: string; corAresta: string }
> = {
  adicionado: {
    rotulo: "Adicionado",
    classes:
      "border-[color:rgba(15,118,110,0.32)] bg-[color:rgba(15,118,110,0.18)] text-[color:var(--cor-acao-secundaria)]",
    corAresta: "rgba(15,118,110,0.72)",
  },
  removido: {
    rotulo: "Removido",
    classes:
      "border-[color:rgba(180,35,24,0.3)] bg-[color:rgba(180,35,24,0.18)] text-[color:var(--cor-perigo)]",
    corAresta: "rgba(180,35,24,0.72)",
  },
  alterado: {
    rotulo: "Alterado",
    classes:
      "border-[color:rgba(199,91,18,0.3)] bg-[color:rgba(199,91,18,0.18)] text-[color:var(--cor-destaque-forte)]",
    corAresta: "rgba(199,91,18,0.74)",
  },
};

function obterCorMiniMapa(data: DadosNoGrafoInterativo) {
  if (data.resultadoAtual) {
    return "var(--cor-destaque)";
  }

  if (data.statusDiferenca === "adicionado") {
    return "var(--cor-acao-secundaria)";
  }

  if (data.statusDiferenca === "removido") {
    return "var(--cor-perigo)";
  }

  if (data.statusDiferenca === "alterado") {
    return "var(--cor-destaque-forte)";
  }

  if (data.correspondeBusca) {
    return "var(--cor-destaque)";
  }

  return "var(--cor-texto-suave)";
}

const NoMiniMapaPersonalizado = memo(function NoMiniMapaPersonalizado({
  id,
  x,
  y,
  width,
  height,
  style,
  color = "var(--cor-texto-suave)",
  strokeColor = "var(--cor-borda-forte)",
  strokeWidth = 1.2,
  className,
  borderRadius = 8,
  selected = false,
  onClick,
}: PropsNoMiniMapa) {
  const larguraUtil = Math.max(width, 16);
  const alturaUtil = Math.max(height, 12);
  const preenchimento = Math.max(Math.min(larguraUtil * 0.06, 5), 2);
  const alturaCabecalho = Math.max(alturaUtil * 0.22, 3);
  const alturaLinha = Math.max(alturaUtil * 0.12, 2);
  const larguraTitulo = Math.max(larguraUtil * 0.5, 8);
  const larguraLinhaPrimaria = Math.max(larguraUtil * 0.74, 10);
  const larguraLinhaSecundaria = Math.max(larguraUtil * 0.48, 8);

  return (
    <g
      className={className}
      style={style}
      transform={`translate(${x}, ${y})`}
      onClick={(evento) => onClick?.(evento, id)}
    >
      <rect
        fill="var(--cor-cartao-grafo)"
        height={alturaUtil}
        rx={borderRadius}
        ry={borderRadius}
        stroke={strokeColor}
        strokeOpacity={selected ? 1 : 0.85}
        strokeWidth={selected ? strokeWidth + 0.8 : strokeWidth}
        width={larguraUtil}
      />
      <rect
        fill={color}
        height={alturaCabecalho}
        opacity={0.92}
        rx={Math.max(borderRadius / 2.2, 2)}
        ry={Math.max(borderRadius / 2.2, 2)}
        width={larguraTitulo}
        x={preenchimento}
        y={preenchimento}
      />
      <rect
        fill="var(--cor-texto-suave)"
        height={alturaLinha}
        opacity={0.34}
        rx={alturaLinha / 2}
        ry={alturaLinha / 2}
        width={larguraLinhaPrimaria}
        x={preenchimento}
        y={preenchimento + alturaCabecalho + Math.max(alturaUtil * 0.12, 2)}
      />
      <rect
        fill="var(--cor-texto-suave)"
        height={alturaLinha}
        opacity={0.22}
        rx={alturaLinha / 2}
        ry={alturaLinha / 2}
        width={larguraLinhaSecundaria}
        x={preenchimento}
        y={
          preenchimento +
          alturaCabecalho +
          Math.max(alturaUtil * 0.12, 2) +
          alturaLinha +
          Math.max(alturaUtil * 0.08, 2)
        }
      />
    </g>
  );
});

function classeCartaoNo(data: DadosNoGrafoInterativo) {
  if (data.resultadoAtual) {
    return "border-[color:var(--cor-destaque)] bg-[color:var(--cor-destaque-suave)] shadow-[0_18px_40px_rgba(199,91,18,0.16)]";
  }

  if (data.ativo) {
    return "border-[color:var(--cor-borda-forte)] bg-[color:var(--cor-cartao-grafo-elevado)] shadow-[0_18px_42px_rgba(0,0,0,0.16)]";
  }

  if (data.statusDiferenca === "adicionado") {
    return "border-[color:rgba(15,118,110,0.44)] bg-[color:rgba(15,118,110,0.14)] shadow-[0_18px_42px_rgba(15,118,110,0.12)]";
  }

  if (data.statusDiferenca === "removido") {
    return "border-[color:rgba(180,35,24,0.4)] bg-[color:rgba(180,35,24,0.12)] shadow-[0_18px_42px_rgba(180,35,24,0.12)]";
  }

  if (data.statusDiferenca === "alterado") {
    return "border-[color:rgba(199,91,18,0.44)] bg-[color:rgba(199,91,18,0.14)] shadow-[0_18px_42px_rgba(199,91,18,0.12)]";
  }

  if (data.correspondeBusca) {
    return "border-[color:var(--cor-destaque)] bg-[color:var(--cor-cartao-grafo-elevado)] shadow-[0_18px_40px_rgba(199,91,18,0.12)]";
  }

  return "border-[color:var(--cor-borda-forte)] bg-[color:var(--cor-cartao-grafo)] shadow-[0_18px_40px_rgba(0,0,0,0.12)]";
}

function obterEstiloAresta(status: StatusDiferencaNo | undefined): Edge["style"] | undefined {
  if (!status || status === "igual") {
    return undefined;
  }

  return {
    stroke: metadadosDiferenca[status].corAresta,
    strokeWidth: 2.4,
  };
}

const CartaoNoJson = memo(function CartaoNoJson({
  data,
}: NodeProps<Node<DadosNoGrafoInterativo>>) {
  return (
    <div
      className={`w-[272px] rounded-[24px] border p-4 transition ${classeCartaoNo(data)}`}
    >
      <Handle position={Position.Left} type="target" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[color:var(--cor-texto)]">
            {data.chave === "raiz" ? "raiz" : data.chave}
          </p>
          <p className="mt-1 text-xs text-[color:var(--cor-texto-suave)]">
            {data.resumoValor}
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${classesTipoNo[data.tipo]}`}
        >
          {data.tipo}
        </span>
      </div>
      {data.statusDiferenca !== "igual" ? (
        <div className="mt-3">
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
              metadadosDiferenca[data.statusDiferenca].classes
            }`}
          >
            {metadadosDiferenca[data.statusDiferenca].rotulo}
          </span>
        </div>
      ) : null}
      <div className="mt-4 flex items-center justify-between gap-2">
        {data.permitirEdicao ? (
          <button
            className="rounded-full border border-[color:var(--cor-borda)] px-3 py-1 text-xs font-semibold text-[color:var(--cor-texto)] transition hover:border-[color:var(--cor-borda-forte)] hover:bg-[color:var(--cor-destaque-suave)]"
            onClick={(evento) => {
              evento.stopPropagation();
              data.aoEditar();
            }}
            type="button"
          >
            Editar
          </button>
        ) : null}
        {data.expansivel ? (
          <button
            className="rounded-full bg-[color:var(--cor-destaque)] px-3 py-1 text-xs font-semibold text-white transition hover:opacity-90"
            onClick={(evento) => {
              evento.stopPropagation();
              data.aoAlternarExpansao(data.idNo);
            }}
            type="button"
          >
            {data.expandido ? "Recolher" : "Expandir"}
          </button>
        ) : null}
      </div>
      <Handle position={Position.Right} type="source" />
    </div>
  );
});

function ObservadorDeFoco({
  nodes,
  resultadoAtualId,
  noAtivoId,
  presetLayout = "equilibrado",
}: {
  nodes: Array<Node<DadosNoGrafoInterativo>>;
  resultadoAtualId?: string;
  noAtivoId?: string;
  presetLayout?: PresetLayoutGrafo;
}) {
  const { fitView, getNode, setCenter } =
    useReactFlow<Node<DadosNoGrafoInterativo>>();
  const idFocado = noAtivoId ?? resultadoAtualId;
  const { paddingFitView } = obterConfiguracaoLayoutGrafo(presetLayout);

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      if (idFocado) {
        const no = getNode(idFocado);
        if (no) {
          setCenter(
            no.position.x + LARGURA_CARTAO_GRAFO / 2,
            no.position.y + ALTURA_CARTAO_GRAFO / 2,
            {
            duration: 350,
            zoom: 1.02,
            },
          );
          return;
        }
      }

      void fitView({
        duration: 350,
        padding: paddingFitView,
      });
    }, 40);

    return () => {
      window.clearTimeout(temporizador);
    };
  }, [fitView, getNode, idFocado, nodes, paddingFitView, setCenter]);

  return null;
}

function GrafoInterno({
  raiz,
  nosExpandidos,
  idsCorrespondentes,
  resultadoAtualId,
  noAtivoId,
  mapaDiferencas,
  containerRef,
  miniMapaVisivel,
  permitirEdicao = true,
  presetLayout = "equilibrado",
  aoAlternarExpansao,
  aoSelecionarNo,
  aoEditarNo,
}: PropsVisualizadorGrafo) {
  const { nodes, edges } = useMemo(() => {
    if (!raiz) {
      return { nodes: [] as Array<Node<DadosNoGrafoInterativo>>, edges: [] };
    }

    const base = construirElementosDoGrafo(
      raiz,
      nosExpandidos,
      idsCorrespondentes,
      resultadoAtualId,
      presetLayout,
    );

    return {
      nodes: base.nodes.map((node) => {
        const noOriginal = encontrarNoPorId(raiz, node.id);
        return {
          ...node,
          style: {
            ...node.style,
            width: LARGURA_CARTAO_GRAFO,
            height: ALTURA_CARTAO_GRAFO,
          },
          data: {
            ...node.data,
            ativo: node.id === noAtivoId,
            statusDiferenca: mapaDiferencas?.get(node.id) ?? "igual",
            permitirEdicao,
            aoAlternarExpansao,
            aoEditar: () => {
              if (noOriginal) {
                aoEditarNo(noOriginal);
              }
            },
          },
        };
      }),
      edges: base.edges.map((edge) => ({
        ...edge,
        style: obterEstiloAresta(mapaDiferencas?.get(edge.target)),
      })),
    };
  }, [
    aoAlternarExpansao,
    aoEditarNo,
    idsCorrespondentes,
    mapaDiferencas,
    noAtivoId,
    nosExpandidos,
    permitirEdicao,
    presetLayout,
    raiz,
    resultadoAtualId,
  ]);

  const nodeTypes = useMemo<NodeTypes>(
    () => ({
      cartaoJson: CartaoNoJson,
    }),
    [],
  );

  if (!raiz) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-[26px] border border-dashed border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] p-8 text-center text-[color:var(--cor-texto-suave)]">
        Corrija o documento para liberar a visualizacao em grafo.
      </div>
    );
  }

  return (
    <div
      className="painel-visualizador-canvas linha-grade h-full min-h-[320px] w-full overflow-hidden rounded-[26px] border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)]"
      ref={containerRef}
    >
      <ReactFlow<Node<DadosNoGrafoInterativo>>
        className="bg-transparent"
        defaultViewport={{ x: 0, y: 0, zoom: 0.92 }}
        edges={edges}
        fitView
        fitViewOptions={{ padding: obterConfiguracaoLayoutGrafo(presetLayout).paddingFitView }}
        minZoom={0.2}
        nodes={nodes}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => {
          const no = encontrarNoPorId(raiz, node.id);
          if (no) {
            aoSelecionarNo(no);
          }
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--cor-borda)" gap={24} size={1} />
        {miniMapaVisivel ? (
          <MiniMap
            bgColor="var(--cor-cartao-grafo)"
            className="!rounded-[18px] !border !border-[color:var(--cor-borda-forte)] !bg-[color:var(--cor-cartao-grafo)]"
            maskColor="rgba(0, 0, 0, 0.08)"
            nodeBorderRadius={10}
            nodeColor={(node) => obterCorMiniMapa(node.data as DadosNoGrafoInterativo)}
            nodeComponent={NoMiniMapaPersonalizado}
            nodeStrokeColor="var(--cor-borda-forte)"
            nodeStrokeWidth={1.5}
            pannable
            position="bottom-right"
            zoomable
          />
        ) : null}
        <Controls position="top-right" showInteractive={false} />
        <ObservadorDeFoco
          noAtivoId={noAtivoId}
          nodes={nodes}
          presetLayout={presetLayout}
          resultadoAtualId={resultadoAtualId}
        />
      </ReactFlow>
    </div>
  );
}

export function VisualizadorGrafo(props: PropsVisualizadorGrafo) {
  return (
    <ReactFlowProvider>
      <GrafoInterno {...props} />
    </ReactFlowProvider>
  );
}
