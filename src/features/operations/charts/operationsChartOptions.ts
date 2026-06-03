import type { EChartsOption } from 'echarts';
import type { RankingItem } from '@/types/logistics';
import { formatCurrency } from '@/utils/formatters';

const textColor = '#cbd5e1';

export const operationalCompositionOption = (storage: number, handling: number, transfer: number): EChartsOption => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'item' },
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
});

export const operationalEvolutionOption = (data: RankingItem[]): EChartsOption => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: 58, right: 28, top: 28, bottom: 42 },
  xAxis: { type: 'category', data: data.map((item) => item.label), axisLabel: { color: textColor } },
  yAxis: { type: 'value', axisLabel: { color: textColor, formatter: (value: number) => formatCurrency(value) } },
  series: [{ type: 'line', smooth: true, data: data.map((item) => item.value), lineStyle: { color: '#6ee7b7', width: 3 }, areaStyle: { color: 'rgba(110, 231, 183, 0.14)' } }],
});

export const operationalRankingOption = (data: RankingItem[]): EChartsOption => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: 170, right: 34, top: 24, bottom: 28 },
  xAxis: { type: 'value', axisLabel: { color: textColor, formatter: (value: number) => formatCurrency(value) } },
  yAxis: { type: 'category', data: data.map((item) => item.label).reverse(), axisLabel: { color: textColor } },
  series: [{ type: 'bar', data: data.map((item) => item.value).reverse(), itemStyle: { color: '#6ee7b7', borderRadius: 8 } }],
});
