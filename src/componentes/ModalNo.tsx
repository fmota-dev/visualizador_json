import { useMemo, useState } from "react";
import type { FormatoDocumento, NoEditavel, ValorJson } from "../tipos/json";
import {
  obterRotuloFormato,
  parsearDocumento,
  serializarDocumento,
} from "../utilitarios/documentos";
import { formatarCaminho } from "../utilitarios/json";

export interface PropsModalNo {
  aberto: boolean;
  noEditavel: NoEditavel | null;
  formatoDocumento: FormatoDocumento;
  aoFechar: () => void;
  aoConfirmar: (valor: ValorJson) => void;
  aoAdicionarFilho: (chaveNova: string, valor: ValorJson) => void;
  aoRenomearChave: (novaChave: string) => void;
  aoRemoverNo: () => void;
  aoDuplicarNo: () => void;
}

function criarValorInicial(
  noEditavel: NoEditavel | null,
  formatoDocumento: FormatoDocumento,
) {
  if (!noEditavel) {
    return "";
  }

  if (noEditavel.tipo === "object" || noEditavel.tipo === "array") {
    try {
      if (formatoDocumento === "xml" || formatoDocumento === "csv") {
        return JSON.stringify(noEditavel.valor, null, 2);
      }

      return serializarDocumento(noEditavel.valor, formatoDocumento);
    } catch {
      return JSON.stringify(noEditavel.valor, null, 2);
    }
  }

  if (noEditavel.tipo === "string") {
    return String(noEditavel.valor);
  }

  if (noEditavel.tipo === "null") {
    return "null";
  }

  return String(noEditavel.valor);
}

function interpretarEstruturaEditada(
  valorEditado: string,
  formatoDocumento: FormatoDocumento,
) {
  if (formatoDocumento === "xml" || formatoDocumento === "csv") {
    return JSON.parse(valorEditado) as ValorJson;
  }

  return parsearDocumento(valorEditado, formatoDocumento).valorEstruturado;
}

function interpretarValorEditado(
  noEditavel: NoEditavel,
  valorEditado: string,
  formatoDocumento: FormatoDocumento,
): ValorJson {
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

  return interpretarEstruturaEditada(valorEditado, formatoDocumento);
}

function interpretarNovoValorEstrutural(
  valorEditado: string,
  formatoDocumento: FormatoDocumento,
): ValorJson {
  return interpretarEstruturaEditada(valorEditado, formatoDocumento);
}

export function ModalNo({
  aberto,
  noEditavel,
  formatoDocumento,
  aoFechar,
  aoConfirmar,
  aoAdicionarFilho,
  aoRenomearChave,
  aoRemoverNo,
  aoDuplicarNo,
}: PropsModalNo) {
  const [valorEditado, setValorEditado] = useState(() =>
    criarValorInicial(noEditavel, formatoDocumento),
  );
  const [erroFormulario, setErroFormulario] = useState("");
  const [chaveNovaFilho, setChaveNovaFilho] = useState("");
  const [valorNovoFilho, setValorNovoFilho] = useState("null");
  const [novoNomeChave, setNovoNomeChave] = useState(noEditavel?.chave ?? "");

  const caminhoFormatado = useMemo(
    () => (noEditavel ? formatarCaminho(noEditavel.caminho) : ""),
    [noEditavel],
  );

  if (!aberto || !noEditavel) {
    return null;
  }

  const permiteAdicionarFilho =
    noEditavel.tipo === "object" || noEditavel.tipo === "array";
  const permiteRenomear = noEditavel.tipoPai === "object";
  const permiteRemover =
    noEditavel.tipoPai === "object" || noEditavel.tipoPai === "array";
  const permiteDuplicar = noEditavel.tipoPai === "array";

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
            {noEditavel.tipoPai ? (
              <>
                {" "}
                • contêiner pai:{" "}
                <strong className="text-[color:var(--cor-texto)]">{noEditavel.tipoPai}</strong>
              </>
            ) : null}
          </div>
          {campoPrincipal}
          {erroFormulario ? (
            <p className="text-sm font-medium text-[color:var(--cor-perigo)]">{erroFormulario}</p>
          ) : (
            <p className="text-sm text-[color:var(--cor-texto-suave)]">
              Objetos e arrays aceitam{" "}
              {formatoDocumento === "xml" || formatoDocumento === "csv"
                ? "estrutura em JSON"
                : `${obterRotuloFormato(formatoDocumento)} completo`}
              . Strings editam apenas o texto puro.
            </p>
          )}
        </div>

        {(permiteAdicionarFilho || permiteRenomear || permiteRemover || permiteDuplicar) ? (
          <div className="mt-6 flex flex-col gap-4 rounded-[28px] border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-painel)] p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--cor-texto-suave)]">
                Edicao estrutural
              </p>
              <h3 className="mt-1 text-lg font-semibold text-[color:var(--cor-texto)]">
                Acoes sobre a estrutura do documento
              </h3>
            </div>

            {permiteAdicionarFilho ? (
              <div className="grid gap-3 rounded-[24px] border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] p-4">
                <p className="text-sm font-semibold text-[color:var(--cor-texto)]">
                  {noEditavel.tipo === "object" ? "Adicionar chave filha" : "Adicionar item"}
                </p>
                {noEditavel.tipo === "object" ? (
                  <input
                    className="h-12 rounded-2xl border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-painel)] px-4 text-[color:var(--cor-texto)] outline-none focus:border-[color:var(--cor-destaque)]"
                    onChange={(evento) => setChaveNovaFilho(evento.target.value)}
                    placeholder="Nome da nova chave"
                    type="text"
                    value={chaveNovaFilho}
                  />
                ) : null}
                <textarea
                  className="min-h-28 rounded-3xl border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-painel)] px-4 py-3 font-mono text-sm text-[color:var(--cor-texto)] outline-none focus:border-[color:var(--cor-destaque)]"
                  onChange={(evento) => setValorNovoFilho(evento.target.value)}
                  spellCheck={false}
                  value={valorNovoFilho}
                />
                <button
                  className="justify-self-start rounded-full bg-[color:var(--cor-destaque)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  onClick={() => {
                    try {
                      if (noEditavel.tipo === "object") {
                        const chaveTratada = chaveNovaFilho.trim();
                        if (!chaveTratada) {
                          throw new Error("Informe o nome da nova chave.");
                        }
                        if (Object.prototype.hasOwnProperty.call(noEditavel.valor, chaveTratada)) {
                          throw new Error("Essa chave ja existe neste objeto.");
                        }
                        aoAdicionarFilho(
                          chaveTratada,
                          interpretarNovoValorEstrutural(valorNovoFilho, formatoDocumento),
                        );
                      } else {
                        aoAdicionarFilho(
                          "",
                          interpretarNovoValorEstrutural(valorNovoFilho, formatoDocumento),
                        );
                      }
                      setErroFormulario("");
                    } catch (erro) {
                      setErroFormulario(
                        erro instanceof Error
                          ? erro.message
                          : "Nao foi possivel adicionar o novo elemento.",
                      );
                    }
                  }}
                  type="button"
                >
                  {noEditavel.tipo === "object" ? "Adicionar chave" : "Adicionar item"}
                </button>
              </div>
            ) : null}

            {permiteRenomear ? (
              <div className="grid gap-3 rounded-[24px] border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] p-4">
                <p className="text-sm font-semibold text-[color:var(--cor-texto)]">Renomear chave</p>
                <input
                  className="h-12 rounded-2xl border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-painel)] px-4 text-[color:var(--cor-texto)] outline-none focus:border-[color:var(--cor-destaque)]"
                  onChange={(evento) => setNovoNomeChave(evento.target.value)}
                  type="text"
                  value={novoNomeChave}
                />
                <button
                  className="justify-self-start rounded-full border border-[color:var(--cor-borda)] px-4 py-2 text-sm font-semibold text-[color:var(--cor-texto)] transition hover:border-[color:var(--cor-borda-forte)] hover:bg-[color:var(--cor-destaque-suave)]"
                  onClick={() => {
                    try {
                      const nomeTratado = novoNomeChave.trim();
                      if (!nomeTratado) {
                        throw new Error("Informe o novo nome da chave.");
                      }
                      if (
                        nomeTratado !== noEditavel.chave &&
                        noEditavel.chavesDoPai.includes(nomeTratado)
                      ) {
                        throw new Error("Ja existe uma chave com esse nome no objeto pai.");
                      }
                      aoRenomearChave(nomeTratado);
                      setErroFormulario("");
                    } catch (erro) {
                      setErroFormulario(
                        erro instanceof Error
                          ? erro.message
                          : "Nao foi possivel renomear a chave.",
                      );
                    }
                  }}
                  type="button"
                >
                  Renomear chave
                </button>
              </div>
            ) : null}

            {(permiteRemover || permiteDuplicar) ? (
              <div className="flex flex-wrap gap-3">
                {permiteDuplicar ? (
                  <button
                    className="rounded-full border border-[color:var(--cor-borda)] px-4 py-2 text-sm font-semibold text-[color:var(--cor-texto)] transition hover:border-[color:var(--cor-borda-forte)] hover:bg-[color:var(--cor-destaque-suave)]"
                    onClick={() => {
                      aoDuplicarNo();
                      setErroFormulario("");
                    }}
                    type="button"
                  >
                    Duplicar item
                  </button>
                ) : null}
                {permiteRemover ? (
                  <button
                    className="rounded-full border border-[color:rgba(180,35,24,0.28)] bg-[color:rgba(180,35,24,0.08)] px-4 py-2 text-sm font-semibold text-[color:var(--cor-perigo)] transition hover:bg-[color:rgba(180,35,24,0.14)]"
                    onClick={() => {
                      aoRemoverNo();
                      setErroFormulario("");
                    }}
                    type="button"
                  >
                    {noEditavel.tipoPai === "array" ? "Remover item" : "Remover propriedade"}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

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
                const novoValor = interpretarValorEditado(
                  noEditavel,
                  valorEditado,
                  formatoDocumento,
                );
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
