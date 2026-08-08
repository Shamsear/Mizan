"use client";

import { useMemo, useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useSettings, useTransactions, useCategories } from "@/lib/db/hooks";
import { updateSettings } from "@/lib/db/repository";
import { formatCents, parseAmountToCents } from "@/lib/money";
import { Icon } from "@/components/Icon/Icon";
import { useToast } from "@/components/Toast/Toast";
import { QAR_EXCHANGE_RATES, getCurrencySymbol } from "@/lib/currency";
import Link from "next/link";
import styles from "./page.module.css";

export default function QatarRunwayPage() {
  const { user, isLoaded } = useUser();
  const settings = useSettings();
  const transactions = useTransactions();
  const categories = useCategories();
  const toast = useToast();

  const userId = user?.id;

  // Local state for interactive sliders/inputs (synced with IndexedDB)
  const [savingsInput, setSavingsInput] = useState("");
  const [homeCurrency, setHomeCurrency] = useState("INR");
  const [visaDays, setVisaDays] = useState(90);
  const [customVisaDays, setCustomVisaDays] = useState("");
  const [budgetPreset, setBudgetPreset] = useState<"survival" | "standard" | "comfortable" | "custom">("survival");

  // Tunable expenses (QAR per month)
  const [rentQAR, setRentQAR] = useState(450);
  const [foodQAR, setFoodQAR] = useState(200);
  const [transportQAR, setTransportQAR] = useState(70);
  const [dataQAR, setDataQAR] = useState(30);
  const [miscQAR, setMiscQAR] = useState(50); // CV, job hunt, clothing

  // Presets definition
  const presets = {
    survival: { rent: 450, food: 200, transport: 70, data: 30, misc: 50, total: 750 },
    standard: { rent: 900, food: 400, transport: 200, data: 100, misc: 100, total: 1700 },
    comfortable: { rent: 1800, food: 700, transport: 400, data: 100, misc: 200, total: 3200 },
  };

  // Populate from IndexedDB on load
  useEffect(() => {
    if (settings) {
      const exchange = settings.qatarExchangeRate || QAR_EXCHANGE_RATES[settings.qatarHomeCurrency || "INR"] || 1.0;
      const originalHomeSavings = settings.qatarSavingsCents 
        ? Math.round((settings.qatarSavingsCents / 100) * exchange) 
        : 0;

      setSavingsInput(originalHomeSavings > 0 ? originalHomeSavings.toString() : "");
      setHomeCurrency(settings.qatarHomeCurrency || "INR");
      
      const vDays = settings.qatarVisaDays || 90;
      if ([30, 60, 90].includes(vDays)) {
        setVisaDays(vDays);
      } else {
        setVisaDays(0);
        setCustomVisaDays(vDays.toString());
      }
      
      setBudgetPreset(settings.qatarBudgetPreset || "survival");
      setRentQAR(settings.qatarCustomRentCents ? Math.round(settings.qatarCustomRentCents / 100) : 450);
      setFoodQAR(settings.qatarCustomFoodCents ? Math.round(settings.qatarCustomFoodCents / 100) : 200);
      setTransportQAR(settings.qatarCustomTransportCents ? Math.round(settings.qatarCustomTransportCents / 100) : 70);
      setDataQAR(settings.qatarCustomDataCents ? Math.round(settings.qatarCustomDataCents / 100) : 30);
      setMiscQAR(settings.qatarCustomMiscCents ? Math.round(settings.qatarCustomMiscCents / 100) : 50);
    }
  }, [settings]);

  // Synchronize changes back to database settings
  const handleSaveToSettings = async (updates: Record<string, any>) => {
    if (!userId) return;
    try {
      await updateSettings(userId, updates);
    } catch (e) {
      console.error("Error saving settings:", e);
    }
  };

  // Apply a preset
  const applyPreset = (presetKey: "survival" | "standard" | "comfortable") => {
    const preset = presets[presetKey];
    setBudgetPreset(presetKey);
    setRentQAR(preset.rent);
    setFoodQAR(preset.food);
    setTransportQAR(preset.transport);
    setDataQAR(preset.data);
    setMiscQAR(preset.misc);

    handleSaveToSettings({
      qatarBudgetPreset: presetKey,
      qatarCustomRentCents: preset.rent * 100,
      qatarCustomFoodCents: preset.food * 100,
      qatarCustomTransportCents: preset.transport * 100,
      qatarCustomDataCents: preset.data * 100,
      qatarCustomMiscCents: preset.misc * 100,
    });
    toast.success(`Applied ${presetKey.toUpperCase()} preset`);
  };

  // Sliders and individual changes
  const handleSliderChange = (field: string, val: number) => {
    setBudgetPreset("custom");
    if (field === "rent") {
      setRentQAR(val);
      handleSaveToSettings({ qatarCustomRentCents: val * 100, qatarBudgetPreset: "custom" });
    }
    if (field === "food") {
      setFoodQAR(val);
      handleSaveToSettings({ qatarCustomFoodCents: val * 100, qatarBudgetPreset: "custom" });
    }
    if (field === "transport") {
      setTransportQAR(val);
      handleSaveToSettings({ qatarCustomTransportCents: val * 100, qatarBudgetPreset: "custom" });
    }
    if (field === "data") {
      setDataQAR(val);
      handleSaveToSettings({ qatarCustomDataCents: val * 100, qatarBudgetPreset: "custom" });
    }
    if (field === "misc") {
      setMiscQAR(val);
      handleSaveToSettings({ qatarCustomMiscCents: val * 100, qatarBudgetPreset: "custom" });
    }
  };

  const exchangeRate = QAR_EXCHANGE_RATES[homeCurrency] || 1.0;
  const homeSymbol = getCurrencySymbol(homeCurrency);

  // Parse savings input
  const savingsHomeCents = parseFloat(savingsInput.replace(/,/g, "")) * 100 || 0;
  const savingsQARCents = Math.round(savingsHomeCents / exchangeRate);

  // Total monthly expensess
  const totalMonthlyQAR = rentQAR + foodQAR + transportQAR + dataQAR + miscQAR;
  const dailySpendQAR = totalMonthlyQAR / 30;

  // Runway duration (days)
  const runwayDays = dailySpendQAR > 0 ? Math.floor((savingsQARCents / 100) / dailySpendQAR) : 0;
  const activeVisaDays = visaDays === 0 ? parseInt(customVisaDays) || 30 : visaDays;
  const bufferDays = runwayDays - activeVisaDays;

  // Track job search expenses from transactions
  const jobSearchTransactions = useMemo(() => {
    if (!transactions) return [];
    
    // Look up transaction category matching "Job Search" or notes containing cv, interview, print, formal
    const searchKeywords = ["cv", "interview", "print", "formal", "suit", "xerox", "copier", "metro to", "career"];
    
    return transactions.filter((t) => {
      if (t.deletedAt || t.type !== "expense") return false;
      const noteLower = (t.note || "").toLowerCase();
      const hasKeyword = searchKeywords.some((k) => noteLower.includes(k));
      return hasKeyword;
    });
  }, [transactions]);

  const totalJobSearchSpentCents = useMemo(() => {
    return jobSearchTransactions.reduce((sum, t) => sum + t.amountCents, 0);
  }, [jobSearchTransactions]);

  // Handle savings/currency update
  const handleSavingsChange = (val: string) => {
    setSavingsInput(val);
    const cleaned = parseFloat(val.replace(/,/g, "")) || 0;
    const finalQARCents = Math.round((cleaned * 100) / exchangeRate);
    handleSaveToSettings({
      qatarSavingsCents: finalQARCents,
    });
  };

  const handleCurrencyChange = (code: string) => {
    setHomeCurrency(code);
    const cleaned = parseFloat(savingsInput.replace(/,/g, "")) || 0;
    const newExchange = QAR_EXCHANGE_RATES[code] || 1.0;
    const finalQARCents = Math.round((cleaned * 100) / newExchange);
    handleSaveToSettings({
      qatarHomeCurrency: code,
      qatarExchangeRate: newExchange,
      qatarSavingsCents: finalQARCents,
    });
  };

  const handleVisaDaysChange = (days: number) => {
    setVisaDays(days);
    const finalDays = days === 0 ? parseInt(customVisaDays) || 30 : days;
    handleSaveToSettings({
      qatarVisaDays: finalDays,
    });
  };

  const handleCustomVisaChange = (val: string) => {
    setCustomVisaDays(val);
    const parsed = parseInt(val) || 30;
    handleSaveToSettings({
      qatarVisaDays: parsed,
    });
  };

  if (!isLoaded) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <main className={`app-shell page-enter ${styles.page}`}>
      {/* Header */}
      <header className={styles.header}>
        <Link href="/" className={styles.backBtn} aria-label="Go back">
          <Icon name="chevron-left" size={24} />
        </Link>
        <h1 className={styles.title}>Qatar Runway</h1>
        <div className={styles.headerSpacer} />
      </header>

      {/* ── Runway Health Indicator Card (WOW element!) ── */}
      <section className={styles.runwayDashboard}>
        <div className={styles.runwayGlow} style={{ 
          background: bufferDays >= 0 
            ? "radial-gradient(circle, rgba(87, 217, 163, 0.08) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(255, 107, 90, 0.08) 0%, transparent 70%)"
        }} />
        
        <div className={styles.runwayMetric}>
          <span className={styles.metricLabel}>Your Cash Runway</span>
          <span className={`${styles.metricVal} ${bufferDays >= 0 ? styles.positiveMetric : styles.negativeMetric}`}>
            {runwayDays} <span className={styles.metricUnit}>Days</span>
          </span>
        </div>

        {/* Comparison Alert */}
        <div className={`${styles.statusAlert} ${bufferDays >= 0 ? styles.statusAlertOk : styles.statusAlertWarning}`}>
          <Icon name={bufferDays >= 0 ? "check-circle" : "alert-triangle"} size={18} />
          <span className={styles.alertText}>
            {bufferDays >= 0 
              ? `You have a safety buffer of +${bufferDays} days beyond your ${activeVisaDays}-day visa.`
              : `Warning: Savings run out ${Math.abs(bufferDays)} days before your ${activeVisaDays}-day visa expires!`
            }
          </span>
        </div>

        {/* Small stats layout */}
        <div className={styles.dashboardStats}>
          <div className={styles.miniStat}>
            <span className={styles.miniLabel}>Daily Limit</span>
            <span className={styles.miniValue}>QR {dailySpendQAR.toFixed(1)}</span>
            <span className={styles.miniHomeValue}>
              ≈ {homeSymbol}{Math.round(dailySpendQAR * exchangeRate)}
            </span>
          </div>

          <div className={styles.miniStat}>
            <span className={styles.miniLabel}>Monthly Total</span>
            <span className={styles.miniValue}>QR {totalMonthlyQAR}</span>
            <span className={styles.miniHomeValue}>
              ≈ {homeSymbol}{Math.round(totalMonthlyQAR * exchangeRate)}
            </span>
          </div>

          <div className={styles.miniStat}>
            <span className={styles.miniLabel}>Total Savings</span>
            <span className={styles.miniValue}>QR {Math.round(savingsQARCents / 100)}</span>
            <span className={styles.miniHomeValue}>
              ≈ {homeSymbol}{Math.round(savingsHomeCents / 100).toLocaleString()}
            </span>
          </div>
        </div>
      </section>

      {/* ── Inputs / Savings & Capital ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Savings & Visa Status</h2>
        <div className={styles.card}>
          <div className={styles.formRow}>
            <label className={styles.inputLabel}>Initial Savings</label>
            <div className={styles.savingsFieldWrap}>
              <select
                className={styles.currencySelect}
                value={homeCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                aria-label="Currency"
              >
                {Object.keys(QAR_EXCHANGE_RATES).map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
              <input
                type="number"
                inputMode="decimal"
                className={styles.savingsInput}
                value={savingsInput}
                onChange={(e) => handleSavingsChange(e.target.value)}
                placeholder="0.00"
                aria-label="Savings amount"
              />
            </div>
          </div>

          {savingsInput && homeCurrency !== "QAR" && (
            <div className={styles.rateCaption}>
              Rate: 1 QAR = {exchangeRate.toFixed(2)} {homeCurrency} • Equivalent to QR {(savingsQARCents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          )}

          <div className={styles.divider} />

          <div className={styles.formRow}>
            <label className={styles.inputLabel}>Visa Target Days</label>
            <div className={styles.visaDaysRow}>
              {([30, 60, 90, 0] as const).map((days) => (
                <button
                  key={days}
                  type="button"
                  className={`${styles.visaPill} ${visaDays === days ? styles.visaPillActive : ""}`}
                  onClick={() => handleVisaDaysChange(days)}
                >
                  {days === 0 ? "Custom" : `${days} d`}
                </button>
              ))}
            </div>
          </div>

          {visaDays === 0 && (
            <div className={styles.formRow} style={{ marginTop: "0.5rem" }}>
              <span className={styles.inputLabel}>Custom Days</span>
              <input
                type="number"
                className={styles.customVisaInput}
                value={customVisaDays}
                onChange={(e) => handleCustomVisaChange(e.target.value)}
                placeholder="Enter days"
              />
            </div>
          )}
        </div>
      </section>

      {/* ── Living Costs & Sliders ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Qatar Living Expenses</h2>
          <span className={styles.presetIndicator}>
            Preset: <span className={styles.presetHighlight}>{budgetPreset}</span>
          </span>
        </div>

        {/* Preset selections */}
        <div className={styles.presetButtons}>
          <button
            className={`${styles.presetBtn} ${budgetPreset === "survival" ? styles.presetBtnActive : ""}`}
            onClick={() => applyPreset("survival")}
          >
            Survival (QR 750)
          </button>
          <button
            className={`${styles.presetBtn} ${budgetPreset === "standard" ? styles.presetBtnActive : ""}`}
            onClick={() => applyPreset("standard")}
          >
            Standard (QR 1700)
          </button>
          <button
            className={`${styles.presetBtn} ${budgetPreset === "comfortable" ? styles.presetBtnActive : ""}`}
            onClick={() => applyPreset("comfortable")}
          >
            Comfortable (QR 3200)
          </button>
        </div>

        {/* Sliders Card */}
        <div className={styles.card}>
          {/* Rent */}
          <div className={styles.sliderGroup}>
            <div className={styles.sliderLabelRow}>
              <span className={styles.sliderName}>Rent (Accommodation)</span>
              <span className={styles.sliderValue}>QR {rentQAR} / mo</span>
            </div>
            <input
              type="range"
              min="300"
              max="4000"
              step="50"
              value={rentQAR}
              onChange={(e) => handleSliderChange("rent", parseInt(e.target.value))}
              className={styles.slider}
              aria-label="Rent slider"
            />
            <span className={styles.sliderHint}>Survival: Bedspace (Industrial/Wakra). Comfortable: Private partition/studio.</span>
          </div>

          <div className={styles.divider} />

          {/* Food */}
          <div className={styles.sliderGroup}>
            <div className={styles.sliderLabelRow}>
              <span className={styles.sliderName}>Food & Groceries</span>
              <span className={styles.sliderValue}>QR {foodQAR} / mo</span>
            </div>
            <input
              type="range"
              min="150"
              max="2000"
              step="25"
              value={foodQAR}
              onChange={(e) => handleSliderChange("food", parseInt(e.target.value))}
              className={styles.slider}
              aria-label="Food slider"
            />
            <span className={styles.sliderHint}>Survival: Cooking own grains. Comfortable: Ordering out + delivery.</span>
          </div>

          <div className={styles.divider} />

          {/* Transport */}
          <div className={styles.sliderGroup}>
            <div className={styles.sliderLabelRow}>
              <span className={styles.sliderName}>Transport (Metro / Uber)</span>
              <span className={styles.sliderValue}>QR {transportQAR} / mo</span>
            </div>
            <input
              type="range"
              min="50"
              max="1500"
              step="10"
              value={transportQAR}
              onChange={(e) => handleSliderChange("transport", parseInt(e.target.value))}
              className={styles.slider}
              aria-label="Transport slider"
            />
            <span className={styles.sliderHint}>Survival: Doha Metro monthly pass. Comfortable: Daily Uber trips.</span>
          </div>

          <div className={styles.divider} />

          {/* Mobile & Data */}
          <div className={styles.sliderGroup}>
            <div className={styles.sliderLabelRow}>
              <span className={styles.sliderName}>Mobile & Internet (SIM)</span>
              <span className={styles.sliderValue}>QR {dataQAR} / mo</span>
            </div>
            <input
              type="range"
              min="20"
              max="500"
              step="5"
              value={dataQAR}
              onChange={(e) => handleSliderChange("data", parseInt(e.target.value))}
              className={styles.slider}
              aria-label="Mobile slider"
            />
            <span className={styles.sliderHint}>Essential for receiving calls & applying on LinkedIn/Indeed.</span>
          </div>

          <div className={styles.divider} />

          {/* Job hunting misc */}
          <div className={styles.sliderGroup}>
            <div className={styles.sliderLabelRow}>
              <span className={styles.sliderName}>Job Hunt Misc (CV, Copy, Clothes)</span>
              <span className={styles.sliderValue}>QR {miscQAR} / mo</span>
            </div>
            <input
              type="range"
              min="10"
              max="800"
              step="10"
              value={miscQAR}
              onChange={(e) => handleSliderChange("misc", parseInt(e.target.value))}
              className={styles.slider}
              aria-label="Miscellaneous slider"
            />
            <span className={styles.sliderHint}>Printing CVs, documents processing, dress clothes for interviews.</span>
          </div>
        </div>
      </section>

      {/* ── Job Hunting Expense Tracker ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Job Hunt Expenses Logged</h2>
        <div className={styles.card}>
          <div className={styles.jobSearchSpentHeader}>
            <span className={styles.jobSearchLabel}>Spent from active runway:</span>
            <span className={styles.jobSearchTotal}>
              {formatCents(totalJobSearchSpentCents, "QAR")}
            </span>
          </div>

          <div className={styles.divider} style={{ margin: "0.75rem 0" }} />

          {jobSearchTransactions.length === 0 ? (
            <div className={styles.emptyJobSearch}>
              <Icon name="briefcase" size={24} color="var(--ink-faint)" />
              <p>No job hunting expenses logged yet.</p>
              <p className={styles.emptyHint}>
                Add note words like "cv", "interview", "print", "formal" to log them under this section!
              </p>
            </div>
          ) : (
            <div className={styles.jsTransactionsList}>
              {jobSearchTransactions.slice(0, 5).map((t) => (
                <div key={t.id} className={styles.jsTransactionRow}>
                  <div className={styles.jsTxnMeta}>
                    <span className={styles.jsTxnNote}>{t.note || "Job Search Expense"}</span>
                    <span className={styles.jsTxnDate}>
                      {new Date(t.date).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                  <span className={styles.jsTxnAmount}>
                    {formatCents(t.amountCents, "QAR")}
                  </span>
                </div>
              ))}
              {jobSearchTransactions.length > 5 && (
                <div className={styles.moreTxnsText}>
                  + {jobSearchTransactions.length - 5} more transactions
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Doha Cost Reference Sheet ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Qatar Cost Reference Sheet</h2>
        <div className={styles.card}>
          <table className={styles.costTable}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Avg. Price</th>
                <th>Budget Tip</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Karak Tea</td>
                <td>QR 1.00 - 1.50</td>
                <td>Cheapest social drink in local cafeterias.</td>
              </tr>
              <tr>
                <td>Metro Ride</td>
                <td>QR 2.00</td>
                <td>Use MetroExpress (free feeder van) to reach station.</td>
              </tr>
              <tr>
                <td>Metro Monthly Pass</td>
                <td>QR 100.00</td>
                <td>Unlimited travel for 30 days. Perfect for job hunting.</td>
              </tr>
              <tr>
                <td>Grocery (Cook at home)</td>
                <td>QR 300 / mo</td>
                <td>Buy in Lulu, Safari or Family Food Centre. Avoid high-end imports.</td>
              </tr>
              <tr>
                <td>Shared Room / Bed space</td>
                <td>QR 500 - 900 / mo</td>
                <td>Najma, Mansoura, and Al Sadd have affordable options near Metro.</td>
              </tr>
              <tr>
                <td>SIM Flexi Packages</td>
                <td>QR 35 - 60 / mo</td>
                <td>Vodafone Flex or Ooredoo Halala. Use WiFi for calls to save data.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Survival Guide Tips ── */}
      <section className={styles.section} style={{ marginBottom: "5rem" }}>
        <h2 className={styles.sectionTitle}>Qatar Survival Tips for Job Seekers</h2>
        <div className={styles.tipsList}>
          <div className={styles.tipItem}>
            <span className={styles.tipIcon}><Icon name="sparkles" size={18} /></span>
            <div className={styles.tipText}>
              <strong>Housing near Transit:</strong> Prioritize staying in sharing partitions close to a Doha Metro Red/Gold/Green line station. It saves huge amounts of taxi fares. Najma, Mansoura, and Bin Mahmoud are popular.
            </div>
          </div>
          <div className={styles.tipItem}>
            <span className={styles.tipIcon}><Icon name="info" size={18} /></span>
            <div className={styles.tipText}>
              <strong>Doha Metro Card:</strong> Buy a Gold or Standard travel card immediately on arrival and register it in the Qatar Rail app. Recharge in bulk or use the QR 100 monthly pass if traveling daily.
            </div>
          </div>
          <div className={styles.tipItem}>
            <span className={styles.tipIcon}><Icon name="briefcase" size={18} /></span>
            <div className={styles.tipText}>
              <strong>Legal Note:</strong> If you secure a job, ensure your visa is legally transferred to the employer's sponsorship. The employer must issue a QID (Qatari residency ID card). Never work illegally on a tourist visa.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
