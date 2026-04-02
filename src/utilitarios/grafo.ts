import type { Edge, Node } from "@xyflow/react";
import type { DadosNoGrafo, NoJson, PresetLayoutGrafo } from "../tipos/json";

interface ResultadoLayout {
  nodes: Array<Node<DadosNoGrafo>>;
  edges: Edge[];
}

interface PosicaoInterna {
  x: number;
  y: number;
}

export const LARGURA_CARTAO_GRAFO = 272;
export const ALTURA_CARTAO_GRAFO = 144;

const configuracoesLayout: Record<
  PresetLayoutGrafo,
  { espacamentoHorizontal: number; espacamentoVertical: number; paddingFitView: number }
> = {
  compacto: {
    espacamentoHorizontal: 332,
    espacamentoVertical: 142,
    paddingFitView: 0.18,
  },
  equilibrado: {
    espacamentoHorizontal: 392,
    espacamentoVertical: 168,
    paddingFitView: 0.24,
  },
  amplo: {
    espacamentoHorizontal: 452,
    espacamentoVertical: 198,
    paddingFitView: 0.3,
  },
};

export function obterConfiguracaoLayoutGrafo(preset: PresetLayoutGrafo) {
  return configuracoesLayout[preset];
}

export function construirElementosDoGrafo(
  raiz: NoJson,
  nosExpandidos: Set<string>,
  idsCorrespondentes: Set<string>,
  resultadoAtualId?: string,
  presetLayout: PresetLayoutGrafo = "equilibrado",
): ResultadoLayout {
  const { espacamentoHorizontal, espacamentoVertical } =
    obterConfiguracaoLayoutGrafo(presetLayout);
  const posicoes = new Map<string, PosicaoInterna>();
  let cursorY = 0;

  function posicionarNo(no: NoJson): number {
    const filhosVisiveis =
      no.filhos.length > 0 && nosExpandidos.has(no.id) ? no.filhos : [];

    if (filhosVisiveis.length === 0) {
      const y = cursorY * espacamentoVertical;
      cursorY += 1;
      posicoes.set(no.id, { x: no.profundidade * espacamentoHorizontal, y });
      return y;
    }

    const posicoesFilhos = filhosVisiveis.map((filho) => posicionarNo(filho));
    const y =
      (posicoesFilhos[0] + posicoesFilhos[posicoesFilhos.length - 1]) / 2;
    posicoes.set(no.id, { x: no.profundidade * espacamentoHorizontal, y });
    return y;
  }

  posicionarNo(raiz);

  const nodes: Array<Node<DadosNoGrafo>> = [];
  const edges: Edge[] = [];

  function percorrer(no: NoJson) {
    const posicao = posicoes.get(no.id) ?? { x: 0, y: 0 };
    const expansivel = no.filhos.length > 0;
    const expandido = expansivel && nosExpandidos.has(no.id);

    nodes.push({
      id: no.id,
      type: "cartaoJson",
      position: posicao,
      width: LARGURA_CARTAO_GRAFO,
      height: ALTURA_CARTAO_GRAFO,
      data: {
        idNo: no.id,
        chave: no.chave,
        resumoValor: no.resumoValor,
        tipo: no.tipo,
        expansivel,
        expandido,
        correspondeBusca: idsCorrespondentes.has(no.id),
        resultadoAtual: resultadoAtualId === no.id,
      },
      draggable: false,
      selectable: false,
    });

    if (expandido) {
      no.filhos.forEach((filho) => {
        edges.push({
          id: `${no.id}-${filho.id}`,
          source: no.id,
          target: filho.id,
          type: "smoothstep",
          animated: resultadoAtualId === filho.id,
          style: {
            stroke: idsCorrespondentes.has(filho.id)
              ? "var(--cor-destaque)"
              : "var(--cor-borda-forte)",
            strokeWidth: idsCorrespondentes.has(filho.id) ? 2.4 : 1.4,
          },
        });
        percorrer(filho);
      });
    }
  }

  percorrer(raiz);

  return { nodes, edges };
}
