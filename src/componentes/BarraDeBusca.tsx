export interface PropsBarraDeBusca {
  termoBusca: string;
  totalResultados: number;
  indiceResultadoAtual: number;
  aoAlterarTermoBusca: (valor: string) => void;
  aoIrParaResultadoAnterior: () => void;
  aoIrParaProximoResultado: () => void;
}

function classeBotaoNavegacao(disabled: boolean) {
  return [
    "inline-flex h-11 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition",
    disabled
      ? "cursor-not-allowed border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] text-[color:var(--cor-texto-suave)] opacity-50"
      : "border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] text-[color:var(--cor-texto)] hover:border-[color:var(--cor-borda-forte)] hover:bg-[color:var(--cor-destaque-suave)]",
  ].join(" ");
}

export function BarraDeBusca({
  termoBusca,
  totalResultados,
  indiceResultadoAtual,
  aoAlterarTermoBusca,
  aoIrParaResultadoAnterior,
  aoIrParaProximoResultado,
}: PropsBarraDeBusca) {
  const buscaAtiva = termoBusca.trim().length > 0;
  const semResultados = totalResultados === 0;
  const contador = semResultados ? "0 de 0" : `${indiceResultadoAtual + 1} de ${totalResultados}`;

  return (
    <div className="painel-vidro flex flex-col gap-3 rounded-[28px] border border-[color:var(--cor-borda)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--cor-texto-suave)]">
            Busca
          </p>
          <h2 className="text-lg font-semibold text-[color:var(--cor-texto)]">
            Encontre chaves e valores em qualquer visualizacao
          </h2>
        </div>
        <div className="rounded-full border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] px-4 py-2 text-sm text-[color:var(--cor-texto-suave)]">
          {contador}
        </div>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row">
        <input
          className="h-12 flex-1 rounded-2xl border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] px-4 text-[color:var(--cor-texto)] outline-none transition placeholder:text-[color:var(--cor-texto-suave)] focus:border-[color:var(--cor-destaque)]"
          onChange={(evento) => aoAlterarTermoBusca(evento.target.value)}
          placeholder="Busque por chave, valor ou tipo..."
          type="search"
          value={termoBusca}
        />
        <div className="flex gap-2">
          <button
            className={classeBotaoNavegacao(!buscaAtiva || semResultados)}
            disabled={!buscaAtiva || semResultados}
            onClick={aoIrParaResultadoAnterior}
            type="button"
          >
            Anterior
          </button>
          <button
            className={classeBotaoNavegacao(!buscaAtiva || semResultados)}
            disabled={!buscaAtiva || semResultados}
            onClick={aoIrParaProximoResultado}
            type="button"
          >
            Proximo
          </button>
        </div>
      </div>
    </div>
  );
}
