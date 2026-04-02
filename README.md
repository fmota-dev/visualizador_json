# Documentacao Tecnica

## Visao geral
`Explorador de Estruturas | fmota` e uma aplicacao frontend para explorar, comparar, editar e exportar estruturas de dados usadas no dia a dia de desenvolvimento de APIs e integrações.

O projeto foi construído com foco em:

- leitura de estruturas complexas
- comparacao visual entre versoes de um mesmo documento
- edicao bidirecional entre texto bruto e visualizacao estruturada
- suporte a multiplos formatos sem perder o formato original no editor

## Stack
- `React 19`
- `TypeScript`
- `Vite`
- `Tailwind CSS 4`
- `@xyflow/react` para visualizacao em grafo
- `@monaco-editor/react` para editor e diff textual
- `fast-xml-parser` para `XML`
- `yaml` para `YAML`
- `@iarna/toml` para `TOML`
- `papaparse` para `CSV`
- `html-to-image` para exportacao

## Formatos suportados
- `JSON`
- `YAML`
- `TOML`
- `XML`
- `CSV`

### Regra importante de comparacao
O modo `Comparar` funciona apenas entre documentos do mesmo formato:

- `JSON x JSON`
- `YAML x YAML`
- `TOML x TOML`
- `XML x XML`
- `CSV x CSV`

Quando os formatos nao batem, a interface trata o estado como formato invalido.

## Principais funcionalidades

### Exploracao
- visualizacao em arvore
- visualizacao em grafo para formatos estruturados
- visualizacao em tabela para `CSV`
- busca por chave, valor, caminho e tipo
- breadcrumb do no em foco

### Comparacao
- diff textual com `DiffEditor`
- comparacao em arvore
- comparacao em grafo
- comparacao em tabela para `CSV`
- rótulos `Original` e `Modificado`
- scroll sincronizado entre os editores no modo comparar

### Edicao
- edicao direta no Monaco
- edicao visual por no
- operacoes estruturais em objetos e arrays
- atualizacao do texto bruto apos edicao visual

### Exportacao
- exportacao do grafo em `PNG`
- exportacao do grafo em `SVG`

## Arquitetura

### Estado central
O arquivo [src/App.tsx](/c:/Users/fmota/Desktop/visualizar_json/src/App.tsx) concentra o estado principal da aplicacao:

- documento bruto atual
- documento bruto original
- formato atual e formato original
- modo de exploracao e comparacao
- no selecionado
- expansao de nos
- largura do editor
- altura do painel original no comparar
- tema
- configuracoes de layout do grafo

### Hooks principais
- [src/hooks/useDocumentoParseado.ts](/c:/Users/fmota/Desktop/visualizar_json/src/hooks/useDocumentoParseado.ts)
  Responsavel por parsear o documento bruto conforme o formato selecionado e devolver estrutura, erro e metadados de tabela.

- [src/hooks/useBuscaJson.ts](/c:/Users/fmota/Desktop/visualizar_json/src/hooks/useBuscaJson.ts)
  Responsavel por indexar a arvore e localizar resultados de busca.

- [src/hooks/usePersistenciaWorkspace.ts](/c:/Users/fmota/Desktop/visualizar_json/src/hooks/usePersistenciaWorkspace.ts)
  Persiste no `localStorage` o workspace do usuario, incluindo tema, modo, formatos, largura do editor e configuracoes de comparacao.

### Utilitarios principais
- [src/utilitarios/documentos.ts](/c:/Users/fmota/Desktop/visualizar_json/src/utilitarios/documentos.ts)
  Camada de parse, serializacao e deteccao de formato por conteudo e por nome de arquivo.

- [src/utilitarios/json.ts](/c:/Users/fmota/Desktop/visualizar_json/src/utilitarios/json.ts)
  Funcoes de arvore, caminhos, ids, serializacao e edicao estrutural.

- [src/utilitarios/comparacao.ts](/c:/Users/fmota/Desktop/visualizar_json/src/utilitarios/comparacao.ts)
  Responsavel pelo diff estrutural entre `Original` e `Modificado`.

## Componentes principais
- [src/componentes/EditorJson.tsx](/c:/Users/fmota/Desktop/visualizar_json/src/componentes/EditorJson.tsx)
  Editor Monaco com upload, erro em tempo real, auto-deteccao ao colar e acoes locais.

- [src/componentes/PainelVisualizador.tsx](/c:/Users/fmota/Desktop/visualizar_json/src/componentes/PainelVisualizador.tsx)
  Shell do visualizador. Controla arvore, grafo, tabela, comparacao e diff textual.

- [src/componentes/VisualizadorArvore.tsx](/c:/Users/fmota/Desktop/visualizar_json/src/componentes/VisualizadorArvore.tsx)
  Exibe o documento em estrutura hierarquica colapsavel.

- [src/componentes/VisualizadorGrafo.tsx](/c:/Users/fmota/Desktop/visualizar_json/src/componentes/VisualizadorGrafo.tsx)
  Exibe o documento em layout de grafo com zoom, minimapa e exportacao.

- [src/componentes/VisualizadorTabela.tsx](/c:/Users/fmota/Desktop/visualizar_json/src/componentes/VisualizadorTabela.tsx)
  Exibe `CSV` como tabela.

- [src/componentes/ModalNo.tsx](/c:/Users/fmota/Desktop/visualizar_json/src/componentes/ModalNo.tsx)
  Permite editar o valor de um no e realizar operacoes estruturais.

## Fluxos tecnicos importantes

### Parse e visualizacao
1. O usuario edita ou carrega o texto bruto.
2. O formato atual determina o adaptador usado no parse.
3. O resultado parseado e transformado em estrutura comum.
4. A mesma estrutura alimenta busca, arvore, grafo, tabela e diff.

### Auto-deteccao ao colar
A auto-deteccao acontece no evento de `paste` do Monaco.

Regras atuais:
- tenta identificar o formato pelo conteudo
- prioriza o formato atual quando o conteudo claramente parece `JSON` e o editor ja esta em `JSON`
- `XML` so e aceito se passar pela validacao formal do `XMLValidator`

### Comparacao
1. `Original` e `Modificado` compartilham o mesmo formato.
2. O diff textual usa o `DiffEditor` do Monaco.
3. O diff estrutural usa a arvore parseada dos dois lados.
4. No modo comparar, o fallback manual de formato fica disponivel por um seletor compartilhado.

### Scroll sincronizado dos editores
No comparar, os dois editores Monaco podem rolar juntos.

Implementacao atual:
- o estado fica em [src/App.tsx](/c:/Users/fmota/Desktop/visualizar_json/src/App.tsx)
- o comportamento e ativado apenas quando os dois editores do layout desktop estao visiveis
- o usuario pode alternar entre scroll sincronizado e livre

## Persistencia local
O workspace e salvo no `localStorage` com chave versionada.

Persistido atualmente:
- documento atual
- documento original
- formatos
- tema
- modo de visualizacao
- modo de comparacao
- busca
- expansoes
- largura do editor
- minimapa
- layout do grafo
- scroll sincronizado dos editores

## Decisoes de UX
- comparacao restrita ao mesmo formato para evitar diff enganoso entre contratos diferentes
- seletor unico de formato no comparar para manter o par `Original/Modificado` alinhado
- scroll sincronizado no diff textual do visualizador
- scroll sincronizado opcional nos editores do comparar
- destaque de linha ativa no diff textual

## Limitacoes atuais
- o parser `@iarna/toml` ainda gera warning de build relacionado a `stream` e `eval`, embora a aplicacao funcione no browser
- as capturas de Playwright sao artefatos locais e nao fazem parte do build
- o scroll sincronizado dos editores esta focado no layout desktop

## Como executar localmente
```bash
npm install --legacy-peer-deps
npm run dev
```

## Como validar localmente
```bash
npm run lint
npm run build
```

## Proximos passos recomendados
- substituir o parser atual de `TOML` por uma opcao mais amigavel para browser
- adicionar testes automatizados de fluxos criticos com Playwright
- melhorar a estrategia de code splitting do Monaco e do grafo
- adicionar deploy automatizado para GitHub Pages
