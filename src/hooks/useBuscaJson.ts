import { useDeferredValue, useMemo } from "react";
import type { NoJson } from "../tipos/json";
import { buscarNaArvore, coletarIdsRelacionadosAResultados } from "../utilitarios/busca";

export function useBuscaJson(arvoreJson: NoJson | null, termoBusca: string) {
  const termoBuscaAdiado = useDeferredValue(termoBusca);

  return useMemo(() => {
    if (!arvoreJson) {
      return {
        resultadosBusca: [],
        idsCorrespondentes: new Set<string>(),
        idsAncestres: new Set<string>(),
      };
    }

    const resultadosBusca = buscarNaArvore(arvoreJson, termoBuscaAdiado);
    const { idsCorrespondentes, idsAncestres } =
      coletarIdsRelacionadosAResultados(resultadosBusca);

    return {
      resultadosBusca,
      idsCorrespondentes,
      idsAncestres,
    };
  }, [arvoreJson, termoBuscaAdiado]);
}
