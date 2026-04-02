import { useDeferredValue, useMemo } from "react";
import type { ErroJson, NoJson, ValorJson } from "../tipos/json";
import { analisarErroJson, construirArvoreJson } from "../utilitarios/json";

interface RetornoJsonParseado {
  jsonParseado: ValorJson | null;
  arvoreJson: NoJson | null;
  erroJson: ErroJson | null;
}

export function useJsonParseado(jsonBruto: string): RetornoJsonParseado {
  const resultadoImmediate = useMemo(() => {
    if (!jsonBruto.trim()) {
      return {
        jsonParseado: null,
        erroJson: {
          mensagem: "Cole um JSON para visualizar.",
          linha: 1,
          coluna: 1,
        },
      };
    }

    try {
      const jsonParseado = JSON.parse(jsonBruto) as ValorJson;
      return {
        jsonParseado,
        erroJson: null,
      };
    } catch (erro) {
      return {
        jsonParseado: null,
        erroJson: analisarErroJson(jsonBruto, erro),
      };
    }
  }, [jsonBruto]);

  const jsonParseadoAdiado = useDeferredValue(resultadoImmediate.jsonParseado);

  const arvoreJson = useMemo<NoJson | null>(() => {
    if (!jsonParseadoAdiado) {
      return null;
    }

    return construirArvoreJson(jsonParseadoAdiado);
  }, [jsonParseadoAdiado]);

  return {
    jsonParseado: resultadoImmediate.jsonParseado,
    arvoreJson,
    erroJson: resultadoImmediate.erroJson,
  };
}
