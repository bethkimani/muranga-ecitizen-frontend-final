'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DownloadIcon, PrinterIcon } from 'lucide-react';
import {
  byCategory,
  bySubCounty,
  departmentWorkload,
  priorityDistribution,
  resolutionTrend,
  volumeByMonth,
} from '@/data/analytics';
import { ChartCard, Legend, chartColors, tooltipStyle } from '@/components/ChartCard';
import { PageHeader } from '@/components/ui';

const axis = {
  tick: { fill: chartColors.axis, fontSize: 12 },
  axisLine: false,
  tickLine: false,
} as const;

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState('6m');

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Reports and analytics"
        description="When connected, every chart is calculated from live request records. Charts here use sample data."
        actions={
          <>
            <select
              aria-label="Date range"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="field h-10 w-40"
            >
              <option value="30d">Last 30 days</option>
              <option value="6m">Last 6 months</option>
              <option value="12m">Last 12 months</option>
            </select>
            <button onClick={() => toast.success('CSV export queued')} className="btn-secondary h-10">
              <DownloadIcon className="h-4 w-4" /> CSV
            </button>
            <button onClick={() => window.print()} className="btn-secondary h-10">
              <PrinterIcon className="h-4 w-4" /> Print report
            </button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Open vs resolved over time"
          description="Monthly requests received and resolved"
          className="lg:col-span-2"
        >
          <Legend
            items={[
              { label: 'Received', color: chartColors.gold },
              { label: 'Resolved', color: chartColors.green },
            ]}
          />
          <div className="mt-3 h-72">
            <ResponsiveContainer>
              <LineChart data={volumeByMonth} margin={{ left: -16, right: 8, top: 8 }}>
                <CartesianGrid stroke={chartColors.grid} vertical={false} />
                <XAxis dataKey="month" {...axis} />
                <YAxis {...axis} />
                <Tooltip {...tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="received"
                  name="Received"
                  stroke={chartColors.gold}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved"
                  stroke={chartColors.green}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Requests by category">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={byCategory} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid stroke={chartColors.grid} horizontal={false} />
                <XAxis type="number" {...axis} />
                <YAxis type="category" dataKey="name" width={84} {...axis} />
                <Tooltip {...tooltipStyle} cursor={{ fill: '#F5F7F5' }} />
                <Bar
                  dataKey="value"
                  name="Requests"
                  fill={chartColors.green}
                  radius={[0, 4, 4, 0]}
                  barSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Requests by sub-county">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={bySubCounty} margin={{ left: -16, right: 8 }}>
                <CartesianGrid stroke={chartColors.grid} vertical={false} />
                <XAxis
                  dataKey="name"
                  {...axis}
                  interval={0}
                  tick={{ fill: chartColors.axis, fontSize: 11 }}
                />
                <YAxis {...axis} />
                <Tooltip {...tooltipStyle} cursor={{ fill: '#F5F7F5' }} />
                <Bar
                  dataKey="value"
                  name="Requests"
                  fill={chartColors.forest}
                  radius={[4, 4, 0, 0]}
                  barSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Department workload" description="Open cases, with overdue share">
          <Legend
            items={[
              { label: 'Open on time', color: chartColors.green },
              { label: 'Overdue', color: chartColors.red },
            ]}
          />
          <div className="mt-3 h-64">
            <ResponsiveContainer>
              <BarChart data={departmentWorkload} margin={{ left: -16, right: 8 }}>
                <CartesianGrid stroke={chartColors.grid} vertical={false} />
                <XAxis dataKey="name" {...axis} />
                <YAxis {...axis} />
                <Tooltip {...tooltipStyle} cursor={{ fill: '#F5F7F5' }} />
                <Bar dataKey="open" name="Open" stackId="a" fill={chartColors.green} barSize={28} />
                <Bar
                  dataKey="overdue"
                  name="Overdue"
                  stackId="a"
                  fill={chartColors.red}
                  radius={[4, 4, 0, 0]}
                  barSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Average resolution time" description="Days from submission to resolved">
          <div className="h-[280px]">
            <ResponsiveContainer>
              <LineChart data={resolutionTrend} margin={{ left: -16, right: 8, top: 8 }}>
                <CartesianGrid stroke={chartColors.grid} vertical={false} />
                <XAxis dataKey="month" {...axis} />
                <YAxis {...axis} domain={[0, 8]} unit="d" />
                <Tooltip {...tooltipStyle} formatter={(v) => [`${v} days`, 'Average']} />
                <Line
                  type="monotone"
                  dataKey="days"
                  stroke={chartColors.blue}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Priority and overdue distribution" className="lg:col-span-2">
          <Legend
            items={[
              { label: 'Open', color: chartColors.gold },
              { label: 'Overdue', color: chartColors.red },
            ]}
          />
          <div className="mt-3 h-56">
            <ResponsiveContainer>
              <BarChart data={priorityDistribution} margin={{ left: -16, right: 8 }}>
                <CartesianGrid stroke={chartColors.grid} vertical={false} />
                <XAxis dataKey="name" {...axis} />
                <YAxis {...axis} />
                <Tooltip {...tooltipStyle} cursor={{ fill: '#F5F7F5' }} />
                <Bar
                  dataKey="open"
                  name="Open"
                  fill={chartColors.gold}
                  radius={[4, 4, 0, 0]}
                  barSize={36}
                />
                <Bar
                  dataKey="overdue"
                  name="Overdue"
                  fill={chartColors.red}
                  radius={[4, 4, 0, 0]}
                  barSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}