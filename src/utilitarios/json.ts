import type {
  ErroJson,
  NoJson,
  SegmentoCaminho,
  TipoNo,
  ValorJson,
} from "../tipos/json";

export function determinarTipoNo(valor: ValorJson): TipoNo {
  if (valor === null) {
    return "null";
  }

  if (Array.isArray(valor)) {
    return "array";
  }

  return typeof valor as Exclude<TipoNo, "array" | "null">;
}

export function criarIdNo(caminho: SegmentoCaminho[]): string {
  if (caminho.length === 0) {
    return "raiz";
  }

  return `raiz/${caminho
    .map((segmento) =>
      typeof segmento === "number"
        ? `[${segmento}]`
        : segmento.replaceAll("/", "~"),
    )
    .join("/")}`;
}

export function formatarCaminho(caminho: SegmentoCaminho[]): string {
  if (caminho.length === 0) {
    return "raiz";
  }

  return caminho
    .map((segmento, indice) =>
      typeof segmento === "number"
        ? `[${segmento}]`
        : indice === 0
          ? segmento
          : `.${segmento}`,
    )
    .join("");
}

export function resumirValor(valor: ValorJson): string {
  const tipo = determinarTipoNo(valor);

  if (tipo === "object") {
    const total = Object.keys(valor as Record<string, ValorJson>).length;
    return `objeto com ${total} ${total === 1 ? "chave" : "chaves"}`;
  }

  if (tipo === "array") {
    const total = (valor as ValorJson[]).length;
    return `array com ${total} ${total === 1 ? "item" : "itens"}`;
  }

  if (tipo === "string") {
    return `"${String(valor)}"`;
  }

  return String(valor);
}

function criarRotuloItemArray(chavePai: string, indice: number) {
  return `${chavePai}[${indice}]`;
}

export function construirArvoreJson(
  valor: ValorJson,
  chave = "raiz",
  caminho: SegmentoCaminho[] = [],
  profundidade = 0,
): NoJson {
  const tipo = determinarTipoNo(valor);

  const filhos =
    tipo === "object"
      ? Object.entries(valor as Record<string, ValorJson>).map(([proximaChave, proximoValor]) =>
          construirArvoreJson(
            proximoValor,
            proximaChave,
            [...caminho, proximaChave],
            profundidade + 1,
          ),
        )
      : tipo === "array"
        ? (valor as ValorJson[]).map((proximoValor, indice) =>
            construirArvoreJson(
              proximoValor,
              criarRotuloItemArray(chave, indice),
              [...caminho, indice],
              profundidade + 1,
            ),
          )
        : [];

  return {
    id: criarIdNo(caminho),
    caminho,
    chave,
    valor,
    tipo,
    profundidade,
    filhos,
    resumoValor: resumirValor(valor),
  };
}

export function coletarIdsExpansiveis(no: NoJson): string[] {
  const ids: string[] = [];

  if (no.filhos.length > 0) {
    ids.push(no.id);
  }

  no.filhos.forEach((filho) => {
    ids.push(...coletarIdsExpansiveis(filho));
  });

  return ids;
}

export function encontrarNoPorId(raiz: NoJson, id: string): NoJson | null {
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

export function obterValorPorCaminho(
  valor: ValorJson,
  caminho: SegmentoCaminho[],
): ValorJson {
  return caminho.reduce<ValorJson>((atual, segmento) => {
    if (Array.isArray(atual)) {
      return atual[segmento as number] as ValorJson;
    }

    return (atual as Record<string, ValorJson>)[segmento as string] as ValorJson;
  }, valor);
}

export function atualizarValorPorCaminho(
  valor: ValorJson,
  caminho: SegmentoCaminho[],
  novoValor: ValorJson,
): ValorJson {
  if (caminho.length === 0) {
    return novoValor;
  }

  const [primeiro, ...restante] = caminho;

  if (Array.isArray(valor)) {
    return valor.map((item, indice) =>
      indice === primeiro
        ? atualizarValorPorCaminho(item, restante, novoValor)
        : item,
    );
  }

  return Object.fromEntries(
    Object.entries(valor as Record<string, ValorJson>).map(([chave, item]) => [
      chave,
      chave === primeiro
        ? atualizarValorPorCaminho(item, restante, novoValor)
        : item,
    ]),
  );
}

export function adicionarPropriedadeEmObjeto(
  valor: ValorJson,
  caminhoPai: SegmentoCaminho[],
  chaveNova: string,
  novoValor: ValorJson,
): ValorJson {
  const alvo = obterValorPorCaminho(valor, caminhoPai);

  if (Array.isArray(alvo) || determinarTipoNo(alvo) !== "object") {
    throw new Error("O no selecionado nao aceita novas chaves.");
  }

  return atualizarValorPorCaminho(valor, caminhoPai, {
    ...(alvo as Record<string, ValorJson>),
    [chaveNova]: novoValor,
  });
}

export function adicionarItemEmArray(
  valor: ValorJson,
  caminhoPai: SegmentoCaminho[],
  novoValor: ValorJson,
): ValorJson {
  const alvo = obterValorPorCaminho(valor, caminhoPai);

  if (!Array.isArray(alvo)) {
    throw new Error("O no selecionado nao aceita novos itens.");
  }

  return atualizarValorPorCaminho(valor, caminhoPai, [...alvo, novoValor]);
}

export function removerValorPorCaminho(
  valor: ValorJson,
  caminho: SegmentoCaminho[],
): ValorJson {
  if (caminho.length === 0) {
    return valor;
  }

  const caminhoPai = caminho.slice(0, -1);
  const segmentoFinal = caminho[caminho.length - 1];
  const alvoPai = obterValorPorCaminho(valor, caminhoPai);

  if (Array.isArray(alvoPai) && typeof segmentoFinal === "number") {
    return atualizarValorPorCaminho(
      valor,
      caminhoPai,
      alvoPai.filter((_, indice) => indice !== segmentoFinal),
    );
  }

  if (!Array.isArray(alvoPai) && typeof segmentoFinal === "string") {
    return atualizarValorPorCaminho(
      valor,
      caminhoPai,
      Object.fromEntries(
        Object.entries(alvoPai as Record<string, ValorJson>).filter(
          ([chave]) => chave !== segmentoFinal,
        ),
      ),
    );
  }

  throw new Error("Nao foi possivel remover o no selecionado.");
}

export function renomearChavePorCaminho(
  valor: ValorJson,
  caminho: SegmentoCaminho[],
  novaChave: string,
): ValorJson {
  if (caminho.length === 0) {
    throw new Error("A raiz nao pode ser renomeada.");
  }

  const caminhoPai = caminho.slice(0, -1);
  const segmentoFinal = caminho[caminho.length - 1];
  const alvoPai = obterValorPorCaminho(valor, caminhoPai);

  if (Array.isArray(alvoPai) || typeof segmentoFinal !== "string") {
    throw new Error("Somente propriedades de objetos podem ser renomeadas.");
  }

  return atualizarValorPorCaminho(
    valor,
    caminhoPai,
    Object.fromEntries(
      Object.entries(alvoPai as Record<string, ValorJson>).map(([chave, item]) => [
        chave === segmentoFinal ? novaChave : chave,
        item,
      ]),
    ),
  );
}

export function duplicarItemPorCaminho(
  valor: ValorJson,
  caminho: SegmentoCaminho[],
): ValorJson {
  if (caminho.length === 0) {
    throw new Error("A raiz nao pode ser duplicada.");
  }

  const caminhoPai = caminho.slice(0, -1);
  const segmentoFinal = caminho[caminho.length - 1];
  const alvoPai = obterValorPorCaminho(valor, caminhoPai);

  if (!Array.isArray(alvoPai) || typeof segmentoFinal !== "number") {
    throw new Error("Somente itens de arrays podem ser duplicados.");
  }

  const item = alvoPai[segmentoFinal];
  const clone = JSON.parse(JSON.stringify(item)) as ValorJson;
  const proximoArray = [...alvoPai];
  proximoArray.splice(segmentoFinal + 1, 0, clone);

  return atualizarValorPorCaminho(valor, caminhoPai, proximoArray);
}

function calcularLinhaColunaPorPosicao(jsonBruto: string, posicao: number) {
  const antes = jsonBruto.slice(0, posicao);
  const linhas = antes.split("\n");

  return {
    linha: linhas.length,
    coluna: linhas[linhas.length - 1].length + 1,
  };
}

export function analisarErroJson(jsonBruto: string, erro: unknown): ErroJson {
  const mensagemOriginal =
    erro instanceof Error ? erro.message : "Nao foi possivel interpretar o JSON.";

  const posicaoPorOffset = mensagemOriginal.match(/position\s+(\d+)/i);
  if (posicaoPorOffset) {
    const posicao = Number(posicaoPorOffset[1]);
    const { linha, coluna } = calcularLinhaColunaPorPosicao(jsonBruto, posicao);

    return {
      mensagem: mensagemOriginal,
      linha,
      coluna,
    };
  }

  const linhaColunaDiretas = mensagemOriginal.match(/line\s+(\d+)\s+column\s+(\d+)/i);
  if (linhaColunaDiretas) {
    return {
      mensagem: mensagemOriginal,
      linha: Number(linhaColunaDiretas[1]),
      coluna: Number(linhaColunaDiretas[2]),
    };
  }

  return {
    mensagem: mensagemOriginal,
    linha: 1,
    coluna: 1,
  };
}

export function serializarJson(valor: ValorJson): string {
  return JSON.stringify(valor, null, 2);
}
