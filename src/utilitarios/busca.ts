import type { NoJson, ResultadoBusca } from "../tipos/json";
import { formatarCaminho } from "./json";

function incluirSeNaoExistir(ids: string[], valor: string) {
  if (!ids.includes(valor)) {
    ids.push(valor);
  }
}

export function buscarNaArvore(raiz: NoJson, termoBusca: string): ResultadoBusca[] {
  const termoNormalizado = termoBusca.trim().toLowerCase();

  if (!termoNormalizado) {
    return [];
  }

  const resultados: ResultadoBusca[] = [];

  function percorrer(no: NoJson, idsAncestres: string[]) {
    const chaveNormalizada = no.chave.toLowerCase();
    const valorNormalizado = no.resumoValor.toLowerCase();
    const correspondeChave = chaveNormalizada.includes(termoNormalizado);
    const correspondeValor = valorNormalizado.includes(termoNormalizado);

    if (correspondeChave || correspondeValor) {
      resultados.push({
        id: no.id,
        caminho: no.caminho,
        trecho: `${formatarCaminho(no.caminho)}: ${no.resumoValor}`,
        tipoCorrespondencia:
          correspondeChave && correspondeValor
            ? "chave-e-valor"
            : correspondeChave
              ? "chave"
              : "valor",
        idsAncestres,
      });
    }

    no.filhos.forEach((filho) => {
      percorrer(filho, [...idsAncestres, no.id]);
    });
  }

  percorrer(raiz, []);

  return resultados;
}

export function coletarIdsRelacionadosAResultados(resultados: ResultadoBusca[]) {
  const idsCorrespondentes = new Set<string>();
  const idsAncestres = new Set<string>();

  resultados.forEach((resultado) => {
    idsCorrespondentes.add(resultado.id);
    resultado.idsAncestres.forEach((idAncestre) => {
      idsAncestres.add(idAncestre);
    });
  });

  return {
    idsCorrespondentes,
    idsAncestres,
  };
}

export function marcarTrechos(texto: string, termoBusca: string) {
  if (!termoBusca.trim()) {
    return [{ texto, destacado: false }];
  }

  const termoEscapado = termoBusca.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const partes = texto.split(new RegExp(`(${termoEscapado})`, "ig"));

  return partes
    .filter((parte) => parte.length > 0)
    .map((parte) => ({
      texto: parte,
      destacado: parte.toLowerCase() === termoBusca.toLowerCase(),
    }));
}

export function mesclarIdsVisiveis(
  idsExpandidos: Set<string>,
  resultados: ResultadoBusca[],
) {
  const proximos = new Set(idsExpandidos);

  resultados.forEach((resultado) => {
    resultado.idsAncestres.forEach((idAncestre) => {
      incluirSeNaoExistir([...proximos], idAncestre);
      proximos.add(idAncestre);
    });
  });

  return proximos;
}
