# Translation Keys: Staking Rewards Calculator

Translation keys for the staking rewards calculator interface across all 7 supported languages.
Follows the naming conventions in `src/locales/` and the patterns described in `i18n-patterns.md`.

Closes #1384

---

## Key definitions

All keys live under the `staking` top-level namespace.

| Key | Description |
|-----|-------------|
| `staking.calculator.title` | Calculator section heading |
| `staking.calculator.subtitle` | Short description |
| `staking.input.amount` | Staking amount input label |
| `staking.input.amountPlaceholder` | Placeholder for staking amount |
| `staking.input.duration` | Staking duration input label |
| `staking.input.apr` | APR input label |
| `staking.input.compoundFrequency` | Compounding frequency label |
| `staking.input.calculate` | Calculate CTA button |
| `staking.input.reset` | Reset CTA button |
| `staking.results.title` | Results section heading |
| `staking.results.estimatedRewards` | Estimated rewards label |
| `staking.results.totalValue` | Total value at end of period |
| `staking.results.effectiveApy` | Effective APY label |
| `staking.results.dailyRewards` | Daily rewards estimate |
| `staking.results.monthlyRewards` | Monthly rewards estimate |
| `staking.chart.title` | Chart section heading |
| `staking.chart.xAxis` | X-axis label (time) |
| `staking.chart.yAxis` | Y-axis label (value) |
| `staking.chart.principal` | Principal series label |
| `staking.chart.rewards` | Rewards series label |
| `staking.chart.totalValue` | Total value series label |
| `staking.period.days` | Days period selector label |
| `staking.period.weeks` | Weeks period selector label |
| `staking.period.months` | Months period selector label |
| `staking.period.years` | Years period selector label |
| `staking.period.custom` | Custom period option |
| `staking.error.invalidAmount` | Amount must be greater than zero |
| `staking.error.invalidApr` | APR must be between 0 and 100 |
| `staking.error.invalidDuration` | Duration must be greater than zero |
| `staking.error.fetchFailed` | Could not load staking data |

---

## Language files

### English (`src/locales/en/staking.json`)

```json
{
  "staking": {
    "calculator": {
      "title": "Staking Rewards Calculator",
      "subtitle": "Estimate your staking returns over time"
    },
    "input": {
      "amount": "Staking amount",
      "amountPlaceholder": "Enter amount",
      "duration": "Duration",
      "apr": "Annual percentage rate (APR)",
      "compoundFrequency": "Compounding frequency",
      "calculate": "Calculate",
      "reset": "Reset"
    },
    "results": {
      "title": "Estimated returns",
      "estimatedRewards": "Estimated rewards",
      "totalValue": "Total value",
      "effectiveApy": "Effective APY",
      "dailyRewards": "Daily rewards",
      "monthlyRewards": "Monthly rewards"
    },
    "chart": {
      "title": "Growth projection",
      "xAxis": "Time",
      "yAxis": "Value",
      "principal": "Principal",
      "rewards": "Rewards",
      "totalValue": "Total value"
    },
    "period": {
      "days": "Days",
      "weeks": "Weeks",
      "months": "Months",
      "years": "Years",
      "custom": "Custom"
    },
    "error": {
      "invalidAmount": "Amount must be greater than zero",
      "invalidApr": "APR must be between 0 and 100",
      "invalidDuration": "Duration must be greater than zero",
      "fetchFailed": "Could not load staking data. Please try again."
    }
  }
}
```

### Spanish (`src/locales/es/staking.json`)

```json
{
  "staking": {
    "calculator": {
      "title": "Calculadora de recompensas de staking",
      "subtitle": "Estima tus ganancias de staking a lo largo del tiempo"
    },
    "input": {
      "amount": "Monto en staking",
      "amountPlaceholder": "Ingresa el monto",
      "duration": "Duración",
      "apr": "Tasa de porcentaje anual (APR)",
      "compoundFrequency": "Frecuencia de capitalización",
      "calculate": "Calcular",
      "reset": "Restablecer"
    },
    "results": {
      "title": "Rendimientos estimados",
      "estimatedRewards": "Recompensas estimadas",
      "totalValue": "Valor total",
      "effectiveApy": "APY efectivo",
      "dailyRewards": "Recompensas diarias",
      "monthlyRewards": "Recompensas mensuales"
    },
    "chart": {
      "title": "Proyección de crecimiento",
      "xAxis": "Tiempo",
      "yAxis": "Valor",
      "principal": "Capital",
      "rewards": "Recompensas",
      "totalValue": "Valor total"
    },
    "period": {
      "days": "Días",
      "weeks": "Semanas",
      "months": "Meses",
      "years": "Años",
      "custom": "Personalizado"
    },
    "error": {
      "invalidAmount": "El monto debe ser mayor que cero",
      "invalidApr": "El APR debe estar entre 0 y 100",
      "invalidDuration": "La duración debe ser mayor que cero",
      "fetchFailed": "No se pudieron cargar los datos de staking. Inténtalo de nuevo."
    }
  }
}
```

### French (`src/locales/fr/staking.json`)

```json
{
  "staking": {
    "calculator": {
      "title": "Calculateur de récompenses de staking",
      "subtitle": "Estimez vos rendements de staking dans le temps"
    },
    "input": {
      "amount": "Montant en staking",
      "amountPlaceholder": "Saisir le montant",
      "duration": "Durée",
      "apr": "Taux annuel en pourcentage (APR)",
      "compoundFrequency": "Fréquence de capitalisation",
      "calculate": "Calculer",
      "reset": "Réinitialiser"
    },
    "results": {
      "title": "Rendements estimés",
      "estimatedRewards": "Récompenses estimées",
      "totalValue": "Valeur totale",
      "effectiveApy": "APY effectif",
      "dailyRewards": "Récompenses quotidiennes",
      "monthlyRewards": "Récompenses mensuelles"
    },
    "chart": {
      "title": "Projection de croissance",
      "xAxis": "Temps",
      "yAxis": "Valeur",
      "principal": "Capital",
      "rewards": "Récompenses",
      "totalValue": "Valeur totale"
    },
    "period": {
      "days": "Jours",
      "weeks": "Semaines",
      "months": "Mois",
      "years": "Années",
      "custom": "Personnalisé"
    },
    "error": {
      "invalidAmount": "Le montant doit être supérieur à zéro",
      "invalidApr": "L'APR doit être compris entre 0 et 100",
      "invalidDuration": "La durée doit être supérieure à zéro",
      "fetchFailed": "Impossible de charger les données de staking. Veuillez réessayer."
    }
  }
}
```

### German (`src/locales/de/staking.json`)

```json
{
  "staking": {
    "calculator": {
      "title": "Staking-Ertragsrechner",
      "subtitle": "Schätzen Sie Ihre Staking-Renditen über die Zeit"
    },
    "input": {
      "amount": "Staking-Betrag",
      "amountPlaceholder": "Betrag eingeben",
      "duration": "Laufzeit",
      "apr": "Jährlicher Zinssatz (APR)",
      "compoundFrequency": "Zinseszinsfrequenz",
      "calculate": "Berechnen",
      "reset": "Zurücksetzen"
    },
    "results": {
      "title": "Geschätzte Renditen",
      "estimatedRewards": "Geschätzte Belohnungen",
      "totalValue": "Gesamtwert",
      "effectiveApy": "Effektiver APY",
      "dailyRewards": "Tägliche Belohnungen",
      "monthlyRewards": "Monatliche Belohnungen"
    },
    "chart": {
      "title": "Wachstumsprognose",
      "xAxis": "Zeit",
      "yAxis": "Wert",
      "principal": "Kapital",
      "rewards": "Belohnungen",
      "totalValue": "Gesamtwert"
    },
    "period": {
      "days": "Tage",
      "weeks": "Wochen",
      "months": "Monate",
      "years": "Jahre",
      "custom": "Benutzerdefiniert"
    },
    "error": {
      "invalidAmount": "Der Betrag muss größer als null sein",
      "invalidApr": "Der APR muss zwischen 0 und 100 liegen",
      "invalidDuration": "Die Laufzeit muss größer als null sein",
      "fetchFailed": "Staking-Daten konnten nicht geladen werden. Bitte versuchen Sie es erneut."
    }
  }
}
```

### Chinese Simplified (`src/locales/zh/staking.json`)

```json
{
  "staking": {
    "calculator": {
      "title": "质押奖励计算器",
      "subtitle": "估算您随时间变化的质押收益"
    },
    "input": {
      "amount": "质押金额",
      "amountPlaceholder": "输入金额",
      "duration": "持续时间",
      "apr": "年化收益率（APR）",
      "compoundFrequency": "复利频率",
      "calculate": "计算",
      "reset": "重置"
    },
    "results": {
      "title": "预计收益",
      "estimatedRewards": "预计奖励",
      "totalValue": "总价值",
      "effectiveApy": "实际APY",
      "dailyRewards": "每日奖励",
      "monthlyRewards": "每月奖励"
    },
    "chart": {
      "title": "增长预测",
      "xAxis": "时间",
      "yAxis": "价值",
      "principal": "本金",
      "rewards": "奖励",
      "totalValue": "总价值"
    },
    "period": {
      "days": "天",
      "weeks": "周",
      "months": "月",
      "years": "年",
      "custom": "自定义"
    },
    "error": {
      "invalidAmount": "金额必须大于零",
      "invalidApr": "APR必须在0到100之间",
      "invalidDuration": "持续时间必须大于零",
      "fetchFailed": "无法加载质押数据，请重试。"
    }
  }
}
```

### Arabic (`src/locales/ar/staking.json`)

```json
{
  "staking": {
    "calculator": {
      "title": "حاسبة مكافآت التخزين",
      "subtitle": "احسب عوائد التخزين الخاصة بك بمرور الوقت"
    },
    "input": {
      "amount": "مبلغ التخزين",
      "amountPlaceholder": "أدخل المبلغ",
      "duration": "المدة",
      "apr": "معدل الفائدة السنوي (APR)",
      "compoundFrequency": "تكرار الفائدة المركبة",
      "calculate": "احسب",
      "reset": "إعادة تعيين"
    },
    "results": {
      "title": "العوائد المقدّرة",
      "estimatedRewards": "المكافآت المقدّرة",
      "totalValue": "القيمة الإجمالية",
      "effectiveApy": "APY الفعلي",
      "dailyRewards": "المكافآت اليومية",
      "monthlyRewards": "المكافآت الشهرية"
    },
    "chart": {
      "title": "توقعات النمو",
      "xAxis": "الوقت",
      "yAxis": "القيمة",
      "principal": "رأس المال",
      "rewards": "المكافآت",
      "totalValue": "القيمة الإجمالية"
    },
    "period": {
      "days": "أيام",
      "weeks": "أسابيع",
      "months": "أشهر",
      "years": "سنوات",
      "custom": "مخصص"
    },
    "error": {
      "invalidAmount": "يجب أن يكون المبلغ أكبر من صفر",
      "invalidApr": "يجب أن يكون APR بين 0 و100",
      "invalidDuration": "يجب أن تكون المدة أكبر من صفر",
      "fetchFailed": "تعذّر تحميل بيانات التخزين. يرجى المحاولة مرة أخرى."
    }
  }
}
```

### Hebrew (`src/locales/he/staking.json`)

```json
{
  "staking": {
    "calculator": {
      "title": "מחשבון תגמולי סטייקינג",
      "subtitle": "הערך את תשואות הסטייקינג שלך לאורך זמן"
    },
    "input": {
      "amount": "סכום הסטייקינג",
      "amountPlaceholder": "הזן סכום",
      "duration": "משך זמן",
      "apr": "שיעור ריבית שנתי (APR)",
      "compoundFrequency": "תדירות ריבית דריבית",
      "calculate": "חשב",
      "reset": "אפס"
    },
    "results": {
      "title": "תשואות משוערות",
      "estimatedRewards": "תגמולים משוערים",
      "totalValue": "ערך כולל",
      "effectiveApy": "APY אפקטיבי",
      "dailyRewards": "תגמולים יומיים",
      "monthlyRewards": "תגמולים חודשיים"
    },
    "chart": {
      "title": "תחזית צמיחה",
      "xAxis": "זמן",
      "yAxis": "ערך",
      "principal": "קרן",
      "rewards": "תגמולים",
      "totalValue": "ערך כולל"
    },
    "period": {
      "days": "ימים",
      "weeks": "שבועות",
      "months": "חודשים",
      "years": "שנים",
      "custom": "מותאם אישית"
    },
    "error": {
      "invalidAmount": "הסכום חייב להיות גדול מאפס",
      "invalidApr": "APR חייב להיות בין 0 ל-100",
      "invalidDuration": "משך הזמן חייב להיות גדול מאפס",
      "fetchFailed": "לא ניתן לטעון נתוני סטייקינג. נסה שוב."
    }
  }
}
```
