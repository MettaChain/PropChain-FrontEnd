# Translation Keys: KYC Verification Flow

Translation keys for the KYC verification stepper interface across all 7 supported languages.
Follows the naming conventions in `src/locales/` and the patterns described in `i18n-patterns.md`.

Closes #1388

---

## Key definitions

All keys live under the `kyc` top-level namespace.

| Key | Description |
|-----|-------------|
| `kyc.title` | Page heading |
| `kyc.subtitle` | Short description |
| `kyc.steps.identity` | Step 1 label — Identity |
| `kyc.steps.address` | Step 2 label — Address |
| `kyc.steps.documents` | Step 3 label — Documents |
| `kyc.steps.review` | Step 4 label — Review |
| `kyc.steps.complete` | Step 5 label — Complete |
| `kyc.fields.firstName` | First name field label |
| `kyc.fields.lastName` | Last name field label |
| `kyc.fields.dateOfBirth` | Date of birth label |
| `kyc.fields.nationality` | Nationality label |
| `kyc.fields.streetAddress` | Street address label |
| `kyc.fields.city` | City label |
| `kyc.fields.postCode` | Postal code label |
| `kyc.fields.country` | Country label |
| `kyc.fields.documentType` | Document type label |
| `kyc.fields.documentNumber` | Document number label |
| `kyc.validation.required` | Field is required |
| `kyc.validation.invalidDate` | Invalid date format |
| `kyc.validation.invalidDocument` | Invalid document number |
| `kyc.validation.minAge` | Must be at least 18 years old |
| `kyc.upload.title` | Upload section heading |
| `kyc.upload.front` | Upload front of document |
| `kyc.upload.back` | Upload back of document |
| `kyc.upload.selfie` | Upload selfie |
| `kyc.upload.instructions` | General upload instructions |
| `kyc.upload.sizeLimit` | File size limit notice |
| `kyc.upload.formats` | Accepted file formats |
| `kyc.upload.retry` | Retry upload CTA |
| `kyc.review.title` | Review summary heading |
| `kyc.review.personal` | Personal information section |
| `kyc.review.addressSection` | Address section |
| `kyc.review.documents` | Documents section |
| `kyc.review.edit` | Edit button label |
| `kyc.review.submit` | Submit for verification CTA |
| `kyc.status.pending` | Verification pending |
| `kyc.status.approved` | Verification approved |
| `kyc.status.rejected` | Verification rejected |
| `kyc.status.resubmit` | Resubmission required |

---

## Language files

### English (`src/locales/en/kyc.json`)

```json
{
  "kyc": {
    "title": "Identity Verification",
    "subtitle": "Complete KYC to access all platform features",
    "steps": {
      "identity": "Identity",
      "address": "Address",
      "documents": "Documents",
      "review": "Review",
      "complete": "Complete"
    },
    "fields": {
      "firstName": "First name",
      "lastName": "Last name",
      "dateOfBirth": "Date of birth",
      "nationality": "Nationality",
      "streetAddress": "Street address",
      "city": "City",
      "postCode": "Postal code",
      "country": "Country",
      "documentType": "Document type",
      "documentNumber": "Document number"
    },
    "validation": {
      "required": "This field is required",
      "invalidDate": "Please enter a valid date",
      "invalidDocument": "Invalid document number",
      "minAge": "You must be at least 18 years old"
    },
    "upload": {
      "title": "Upload documents",
      "front": "Front of document",
      "back": "Back of document",
      "selfie": "Selfie with document",
      "instructions": "Take a clear photo in good lighting. All text must be legible.",
      "sizeLimit": "Maximum file size: 10 MB",
      "formats": "Accepted formats: JPG, PNG, PDF",
      "retry": "Try again"
    },
    "review": {
      "title": "Review your information",
      "personal": "Personal information",
      "addressSection": "Address",
      "documents": "Documents",
      "edit": "Edit",
      "submit": "Submit for verification"
    },
    "status": {
      "pending": "Verification pending",
      "approved": "Verification approved",
      "rejected": "Verification rejected",
      "resubmit": "Additional documents required"
    }
  }
}
```

### Spanish (`src/locales/es/kyc.json`)

```json
{
  "kyc": {
    "title": "Verificación de identidad",
    "subtitle": "Completa el KYC para acceder a todas las funciones",
    "steps": {
      "identity": "Identidad",
      "address": "Dirección",
      "documents": "Documentos",
      "review": "Revisión",
      "complete": "Completado"
    },
    "fields": {
      "firstName": "Nombre",
      "lastName": "Apellido",
      "dateOfBirth": "Fecha de nacimiento",
      "nationality": "Nacionalidad",
      "streetAddress": "Dirección",
      "city": "Ciudad",
      "postCode": "Código postal",
      "country": "País",
      "documentType": "Tipo de documento",
      "documentNumber": "Número de documento"
    },
    "validation": {
      "required": "Este campo es obligatorio",
      "invalidDate": "Por favor, introduce una fecha válida",
      "invalidDocument": "Número de documento no válido",
      "minAge": "Debes tener al menos 18 años"
    },
    "upload": {
      "title": "Subir documentos",
      "front": "Parte delantera del documento",
      "back": "Parte trasera del documento",
      "selfie": "Selfie con el documento",
      "instructions": "Toma una foto clara con buena iluminación. Todo el texto debe ser legible.",
      "sizeLimit": "Tamaño máximo: 10 MB",
      "formats": "Formatos aceptados: JPG, PNG, PDF",
      "retry": "Intentar de nuevo"
    },
    "review": {
      "title": "Revisa tu información",
      "personal": "Información personal",
      "addressSection": "Dirección",
      "documents": "Documentos",
      "edit": "Editar",
      "submit": "Enviar para verificación"
    },
    "status": {
      "pending": "Verificación pendiente",
      "approved": "Verificación aprobada",
      "rejected": "Verificación rechazada",
      "resubmit": "Se requieren documentos adicionales"
    }
  }
}
```

### French (`src/locales/fr/kyc.json`)

```json
{
  "kyc": {
    "title": "Vérification d'identité",
    "subtitle": "Complétez le KYC pour accéder à toutes les fonctionnalités",
    "steps": {
      "identity": "Identité",
      "address": "Adresse",
      "documents": "Documents",
      "review": "Révision",
      "complete": "Terminé"
    },
    "fields": {
      "firstName": "Prénom",
      "lastName": "Nom de famille",
      "dateOfBirth": "Date de naissance",
      "nationality": "Nationalité",
      "streetAddress": "Adresse",
      "city": "Ville",
      "postCode": "Code postal",
      "country": "Pays",
      "documentType": "Type de document",
      "documentNumber": "Numéro de document"
    },
    "validation": {
      "required": "Ce champ est obligatoire",
      "invalidDate": "Veuillez saisir une date valide",
      "invalidDocument": "Numéro de document invalide",
      "minAge": "Vous devez avoir au moins 18 ans"
    },
    "upload": {
      "title": "Télécharger des documents",
      "front": "Recto du document",
      "back": "Verso du document",
      "selfie": "Selfie avec le document",
      "instructions": "Prenez une photo nette dans une bonne lumière. Tout le texte doit être lisible.",
      "sizeLimit": "Taille maximale : 10 Mo",
      "formats": "Formats acceptés : JPG, PNG, PDF",
      "retry": "Réessayer"
    },
    "review": {
      "title": "Vérifiez vos informations",
      "personal": "Informations personnelles",
      "addressSection": "Adresse",
      "documents": "Documents",
      "edit": "Modifier",
      "submit": "Soumettre pour vérification"
    },
    "status": {
      "pending": "Vérification en cours",
      "approved": "Vérification approuvée",
      "rejected": "Vérification rejetée",
      "resubmit": "Documents supplémentaires requis"
    }
  }
}
```

### German (`src/locales/de/kyc.json`)

```json
{
  "kyc": {
    "title": "Identitätsprüfung",
    "subtitle": "Schließen Sie die KYC-Prüfung ab, um alle Funktionen zu nutzen",
    "steps": {
      "identity": "Identität",
      "address": "Adresse",
      "documents": "Dokumente",
      "review": "Überprüfung",
      "complete": "Abgeschlossen"
    },
    "fields": {
      "firstName": "Vorname",
      "lastName": "Nachname",
      "dateOfBirth": "Geburtsdatum",
      "nationality": "Staatsangehörigkeit",
      "streetAddress": "Straße",
      "city": "Stadt",
      "postCode": "Postleitzahl",
      "country": "Land",
      "documentType": "Dokumententyp",
      "documentNumber": "Dokumentennummer"
    },
    "validation": {
      "required": "Dieses Feld ist erforderlich",
      "invalidDate": "Bitte geben Sie ein gültiges Datum ein",
      "invalidDocument": "Ungültige Dokumentennummer",
      "minAge": "Sie müssen mindestens 18 Jahre alt sein"
    },
    "upload": {
      "title": "Dokumente hochladen",
      "front": "Vorderseite des Dokuments",
      "back": "Rückseite des Dokuments",
      "selfie": "Selfie mit Dokument",
      "instructions": "Machen Sie ein klares Foto bei guter Beleuchtung. Alle Texte müssen lesbar sein.",
      "sizeLimit": "Maximale Dateigröße: 10 MB",
      "formats": "Akzeptierte Formate: JPG, PNG, PDF",
      "retry": "Erneut versuchen"
    },
    "review": {
      "title": "Überprüfen Sie Ihre Angaben",
      "personal": "Persönliche Daten",
      "addressSection": "Adresse",
      "documents": "Dokumente",
      "edit": "Bearbeiten",
      "submit": "Zur Überprüfung einreichen"
    },
    "status": {
      "pending": "Überprüfung ausstehend",
      "approved": "Überprüfung genehmigt",
      "rejected": "Überprüfung abgelehnt",
      "resubmit": "Weitere Dokumente erforderlich"
    }
  }
}
```

### Chinese Simplified (`src/locales/zh/kyc.json`)

```json
{
  "kyc": {
    "title": "身份验证",
    "subtitle": "完成KYC以访问所有平台功能",
    "steps": {
      "identity": "身份",
      "address": "地址",
      "documents": "文件",
      "review": "审核",
      "complete": "完成"
    },
    "fields": {
      "firstName": "名字",
      "lastName": "姓氏",
      "dateOfBirth": "出生日期",
      "nationality": "国籍",
      "streetAddress": "街道地址",
      "city": "城市",
      "postCode": "邮政编码",
      "country": "国家",
      "documentType": "证件类型",
      "documentNumber": "证件号码"
    },
    "validation": {
      "required": "此字段为必填项",
      "invalidDate": "请输入有效日期",
      "invalidDocument": "无效的证件号码",
      "minAge": "您必须年满18岁"
    },
    "upload": {
      "title": "上传文件",
      "front": "证件正面",
      "back": "证件背面",
      "selfie": "持证自拍",
      "instructions": "在良好光线下拍摄清晰照片，所有文字必须清晰可见。",
      "sizeLimit": "最大文件大小：10 MB",
      "formats": "接受格式：JPG、PNG、PDF",
      "retry": "重试"
    },
    "review": {
      "title": "审核您的信息",
      "personal": "个人信息",
      "addressSection": "地址",
      "documents": "文件",
      "edit": "编辑",
      "submit": "提交审核"
    },
    "status": {
      "pending": "验证待处理",
      "approved": "验证已通过",
      "rejected": "验证已拒绝",
      "resubmit": "需要补充文件"
    }
  }
}
```

### Arabic (`src/locales/ar/kyc.json`)

```json
{
  "kyc": {
    "title": "التحقق من الهوية",
    "subtitle": "أكمل إجراء KYC للوصول إلى جميع ميزات المنصة",
    "steps": {
      "identity": "الهوية",
      "address": "العنوان",
      "documents": "المستندات",
      "review": "المراجعة",
      "complete": "مكتمل"
    },
    "fields": {
      "firstName": "الاسم الأول",
      "lastName": "اسم العائلة",
      "dateOfBirth": "تاريخ الميلاد",
      "nationality": "الجنسية",
      "streetAddress": "عنوان الشارع",
      "city": "المدينة",
      "postCode": "الرمز البريدي",
      "country": "الدولة",
      "documentType": "نوع الوثيقة",
      "documentNumber": "رقم الوثيقة"
    },
    "validation": {
      "required": "هذا الحقل مطلوب",
      "invalidDate": "يرجى إدخال تاريخ صحيح",
      "invalidDocument": "رقم الوثيقة غير صالح",
      "minAge": "يجب أن يكون عمرك 18 عامًا على الأقل"
    },
    "upload": {
      "title": "رفع المستندات",
      "front": "الوجه الأمامي للوثيقة",
      "back": "الوجه الخلفي للوثيقة",
      "selfie": "صورة سيلفي مع الوثيقة",
      "instructions": "التقط صورة واضحة في إضاءة جيدة. يجب أن يكون النص مقروءًا.",
      "sizeLimit": "الحد الأقصى لحجم الملف: 10 ميغابايت",
      "formats": "الصيغ المقبولة: JPG، PNG، PDF",
      "retry": "أعد المحاولة"
    },
    "review": {
      "title": "راجع معلوماتك",
      "personal": "المعلومات الشخصية",
      "addressSection": "العنوان",
      "documents": "المستندات",
      "edit": "تعديل",
      "submit": "إرسال للتحقق"
    },
    "status": {
      "pending": "التحقق قيد الانتظار",
      "approved": "تم التحقق بنجاح",
      "rejected": "رُفض التحقق",
      "resubmit": "مطلوب وثائق إضافية"
    }
  }
}
```

### Hebrew (`src/locales/he/kyc.json`)

```json
{
  "kyc": {
    "title": "אימות זהות",
    "subtitle": "השלם KYC כדי לגשת לכל תכונות הפלטפורמה",
    "steps": {
      "identity": "זהות",
      "address": "כתובת",
      "documents": "מסמכים",
      "review": "סקירה",
      "complete": "הושלם"
    },
    "fields": {
      "firstName": "שם פרטי",
      "lastName": "שם משפחה",
      "dateOfBirth": "תאריך לידה",
      "nationality": "לאומיות",
      "streetAddress": "כתובת רחוב",
      "city": "עיר",
      "postCode": "מיקוד",
      "country": "מדינה",
      "documentType": "סוג מסמך",
      "documentNumber": "מספר מסמך"
    },
    "validation": {
      "required": "שדה זה הוא חובה",
      "invalidDate": "אנא הזן תאריך תקין",
      "invalidDocument": "מספר מסמך לא תקין",
      "minAge": "עליך להיות בן 18 לפחות"
    },
    "upload": {
      "title": "העלה מסמכים",
      "front": "חזית המסמך",
      "back": "גב המסמך",
      "selfie": "סלפי עם המסמך",
      "instructions": "צלם תמונה ברורה באור טוב. כל הטקסט חייב להיות קריא.",
      "sizeLimit": "גודל קובץ מקסימלי: 10 MB",
      "formats": "פורמטים מותרים: JPG, PNG, PDF",
      "retry": "נסה שוב"
    },
    "review": {
      "title": "סקור את המידע שלך",
      "personal": "מידע אישי",
      "addressSection": "כתובת",
      "documents": "מסמכים",
      "edit": "ערוך",
      "submit": "שלח לאימות"
    },
    "status": {
      "pending": "אימות ממתין",
      "approved": "אימות אושר",
      "rejected": "אימות נדחה",
      "resubmit": "נדרשים מסמכים נוספים"
    }
  }
}
```
