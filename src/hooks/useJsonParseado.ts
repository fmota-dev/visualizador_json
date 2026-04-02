import { useMemo } from "react";
import type { ErroJson, NoJson, ValorJson } from "../tipos/json";
import { analisarErroJson, construirArvoreJson } from "../utilitarios/json";

interface RetornoJsonParseado {
  jsonParseado: ValorJson | null;
  arvoreJson: NoJson | null;
  erroJson: ErroJson | null;
}

export function useJsonParseado(jsonBruto: string): RetornoJsonParseado {
  return useMemo(() => {
    if (!jsonBruto.trim()) {
      return {
        jsonParseado: null,
        arvoreJson: null,
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
        arvoreJson: construirArvoreJson(jsonParseado),
        erroJson: null,
      };
    } catch (erro) {
      return {
        jsonParseado: null,
        arvoreJson: null,
        erroJson: analisarErroJson(jsonBruto, erro),
      };
    }
  }, [jsonBruto]);
}
