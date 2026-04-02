import type { MetadadosTabelaCsv, NoJson, StatusDiferencaNo } from "../tipos/json";
import { criarIdNo, encontrarNoPorId } from "../utilitarios/json";

export interface PropsVisualizadorTabela {
  raiz: NoJson | null;
  metadadosTabela: MetadadosTabelaCsv | null;
  idsCorrespondentes: Set<string>;
  resultadoAtualId?: string;
  noAtivoId?: string;
  mapaDiferencas?: Map<string, StatusDiferencaNo>;
  permitirEdicao?: boolean;
  aoSelecionarNo: (no: NoJson) => void;
  aoEditarNo: (no: NoJson) => void;
}

const classesStatusCelula: Record<Exclude<StatusDiferencaNo, "igual">, string> = {
  adicionado:
    "border-[color:rgba(15,118,110,0.34)] bg-[color:rgba(15,118,110,0.12)]",
  removido:
    "border-[color:rgba(180,35,24,0.32)] bg-[color:rgba(180,35,24,0.12)]",
  alterado:
    "border-[color:rgba(199,91,18,0.34)] bg-[color:rgba(199,91,18,0.12)]",
};

function obterClasseCelula(params: {
  statusDiferenca: StatusDiferencaNo;
  correspondeBusca: boolean;
  ativa: boolean;
  focoAtual: boolean;
}) {
  const { statusDiferenca, correspondeBusca, ativa, focoAtual } = params;

  if (focoAtual) {
    return "border-[color:var(--cor-destaque)] bg-[color:var(--cor-destaque-suave)]";
  }

  if (ativa) {
    return "border-[color:var(--cor-borda-forte)] bg-[color:var(--cor-cartao-arvore)]";
  }

  if (statusDiferenca !== "igual") {
    return classesStatusCelula[statusDiferenca];
  }

  if (correspondeBusca) {
    return "border-[color:var(--cor-destaque)] bg-[color:rgba(199,91,18,0.08)]";
  }

  return "border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)]";
}

export function VisualizadorTabela({
  raiz,
  metadadosTabela,
  idsCorrespondentes,
  resultadoAtualId,
  noAtivoId,
  mapaDiferencas,
  permitirEdicao = true,
  aoSelecionarNo,
  aoEditarNo,
}: PropsVisualizadorTabela) {
  if (!metadadosTabela || !raiz) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-[26px] border border-dashed border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)] p-8 text-center text-[color:var(--cor-texto-suave)]">
        Carregue um CSV valido para usar a visualizacao em tabela.
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto rounded-[26px] border border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-elevado)]">
      <table className="min-w-full border-separate border-spacing-0">
        <thead className="sticky top-0 z-10 bg-[color:var(--cor-fundo-painel)]">
          <tr>
            <th className="border-b border-[color:var(--cor-borda)] px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--cor-texto-suave)]">
              Linha
            </th>
            {metadadosTabela.colunas.map((coluna) => (
              <th
                className="border-b border-[color:var(--cor-borda)] px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--cor-texto-suave)]"
                key={coluna}
              >
                {coluna}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metadadosTabela.linhas.map((linha, indiceLinha) => {
            const idLinha = criarIdNo([indiceLinha]);
            const noLinha = encontrarNoPorId(raiz, idLinha);
            const linhaAtiva = noAtivoId === idLinha;
            const linhaEmFoco = resultadoAtualId === idLinha;

            return (
              <tr className="align-top" key={idLinha}>
                <td className="border-b border-[color:var(--cor-borda)] px-3 py-3">
                  <button
                    className={`rounded-full border px-3 py-1 text-sm font-semibold transition ${
                      linhaEmFoco
                        ? "border-[color:var(--cor-destaque)] bg-[color:var(--cor-destaque-suave)] text-[color:var(--cor-texto)]"
                        : linhaAtiva
                          ? "border-[color:var(--cor-borda-forte)] bg-[color:var(--cor-cartao-arvore)] text-[color:var(--cor-texto)]"
                          : "border-[color:var(--cor-borda)] bg-[color:var(--cor-fundo-painel)] text-[color:var(--cor-texto)] hover:border-[color:var(--cor-borda-forte)]"
                    }`}
                    onClick={() => {
                      if (noLinha) {
                        aoSelecionarNo(noLinha);
                      }
                    }}
                    type="button"
                  >
                    {indiceLinha + 1}
                  </button>
                </td>
                {metadadosTabela.colunas.map((coluna) => {
                  const idCelula = criarIdNo([indiceLinha, coluna]);
                  const noCelula = encontrarNoPorId(raiz, idCelula);
                  const statusDiferenca = mapaDiferencas?.get(idCelula) ?? "igual";
                  const correspondeBusca = idsCorrespondentes.has(idCelula);
                  const ativa = noAtivoId === idCelula;
                  const focoAtual = resultadoAtualId === idCelula;

                  return (
                    <td className="border-b border-[color:var(--cor-borda)] px-3 py-3" key={idCelula}>
                      <div
                        className={`flex min-h-16 min-w-40 items-start justify-between gap-3 rounded-[18px] border px-3 py-3 ${obterClasseCelula({
                          statusDiferenca,
                          correspondeBusca,
                          ativa,
                          focoAtual,
                        })}`}
                      >
                        <button
                          className="min-w-0 flex-1 text-left text-sm text-[color:var(--cor-texto)]"
                          onClick={() => {
                            if (noCelula) {
                              aoSelecionarNo(noCelula);
                            }
                          }}
                          type="button"
                        >
                          <span className="block break-words">{linha[coluna] ?? ""}</span>
                        </button>

                        {permitirEdicao && noCelula ? (
                          <button
                            className="shrink-0 rounded-full border border-[color:var(--cor-borda)] px-3 py-1 text-xs font-semibold text-[color:var(--cor-texto)] transition hover:border-[color:var(--cor-borda-forte)] hover:bg-[color:var(--cor-destaque-suave)]"
                            onClick={() => aoEditarNo(noCelula)}
                            type="button"
                          >
                            Editar
                          </button>
                        ) : null}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
