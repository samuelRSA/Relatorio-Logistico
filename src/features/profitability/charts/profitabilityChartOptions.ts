import type { EChartsOption } from 'echarts';
import type { QuadrantPoint, RankingItem } from '@/types/logistics';
import { formatCurrency, formatPercent } from '@/utils/formatters';

const textColor = '#cbd5e1';

export const paretoCustomersOption = (data: RankingItem[]): EChartsOption => {
  const total = data.reduce((sum, item) => sum + Math.max(item.value, 0), 0);
  let cumulative = 0;
  const positiveData = data.map((item) => {
    cumulative += Math.max(item.value, 0);
    return { ...item, secondary: total === 0 ? 0 : cumulative / total };
  });

  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { textStyle: { color: textColor } },
    grid: { left: 150, right: 48, top: 40, bottom: 42 },
    xAxis: { type: 'category', data: positiveData.map((item) => item.label), axisLabel: { color: textColor, rotate: 28 } },
    yAxis: [
      { type: 'value', axisLabel: { color: textColor, formatter: (value: number) => formatCurrency(value) } },
      { type: 'value', axisLabel: { color: textColor, formatter: (value: number) => formatPercent(value) } },
    ],
    series: [
      { name: 'Custo logÌstico', type: 'bar', data: positiveData.map((item) => item.value), itemStyle: { color: '#65b7ff', borderRadius: 8 } },
      { name: 'Pareto', type: 'line', yAxisIndex: 1, smooth: true, data: positiveData.map((item) => item.secondary), lineStyle: { color: '#f4b860', width: 3 } },
    ],
  };
};

export const profitabilityQuadrantOption = (data: QuadrantPoint[]): EChartsOption => {
  const avgRevenue = data.reduce((sum, item) => sum + item.revenue, 0) / Math.max(data.length, 1);
  const avgIndex = data.reduce((sum, item) => sum + item.logisticsIndex, 0) / Math.max(data.length, 1);

  return {
    backgroundColor: 'transparent',
    tooltip: {
      formatter: (params: unknown) => {
        const value = (params as { value: [number, number, string, number] }).value;
        return `${value[2]}<br/>Receita: ${formatCurrency(value[0])}<br/>√çndice: ${formatPercent(value[1])}<br/>Custo logÌstico: ${formatCurrency(value[3])}`;
      },
    },
    grid: { left: 72, right: 42, top: 36, bottom: 58 },
    xAxis: {
      type: 'value',
      name: 'Receita',
      axisLabel: { color: textColor, formatter: (value: number) => formatCurrency(value) },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
    },
    yAxis: {
      type: 'value',
      name: '√çndice log√≠stico',
      axisLabel: { color: textColor, formatter: (value: number) => formatPercent(value) },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
    },
    graphic: [
      { type: 'text', left: '55%', top: '16%', style: { text: 'Alta Receita + Alto Custo', fill: '#ff7a7a', fontSize: 12 } },
      { type: 'text', left: '55%', top: '80%', style: { text: 'Alta Receita + Baixo Custo', fill: '#6ee7b7', fontSize: 12 } },
      { type: 'text', left: '12%', top: '16%', style: { text: 'Baixa Receita + Alto Custo', fill: '#f4b860', fontSize: 12 } },
      { type: 'text', left: '12%', top: '80%', style: { text: 'Baixa Receita + Baixo Custo', fill: '#65b7ff', fontSize: 12 } },
    ],
    series: [
      {
        type: 'scatter',
        symbolSize: (value: unknown) => Math.max(12, Math.min(34, Number((value as number[])[3]) / 5000)),
        data: data.map((item) => [item.revenue, item.logisticsIndex, item.customer, item.totalLogisticsCost]),
        markLine: {
          silent: true,
          lineStyle: { color: 'rgba(255,255,255,0.3)', type: 'dashed' },
          data: [{ xAxis: avgRevenue }, { yAxis: avgIndex }],
        },
        itemStyle: { color: '#65b7ff' },
      },
    ],
  };
};
