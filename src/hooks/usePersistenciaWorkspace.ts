import { useEffect } from "react";
import type {
  FiltroBusca,
  FormatoDocumento,
  ModoPainelVisualizador,
  ModoVisualizacao,
  PresetLayoutGrafo,
  SubmodoComparacao,
  TemaAplicacao,
} from "../tipos/json";

const CHAVE_WORKSPACE = "visualizador-json:workspace:v1";

export interface WorkspacePersistido {
  jsonBruto: string;
  jsonReferenciaBruto: string;
  formatoDocumento: FormatoDocumento;
  formatoDocumentoReferencia: FormatoDocumento;
  temaAplicacao: TemaAplicacao;
  modoVisualizacao: ModoVisualizacao;
  modoPainelVisualizador: ModoPainelVisualizador;
  submodoComparacao: SubmodoComparacao;
  termoBusca: string;
  filtroBusca: FiltroBusca;
  nosExpandidos: string[];
  larguraPainelEditor: number;
  editorRecolhido: boolean;
  presetLayoutGrafo: PresetLayoutGrafo;
  miniMapaVisivel: boolean;
}

export const workspacePersistidoPadrao: WorkspacePersistido = {
  jsonBruto: "",
  jsonReferenciaBruto: "",
  formatoDocumento: "json",
  formatoDocumentoReferencia: "json",
  temaAplicacao: "claro",
  modoVisualizacao: "grafo",
  modoPainelVisualizador: "explorar",
  submodoComparacao: "texto",
  termoBusca: "",
  filtroBusca: "todos",
  nosExpandidos: ["raiz"],
  larguraPainelEditor: 31,
  editorRecolhido: false,
  presetLayoutGrafo: "equilibrado",
  miniMapaVisivel: false,
};

function validarTexto(valor: unknown) {
  return typeof valor === "string" ? valor : undefined;
}

function validarBooleano(valor: unknown) {
  return typeof valor === "boolean" ? valor : undefined;
}

function validarNumero(valor: unknown) {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : undefined;
}

function validarListaDeIds(valor: unknown) {
  return Array.isArray(valor) && valor.every((item) => typeof item === "string")
    ? valor
    : undefined;
}

function validarEnumeracao<T extends string>(
  valor: unknown,
  valoresPermitidos: readonly T[],
) {
  return typeof valor === "string" && valoresPermitidos.includes(valor as T)
    ? (valor as T)
    : undefined;
}

export function carregarWorkspacePersistido(): WorkspacePersistido {
  if (typeof window === "undefined") {
    return workspacePersistidoPadrao;
  }

  try {
    const bruto = window.localStorage.getItem(CHAVE_WORKSPACE);
    if (!bruto) {
      return workspacePersistidoPadrao;
    }

    const valorLido = JSON.parse(bruto) as Record<string, unknown>;

    return {
      jsonBruto:
        validarTexto(valorLido.jsonBruto) ?? workspacePersistidoPadrao.jsonBruto,
      jsonReferenciaBruto:
        validarTexto(valorLido.jsonReferenciaBruto) ??
        workspacePersistidoPadrao.jsonReferenciaBruto,
      formatoDocumento:
        validarEnumeracao(valorLido.formatoDocumento, [
          "json",
          "yaml",
          "toml",
          "xml",
          "csv",
        ]) ?? workspacePersistidoPadrao.formatoDocumento,
      formatoDocumentoReferencia:
        validarEnumeracao(valorLido.formatoDocumentoReferencia, [
          "json",
          "yaml",
          "toml",
          "xml",
          "csv",
        ]) ?? workspacePersistidoPadrao.formatoDocumentoReferencia,
      temaAplicacao:
        validarEnumeracao(valorLido.temaAplicacao, ["claro", "escuro"]) ??
        workspacePersistidoPadrao.temaAplicacao,
      modoVisualizacao:
        validarEnumeracao(valorLido.modoVisualizacao, ["arvore", "grafo", "tabela"]) ??
        workspacePersistidoPadrao.modoVisualizacao,
      modoPainelVisualizador:
        validarEnumeracao(valorLido.modoPainelVisualizador, ["explorar", "comparar"]) ??
        workspacePersistidoPadrao.modoPainelVisualizador,
      submodoComparacao:
        validarEnumeracao(valorLido.submodoComparacao, [
          "texto",
          "arvore",
          "grafo",
          "tabela",
        ]) ??
        workspacePersistidoPadrao.submodoComparacao,
      termoBusca:
        validarTexto(valorLido.termoBusca) ?? workspacePersistidoPadrao.termoBusca,
      filtroBusca:
        validarEnumeracao(valorLido.filtroBusca, [
          "todos",
          "chave",
          "valor",
          "caminho",
          "tipo",
        ]) ?? workspacePersistidoPadrao.filtroBusca,
      nosExpandidos:
        validarListaDeIds(valorLido.nosExpandidos) ??
        workspacePersistidoPadrao.nosExpandidos,
      larguraPainelEditor:
        validarNumero(valorLido.larguraPainelEditor) ??
        workspacePersistidoPadrao.larguraPainelEditor,
      editorRecolhido:
        validarBooleano(valorLido.editorRecolhido) ??
        workspacePersistidoPadrao.editorRecolhido,
      presetLayoutGrafo:
        validarEnumeracao(valorLido.presetLayoutGrafo, [
          "compacto",
          "equilibrado",
          "amplo",
        ]) ?? workspacePersistidoPadrao.presetLayoutGrafo,
      miniMapaVisivel:
        validarBooleano(valorLido.miniMapaVisivel) ??
        workspacePersistidoPadrao.miniMapaVisivel,
    };
  } catch {
    return workspacePersistidoPadrao;
  }
}

export function usePersistenciaWorkspace(workspace: WorkspacePersistido) {
  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      window.localStorage.setItem(CHAVE_WORKSPACE, JSON.stringify(workspace));
    }, 240);

    return () => {
      window.clearTimeout(temporizador);
    };
  }, [workspace]);
}
