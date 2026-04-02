import { useEffect } from "react";
import type { TemaAplicacao } from "../tipos/json";

export function useTema(temaAplicacao: TemaAplicacao) {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", temaAplicacao);
  }, [temaAplicacao]);
}
