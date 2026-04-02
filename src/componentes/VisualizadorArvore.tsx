import { useEffect, useMemo, useRef } from "react";
import type { NoJson } from "../tipos/json";
import { marcarTrechos } from "../utilitarios/busca";

export interface PropsVisualizadorArvore {
  raiz: NoJson | null;
  nosExpandidos: Set<string>;
  idsCorrespondentes: Set<string>;
  idsAncestres: Set<string>;
  resultadoAtualId?: string;
  termoBusca: string;
  aoAlternarExpansao: (id: string) => void;
  aoEditarNo: (no: NoJson) => void;
}

function IconeTipoNo({ tipo }: { tipo: NoJson["tipo"] }) {
  const rotulos: Record<NoJson["tipo"], string> = {
    object: "{}",
    array: "[]",
    string: '""',
    number: "123",
    boolean: "T/F",
    null: "null",
  };

  return (
    <span className="inline-flex min-w-11 items-center justify-center rounded-full border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] px-2 py-1 text-[10px] font-bold tracking-[0.14em] text-[color:var(--cor-texto-suave)]">
      {rotulos[tipo]}
    </span>
  );
}

function TextoMarcado({ texto, termoBusca }: { texto: string; termoBusca: string }) {
  const partes = useMemo(() => marcarTrechos(texto, termoBusca), [texto, termoBusca]);

  return (
    <>
      {partes.map((parte, indice) =>
        parte.destacado ? (
          <mark
            className="rounded-md bg-[color:var(--cor-destaque)] px-1 text-white"
            key={`${parte.texto}-${indice}`}
          >
            {parte.texto}
          </mark>
        ) : (
          <span key={`${parte.texto}-${indice}`}>{parte.texto}</span>
        ),
      )}
    </>
  );
}

interface PropsItemArvore {
  no: NoJson;
  nosExpandidos: Set<string>;
  idsCorrespondentes: Set<string>;
  idsAncestres: Set<string>;
  resultadoAtualId?: string;
  termoBusca: string;
  aoAlternarExpansao: (id: string) => void;
  aoEditarNo: (no: NoJson) => void;
}

function ItemArvore({
  no,
  nosExpandidos,
  idsCorrespondentes,
  idsAncestres,
  resultadoAtualId,
  termoBusca,
  aoAlternarExpansao,
  aoEditarNo,
}: PropsItemArvore) {
  const expansivel = no.filhos.length > 0;
  const expandido = !expansivel || nosExpandidos.has(no.id);
  const correspondeBusca = idsCorrespondentes.has(no.id);
  const relacionadoBusca = correspondeBusca || idsAncestres.has(no.id) || !termoBusca.trim();

  return (
    <div className="space-y-2" data-no-id={no.id}>
      <div
        className={`group flex items-center gap-3 rounded-[22px] border px-3 py-2 transition ${
          resultadoAtualId === no.id
            ? "border-[color:var(--cor-destaque)] bg-[color:var(--cor-destaque-suave)] shadow-lg shadow-[color:var(--cor-destaque-suave)]"
            : "border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)]"
        } ${relacionadoBusca ? "opacity-100" : "opacity-45"}`}
        style={{ marginLeft: `${no.profundidade * 16}px` }}
      >
        <button
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold ${
            expansivel
              ? "border-[color:var(--cor-borda)] text-[color:var(--cor-texto)] hover:bg-[color:var(--cor-destaque-suave)]"
              : "cursor-default border-transparent text-[color:var(--cor-texto-suave)]"
          }`}
          disabled={!expansivel}
          onClick={() => aoAlternarExpansao(no.id)}
          type="button"
        >
          {expansivel ? (expandido ? "-" : "+") : "·"}
        </button>

        <IconeTipoNo tipo={no.tipo} />

        <button
          className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
          onClick={() => aoEditarNo(no)}
          type="button"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[color:var(--cor-texto)]">
              <TextoMarcado
                termoBusca={termoBusca}
                texto={no.chave === "raiz" ? "raiz" : no.chave}
              />
            </p>
            <p className="truncate text-xs text-[color:var(--cor-texto-suave)]">
              <TextoMarcado termoBusca={termoBusca} texto={no.resumoValor} />
            </p>
          </div>
          {correspondeBusca ? (
            <span className="rounded-full bg-[color:var(--cor-destaque)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
              Match
            </span>
          ) : null}
        </button>
      </div>

      {expansivel && expandido ? (
        <div className="space-y-2">
          {no.filhos.map((filho) => (
            <ItemArvore
              aoAlternarExpansao={aoAlternarExpansao}
              aoEditarNo={aoEditarNo}
              idsAncestres={idsAncestres}
              idsCorrespondentes={idsCorrespondentes}
              key={filho.id}
              no={filho}
              nosExpandidos={nosExpandidos}
              resultadoAtualId={resultadoAtualId}
              termoBusca={termoBusca}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function VisualizadorArvore({
  raiz,
  nosExpandidos,
  idsCorrespondentes,
  idsAncestres,
  resultadoAtualId,
  termoBusca,
  aoAlternarExpansao,
  aoEditarNo,
}: PropsVisualizadorArvore) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!resultadoAtualId || !containerRef.current) {
      return;
    }

    const elemento = containerRef.current.querySelector<HTMLElement>(
      `[data-no-id="${resultadoAtualId}"]`,
    );

    elemento?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
  }, [resultadoAtualId]);

  if (!raiz) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-[30px] border border-dashed border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] p-8 text-center text-[color:var(--cor-texto-suave)]">
        Corrija o JSON para liberar a visualizacao em arvore.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[420px] flex-col rounded-[30px] border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)]">
      <div className="border-b border-[color:var(--cor-borda)] px-5 py-4">
        <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--cor-texto-suave)]">
          Visualizador
        </p>
        <h2 className="text-xl font-semibold text-[color:var(--cor-texto)]">Modo Arvore</h2>
      </div>
      <div className="flex-1 overflow-auto px-4 py-4" ref={containerRef}>
        <ItemArvore
          aoAlternarExpansao={aoAlternarExpansao}
          aoEditarNo={aoEditarNo}
          idsAncestres={idsAncestres}
          idsCorrespondentes={idsCorrespondentes}
          no={raiz}
          nosExpandidos={nosExpandidos}
          resultadoAtualId={resultadoAtualId}
          termoBusca={termoBusca}
        />
      </div>
    </div>
  );
}
