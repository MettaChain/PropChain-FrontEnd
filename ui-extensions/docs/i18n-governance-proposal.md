# Translation Keys: Governance Proposal Interface

Translation keys for the governance proposal interface across all 7 supported languages.
Follows the naming conventions in `src/locales/` and the patterns described in `i18n-patterns.md`.

Closes #1386

---

## Key definitions

All keys live under the `governance` top-level namespace.

| Key | Description |
|-----|-------------|
| `governance.title` | Page / panel heading |
| `governance.subtitle` | Short description of the governance section |
| `governance.status.active` | Proposal is open for voting |
| `governance.status.pending` | Proposal not yet started |
| `governance.status.passed` | Proposal passed |
| `governance.status.rejected` | Proposal rejected |
| `governance.status.cancelled` | Proposal was cancelled |
| `governance.status.executed` | Proposal has been executed on-chain |
| `governance.vote.for` | "For" vote button label |
| `governance.vote.against` | "Against" vote button label |
| `governance.vote.abstain` | "Abstain" vote button label |
| `governance.vote.cast` | Submit vote CTA |
| `governance.vote.change` | Change an existing vote |
| `governance.vote.alreadyCast` | Informational: vote already submitted |
| `governance.distribution.title` | Heading for vote distribution chart |
| `governance.distribution.forPct` | Label for the "For" percentage |
| `governance.distribution.againstPct` | Label for the "Against" percentage |
| `governance.distribution.abstainPct` | Label for the "Abstain" percentage |
| `governance.distribution.quorum` | Quorum threshold label |
| `governance.distribution.quorumMet` | Quorum has been reached |
| `governance.distribution.quorumNotMet` | Quorum has not been reached |
| `governance.details.proposer` | "Proposer" field label |
| `governance.details.created` | "Created" date label |
| `governance.details.start` | "Voting starts" label |
| `governance.details.end` | "Voting ends" label |
| `governance.details.snapshotBlock` | "Snapshot block" label |
| `governance.details.description` | "Description" section heading |
| `governance.details.actions` | "On-chain actions" section heading |
| `governance.error.fetchFailed` | Could not load proposals |
| `governance.error.voteFailed` | Vote transaction failed |
| `governance.error.alreadyVoted` | Wallet has already voted |
| `governance.error.notEligible` | Wallet is not eligible to vote |
| `governance.error.networkMismatch` | Connected to the wrong network |

---

## Language files

### English (`src/locales/en/governance.json`)

```json
{
  "governance": {
    "title": "Governance",
    "subtitle": "Vote on proposals that shape the protocol",
    "status": {
      "active": "Active",
      "pending": "Pending",
      "passed": "Passed",
      "rejected": "Rejected",
      "cancelled": "Cancelled",
      "executed": "Executed"
    },
    "vote": {
      "for": "For",
      "against": "Against",
      "abstain": "Abstain",
      "cast": "Cast vote",
      "change": "Change vote",
      "alreadyCast": "You have already voted on this proposal"
    },
    "distribution": {
      "title": "Vote distribution",
      "forPct": "For",
      "againstPct": "Against",
      "abstainPct": "Abstain",
      "quorum": "Quorum",
      "quorumMet": "Quorum reached",
      "quorumNotMet": "Quorum not reached"
    },
    "details": {
      "proposer": "Proposer",
      "created": "Created",
      "start": "Voting starts",
      "end": "Voting ends",
      "snapshotBlock": "Snapshot block",
      "description": "Description",
      "actions": "On-chain actions"
    },
    "error": {
      "fetchFailed": "Could not load proposals. Please try again.",
      "voteFailed": "Vote transaction failed. Please try again.",
      "alreadyVoted": "Your wallet has already voted on this proposal.",
      "notEligible": "Your wallet is not eligible to vote.",
      "networkMismatch": "Please switch to the correct network to vote."
    }
  }
}
```

### Spanish (`src/locales/es/governance.json`)

```json
{
  "governance": {
    "title": "Gobernanza",
    "subtitle": "Vota las propuestas que dan forma al protocolo",
    "status": {
      "active": "Activo",
      "pending": "Pendiente",
      "passed": "Aprobado",
      "rejected": "Rechazado",
      "cancelled": "Cancelado",
      "executed": "Ejecutado"
    },
    "vote": {
      "for": "A favor",
      "against": "En contra",
      "abstain": "Abstención",
      "cast": "Emitir voto",
      "change": "Cambiar voto",
      "alreadyCast": "Ya has votado en esta propuesta"
    },
    "distribution": {
      "title": "Distribución de votos",
      "forPct": "A favor",
      "againstPct": "En contra",
      "abstainPct": "Abstención",
      "quorum": "Quórum",
      "quorumMet": "Quórum alcanzado",
      "quorumNotMet": "Quórum no alcanzado"
    },
    "details": {
      "proposer": "Proponente",
      "created": "Creado",
      "start": "Inicio de la votación",
      "end": "Fin de la votación",
      "snapshotBlock": "Bloque de instantánea",
      "description": "Descripción",
      "actions": "Acciones en cadena"
    },
    "error": {
      "fetchFailed": "No se pudieron cargar las propuestas. Inténtalo de nuevo.",
      "voteFailed": "La transacción de voto falló. Inténtalo de nuevo.",
      "alreadyVoted": "Tu cartera ya ha votado en esta propuesta.",
      "notEligible": "Tu cartera no es elegible para votar.",
      "networkMismatch": "Cambia a la red correcta para votar."
    }
  }
}
```

### French (`src/locales/fr/governance.json`)

```json
{
  "governance": {
    "title": "Gouvernance",
    "subtitle": "Votez sur les propositions qui façonnent le protocole",
    "status": {
      "active": "Actif",
      "pending": "En attente",
      "passed": "Adopté",
      "rejected": "Rejeté",
      "cancelled": "Annulé",
      "executed": "Exécuté"
    },
    "vote": {
      "for": "Pour",
      "against": "Contre",
      "abstain": "Abstention",
      "cast": "Voter",
      "change": "Modifier le vote",
      "alreadyCast": "Vous avez déjà voté sur cette proposition"
    },
    "distribution": {
      "title": "Répartition des votes",
      "forPct": "Pour",
      "againstPct": "Contre",
      "abstainPct": "Abstention",
      "quorum": "Quorum",
      "quorumMet": "Quorum atteint",
      "quorumNotMet": "Quorum non atteint"
    },
    "details": {
      "proposer": "Proposant",
      "created": "Créé le",
      "start": "Début du vote",
      "end": "Fin du vote",
      "snapshotBlock": "Bloc de référence",
      "description": "Description",
      "actions": "Actions on-chain"
    },
    "error": {
      "fetchFailed": "Impossible de charger les propositions. Veuillez réessayer.",
      "voteFailed": "La transaction de vote a échoué. Veuillez réessayer.",
      "alreadyVoted": "Votre portefeuille a déjà voté sur cette proposition.",
      "notEligible": "Votre portefeuille n'est pas éligible pour voter.",
      "networkMismatch": "Veuillez basculer sur le bon réseau pour voter."
    }
  }
}
```

### German (`src/locales/de/governance.json`)

```json
{
  "governance": {
    "title": "Governance",
    "subtitle": "Stimmen Sie über Vorschläge ab, die das Protokoll gestalten",
    "status": {
      "active": "Aktiv",
      "pending": "Ausstehend",
      "passed": "Angenommen",
      "rejected": "Abgelehnt",
      "cancelled": "Abgebrochen",
      "executed": "Ausgeführt"
    },
    "vote": {
      "for": "Dafür",
      "against": "Dagegen",
      "abstain": "Enthaltung",
      "cast": "Abstimmen",
      "change": "Abstimmung ändern",
      "alreadyCast": "Sie haben bereits über diesen Vorschlag abgestimmt"
    },
    "distribution": {
      "title": "Abstimmungsverteilung",
      "forPct": "Dafür",
      "againstPct": "Dagegen",
      "abstainPct": "Enthaltung",
      "quorum": "Quorum",
      "quorumMet": "Quorum erreicht",
      "quorumNotMet": "Quorum nicht erreicht"
    },
    "details": {
      "proposer": "Antragsteller",
      "created": "Erstellt",
      "start": "Abstimmungsbeginn",
      "end": "Abstimmungsende",
      "snapshotBlock": "Snapshot-Block",
      "description": "Beschreibung",
      "actions": "On-Chain-Aktionen"
    },
    "error": {
      "fetchFailed": "Vorschläge konnten nicht geladen werden. Bitte versuchen Sie es erneut.",
      "voteFailed": "Abstimmungstransaktion fehlgeschlagen. Bitte erneut versuchen.",
      "alreadyVoted": "Ihre Wallet hat bereits über diesen Vorschlag abgestimmt.",
      "notEligible": "Ihre Wallet ist nicht abstimmungsberechtigt.",
      "networkMismatch": "Bitte wechseln Sie zum richtigen Netzwerk, um abzustimmen."
    }
  }
}
```

### Chinese Simplified (`src/locales/zh/governance.json`)

```json
{
  "governance": {
    "title": "治理",
    "subtitle": "对塑造协议的提案进行投票",
    "status": {
      "active": "活跃",
      "pending": "待处理",
      "passed": "已通过",
      "rejected": "已拒绝",
      "cancelled": "已取消",
      "executed": "已执行"
    },
    "vote": {
      "for": "支持",
      "against": "反对",
      "abstain": "弃权",
      "cast": "投票",
      "change": "更改投票",
      "alreadyCast": "您已对此提案投票"
    },
    "distribution": {
      "title": "投票分布",
      "forPct": "支持",
      "againstPct": "反对",
      "abstainPct": "弃权",
      "quorum": "法定人数",
      "quorumMet": "已达法定人数",
      "quorumNotMet": "未达法定人数"
    },
    "details": {
      "proposer": "提案人",
      "created": "创建时间",
      "start": "投票开始",
      "end": "投票结束",
      "snapshotBlock": "快照区块",
      "description": "描述",
      "actions": "链上操作"
    },
    "error": {
      "fetchFailed": "无法加载提案，请重试。",
      "voteFailed": "投票交易失败，请重试。",
      "alreadyVoted": "您的钱包已对此提案投票。",
      "notEligible": "您的钱包没有投票资格。",
      "networkMismatch": "请切换到正确的网络进行投票。"
    }
  }
}
```

### Arabic (`src/locales/ar/governance.json`)

```json
{
  "governance": {
    "title": "الحوكمة",
    "subtitle": "صوّت على المقترحات التي تشكّل البروتوكول",
    "status": {
      "active": "نشط",
      "pending": "قيد الانتظار",
      "passed": "مقبول",
      "rejected": "مرفوض",
      "cancelled": "ملغى",
      "executed": "منفَّذ"
    },
    "vote": {
      "for": "مع",
      "against": "ضد",
      "abstain": "امتناع",
      "cast": "تصويت",
      "change": "تغيير التصويت",
      "alreadyCast": "لقد صوّتت بالفعل على هذا المقترح"
    },
    "distribution": {
      "title": "توزيع الأصوات",
      "forPct": "مع",
      "againstPct": "ضد",
      "abstainPct": "امتناع",
      "quorum": "النصاب",
      "quorumMet": "تم بلوغ النصاب",
      "quorumNotMet": "لم يتم بلوغ النصاب"
    },
    "details": {
      "proposer": "مقدّم المقترح",
      "created": "تاريخ الإنشاء",
      "start": "بدء التصويت",
      "end": "نهاية التصويت",
      "snapshotBlock": "كتلة اللقطة",
      "description": "الوصف",
      "actions": "الإجراءات على السلسلة"
    },
    "error": {
      "fetchFailed": "تعذّر تحميل المقترحات. يرجى المحاولة مرة أخرى.",
      "voteFailed": "فشلت معاملة التصويت. يرجى المحاولة مرة أخرى.",
      "alreadyVoted": "صوّتت محفظتك بالفعل على هذا المقترح.",
      "notEligible": "محفظتك غير مؤهلة للتصويت.",
      "networkMismatch": "يرجى التبديل إلى الشبكة الصحيحة للتصويت."
    }
  }
}
```

### Hebrew (`src/locales/he/governance.json`)

```json
{
  "governance": {
    "title": "ממשל",
    "subtitle": "הצבע על הצעות שמעצבות את הפרוטוקול",
    "status": {
      "active": "פעיל",
      "pending": "ממתין",
      "passed": "עבר",
      "rejected": "נדחה",
      "cancelled": "בוטל",
      "executed": "בוצע"
    },
    "vote": {
      "for": "בעד",
      "against": "נגד",
      "abstain": "נמנע",
      "cast": "הצבע",
      "change": "שנה הצבעה",
      "alreadyCast": "כבר הצבעת על הצעה זו"
    },
    "distribution": {
      "title": "התפלגות הצבעות",
      "forPct": "בעד",
      "againstPct": "נגד",
      "abstainPct": "נמנע",
      "quorum": "מניין",
      "quorumMet": "המניין הושג",
      "quorumNotMet": "המניין לא הושג"
    },
    "details": {
      "proposer": "מציע",
      "created": "נוצר",
      "start": "תחילת הצבעה",
      "end": "סיום הצבעה",
      "snapshotBlock": "בלוק תמונת מצב",
      "description": "תיאור",
      "actions": "פעולות בשרשרת"
    },
    "error": {
      "fetchFailed": "לא ניתן לטעון הצעות. נסה שוב.",
      "voteFailed": "עסקת ההצבעה נכשלה. נסה שוב.",
      "alreadyVoted": "הארנק שלך כבר הצביע על הצעה זו.",
      "notEligible": "הארנק שלך אינו זכאי להצביע.",
      "networkMismatch": "החלף לרשת הנכונה כדי להצביע."
    }
  }
}
```
