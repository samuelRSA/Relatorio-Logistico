import type { EChartsOption } from 'echarts';
import type { EnrichedInvoice, RankingItem, RouteCost } from '@/types/logistics';
import { formatCurrency } from '@/utils/formatters';

const textColor = '#cbd5e1';

export const heatmapCityCostOption = (data: RouteCost[]): EChartsOption => ({
  backgroundColor: 'transparent',
  tooltip: { formatter: (params: unknown) => `${(params as { name: string }).name}<br/>${formatCurrency(Number((params as { value: number[] }).value[2]))}` },
  grid: { left: 90, right: 28, top: 24, bottom: 48 },
  xAxis: { type: 'category', data: data.map((item) => item.uf), axisLabel: { color: textColor } },
  yAxis: { type: 'category', data: data.map((item) => item.city), axisLabel: { color: textColor } },
  visualMap: { show: false, min: 0, max: Math.max(...data.map((item) => item.cost), 1), inRange: { color: ['#17202c', '#65b7ff', '#ff7a7a'] } },
  series: [
    {
      type: 'heatmap',
      data: data.map((item, index) => [index, index, item.cost]),
      label: { show: true, formatter: (params: unknown) => formatCurrency(Number((params as { value: number[] }).value[2])), color: '#fff' },
    },
  ],
});

export const weightFreightScatterOption = (invoices: EnrichedInvoice[]): EChartsOption => ({
  backgroundColor: 'transparent',
  tooltip: { formatter: (params: unknown) => `${(params as { value: [number, number, string] }).value[2]}<br/>${formatCurrency((params as { value: [number, number, string] }).value[1])}/kg` },
  grid: { left: 58, right: 28, top: 32, bottom: 42 },
  xAxis: { type: 'value', name: 'Peso bruto', axisLabel: { color: textColor } },
  yAxis: { type: 'value', name: 'Frete/Kg', axisLabel: { color: textColor, formatter: (value: number) => formatCurrency(value) } },
  series: [{ type: 'scatter', symbolSize: 14, data: invoices.map((invoice) => [invoice.grossWeight, invoice.grossFreightPerKg, invoice.customer]), itemStyle: { color: '#f4b860' } }],
});

export const routeRankingOption = (data: RankingItem[]): EChartsOption => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: 150, right: 34, top: 24, bottom: 28 },
  xAxis: { type: 'value', axisLabel: { color: textColor, formatter: (value: number) => formatCurrency(value) } },
  yAxis: { type: 'category', data: data.map((item) => item.label).reverse(), axisLabel: { color: textColor } },
  series: [{ type: 'bar', data: data.map((item) => item.value).reverse(), itemStyle: { color: '#65b7ff', borderRadius: 8 } }],
});
