import TOML from "@iarna/toml";
import { XMLBuilder, XMLParser, XMLValidator } from "fast-xml-parser";
import Papa from "papaparse";
import YAML from "yaml";
import type {
  ErroJson,
  FormatoDocumento,
  MetadadosTabelaCsv,
  ValorJson,
} from "../tipos/json";
import { analisarErroJson } from "./json";

const parserXml = new XMLParser({
  attributeNamePrefix: "@",
  ignoreAttributes: false,
  parseAttributeValue: false,
  parseTagValue: false,
  textNodeName: "#texto",
  trimValues: false,
});

const construtorXml = new XMLBuilder({
  attributeNamePrefix: "@",
  format: true,
  ignoreAttributes: false,
  indentBy: "  ",
  suppressBooleanAttributes: false,
  textNodeName: "#texto",
});

export const formatosDocumento: FormatoDocumento[] = [
  "json",
  "yaml",
  "toml",
  "xml",
  "csv",
];

export function obterRotuloFormato(formato: FormatoDocumento) {
  const rotulos: Record<FormatoDocumento, string> = {
    json: "JSON",
    yaml: "YAML",
    toml: "TOML",
    xml: "XML",
    csv: "CSV",
  };

  return rotulos[formato];
}

export function obterLinguagemEditor(formato: FormatoDocumento) {
  const linguagens: Record<FormatoDocumento, string> = {
    json: "json",
    yaml: "yaml",
    toml: "ini",
    xml: "xml",
    csv: "plaintext",
  };

  return linguagens[formato];
}

export function detectarFormatoPorNomeArquivo(nomeArquivo: string): FormatoDocumento {
  const nomeNormalizado = nomeArquivo.trim().toLowerCase();

  if (nomeNormalizado.endsWith(".yaml") || nomeNormalizado.endsWith(".yml")) {
    return "yaml";
  }

  if (nomeNormalizado.endsWith(".toml")) {
    return "toml";
  }

  if (nomeNormalizado.endsWith(".xml")) {
    return "xml";
  }

  if (nomeNormalizado.endsWith(".csv")) {
    return "csv";
  }

  return "json";
}

export function obterAcceptUpload() {
  return ".json,.yaml,.yml,.toml,.xml,.csv,application/json,text/yaml,text/x-yaml,text/xml,text/csv";
}

function documentoValidoNoFormato(bruto: string, formato: FormatoDocumento) {
  const resultado = parsearDocumento(bruto, formato);
  return resultado.erroDocumento === null;
}

export function detectarFormatoPorConteudo(
  bruto: string,
  formatoAtual?: FormatoDocumento,
): FormatoDocumento | null {
  const conteudo = bruto.trim();

  if (!conteudo) {
    return null;
  }

  const candidatos: FormatoDocumento[] = [];
  const adicionarCandidato = (formato: FormatoDocumento) => {
    if (!candidatos.includes(formato)) {
      candidatos.push(formato);
    }
  };
  const pareceJson = conteudo.startsWith("{") || conteudo.startsWith("[");
  const pareceXml = conteudo.startsWith("<");
  const pareceToml =
    /^\s*\[\[[^\]]+\]\]/m.test(conteudo) || /^\s*[\w.-]+\s*=/m.test(conteudo);
  const pareceYaml =
    /^\s*-\s+\S/m.test(conteudo) || /^\s*[\w.-]+\s*:\s*\S*/m.test(conteudo);

  if (pareceJson) {
    if (formatoAtual === "json") {
      return "json";
    }

    adicionarCandidato("json");
  }

  if (pareceXml) {
    if (formatoAtual === "xml") {
      return "xml";
    }

    adicionarCandidato("xml");
  }

  if (pareceToml) {
    adicionarCandidato("toml");
  }

  if (pareceYaml) {
    adicionarCandidato("yaml");
  }

  const linhasNaoVazias = conteudo
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean);
  if (
    linhasNaoVazias.length >= 2 &&
    linhasNaoVazias.slice(0, 3).every((linha) => linha.includes(",")) &&
    !conteudo.startsWith("{") &&
    !conteudo.startsWith("[")
  ) {
    adicionarCandidato("csv");
  }

  if (formatoAtual) {
    adicionarCandidato(formatoAtual);
  }

  formatosDocumento.forEach((formato) => adicionarCandidato(formato));

  for (const formato of candidatos) {
    if (documentoValidoNoFormato(bruto, formato)) {
      return formato;
    }
  }

  return null;
}

function normalizarValorEstruturado(valor: unknown): ValorJson {
  if (
    valor === null ||
    typeof valor === "string" ||
    typeof valor === "number" ||
    typeof valor === "boolean"
  ) {
    return valor;
  }

  if (valor instanceof Date) {
    return valor.toISOString();
  }

  if (Array.isArray(valor)) {
    return valor.map((item) => normalizarValorEstruturado(item));
  }

  if (typeof valor === "object") {
    return Object.fromEntries(
      Object.entries(valor as Record<string, unknown>).map(([chave, item]) => [
        chave,
        normalizarValorEstruturado(item),
      ]),
    );
  }

  return String(valor);
}

function obterErroPadrao(mensagem: string): ErroJson {
  return {
    mensagem,
    linha: 1,
    coluna: 1,
  };
}

function analisarErroYaml(erro: unknown): ErroJson {
  const erroYaml = erro as {
    message?: string;
    linePos?: Array<{ line: number; col: number }>;
  };
  const primeiraPosicao = erroYaml.linePos?.[0];

  return {
    mensagem: erroYaml.message ?? "Nao foi possivel interpretar o YAML.",
    linha: primeiraPosicao?.line ?? 1,
    coluna: primeiraPosicao?.col ?? 1,
  };
}

function analisarErroToml(erro: unknown): ErroJson {
  const erroToml = erro as {
    message?: string;
    line?: number;
    column?: number;
    col?: number;
  };

  return {
    mensagem: erroToml.message ?? "Nao foi possivel interpretar o TOML.",
    linha: erroToml.line ?? 1,
    coluna: erroToml.column ?? erroToml.col ?? 1,
  };
}

function analisarErroXml(bruto: string, erro: unknown): ErroJson {
  const validacao = XMLValidator.validate(bruto);
  if (validacao !== true) {
    return {
      mensagem: validacao.err.msg,
      linha: validacao.err.line,
      coluna: validacao.err.col,
    };
  }

  const erroXml = erro as {
    message?: string;
    line?: number;
    column?: number;
    col?: number;
  };

  return {
    mensagem: erroXml.message ?? "Nao foi possivel interpretar o XML.",
    linha: erroXml.line ?? 1,
    coluna: erroXml.column ?? erroXml.col ?? 1,
  };
}

function parsearCsv(bruto: string) {
  const resultado = Papa.parse<Record<string, string>>(bruto, {
    header: true,
    skipEmptyLines: "greedy",
  });

  if (resultado.errors.length > 0) {
    const primeiroErro = resultado.errors[0];
    throw {
      message: primeiroErro.message,
      line: (primeiroErro.row ?? 0) + 2,
      column: 1,
    };
  }

  const colunas = resultado.meta.fields ?? [];
  const linhas = resultado.data.map((linha) =>
    Object.fromEntries(
      colunas.map((coluna) => [coluna, linha[coluna] ?? ""]),
    ),
  );

  return {
    valorEstruturado: linhas as ValorJson,
    metadadosTabela: {
      colunas,
      linhas,
    } satisfies MetadadosTabelaCsv,
  };
}

function serializarCsv(valor: ValorJson) {
  if (!Array.isArray(valor)) {
    throw new Error("CSV exige uma lista de linhas para serializacao.");
  }

  const linhas = valor.map((item) => {
    if (!item || Array.isArray(item) || typeof item !== "object") {
      throw new Error("CSV exige linhas em formato de objeto.");
    }

    return item as Record<string, ValorJson>;
  });

  const colunas = Array.from(
    new Set(linhas.flatMap((linha) => Object.keys(linha))),
  );

  const linhasPlanas = linhas.map((linha) =>
    Object.fromEntries(
      colunas.map((coluna) => {
        const valorCelula = linha[coluna];

        if (
          valorCelula === null ||
          typeof valorCelula === "string" ||
          typeof valorCelula === "number" ||
          typeof valorCelula === "boolean"
        ) {
          return [coluna, valorCelula ?? ""];
        }

        throw new Error(
          "CSV nao suporta objetos ou arrays dentro das celulas na serializacao.",
        );
      }),
    ),
  );

  return Papa.unparse(linhasPlanas, {
    columns: colunas,
  });
}

function serializarXml(valor: ValorJson) {
  if (Array.isArray(valor) || valor === null || typeof valor !== "object") {
    return construtorXml.build({ documento: valor });
  }

  return construtorXml.build(valor as Record<string, ValorJson>);
}

export function serializarDocumento(
  valor: ValorJson,
  formato: FormatoDocumento,
): string {
  switch (formato) {
    case "json":
      return JSON.stringify(valor, null, 2);
    case "yaml":
      return YAML.stringify(valor);
    case "toml":
      return TOML.stringify(valor as Parameters<typeof TOML.stringify>[0]);
    case "xml":
      return serializarXml(valor);
    case "csv":
      return serializarCsv(valor);
    default:
      return JSON.stringify(valor, null, 2);
  }
}

export function construirMetadadosTabelaCsv(
  valorEstruturado: ValorJson | null,
  formato: FormatoDocumento,
): MetadadosTabelaCsv | null {
  if (formato !== "csv" || !Array.isArray(valorEstruturado)) {
    return null;
  }

  const linhas = valorEstruturado
    .filter(
      (item): item is Record<string, ValorJson> =>
        Boolean(item) && !Array.isArray(item) && typeof item === "object",
    )
    .map((linha) =>
      Object.fromEntries(
        Object.entries(linha).map(([chave, valor]) => [chave, String(valor ?? "")]),
      ),
    );
  const colunas = Array.from(
    new Set(linhas.flatMap((linha) => Object.keys(linha))),
  );

  return {
    colunas,
    linhas: linhas.map((linha) =>
      Object.fromEntries(colunas.map((coluna) => [coluna, linha[coluna] ?? ""])),
    ),
  };
}

export function parsearDocumento(bruto: string, formato: FormatoDocumento) {
  if (!bruto.trim()) {
    return {
      valorEstruturado: null,
      erroDocumento: obterErroPadrao("Cole um documento para visualizar."),
      metadadosTabela: null,
    };
  }

  try {
    switch (formato) {
      case "json": {
        const valorEstruturado = JSON.parse(bruto) as ValorJson;
        return { valorEstruturado, erroDocumento: null, metadadosTabela: null };
      }
      case "yaml": {
        const valorEstruturado = normalizarValorEstruturado(YAML.parse(bruto));
        return { valorEstruturado, erroDocumento: null, metadadosTabela: null };
      }
      case "toml": {
        const valorEstruturado = normalizarValorEstruturado(TOML.parse(bruto));
        return { valorEstruturado, erroDocumento: null, metadadosTabela: null };
      }
      case "xml": {
        const validacao = XMLValidator.validate(bruto);
        if (validacao !== true) {
          return {
            valorEstruturado: null,
            erroDocumento: {
              mensagem: validacao.err.msg,
              linha: validacao.err.line,
              coluna: validacao.err.col,
            },
            metadadosTabela: null,
          };
        }

        const valorEstruturado = normalizarValorEstruturado(parserXml.parse(bruto));
        return { valorEstruturado, erroDocumento: null, metadadosTabela: null };
      }
      case "csv": {
        const { valorEstruturado, metadadosTabela } = parsearCsv(bruto);
        return { valorEstruturado, erroDocumento: null, metadadosTabela };
      }
      default:
        return {
          valorEstruturado: null,
          erroDocumento: obterErroPadrao("Formato nao suportado."),
          metadadosTabela: null,
        };
    }
  } catch (erro) {
    if (formato === "json") {
      return {
        valorEstruturado: null,
        erroDocumento: analisarErroJson(bruto, erro),
        metadadosTabela: null,
      };
    }

    if (formato === "yaml") {
      return {
        valorEstruturado: null,
        erroDocumento: analisarErroYaml(erro),
        metadadosTabela: null,
      };
    }

    if (formato === "toml") {
      return {
        valorEstruturado: null,
        erroDocumento: analisarErroToml(erro),
        metadadosTabela: null,
      };
    }

    if (formato === "xml") {
      return {
        valorEstruturado: null,
        erroDocumento: analisarErroXml(bruto, erro),
        metadadosTabela: null,
      };
    }

    const erroCsv = erro as { message?: string; line?: number; column?: number };

    return {
      valorEstruturado: null,
      erroDocumento: {
        mensagem: erroCsv.message ?? "Nao foi possivel interpretar o CSV.",
        linha: erroCsv.line ?? 1,
        coluna: erroCsv.column ?? 1,
      },
      metadadosTabela: null,
    };
  }
}
