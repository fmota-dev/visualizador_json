import type { FiltroBusca, NoJson, ResultadoBusca } from "../tipos/json";
import { formatarCaminho } from "./json";

function incluirSeNaoExistir(ids: string[], valor: string) {
  if (!ids.includes(valor)) {
    ids.push(valor);
  }
}

function determinarTipoCorrespondencia(
  correspondencias: Array<"chave" | "valor" | "caminho" | "tipo">,
): ResultadoBusca["tipoCorrespondencia"] {
  if (correspondencias.length === 1) {
    return correspondencias[0];
  }

  return "multiplo";
}

export function buscarNaArvore(
  raiz: NoJson,
  termoBusca: string,
  filtroBusca: FiltroBusca,
): ResultadoBusca[] {
  const termoNormalizado = termoBusca.trim().toLowerCase();

  if (!termoNormalizado) {
    return [];
  }

  const resultados: ResultadoBusca[] = [];

  function percorrer(no: NoJson, idsAncestres: string[]) {
    const chaveNormalizada = no.chave.toLowerCase();
    const valorNormalizado = no.resumoValor.toLowerCase();
    const caminhoNormalizado = formatarCaminho(no.caminho).toLowerCase();
    const tipoNormalizado = no.tipo.toLowerCase();
    const correspondeChave = chaveNormalizada.includes(termoNormalizado);
    const correspondeValor = valorNormalizado.includes(termoNormalizado);
    const correspondeCaminho = caminhoNormalizado.includes(termoNormalizado);
    const correspondeTipo = tipoNormalizado.includes(termoNormalizado);
    const correspondencias = [
      correspondeChave ? "chave" : null,
      correspondeValor ? "valor" : null,
      correspondeCaminho ? "caminho" : null,
      correspondeTipo ? "tipo" : null,
    ].filter(Boolean) as Array<"chave" | "valor" | "caminho" | "tipo">;
    const correspondeFiltro =
      filtroBusca === "todos"
        ? correspondencias.length > 0
        : correspondencias.includes(filtroBusca);

    if (correspondeFiltro) {
      resultados.push({
        id: no.id,
        caminho: no.caminho,
        trecho: `${formatarCaminho(no.caminho)}: ${no.resumoValor}`,
        tipoCorrespondencia: determinarTipoCorrespondencia(correspondencias),
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
