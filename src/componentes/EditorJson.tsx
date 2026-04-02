import Editor from "@monaco-editor/react";
import { useRef } from "react";
import type { ErroJson, TemaAplicacao } from "../tipos/json";

export interface PropsEditorJson {
  jsonBruto: string;
  temaAplicacao: TemaAplicacao;
  erroJson: ErroJson | null;
  aoAlterarJsonBruto: (valor: string) => void;
  aoCarregarArquivo: (arquivo: File) => void;
}

export function EditorJson({
  jsonBruto,
  temaAplicacao,
  erroJson,
  aoAlterarJsonBruto,
  aoCarregarArquivo,
}: PropsEditorJson) {
  const inputArquivoRef = useRef<HTMLInputElement>(null);

  return (
    <section className="flex h-full min-h-[420px] flex-col gap-4 rounded-[30px] border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--cor-texto-suave)]">
            Entrada
          </p>
          <h2 className="text-xl font-semibold text-[color:var(--cor-texto)]">
            Editor JSON
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              erroJson
                ? "bg-[color:rgba(180,35,24,0.12)] text-[color:var(--cor-perigo)]"
                : "bg-[color:rgba(15,118,110,0.14)] text-[color:var(--cor-acao-secundaria)]"
            }`}
          >
            {erroJson ? "JSON invalido" : "JSON valido"}
          </span>
          <button
            className="rounded-full border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-painel)] px-4 py-2 text-sm font-medium text-[color:var(--cor-texto)] transition hover:border-[color:var(--cor-borda-forte)] hover:bg-[color:var(--cor-destaque-suave)]"
            onClick={() => inputArquivoRef.current?.click()}
            type="button"
          >
            Upload .json
          </button>
          <input
            accept=".json,application/json"
            className="hidden"
            onChange={(evento) => {
              const arquivo = evento.target.files?.[0];
              if (arquivo) {
                aoCarregarArquivo(arquivo);
              }
              evento.target.value = "";
            }}
            ref={inputArquivoRef}
            type="file"
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-[24px] border border-[color:var(--cor-borda)]">
        <Editor
          defaultLanguage="json"
          onChange={(valor) => aoAlterarJsonBruto(valor ?? "")}
          options={{
            automaticLayout: true,
            fontSize: 14,
            minimap: { enabled: false },
            padding: { top: 18, bottom: 18 },
            scrollBeyondLastLine: false,
            wordWrap: "on",
          }}
          theme={temaAplicacao === "escuro" ? "vs-dark" : "light"}
          value={jsonBruto}
        />
      </div>

      <div className="min-h-14 rounded-[22px] border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-painel)] px-4 py-3">
        {erroJson ? (
          <div className="space-y-1 text-sm text-[color:var(--cor-perigo)]">
            <p className="font-semibold">
              Erro na linha {erroJson.linha}, coluna {erroJson.coluna}
            </p>
            <p className="text-[color:var(--cor-texto-suave)]">{erroJson.mensagem}</p>
          </div>
        ) : (
          <p className="text-sm text-[color:var(--cor-texto-suave)]">
            Altere o codigo livremente ou clique em um no para editar o valor sem sair da
            visualizacao.
          </p>
        )}
      </div>
    </section>
  );
}
