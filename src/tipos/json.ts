export type ModoVisualizacao = "arvore" | "grafo" | "tabela";
export type TemaAplicacao = "claro" | "escuro";
export type ModoPainelVisualizador = "explorar" | "comparar";
export type SubmodoComparacao = "texto" | "arvore" | "grafo" | "tabela";
export type EscopoBusca = "todos" | "chave" | "valor" | "caminho" | "tipo";
export type FiltroBusca = EscopoBusca;
export type PresetLayoutGrafo = "compacto" | "equilibrado" | "amplo";
export type StatusDiferencaNo = "igual" | "adicionado" | "removido" | "alterado";
export type TipoNo = "object" | "array" | "string" | "number" | "boolean" | "null";
export type FormatoDocumento = "json" | "yaml" | "toml" | "xml" | "csv";
export type SegmentoCaminho = string | number;

export type ValorJson =
  | string
  | number
  | boolean
  | null
  | ValorJson[]
  | { [chave: string]: ValorJson };

export interface NoJson {
  id: string;
  caminho: SegmentoCaminho[];
  chave: string;
  valor: ValorJson;
  tipo: TipoNo;
  profundidade: number;
  filhos: NoJson[];
  resumoValor: string;
}

export interface ErroJson {
  mensagem: string;
  linha: number;
  coluna: number;
}

export interface MetadadosTabelaCsv {
  colunas: string[];
  linhas: Array<Record<string, string>>;
}

export interface ResultadoBusca {
  id: string;
  caminho: SegmentoCaminho[];
  trecho: string;
  tipoCorrespondencia: "chave" | "valor" | "caminho" | "tipo" | "multiplo";
  idsAncestres: string[];
}

export interface NoEditavel {
  id: string;
  caminho: SegmentoCaminho[];
  chave: string;
  tipo: TipoNo;
  tipoPai: TipoNo | null;
  chavesDoPai: string[];
  valor: ValorJson;
}

export interface DadosNoGrafo {
  [chave: string]: unknown;
  idNo: string;
  chave: string;
  resumoValor: string;
  tipo: TipoNo;
  expansivel: boolean;
  expandido: boolean;
  correspondeBusca: boolean;
  resultadoAtual: boolean;
}
