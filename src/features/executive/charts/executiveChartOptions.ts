import type { EChartsOption } from 'echarts';
import type { RankingItem } from '@/types/logistics';
import { formatCurrency } from '@/utils/formatters';

const textColor = '#cbd5e1';
const grid = { left: 52, right: 28, top: 34, bottom: 42 };

export const revenueCostComboOption = (data: RankingItem[]): EChartsOption => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  legend: { textStyle: { color: textColor } },
  grid,
  xAxis: { type: 'category', data: data.map((item) => item.label), axisLabel: { color: textColor } },
  yAxis: { type: 'value', axisLabel: { color: textColor, formatter: (value: number) => formatCurrency(value) } },
  series: [
    {
      name: 'Receita',
      type: 'bar',
      data: data.map((item) => item.value),
      itemStyle: { color: '#65b7ff', borderRadius: 8 },
    },
    {
      name: 'Custo logístico',
      type: 'line',
      smooth: true,
      data: data.map((item) => item.secondary ?? 0),
      lineStyle: { color: '#f4b860', width: 3 },
      symbolSize: 8,
    },
  ],
});
