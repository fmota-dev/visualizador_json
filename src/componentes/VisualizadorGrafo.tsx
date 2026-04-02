import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import { memo, useEffect, useMemo, type RefObject } from "react";
import type { DadosNoGrafo, NoJson } from "../tipos/json";
import { construirElementosDoGrafo } from "../utilitarios/grafo";

interface PropsVisualizadorGrafo {
  raiz: NoJson | null;
  nosExpandidos: Set<string>;
  idsCorrespondentes: Set<string>;
  resultadoAtualId?: string;
  containerRef: RefObject<HTMLDivElement | null>;
  aoAlternarExpansao: (id: string) => void;
  aoEditarNo: (no: NoJson) => void;
}

interface DadosNoGrafoInterativo extends DadosNoGrafo {
  aoAlternarExpansao: (id: string) => void;
  aoEditar: () => void;
}

const classesTipoNo: Record<DadosNoGrafo["tipo"], string> = {
  object: "bg-[color:rgba(15,118,110,0.14)] text-[color:var(--cor-acao-secundaria)]",
  array: "bg-[color:rgba(59,130,246,0.14)] text-[color:#2563eb]",
  string: "bg-[color:rgba(168,85,247,0.14)] text-[color:#7c3aed]",
  number: "bg-[color:rgba(249,115,22,0.14)] text-[color:#ea580c]",
  boolean: "bg-[color:rgba(234,179,8,0.16)] text-[color:#a16207]",
  null: "bg-[color:rgba(107,114,128,0.16)] text-[color:#4b5563]",
};

const CartaoNoJson = memo(function CartaoNoJson({
  data,
}: NodeProps<Node<DadosNoGrafoInterativo>>) {
  return (
    <div
      className={`w-[240px] rounded-[24px] border p-4 shadow-xl transition ${
        data.resultadoAtual
          ? "border-[color:var(--cor-destaque)] bg-[color:var(--cor-destaque-suave)]"
          : data.correspondeBusca
            ? "border-[color:var(--cor-destaque)] bg-[color:var(--cor-fundo-elevado)]"
            : "border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-painel)]"
      }`}
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
      <div className="mt-4 flex items-center justify-between gap-2">
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

function encontrarNoPorId(raiz: NoJson, id: string): NoJson | null {
  if (raiz.id === id) {
    return raiz;
  }

  for (const filho of raiz.filhos) {
    const encontrado = encontrarNoPorId(filho, id);
    if (encontrado) {
      return encontrado;
    }
  }

  return null;
}

function ObservadorDeFoco({
  nodes,
  resultadoAtualId,
}: {
  nodes: Array<Node<DadosNoGrafoInterativo>>;
  resultadoAtualId?: string;
}) {
  const { fitView, getNode, setCenter } =
    useReactFlow<Node<DadosNoGrafoInterativo>>();

  useEffect(() => {
    if (resultadoAtualId) {
      const no = getNode(resultadoAtualId);
      if (no) {
        setCenter(no.position.x + 120, no.position.y + 60, {
          duration: 350,
          zoom: 1.02,
        });
        return;
      }
    }

    void fitView({
      duration: 350,
      padding: 0.2,
    });
  }, [fitView, getNode, nodes, resultadoAtualId, setCenter]);

  return null;
}

function GrafoInterno({
  raiz,
  nosExpandidos,
  idsCorrespondentes,
  resultadoAtualId,
  containerRef,
  aoAlternarExpansao,
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
    );

    return {
      nodes: base.nodes.map((node) => {
        const noOriginal = encontrarNoPorId(raiz, node.id);
        return {
          ...node,
          data: {
            ...node.data,
            aoAlternarExpansao,
            aoEditar: () => {
              if (noOriginal) {
                aoEditarNo(noOriginal);
              }
            },
          },
        };
      }),
      edges: base.edges,
    };
  }, [
    aoAlternarExpansao,
    aoEditarNo,
    idsCorrespondentes,
    nosExpandidos,
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
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-[30px] border border-dashed border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] p-8 text-center text-[color:var(--cor-texto-suave)]">
        Corrija o JSON para liberar a visualizacao em grafo.
      </div>
    );
  }

  return (
    <div
      className="linha-grade h-full min-h-[420px] overflow-hidden rounded-[30px] border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)]"
      ref={containerRef}
    >
      <ReactFlow<Node<DadosNoGrafoInterativo>>
        edges={edges}
        fitView
        nodes={nodes}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => {
          const no = encontrarNoPorId(raiz, node.id);
          if (no) {
            aoEditarNo(no);
          }
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--cor-borda)" gap={24} size={1} />
        <Controls />
        <ObservadorDeFoco nodes={nodes} resultadoAtualId={resultadoAtualId} />
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
