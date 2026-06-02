# Logistic Intelligence Center

Dashboard executivo de inteligência logística financeira operacional, focado em custo logístico, eficiência operacional, resultado logístico e análise financeira da operação logística.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- Framer Motion
- Apache ECharts
- TanStack Table + TanStack Virtual
- Zustand
- ESLint + Prettier

## Como executar

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run build
npm run lint
npm run format
```

## Arquitetura

A aplicação segue arquitetura feature-based em `src/features`, com separação entre UI, regras de negócio, transformação, agregação e acesso a dados.

Dados iniciais ficam em `src/mock-data/invoices.json`. A camada `src/services` já separa repositório, adapter e mapper para futura integração REST API.

## Regras financeiras implementadas

- Frete/Kg Bruto: `(Vlr CTE1 + Vlr CTE2 + Valor Adicional) / Peso Bruto`
- Frete/Kg Líquido: `(Vlr CTE1 + Vlr CTE2 + Valor Adicional) / Peso Líquido`
- Custo Transporte: `CTE1 + CTE2 + despesas acessórias`
- Custo Operacional: `Armazenagem + Movimentação`
- Custo Logístico Total: `Transporte + Operacional`
- Resultado Logístico: `Receita - Custo Logístico Total`
- Índice Logístico: `Custo Logístico Total / Receita`
