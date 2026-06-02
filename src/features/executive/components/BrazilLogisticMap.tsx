import { memo, useEffect, useMemo, useState } from 'react';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { useGlobalFilterStore } from '@/store/globalFilterStore';
import type { EnrichedInvoice, FilterState } from '@/types/logistics';
import { aggregateIndicators } from '@/utils/aggregations';
import { applyFilters } from '@/utils/filtering';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import type { BrazilMapDatum, BrazilUfMapMetric } from '@/features/executive/types/map';

const BRAZIL_MAP_NAME = 'brazil-logistic-states';
const BRAZIL_GEOJSON_URL = '/data/brazil-states.geojson';
let isBrazilMapRegistered = false;

const emptyMetric = (uf: string): BrazilUfMapMetric => ({
  uf,
  revenue: 0,
  transportCost: 0,
  operationalCost: 0,
  totalLogisticsCost: 0,
  logisticsResult: 0,
  logisticsIndex: 0,
  invoiceCount: 0,
});

const buildMapData = (
  invoices: EnrichedInvoice[],
  filters: FilterState,
  selectedUfs: string[],
): BrazilMapDatum[] => {
  const mapFilters = { ...filters, ufs: [] };
  const invoicesIgnoringUf = applyFilters(invoices, mapFilters);
  const grouped = invoicesIgnoringUf.reduce<Record<string, EnrichedInvoice[]>>((acc, invoice) => {
    acc[invoice.uf] ??= [];
    acc[invoice.uf].push(invoice);
    return acc;
  }, {});

  return Object.entries(grouped).map(([uf, ufInvoices]) => {
    const indicators = aggregateIndicators(ufInvoices);

    return {
      ...emptyMetric(uf),
      name: uf,
      value: indicators.logisticsIndex,
      selected: selectedUfs.includes(uf),
      revenue: indicators.revenue,
      transportCost: indicators.transportCost,
      operationalCost: indicators.operationalCost,
      totalLogisticsCost: indicators.totalLogisticsCost,
      logisticsResult: indicators.logisticsResult,
      logisticsIndex: indicators.logisticsIndex,
      invoiceCount: ufInvoices.length,
    };
  });
};

const buildTooltip = (datum?: BrazilMapDatum): string => {
  if (!datum || datum.invoiceCount === 0) {
    return `
      <div style="min-width:220px;padding:12px 14px;color:#e8edf5">
        <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#65b7ff">UF sem operação</div>
        <div style="margin-top:6px;font-size:18px;font-weight:700">Sem dados no filtro atual</div>
      </div>
    `;
  }

  const rows = [
    ['Receita', formatCurrency(datum.revenue)],
    ['Custo Transporte', formatCurrency(datum.transportCost)],
    ['Custo Operacional', formatCurrency(datum.operationalCost)],
    ['Custo Logístico Total', formatCurrency(datum.totalLogisticsCost)],
    ['Resultado Logístico', formatCurrency(datum.logisticsResult)],
    ['Índice Logístico', formatPercent(datum.logisticsIndex)],
    ['Quantidade NF', String(datum.invoiceCount)],
  ];

  return `
    <div style="min-width:270px;padding:14px 16px;color:#e8edf5">
      <div style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#f4b860">Inteligência logística</div>
      <div style="margin-top:6px;font-size:22px;font-weight:800;color:#fff">${datum.uf}</div>
      <div style="margin-top:12px;display:grid;gap:8px">
        ${rows
          .map(
            ([label, value]) => `
              <div style="display:flex;justify-content:space-between;gap:18px;border-top:1px solid rgba(255,255,255,.08);padding-top:8px">
                <span style="color:#94a3b8">${label}</span>
                <strong style="color:#fff">${value}</strong>
              </div>
            `,
          )
          .join('')}
      </div>
    </div>
  `;
};

const buildMapOption = (data: BrazilMapDatum[], selectedUfs: string[]): EChartsOption => {
  const values = data.map((item) => item.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0.01);

  return {
    backgroundColor: 'transparent',
    animation: true,
    animationDurationUpdate: 420,
    tooltip: {
      trigger: 'item',
      confine: true,
      borderWidth: 1,
      borderColor: 'rgba(101, 183, 255, 0.28)',
      backgroundColor: 'rgba(7, 9, 13, 0.94)',
      extraCssText:
        'border-radius:18px;box-shadow:0 22px 60px rgba(0,0,0,.42);backdrop-filter:blur(18px);',
      formatter: (params: unknown) => buildTooltip((params as { data?: BrazilMapDatum }).data),
    },
    visualMap: {
      type: 'continuous',
      min,
      max,
      left: 10,
      bottom: 12,
      itemWidth: 12,
      itemHeight: 118,
      text: ['Alto custo', 'Baixo custo'],
      textStyle: { color: '#94a3b8', fontSize: 11 },
      calculable: false,
      inRange: {
        color: ['#2563eb', '#65b7ff', '#f4b860', '#fb923c', '#ef4444'],
      },
    },
    series: [
      {
        name: 'Índice Logístico',
        type: 'map',
        map: BRAZIL_MAP_NAME,
        nameProperty: 'short_name',
        roam: true,
        zoom: 1.16,
        scaleLimit: { min: 0.9, max: 5 },
        layoutCenter: ['52%', '50%'],
        layoutSize: '106%',
        selectedMode: 'multiple',
        data,
        select: {
          itemStyle: {
            areaColor: '#f4b860',
            borderColor: '#fff7ed',
            borderWidth: 2,
            shadowBlur: 20,
            shadowColor: 'rgba(244,184,96,.52)',
          },
          label: { color: '#07090d', fontWeight: 800 },
        },
        emphasis: {
          itemStyle: {
            areaColor: '#ff7a7a',
            borderColor: '#ffffff',
            borderWidth: 1.4,
            shadowBlur: 18,
            shadowColor: 'rgba(255,122,122,.45)',
          },
          label: { show: true, color: '#ffffff', fontWeight: 800 },
        },
        itemStyle: {
          borderColor: 'rgba(226,232,240,.42)',
          borderWidth: 0.75,
          shadowBlur: 10,
          shadowColor: 'rgba(101,183,255,.12)',
          areaColor: '#17202c',
        },
        label: {
          show: true,
          color: 'rgba(255,255,255,.74)',
          fontSize: 10,
          fontWeight: 700,
        },
        universalTransition: true,
      },
    ],
    graphic:
      selectedUfs.length > 0
        ? [
            {
              type: 'text',
              right: 18,
              top: 14,
              style: {
                text: `UF ativa: ${selectedUfs.join(', ')}`,
                fill: '#f8fafc',
                font: '700 13px Manrope',
                backgroundColor: 'rgba(244,184,96,.16)',
                borderColor: 'rgba(244,184,96,.32)',
                borderWidth: 1,
                borderRadius: 10,
                padding: [8, 10],
              },
            },
          ]
        : [],
  };
};

function BrazilLogisticMapComponent() {
  const [isMapReady, setIsMapReady] = useState(isBrazilMapRegistered);
  const invoices = useGlobalFilterStore((state) => state.invoices);
  const filters = useGlobalFilterStore((state) => state.filters);
  const setFilter = useGlobalFilterStore((state) => state.setFilter);
  const selectedUfs = filters.ufs;

  useEffect(() => {
    if (isBrazilMapRegistered) {
      setIsMapReady(true);
      return;
    }

    let isMounted = true;

    fetch(BRAZIL_GEOJSON_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Falha ao carregar GeoJSON Brasil: ${response.status}`);
        }

        return response.json() as Promise<Parameters<typeof echarts.registerMap>[1]>;
      })
      .then((geoJson) => {
        echarts.registerMap(BRAZIL_MAP_NAME, geoJson);
        isBrazilMapRegistered = true;

        if (isMounted) {
          setIsMapReady(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsMapReady(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const mapData = useMemo(() => buildMapData(invoices, filters, selectedUfs), [filters, invoices, selectedUfs]);
  const option = useMemo(() => buildMapOption(mapData, selectedUfs), [mapData, selectedUfs]);
  const selectedMetric = useMemo(
    () => mapData.find((item) => item.uf === selectedUfs[0]) ?? null,
    [mapData, selectedUfs],
  );

  const events = useMemo(
    () => ({
      click: (params: unknown) => {
        const uf = (params as { name?: string }).name;
        if (uf) {
          setFilter('ufs', [uf]);
        }
      },
      dblclick: () => setFilter('ufs', []),
    }),
    [setFilter],
  );

  return (
    <div className="relative min-h-[390px] overflow-hidden rounded-[1.65rem] border border-white/10 bg-graphite-950/40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(101,183,255,.15),transparent_44%),linear-gradient(145deg,rgba(255,255,255,.04),transparent)]" />
      {isMapReady ? (
        <div className="relative grid min-h-[390px] grid-cols-[minmax(0,1fr)_260px]">
          <ReactECharts
            option={option}
            notMerge
            lazyUpdate
            onEvents={events}
            style={{ height: 390, width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
          <UfExecutivePanel metric={selectedMetric} />
        </div>
      ) : (
        <div className="flex h-[390px] items-center justify-center">
          <div className="h-20 w-20 animate-pulse rounded-full border border-signal-blue/40 bg-signal-blue/10 shadow-[0_0_40px_rgba(101,183,255,.18)]" />
        </div>
      )}
      <div className="pointer-events-none absolute bottom-4 right-5 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-[11px] text-slate-400 backdrop-blur">
        Arraste para pan, scroll para zoom, duplo clique limpa UF.
      </div>
    </div>
  );
}

function UfExecutivePanel({ metric }: { metric: BrazilMapDatum | null }) {
  if (!metric) {
    return (
      <aside className="relative z-10 m-4 rounded-3xl border border-white/10 bg-black/20 p-4 backdrop-blur">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Painel UF</p>
        <p className="mt-3 text-sm text-slate-400">Selecione uma UF no mapa para ver o detalhamento executivo.</p>
      </aside>
    );
  }

  const rows = [
    ['Receita', formatCurrency(metric.revenue)],
    ['Custo Transporte', formatCurrency(metric.transportCost)],
    ['Custo Operacional', formatCurrency(metric.operationalCost)],
    ['Custo Logístico Total', formatCurrency(metric.totalLogisticsCost)],
    ['Resultado Logístico', formatCurrency(metric.logisticsResult)],
    ['Índice Logístico', formatPercent(metric.logisticsIndex)],
    ['Quantidade NF', String(metric.invoiceCount)],
  ];

  return (
    <aside className="relative z-10 m-4 rounded-3xl border border-white/10 bg-black/25 p-4 backdrop-blur-xl">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-signal-amber">Painel UF</p>
      <h3 className="mt-2 font-display text-3xl font-semibold text-white">{metric.uf}</h3>
      <div className="mt-4 space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2">
            <div className="text-[11px] text-slate-500">{label}</div>
            <div className="mt-1 break-words text-sm font-semibold text-white">{value}</div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export const BrazilLogisticMap = memo(BrazilLogisticMapComponent);
