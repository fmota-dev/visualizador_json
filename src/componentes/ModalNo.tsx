import { useMemo, useState } from "react";
import type { NoEditavel, ValorJson } from "../tipos/json";
import { formatarCaminho } from "../utilitarios/json";

export interface PropsModalNo {
  aberto: boolean;
  noEditavel: NoEditavel | null;
  aoFechar: () => void;
  aoConfirmar: (valor: ValorJson) => void;
}

function criarValorInicial(noEditavel: NoEditavel | null) {
  if (!noEditavel) {
    return "";
  }

  if (noEditavel.tipo === "object" || noEditavel.tipo === "array") {
    return JSON.stringify(noEditavel.valor, null, 2);
  }

  if (noEditavel.tipo === "string") {
    return String(noEditavel.valor);
  }

  if (noEditavel.tipo === "null") {
    return "null";
  }

  return String(noEditavel.valor);
}

function interpretarValorEditado(noEditavel: NoEditavel, valorEditado: string): ValorJson {
  if (noEditavel.tipo === "string") {
    return valorEditado;
  }

  if (noEditavel.tipo === "number") {
    const numero = Number(valorEditado);
    if (Number.isNaN(numero)) {
      throw new Error("Digite um numero valido.");
    }
    return numero;
  }

  if (noEditavel.tipo === "boolean") {
    if (valorEditado !== "true" && valorEditado !== "false") {
      throw new Error("Escolha true ou false.");
    }
    return valorEditado === "true";
  }

  return JSON.parse(valorEditado) as ValorJson;
}

export function ModalNo({
  aberto,
  noEditavel,
  aoFechar,
  aoConfirmar,
}: PropsModalNo) {
  const [valorEditado, setValorEditado] = useState(() => criarValorInicial(noEditavel));
  const [erroFormulario, setErroFormulario] = useState("");

  const caminhoFormatado = useMemo(
    () => (noEditavel ? formatarCaminho(noEditavel.caminho) : ""),
    [noEditavel],
  );

  if (!aberto || !noEditavel) {
    return null;
  }

  const campoPrincipal =
    noEditavel.tipo === "boolean" ? (
      <select
        className="h-12 rounded-2xl border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] px-4 text-[color:var(--cor-texto)] outline-none focus:border-[color:var(--cor-destaque)]"
        onChange={(evento) => setValorEditado(evento.target.value)}
        value={valorEditado}
      >
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    ) : noEditavel.tipo === "string" ? (
      <textarea
        className="min-h-32 rounded-3xl border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] px-4 py-3 text-[color:var(--cor-texto)] outline-none focus:border-[color:var(--cor-destaque)]"
        onChange={(evento) => setValorEditado(evento.target.value)}
        spellCheck={false}
        value={valorEditado}
      />
    ) : noEditavel.tipo === "number" ? (
      <input
        className="h-12 rounded-2xl border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] px-4 text-[color:var(--cor-texto)] outline-none focus:border-[color:var(--cor-destaque)]"
        onChange={(evento) => setValorEditado(evento.target.value)}
        type="text"
        value={valorEditado}
      />
    ) : (
      <textarea
        className="min-h-40 rounded-3xl border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] px-4 py-3 font-mono text-sm text-[color:var(--cor-texto)] outline-none focus:border-[color:var(--cor-destaque)]"
        onChange={(evento) => setValorEditado(evento.target.value)}
        spellCheck={false}
        value={valorEditado}
      />
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6 backdrop-blur-sm">
      <div className="painel-vidro w-full max-w-2xl rounded-[32px] border border-[color:var(--cor-borda)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--cor-texto-suave)]">
              Edicao inline
            </p>
            <h2 className="text-2xl font-semibold text-[color:var(--cor-texto)]">
              {noEditavel.chave === "raiz" ? "Editar raiz" : `Editar ${noEditavel.chave}`}
            </h2>
            <p className="mt-2 text-sm text-[color:var(--cor-texto-suave)]">
              Caminho: {caminhoFormatado}
            </p>
          </div>
          <button
            className="rounded-full border border-[color:var(--cor-borda)] px-3 py-2 text-sm text-[color:var(--cor-texto)] transition hover:border-[color:var(--cor-borda-forte)] hover:bg-[color:var(--cor-destaque-suave)]"
            onClick={aoFechar}
            type="button"
          >
            Fechar
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-4">
          <div className="rounded-[24px] border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-painel)] px-4 py-3 text-sm text-[color:var(--cor-texto-suave)]">
            Tipo atual: <strong className="text-[color:var(--cor-texto)]">{noEditavel.tipo}</strong>
          </div>
          {campoPrincipal}
          {erroFormulario ? (
            <p className="text-sm font-medium text-[color:var(--cor-perigo)]">{erroFormulario}</p>
          ) : (
            <p className="text-sm text-[color:var(--cor-texto-suave)]">
              Objetos e arrays aceitam JSON completo. Strings editam apenas o texto puro.
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            className="rounded-full border border-[color:var(--cor-borda)] px-5 py-2 text-sm font-medium text-[color:var(--cor-texto)] transition hover:border-[color:var(--cor-borda-forte)] hover:bg-[color:var(--cor-destaque-suave)]"
            onClick={aoFechar}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="rounded-full bg-[color:var(--cor-destaque)] px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            onClick={() => {
              try {
                const novoValor = interpretarValorEditado(noEditavel, valorEditado);
                setErroFormulario("");
                aoConfirmar(novoValor);
              } catch (erro) {
                setErroFormulario(
                  erro instanceof Error ? erro.message : "Nao foi possivel atualizar o valor.",
                );
              }
            }}
            type="button"
          >
            Confirmar edicao
          </button>
        </div>
      </div>
    </div>
  );
}
