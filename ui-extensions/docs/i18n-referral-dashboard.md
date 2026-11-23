# Translation Keys: Referral Program Dashboard

Translation keys for the referral program dashboard across all 7 supported languages.
Follows the naming conventions in `src/locales/` and the patterns described in `i18n-patterns.md`.

Closes #1390

---

## Key definitions

All keys live under the `referral` top-level namespace (extending the existing `src/locales/en/referral.json`).

| Key | Description |
|-----|-------------|
| `referral.dashboard.title` | Dashboard page heading |
| `referral.dashboard.subtitle` | Short description |
| `referral.stats.invited` | Number of people invited |
| `referral.stats.registered` | Number who registered |
| `referral.stats.converted` | Number who completed a transaction |
| `referral.stats.pendingRewards` | Rewards pending payout |
| `referral.stats.lifetimeEarnings` | Total lifetime earnings |
| `referral.link.title` | Referral link section heading |
| `referral.link.copy` | Copy link button |
| `referral.link.copied` | Confirmation after copy |
| `referral.link.share` | Share button |
| `referral.link.qrCode` | QR code label |
| `referral.share.email` | Share via email |
| `referral.share.twitter` | Share on Twitter |
| `referral.share.telegram` | Share on Telegram |
| `referral.share.whatsapp` | Share on WhatsApp |
| `referral.share.message` | Default share message body |
| `referral.rewards.title` | Reward history section heading |
| `referral.rewards.date` | Date column header |
| `referral.rewards.referree` | Referred user column header |
| `referral.rewards.action` | Action column header |
| `referral.rewards.amount` | Amount column header |
| `referral.rewards.status` | Status column header |
| `referral.rewards.empty` | Empty state message |
| `referral.rewards.claimAll` | Claim all rewards CTA |
| `referral.leaderboard.title` | Leaderboard section heading |
| `referral.leaderboard.rank` | Rank column header |
| `referral.leaderboard.user` | User column header |
| `referral.leaderboard.referrals` | Referrals column header |
| `referral.leaderboard.earnings` | Earnings column header |
| `referral.leaderboard.youAre` | "You are ranked #N" message |
| `referral.leaderboard.empty` | No data available |

---

## Language files

### English (`src/locales/en/referral.json` — extended section)

```json
{
  "referral": {
    "dashboard": {
      "title": "Referral Dashboard",
      "subtitle": "Track your referrals and rewards"
    },
    "stats": {
      "invited": "Invited",
      "registered": "Registered",
      "converted": "Converted",
      "pendingRewards": "Pending rewards",
      "lifetimeEarnings": "Lifetime earnings"
    },
    "link": {
      "title": "Your referral link",
      "copy": "Copy link",
      "copied": "Link copied!",
      "share": "Share",
      "qrCode": "QR code"
    },
    "share": {
      "email": "Share via email",
      "twitter": "Share on Twitter",
      "telegram": "Share on Telegram",
      "whatsapp": "Share on WhatsApp",
      "message": "Join PropChain and start investing in tokenised real estate!"
    },
    "rewards": {
      "title": "Reward history",
      "date": "Date",
      "referree": "Referred user",
      "action": "Action",
      "amount": "Amount",
      "status": "Status",
      "empty": "No rewards yet. Start sharing your link!",
      "claimAll": "Claim all rewards"
    },
    "leaderboard": {
      "title": "Leaderboard",
      "rank": "Rank",
      "user": "User",
      "referrals": "Referrals",
      "earnings": "Earnings",
      "youAre": "You are ranked #{{rank}}",
      "empty": "No data available"
    }
  }
}
```

### Spanish (`src/locales/es/referral.json`)

```json
{
  "referral": {
    "dashboard": {
      "title": "Panel de referidos",
      "subtitle": "Sigue tus referidos y recompensas"
    },
    "stats": {
      "invited": "Invitados",
      "registered": "Registrados",
      "converted": "Convertidos",
      "pendingRewards": "Recompensas pendientes",
      "lifetimeEarnings": "Ganancias totales"
    },
    "link": {
      "title": "Tu enlace de referido",
      "copy": "Copiar enlace",
      "copied": "¡Enlace copiado!",
      "share": "Compartir",
      "qrCode": "Código QR"
    },
    "share": {
      "email": "Compartir por email",
      "twitter": "Compartir en Twitter",
      "telegram": "Compartir en Telegram",
      "whatsapp": "Compartir en WhatsApp",
      "message": "¡Únete a PropChain e invierte en bienes raíces tokenizados!"
    },
    "rewards": {
      "title": "Historial de recompensas",
      "date": "Fecha",
      "referree": "Usuario referido",
      "action": "Acción",
      "amount": "Monto",
      "status": "Estado",
      "empty": "Sin recompensas aún. ¡Empieza a compartir tu enlace!",
      "claimAll": "Reclamar todas las recompensas"
    },
    "leaderboard": {
      "title": "Tabla de clasificación",
      "rank": "Posición",
      "user": "Usuario",
      "referrals": "Referidos",
      "earnings": "Ganancias",
      "youAre": "Estás en el puesto #{{rank}}",
      "empty": "No hay datos disponibles"
    }
  }
}
```

### French (`src/locales/fr/referral.json`)

```json
{
  "referral": {
    "dashboard": {
      "title": "Tableau de bord de parrainage",
      "subtitle": "Suivez vos parrainages et récompenses"
    },
    "stats": {
      "invited": "Invités",
      "registered": "Inscrits",
      "converted": "Convertis",
      "pendingRewards": "Récompenses en attente",
      "lifetimeEarnings": "Gains totaux"
    },
    "link": {
      "title": "Votre lien de parrainage",
      "copy": "Copier le lien",
      "copied": "Lien copié !",
      "share": "Partager",
      "qrCode": "Code QR"
    },
    "share": {
      "email": "Partager par e-mail",
      "twitter": "Partager sur Twitter",
      "telegram": "Partager sur Telegram",
      "whatsapp": "Partager sur WhatsApp",
      "message": "Rejoignez PropChain et investissez dans l'immobilier tokenisé !"
    },
    "rewards": {
      "title": "Historique des récompenses",
      "date": "Date",
      "referree": "Utilisateur parrainé",
      "action": "Action",
      "amount": "Montant",
      "status": "Statut",
      "empty": "Pas encore de récompenses. Commencez à partager votre lien !",
      "claimAll": "Réclamer toutes les récompenses"
    },
    "leaderboard": {
      "title": "Classement",
      "rank": "Rang",
      "user": "Utilisateur",
      "referrals": "Parrainages",
      "earnings": "Gains",
      "youAre": "Vous êtes classé #{{rank}}",
      "empty": "Aucune donnée disponible"
    }
  }
}
```

### German (`src/locales/de/referral.json`)

```json
{
  "referral": {
    "dashboard": {
      "title": "Empfehlungs-Dashboard",
      "subtitle": "Verfolgen Sie Ihre Empfehlungen und Prämien"
    },
    "stats": {
      "invited": "Eingeladen",
      "registered": "Registriert",
      "converted": "Konvertiert",
      "pendingRewards": "Ausstehende Prämien",
      "lifetimeEarnings": "Gesamteinnahmen"
    },
    "link": {
      "title": "Ihr Empfehlungslink",
      "copy": "Link kopieren",
      "copied": "Link kopiert!",
      "share": "Teilen",
      "qrCode": "QR-Code"
    },
    "share": {
      "email": "Per E-Mail teilen",
      "twitter": "Auf Twitter teilen",
      "telegram": "Auf Telegram teilen",
      "whatsapp": "Auf WhatsApp teilen",
      "message": "Treten Sie PropChain bei und investieren Sie in tokenisierte Immobilien!"
    },
    "rewards": {
      "title": "Prämienhistorie",
      "date": "Datum",
      "referree": "Geworbener Nutzer",
      "action": "Aktion",
      "amount": "Betrag",
      "status": "Status",
      "empty": "Noch keine Prämien. Teilen Sie Ihren Link!",
      "claimAll": "Alle Prämien einlösen"
    },
    "leaderboard": {
      "title": "Rangliste",
      "rank": "Rang",
      "user": "Nutzer",
      "referrals": "Empfehlungen",
      "earnings": "Einnahmen",
      "youAre": "Sie sind auf Platz #{{rank}}",
      "empty": "Keine Daten verfügbar"
    }
  }
}
```

### Chinese Simplified (`src/locales/zh/referral.json`)

```json
{
  "referral": {
    "dashboard": {
      "title": "推荐仪表板",
      "subtitle": "跟踪您的推荐和奖励"
    },
    "stats": {
      "invited": "已邀请",
      "registered": "已注册",
      "converted": "已转化",
      "pendingRewards": "待领取奖励",
      "lifetimeEarnings": "累计收益"
    },
    "link": {
      "title": "您的推荐链接",
      "copy": "复制链接",
      "copied": "链接已复制！",
      "share": "分享",
      "qrCode": "二维码"
    },
    "share": {
      "email": "通过邮件分享",
      "twitter": "在Twitter分享",
      "telegram": "在Telegram分享",
      "whatsapp": "在WhatsApp分享",
      "message": "加入PropChain，投资代币化房地产！"
    },
    "rewards": {
      "title": "奖励历史",
      "date": "日期",
      "referree": "被推荐用户",
      "action": "操作",
      "amount": "金额",
      "status": "状态",
      "empty": "暂无奖励，开始分享您的链接吧！",
      "claimAll": "领取所有奖励"
    },
    "leaderboard": {
      "title": "排行榜",
      "rank": "排名",
      "user": "用户",
      "referrals": "推荐数",
      "earnings": "收益",
      "youAre": "您排名第 #{{rank}}",
      "empty": "暂无数据"
    }
  }
}
```

### Arabic (`src/locales/ar/referral.json`)

```json
{
  "referral": {
    "dashboard": {
      "title": "لوحة الإحالة",
      "subtitle": "تتبع إحالاتك ومكافآتك"
    },
    "stats": {
      "invited": "مدعوون",
      "registered": "مسجلون",
      "converted": "محوّلون",
      "pendingRewards": "مكافآت معلقة",
      "lifetimeEarnings": "الأرباح الإجمالية"
    },
    "link": {
      "title": "رابط الإحالة الخاص بك",
      "copy": "نسخ الرابط",
      "copied": "تم نسخ الرابط!",
      "share": "مشاركة",
      "qrCode": "رمز QR"
    },
    "share": {
      "email": "المشاركة عبر البريد الإلكتروني",
      "twitter": "المشاركة على تويتر",
      "telegram": "المشاركة على تيليغرام",
      "whatsapp": "المشاركة على واتساب",
      "message": "انضم إلى PropChain واستثمر في العقارات المرمّزة!"
    },
    "rewards": {
      "title": "سجل المكافآت",
      "date": "التاريخ",
      "referree": "المستخدم المُحال",
      "action": "الإجراء",
      "amount": "المبلغ",
      "status": "الحالة",
      "empty": "لا توجد مكافآت بعد. ابدأ بمشاركة رابطك!",
      "claimAll": "المطالبة بجميع المكافآت"
    },
    "leaderboard": {
      "title": "لوحة المتصدرين",
      "rank": "الترتيب",
      "user": "المستخدم",
      "referrals": "الإحالات",
      "earnings": "الأرباح",
      "youAre": "أنت في المرتبة #{{rank}}",
      "empty": "لا توجد بيانات متاحة"
    }
  }
}
```

### Hebrew (`src/locales/he/referral.json`)

```json
{
  "referral": {
    "dashboard": {
      "title": "לוח הפניות",
      "subtitle": "עקוב אחר ההפניות והתגמולים שלך"
    },
    "stats": {
      "invited": "הוזמנו",
      "registered": "נרשמו",
      "converted": "הומרו",
      "pendingRewards": "תגמולים בהמתנה",
      "lifetimeEarnings": "הכנסות כוללות"
    },
    "link": {
      "title": "קישור ההפניה שלך",
      "copy": "העתק קישור",
      "copied": "הקישור הועתק!",
      "share": "שתף",
      "qrCode": "קוד QR"
    },
    "share": {
      "email": "שתף באימייל",
      "twitter": "שתף בטוויטר",
      "telegram": "שתף בטלגרם",
      "whatsapp": "שתף בוואטסאפ",
      "message": "הצטרף ל-PropChain והשקע בנדל\"ן מאוחד!"
    },
    "rewards": {
      "title": "היסטוריית תגמולים",
      "date": "תאריך",
      "referree": "משתמש מופנה",
      "action": "פעולה",
      "amount": "סכום",
      "status": "סטטוס",
      "empty": "אין תגמולים עדיין. התחל לשתף את הקישור שלך!",
      "claimAll": "תבע את כל התגמולים"
    },
    "leaderboard": {
      "title": "לוח מובילים",
      "rank": "דירוג",
      "user": "משתמש",
      "referrals": "הפניות",
      "earnings": "הכנסות",
      "youAre": "אתה מדורג במקום #{{rank}}",
      "empty": "אין נתונים זמינים"
    }
  }
}
```
