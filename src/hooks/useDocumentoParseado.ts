import { useDeferredValue, useMemo } from "react";
import type {
  ErroJson,
  FormatoDocumento,
  MetadadosTabelaCsv,
  NoJson,
  ValorJson,
} from "../tipos/json";
import { parsearDocumento } from "../utilitarios/documentos";
import { construirArvoreJson } from "../utilitarios/json";

interface RetornoDocumentoParseado {
  valorEstruturado: ValorJson | null;
  arvoreDocumento: NoJson | null;
  erroDocumento: ErroJson | null;
  metadadosTabela: MetadadosTabelaCsv | null;
}

export function useDocumentoParseado(
  documentoBruto: string,
  formatoDocumento: FormatoDocumento,
): RetornoDocumentoParseado {
  const resultadoImediato = useMemo(
    () => parsearDocumento(documentoBruto, formatoDocumento),
    [documentoBruto, formatoDocumento],
  );

  const valorEstruturadoAdiado = useDeferredValue(resultadoImediato.valorEstruturado);

  const arvoreDocumento = useMemo<NoJson | null>(() => {
    if (!valorEstruturadoAdiado) {
      return null;
    }

    return construirArvoreJson(valorEstruturadoAdiado);
  }, [valorEstruturadoAdiado]);

  return {
    valorEstruturado: resultadoImediato.valorEstruturado,
    arvoreDocumento,
    erroDocumento: resultadoImediato.erroDocumento,
    metadadosTabela: resultadoImediato.metadadosTabela,
  };
}
