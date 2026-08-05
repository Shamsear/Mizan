"use client";

import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCents } from "@/lib/money";
import { format } from "date-fns";
import { getCurrencySymbol } from "@/lib/currency";
import styles from "./Charts.module.css";

type DailyData = {
  date: Date;
  income: number;
  expense: number;
  net: number;
};

type CashFlowTrendProps = {
  data: DailyData[];
  currency?: string;
};

export function CashFlowTrend({ data, currency = "QAR" }: CashFlowTrendProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      date: format(item.date, "MMM d"),
      fullDate: item.date,
      income: item.income / 100, // Convert to dollars/rials for chart
      expense: item.expense / 100,
      net: item.net / 100,
    }));
  }, [data]);

  const currencySym = useMemo(() => getCurrencySymbol(currency), [currency]);

  if (chartData.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>No data yet</p>
        <p className={styles.emptyHint}>Add transactions to see your cash flow</p>
      </div>
    );
  }

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>Cash Flow Trend</h3>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--ink-faint)" />
          <XAxis
            dataKey="date"
            stroke="var(--ink-dim)"
            style={{ fontSize: "0.75rem" }}
          />
          <YAxis
            stroke="var(--ink-dim)"
            style={{ fontSize: "0.75rem" }}
            tickFormatter={(value) => `${currencySym}${value}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className={styles.tooltip}>
                    <div className={styles.tooltipHeader}>
                      <span className={styles.tooltipName}>{payload[0].payload.date}</span>
                    </div>
                    <div className={styles.tooltipRow}>
                      <span className={styles.tooltipLabel} style={{ color: "#10b981" }}>
                        Income:
                      </span>
                      <span className={styles.tooltipValue}>
                        {formatCents(Math.round(payload[0].payload.income * 100), currency, {
                          symbol: true,
                        })}
                      </span>
                    </div>
                    <div className={styles.tooltipRow}>
                      <span className={styles.tooltipLabel} style={{ color: "#ef4444" }}>
                        Expenses:
                      </span>
                      <span className={styles.tooltipValue}>
                        {formatCents(Math.round(payload[0].payload.expense * 100), currency, {
                          symbol: true,
                        })}
                      </span>
                    </div>
                    <div className={styles.tooltipRow}>
                      <span className={styles.tooltipLabel}>Net:</span>
                      <span
                        className={styles.tooltipValue}
                        style={{
                          color: payload[0].payload.net >= 0 ? "#10b981" : "#ef4444",
                        }}
                      >
                        {formatCents(Math.round(payload[0].payload.net * 100), currency, {
                          symbol: true,
                          signed: true,
                        })}
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "0.875rem", paddingTop: "1rem" }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="income"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: "#10b981", r: 3 }}
            name="Income"
          />
          <Line
            type="monotone"
            dataKey="expense"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: "#ef4444", r: 3 }}
            name="Expenses"
          />
          <Line
            type="monotone"
            dataKey="net"
            stroke="#2dd4e8"
            strokeWidth={2}
            dot={{ fill: "#2dd4e8", r: 3 }}
            name="Net"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
