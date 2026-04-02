import Editor from "@monaco-editor/react";
import { useRef } from "react";
import type { ErroJson } from "../tipos/json";

export interface PropsEditorJson {
  jsonBruto: string;
  temaAplicacao: "claro" | "escuro";
  erroJson: ErroJson | null;
  recolhido: boolean;
  legenda?: string;
  titulo?: string;
  classeContainer?: string;
  usarAlturaCompleta?: boolean;
  mostrarBotaoRecolher?: boolean;
  rotuloUpload?: string;
  rotuloRecolher?: string;
  aoAlterarJsonBruto: (valor: string) => void;
  aoCarregarArquivo: (arquivo: File) => void;
  aoAlternarEditor?: () => void;
}

function IconeUpload() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 15V4.5M12 4.5l-3.8 3.8M12 4.5l3.8 3.8M4 16.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconeRecolher() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M4 5.5h16M4 18.5h16M8.5 12H19M8.5 12l3-3M8.5 12l3 3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function classeBotaoAcaoCompacta() {
  return "inline-flex items-center gap-2 rounded-[18px] border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-painel)] px-3 py-2 text-sm font-medium text-[color:var(--cor-texto)] transition hover:border-[color:var(--cor-borda-forte)] hover:bg-[color:var(--cor-destaque-suave)]";
}

export function EditorJson({
  jsonBruto,
  temaAplicacao,
  erroJson,
  recolhido,
  legenda = "Editor",
  titulo = "JSON",
  classeContainer = "",
  usarAlturaCompleta = true,
  mostrarBotaoRecolher = true,
  rotuloUpload = "Upload",
  rotuloRecolher = "Recolher",
  aoAlterarJsonBruto,
  aoCarregarArquivo,
  aoAlternarEditor,
}: PropsEditorJson) {
  const inputArquivoRef = useRef<HTMLInputElement>(null);

  if (recolhido) {
    return null;
  }

  return (
    <section
      className={`painel-vidro flex w-full flex-col gap-3 rounded-[30px] border border-[color:var(--cor-borda)] p-4 ${
        usarAlturaCompleta
          ? "h-[calc(100dvh-1.5rem)] min-h-[520px] sm:h-[calc(100dvh-2rem)]"
          : "h-full min-h-0"
      } ${classeContainer}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--cor-texto-suave)]">
            {legenda}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[color:var(--cor-texto)]">{titulo}</h2>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              erroJson
                ? "bg-[color:rgba(180,35,24,0.12)] text-[color:var(--cor-perigo)]"
                : "bg-[color:rgba(15,118,110,0.14)] text-[color:var(--cor-acao-secundaria)]"
            }`}
          >
            {erroJson ? "JSON invalido" : "JSON valido"}
          </span>

          <div className="flex flex-wrap items-center gap-2 rounded-[22px] border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] px-2 py-2">
            <button
              aria-label="Enviar arquivo JSON"
              className={classeBotaoAcaoCompacta()}
              onClick={() => inputArquivoRef.current?.click()}
              title="Upload do arquivo JSON"
              type="button"
            >
              <IconeUpload />
              <span>{rotuloUpload}</span>
            </button>

            {mostrarBotaoRecolher && aoAlternarEditor ? (
              <button
                aria-label={rotuloRecolher}
                className={classeBotaoAcaoCompacta()}
                onClick={aoAlternarEditor}
                title={rotuloRecolher}
                type="button"
              >
                <IconeRecolher />
                <span>{rotuloRecolher}</span>
              </button>
            ) : null}
          </div>
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

      <div className="min-h-0 flex-1 overflow-hidden rounded-[24px] border border-[color:var(--cor-borda)]">
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

      {erroJson ? (
        <div className="min-h-14 rounded-[22px] border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-painel)] px-4 py-3">
          <div className="space-y-1 text-sm text-[color:var(--cor-perigo)]">
            <p className="font-semibold">
              Erro na linha {erroJson.linha}, coluna {erroJson.coluna}
            </p>
            <p className="text-[color:var(--cor-texto-suave)]">{erroJson.mensagem}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
