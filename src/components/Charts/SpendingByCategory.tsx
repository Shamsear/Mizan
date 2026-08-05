"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCents } from "@/lib/money";
import { Icon } from "@/components/Icon/Icon";
import styles from "./Charts.module.css";

type CategoryData = {
  id: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
};

type SpendingByCategoryProps = {
  data: CategoryData[];
  currency?: string;
};

export function SpendingByCategory({ data, currency = "QAR" }: SpendingByCategoryProps) {
  const chartData = useMemo(() => {
    return data
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8); // Top 8 categories
  }, [data]);

  const total = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.amount, 0);
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>No spending data yet</p>
        <p className={styles.emptyHint}>Add some expenses to see your breakdown</p>
      </div>
    );
  }

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>Spending by Category</h3>
        <span className={styles.chartTotal}>
          Total: {formatCents(total, currency, { symbol: true })}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            innerRadius={60}
            fill="#8884d8"
            dataKey="amount"
            label={({ percent }) => (percent ? `${(percent * 100).toFixed(0)}%` : "")}
          >
            {chartData.map((entry) => (
              <Cell key={entry.id} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload[0]) {
                const data = payload[0].payload as CategoryData;
                return (
                  <div className={styles.tooltip}>
                    <div className={styles.tooltipHeader}>
                      <span className={styles.tooltipIcon}>
                        <Icon name={data.icon} size={14} />
                      </span>
                      <span className={styles.tooltipName}>{data.name}</span>
                    </div>
                    <div className={styles.tooltipAmount}>
                      {formatCents(data.amount, currency, { symbol: true })}
                    </div>
                    <div className={styles.tooltipPercent}>
                      {((data.amount / total) * 100).toFixed(1)}% of total
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className={styles.legend}>
        {chartData.map((item) => (
          <div key={item.id} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: item.color }} />
            <span className={styles.legendIcon}>
              <Icon name={item.icon} size={14} />
            </span>
            <span className={styles.legendName}>{item.name}</span>
            <span className={styles.legendAmount}>
              {formatCents(item.amount, currency, { symbol: true })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
