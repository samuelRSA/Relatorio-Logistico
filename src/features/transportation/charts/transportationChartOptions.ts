import type { EChartsOption } from 'echarts';
import type { CityFreightByInvoiceCost, UfFreightByInvoiceCost, UfTransportCost } from '@/types/logistics';
import { formatCurrency, formatDecimal, formatPercent } from '@/utils/formatters';

const textColor = '#cbd5e1';

type RankedCityFreightByInvoiceCost = CityFreightByInvoiceCost & { rank: number; displayName: string };
type RankedUfTransportCost = UfTransportCost & { rank: number; displayName: string };
type RankedUfFreightByInvoiceCost = UfFreightByInvoiceCost & { rank: number; displayName: string };

export interface UfMonthlyFreightTrend {
  competence: string;
  uf: string;
  freightPerKg: number;
  transportCost: number;
  grossWeight: number;
  invoiceCount: number;
}

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

const formatFreightPerKgAxis = (value: number): string => {
  const formatted = Number.isInteger(value) ? formatCurrency(value).replace(',00', '') : formatCurrency(value);
  return `${formatted}/kg`;
};

const rankCities = (data: CityFreightByInvoiceCost[]): RankedCityFreightByInvoiceCost[] =>
  data
    .slice()
    .sort((a, b) => b.freightPerKgConsolidated - a.freightPerKgConsolidated)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      displayName: `${index + 1}º ${item.city}`,
    }));

const rankUfsByCost = (data: UfTransportCost[]): RankedUfTransportCost[] =>
  data
    .slice()
    .sort((a, b) => b.cost - a.cost)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      displayName: `${index + 1}º ${item.uf}`,
    }));

const rankUfsByFreight = (data: UfFreightByInvoiceCost[]): RankedUfFreightByInvoiceCost[] =>
  data
    .slice()
    .sort((a, b) => b.freightPerKgConsolidated - a.freightPerKgConsolidated)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      displayName: `${index + 1}º ${item.uf}`,
    }));

const buildUfBarSeries = <T extends { value: number; uf: string }>(items: T[], selectedUfs: string[]) =>
  items.map((item) => ({
    value: item.value,
    name: item.uf,
    uf: item.uf,
    itemStyle: {
      opacity: selectedUfs.length === 0 || selectedUfs.includes(item.uf) ? 1 : 0.34,
    },
  }));

export const topCityTransportOption = (data: CityFreightByInvoiceCost[]): EChartsOption => {
  const items = rankCities(data);

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const item = items[(params as { dataIndex: number }).dataIndex];
        return [
          `Ranking: ${item.rank}º`,
          `<strong>${item.city}</strong>`,
          `UF: ${item.uf}`,
          `Frete/Kg Consolidado: ${formatCurrency(item.freightPerKgConsolidated)}/kg`,
          `Frete/Kg médio por NF: ${formatCurrency(item.freightPerKgAverage)}/kg`,
          `Custo Transporte: ${formatCurrency(item.transportCost)}`,
          `Peso Bruto Total: ${formatDecimal(item.grossWeight)}`,
          `Peso médio por NF: ${formatDecimal(item.averageWeight)}`,
          `Menor peso NF: ${formatDecimal(item.minWeight)}`,
          `Quantidade NF: ${formatDecimal(item.invoiceCount)}`,
        ].join('<br/>');
      },
    },
    grid: { left: 170, right: 28, top: 24, bottom: 28 },
    xAxis: {
      type: 'value',
      axisLabel: { color: textColor, formatter: (value: number) => formatCurrency(value) },
    },
    yAxis: {
      type: 'category',
      data: items.map((item) => item.displayName),
      inverse: true,
      axisLabel: {
        color: textColor,
        width: 165,
        overflow: 'truncate',
      },
    },
    series: [
      {
        type: 'bar',
        data: items.map((item) => item.freightPerKgConsolidated),
        itemStyle: { color: '#65b7ff', borderRadius: [0, 8, 8, 0] },
        label: {
          show: true,
          position: 'right',
          color: textColor,
          formatter: (params: unknown) => `${formatCurrency(Number((params as { value: number }).value))}/kg`,
        },
      },
    ],
  };
};

export const ufFreightConsolidatedOption = (data: UfFreightByInvoiceCost[], selectedUfs: string[] = []): EChartsOption => {
  const items = rankUfsByFreight(data);

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const item = items[(params as { dataIndex: number }).dataIndex];
        return [
          `Ranking: ${item.rank}º`,
          `<strong>${item.uf}</strong>`,
          `Frete/Kg consolidado: ${formatCurrency(item.freightPerKgConsolidated)}/kg`,
          `Frete/Kg médio por NF: ${formatCurrency(item.freightPerKgAverage)}/kg`,
          `Peso médio por NF: ${formatDecimal(item.averageWeight)}`,
          `Menor peso NF: ${formatDecimal(item.minWeight)}`,
          `Quantidade NF: ${formatDecimal(item.invoiceCount)}`,
          `Peso bruto total: ${formatDecimal(item.grossWeight)}`,
          `Custo transporte: ${formatCurrency(item.transportCost)}`,
          `Participação no custo total: ${formatPercent(item.participation)}`,
        ].join('<br/>');
      },
    },
    grid: { left: 88, right: 28, top: 28, bottom: 28 },
    xAxis: {
      type: 'value',
      axisLabel: { color: textColor, formatter: (value: number) => formatCurrency(value) },
    },
    yAxis: {
      type: 'category',
      data: items.map((item) => item.displayName),
      inverse: true,
      axisLabel: { color: textColor },
    },
    series: [
      {
        type: 'bar',
        data: buildUfBarSeries(
          items.map((item) => ({
            value: item.freightPerKgConsolidated,
            uf: item.uf,
          })),
          selectedUfs,
        ),
        itemStyle: { color: '#6ee7b7', borderRadius: [0, 8, 8, 0] },
        label: {
          show: true,
          position: 'right',
          color: textColor,
          formatter: (params: unknown) => `${formatCurrency(Number((params as { value: number }).value))}/kg`,
        },
      },
    ],
  };
};

export const ufTransportTotalOption = (data: UfTransportCost[], selectedUfs: string[] = []): EChartsOption => {
  const items = rankUfsByCost(data);

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const item = items[(params as { dataIndex: number }).dataIndex];
        return [
          `Ranking: ${item.rank}º`,
          `<strong>${item.uf}</strong>`,
          `Custo Transporte Total: ${formatCurrency(item.cost)}`,
          `Peso Bruto: ${formatDecimal(item.grossWeight)}`,
          `Frete/Kg Bruto Médio: ${formatCurrency(item.freightPerKg)}/kg`,
          `Quantidade NF: ${formatDecimal(item.invoiceCount)}`,
          `Participação no Custo Transporte Total: ${formatPercent(item.participation)}`,
        ].join('<br/>');
      },
    },
    grid: { left: 88, right: 28, top: 28, bottom: 28 },
    xAxis: {
      type: 'value',
      axisLabel: { color: textColor, formatter: (value: number) => formatCurrency(value) },
    },
    yAxis: {
      type: 'category',
      data: items.map((item) => item.displayName),
      inverse: true,
      axisLabel: {
        color: textColor,
      },
    },
    series: [
      {
        type: 'bar',
        data: buildUfBarSeries(
          items.map((item) => ({
            value: item.cost,
            uf: item.uf,
          })),
          selectedUfs,
        ),
        itemStyle: { color: '#65b7ff', borderRadius: [0, 8, 8, 0] },
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

export const ufMonthlyFreightTrendOption = (
  data: UfMonthlyFreightTrend[],
  selectedUfs: string[] = [],
): EChartsOption => {
  const competences = Array.from(new Set(data.map((item) => item.competence))).sort((a, b) => a.localeCompare(b));
  const ufs = Array.from(new Set(data.map((item) => item.uf))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const itemsByKey = new Map(data.map((item) => [`${item.competence}|${item.uf}`, item]));
  const latestCompetence = competences[competences.length - 1];
  const activeUfs = (selectedUfs.length === 0 ? ufs : ufs.filter((uf) => selectedUfs.includes(uf))).sort((a, b) => {
    const latestA = latestCompetence ? (itemsByKey.get(`${latestCompetence}|${a}`)?.freightPerKg ?? -1) : -1;
    const latestB = latestCompetence ? (itemsByKey.get(`${latestCompetence}|${b}`)?.freightPerKg ?? -1) : -1;
    return latestB - latestA || a.localeCompare(b, 'pt-BR');
  });
  const colorPalette = ['#22d3ee', '#f97316', '#a78bfa', '#34d399', '#f43f5e', '#facc15', '#60a5fa', '#fb7185'];

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10, 14, 23, 0.94)',
      borderColor: 'rgba(101, 183, 255, 0.22)',
      textStyle: { color: textColor },
      formatter: (params) => {
        const point = params as { color?: string; dataIndex: number; seriesName?: string };
        const competence = competences[Number(point.dataIndex ?? 0)];
        const uf = String(point.seriesName ?? '');
        const item = itemsByKey.get(`${competence}|${uf}`);
        if (!item) {
          return '';
        }

        const previousCompetence = competences[Number(point.dataIndex) - 1];
        const previousItem = previousCompetence ? itemsByKey.get(`${previousCompetence}|${uf}`) : undefined;
        const previousValue = previousItem?.freightPerKg ?? null;
        const absoluteVariation = previousValue === null ? null : item.freightPerKg - previousValue;
        const percentVariation = previousValue && previousValue !== 0 ? absoluteVariation! / previousValue : null;
        const emptyValue = '&mdash;';

        return [
          `<span style="color:${point.color}">&bull;</span> <strong>${uf}</strong>`,
          `Compet\u00eancia: ${formatCompetenceLabel(competence)}`,
          `Frete/Kg: ${formatCurrency(item.freightPerKg)}/kg`,
          `Per\u00edodo anterior: ${previousValue === null ? emptyValue : `${formatCurrency(previousValue)}/kg`}`,
          `Varia\u00e7\u00e3o: ${absoluteVariation === null ? emptyValue : `${formatCurrency(absoluteVariation)}/kg`}`,
          `Varia\u00e7\u00e3o %: ${percentVariation === null ? emptyValue : formatPercent(percentVariation)}`,
        ].join('<br/>');
      },
    },
    legend: {
      top: 0,
      textStyle: { color: textColor },
      type: 'scroll',
    },
    grid: { left: 70, right: 28, top: 54, bottom: 42 },
    xAxis: {
      type: 'category',
      data: competences,
      axisLabel: { color: textColor, formatter: (value: string) => formatCompetenceLabel(value) },
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.24)' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: textColor, formatter: (value: number) => formatFreightPerKgAxis(value) },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.08)' } },
    },
    series: activeUfs.map((uf, index) => {
      const color = colorPalette[index % colorPalette.length];
      const values = competences.map((competence) => itemsByKey.get(`${competence}|${uf}`)?.freightPerKg ?? null);

      return {
        name: uf,
        type: 'line',
        smooth: true,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 9,
        connectNulls: false,
        data: values,
        lineStyle: { color, width: 4 },
        itemStyle: {
          color,
          borderColor: '#0f172a',
          borderWidth: 2,
        },
        label: {
          show: true,
          position: 'top',
          distance: 8,
          color,
          fontSize: 11,
          fontWeight: 700,
          formatter: (params: unknown) => {
            const point = params as { dataIndex: number; value: number | null };
            if (point.value === null) {
              return '';
            }

            return `${formatCurrency(Number(point.value))}/kg`;
          },
        },
        labelLayout: { hideOverlap: true },
        emphasis: {
          focus: 'series',
          scale: 1.2,
          lineStyle: { width: 5 },
        },
        blur: {
          lineStyle: { opacity: 0.18 },
          itemStyle: { opacity: 0.22 },
          label: { opacity: 0.18 },
        },
      };
    }),
  };
};
