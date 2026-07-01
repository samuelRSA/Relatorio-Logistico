import type { EChartsOption } from 'echarts';
import type { CustomerOperationalCost, RankingItem } from '@/types/logistics';
import { formatCurrency, formatDecimal, formatPercent } from '@/utils/formatters';

const textColor = '#cbd5e1';

const formatCompetenceLabel = (competence: string): string => {
  const [year, month] = competence.split('-').map(Number);
  if (!year || !month) {
    return competence;
  }

  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    .format(new Date(year, month - 1, 1))
    .replace('.', '');

  return `${monthLabel.charAt(0).toUpperCase()}${monthLabel.slice(1)}/${String(year).slice(-2)}`;
};

export const operationalCompositionOption = (storage: number, handling: number, transfer: number): EChartsOption => {
  const total = storage + handling + transfer;

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const item = params as { name?: string; value?: number };
        const value = Number(item.value ?? 0);
        return [
          `<strong>${item.name ?? ''}</strong>`,
          `Valor: ${formatCurrency(value)}`,
          `Participação no Custo Operacional: ${formatPercent(total === 0 ? 0 : value / total)}`,
        ].join('<br/>');
      },
    },
    legend: { bottom: 0, textStyle: { color: textColor } },
    series: [
      {
        type: 'pie',
        radius: ['48%', '72%'],
        data: [
          { name: 'Armazenagem', value: storage, itemStyle: { color: '#65b7ff' } },
          { name: 'Movimentação', value: handling, itemStyle: { color: '#f4b860' } },
          { name: 'Transferência', value: transfer, itemStyle: { color: '#6ee7b7' } },
        ],
        label: { color: textColor, formatter: (params: { value?: unknown }) => formatCurrency(Number(params.value)) },
      },
    ],
  };
};

export const operationalEvolutionOption = (data: RankingItem[]): EChartsOption => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(10, 14, 23, 0.94)',
    borderColor: 'rgba(110, 231, 183, 0.28)',
    borderWidth: 1,
    padding: [10, 12],
    textStyle: { color: textColor },
    formatter: (params) => {
      const point = params as { dataIndex?: number };
      const index = Number(point.dataIndex ?? 0);
      const item = data[index];

      if (!item) {
        return '';
      }

      return [
        `<strong>Compet\u00eancia: ${formatCompetenceLabel(item.label)}</strong>`,
        `<span style="color:#6ee7b7;font-weight:700">Custo Operacional: ${formatCurrency(item.value)}</span>`,
      ].join('<br />');
    },
  },
  grid: { left: 74, right: 34, top: 48, bottom: 42 },
  xAxis: {
    type: 'category',
    data: data.map((item) => item.label),
    axisLabel: { color: textColor, formatter: (value: string) => formatCompetenceLabel(value) },
    axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.24)' } },
    axisTick: { show: false },
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: textColor, formatter: (value: number) => formatCurrency(value) },
    splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.09)' } },
  },
  series: [
    {
      type: 'line',
      smooth: true,
      showSymbol: true,
      symbol: 'circle',
      symbolSize: 10,
      data: data.map((item) => item.value),
      lineStyle: { color: '#6ee7b7', width: 3.5 },
      itemStyle: { color: '#6ee7b7', borderColor: '#0f172a', borderWidth: 2.5 },
      label: {
        show: true,
        position: 'top',
        distance: 10,
        color: '#d1fae5',
        fontSize: 11,
        fontWeight: 700,
        formatter: (params: unknown) => formatCurrency(Number((params as { value?: number }).value ?? 0)),
      },
      labelLayout: { hideOverlap: true },
      emphasis: {
        scale: 1.25,
        lineStyle: { width: 4.5 },
      },
      areaStyle: { color: 'rgba(110, 231, 183, 0.14)' },
    },
  ],
});
export const operationalRankingOption = (data: CustomerOperationalCost[]): EChartsOption => {
  const items = data
    .slice()
    .sort((a, b) => b.totalOperationalCost - a.totalOperationalCost)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      displayName: `${index + 1}º ${item.customer}`,
    }));

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const item = items[(params as { dataIndex: number }).dataIndex];
        const pesoMedio = item.invoiceCount === 0 ? 0 : item.operationalGrossWeight / item.invoiceCount;
        return [
          `Ranking: ${item.rank}º`,
          `<strong>${item.customer}</strong>`,
          `Custo Operacional Total: ${formatCurrency(item.totalOperationalCost)}`,
          `Kg Movimentado: ${formatDecimal(item.operationalGrossWeight)}`,
          `Custo Operacional/Kg: ${formatCurrency(item.operationalCostPerKg)}`,
          `Quantidade NF: ${formatDecimal(item.invoiceCount)}`,
          `Peso médio por NF: ${formatDecimal(pesoMedio)}`,
          `C. Armazenagem: ${formatCurrency(item.storage)}`,
          `C. Movimentação: ${formatCurrency(item.handling)}`,
          `C. Transferência: ${formatCurrency(item.transfer)}`,
          `Participação no Custo Operacional Total: ${formatPercent(item.participation)}`,
        ].join('<br/>');
      },
    },
    grid: { left: 240, right: 34, top: 24, bottom: 28 },
    xAxis: { type: 'value', axisLabel: { color: textColor, formatter: (value: number) => formatCurrency(value) } },
    yAxis: {
      type: 'category',
      data: items.map((item) => item.displayName),
      inverse: true,
      axisLabel: {
        color: textColor,
        width: 200,
        overflow: 'truncate',
      },
    },
    series: [
      {
        type: 'bar',
        data: items.map((item) => item.totalOperationalCost),
        itemStyle: { color: '#6ee7b7', borderRadius: 8 },
        label: {
          show: true,
          position: 'right',
          color: textColor,
          formatter: (params: unknown) => formatCurrency(Number((params as { value: number }).value)),
        },
      },
    ],
  };
};
