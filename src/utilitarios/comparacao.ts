import type { SegmentoCaminho, StatusDiferencaNo, ValorJson } from "../tipos/json";
import { criarIdNo, determinarTipoNo } from "./json";

interface MapasDeDiferenca {
  mapaAtual: Map<string, StatusDiferencaNo>;
  mapaReferencia: Map<string, StatusDiferencaNo>;
}

function marcarSubarvore(
  valor: ValorJson,
  caminho: SegmentoCaminho[],
  status: StatusDiferencaNo,
  mapa: Map<string, StatusDiferencaNo>,
) {
  mapa.set(criarIdNo(caminho), status);

  if (valor === null) {
    return;
  }

  if (Array.isArray(valor)) {
    valor.forEach((item, indice) => {
      marcarSubarvore(item, [...caminho, indice], status, mapa);
    });
    return;
  }

  if (typeof valor === "object") {
    Object.entries(valor).forEach(([chave, item]) => {
      marcarSubarvore(item, [...caminho, chave], status, mapa);
    });
  }
}

function compararValores(
  valorAtual: ValorJson | undefined,
  valorReferencia: ValorJson | undefined,
  caminho: SegmentoCaminho[],
  mapas: MapasDeDiferenca,
): boolean {
  if (valorAtual === undefined && valorReferencia === undefined) {
    return false;
  }

  if (valorAtual === undefined && valorReferencia !== undefined) {
    marcarSubarvore(valorReferencia, caminho, "removido", mapas.mapaReferencia);
    return true;
  }

  if (valorAtual !== undefined && valorReferencia === undefined) {
    marcarSubarvore(valorAtual, caminho, "adicionado", mapas.mapaAtual);
    return true;
  }

  const tipoAtual = determinarTipoNo(valorAtual as ValorJson);
  const tipoReferencia = determinarTipoNo(valorReferencia as ValorJson);

  if (tipoAtual !== tipoReferencia) {
    mapas.mapaAtual.set(criarIdNo(caminho), "alterado");
    mapas.mapaReferencia.set(criarIdNo(caminho), "alterado");
    return true;
  }

  if (tipoAtual !== "object" && tipoAtual !== "array") {
    const alterado =
      JSON.stringify(valorAtual) !== JSON.stringify(valorReferencia);

    if (alterado) {
      mapas.mapaAtual.set(criarIdNo(caminho), "alterado");
      mapas.mapaReferencia.set(criarIdNo(caminho), "alterado");
    }

    return alterado;
  }

  const chaves =
    tipoAtual === "array"
      ? Array.from(
          new Set([
            ...Array.from({ length: (valorAtual as ValorJson[]).length }, (_, indice) => indice),
            ...Array.from(
              { length: (valorReferencia as ValorJson[]).length },
              (_, indice) => indice,
            ),
          ]),
        )
      : Array.from(
          new Set([
            ...Object.keys(valorAtual as Record<string, ValorJson>),
            ...Object.keys(valorReferencia as Record<string, ValorJson>),
          ]),
        );

  let houveMudanca = false;

  chaves.forEach((chave) => {
    const mudouNesteCaminho = compararValores(
      (valorAtual as Record<string, ValorJson> | ValorJson[])[chave as never] as
        | ValorJson
        | undefined,
      (valorReferencia as Record<string, ValorJson> | ValorJson[])[
        chave as never
      ] as ValorJson | undefined,
      [...caminho, chave as SegmentoCaminho],
      mapas,
    );

    if (mudouNesteCaminho) {
      houveMudanca = true;
    }
  });

  if (houveMudanca) {
    mapas.mapaAtual.set(criarIdNo(caminho), "alterado");
    mapas.mapaReferencia.set(criarIdNo(caminho), "alterado");
  }

  return houveMudanca;
}

export function compararJsonEstruturalmente(
  valorAtual: ValorJson | null,
  valorReferencia: ValorJson | null,
): MapasDeDiferenca {
  const mapas: MapasDeDiferenca = {
    mapaAtual: new Map<string, StatusDiferencaNo>(),
    mapaReferencia: new Map<string, StatusDiferencaNo>(),
  };

  compararValores(
    valorAtual ?? undefined,
    valorReferencia ?? undefined,
    [],
    mapas,
  );

  return mapas;
}
