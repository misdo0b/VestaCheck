export const dictionaries = {
  fr: {
    common: {
      save: "Enregistrer",
      saving: "Enregistrement...",
      cancel: "Annuler",
      settings: "Paramètres",
      success: "Succès",
      error: "Erreur",
    },
    preferences: {
      title: "Préférences Globales",
      subtitle: "Gérez vos préférences de messagerie, de thème et de langue.",
      autoEmailSignatories: "Envoi de mail automatique aux signataires",
      autoEmailDescription: "Envoyer automatiquement le rapport d'état des lieux signé en PDF par mail aux signataires dès la signature.",
      theme: "Thème de l'application",
      themeDescription: "Personnalisez l'apparence visuelle de l'interface.",
      themeLight: "Clair",
      themeDark: "Sombre",
      language: "Langue de l'application",
      languageDescription: "Choisissez votre langue d'affichage globale.",
      saveSuccess: "Préférences mises à jour avec succès",
      saveError: "Erreur lors de la mise à jour des préférences",
    }
  },
  en: {
    common: {
      save: "Save",
      saving: "Saving...",
      cancel: "Cancel",
      settings: "Settings",
      success: "Success",
      error: "Error",
    },
    preferences: {
      title: "Global Preferences",
      subtitle: "Manage your email, theme, and language preferences.",
      autoEmailSignatories: "Automatic email to signatories",
      autoEmailDescription: "Automatically send the signed inspection PDF report to all signatories via email upon final signature.",
      theme: "Application Theme",
      themeDescription: "Customize the visual appearance of the interface.",
      themeLight: "Light",
      themeDark: "Dark",
      language: "Application Language",
      languageDescription: "Choose your global display language.",
      saveSuccess: "Preferences updated successfully",
      saveError: "Error updating preferences",
    }
  },
  es: {
    common: {
      save: "Guardar",
      saving: "Guardando...",
      cancel: "Cancelar",
      settings: "Ajustes",
      success: "Éxito",
      error: "Error",
    },
    preferences: {
      title: "Preferencias Globales",
      subtitle: "Gestione sus preferencias de correo electrónico, tema e idioma.",
      autoEmailSignatories: "Correo automático a los firmantes",
      autoEmailDescription: "Enviar automáticamente el informe PDF firmado a todos los firmantes por correo electrónico tras la firma final.",
      theme: "Tema de la aplicación",
      themeDescription: "Personalice la apariencia visual de la interfaz.",
      themeLight: "Claro",
      themeDark: "Oscuro",
      language: "Idioma de la aplicación",
      languageDescription: "Elija su idioma de visualización global.",
      saveSuccess: "Preferencias actualizadas con éxito",
      saveError: "Error al actualizar las preferencias",
    }
  },
  zh: {
    common: {
      save: "保存",
      saving: "保存中...",
      cancel: "取消",
      settings: "设置",
      success: "成功",
      error: "错误",
    },
    preferences: {
      title: "全局偏好设置",
      subtitle: "管理您的电子邮件、主题和语言偏好。",
      autoEmailSignatories: "自动发送电子邮件给签署人",
      autoEmailDescription: "在最终签署后，自动通过电子邮件将签署的 PDF 报告发送给所有签署人。",
      theme: "应用主题",
      themeDescription: "自定义界面的视觉外观。",
      themeLight: "浅色",
      themeDark: "深色",
      language: "应用语言",
      languageDescription: "选择您的全局显示语言。",
      saveSuccess: "偏好设置更新成功",
      saveError: "更新偏好设置时出错",
    }
  },
  ar: {
    common: {
      save: "حفظ",
      saving: "جاري الحفظ...",
      cancel: "إلغاء",
      settings: "الإعدادات",
      success: "نجاح",
      error: "خطأ",
    },
    preferences: {
      title: "التفضيلات العامة",
      subtitle: "إدارة تفضيلات البريد الإلكتروني والمظهر واللغة.",
      autoEmailSignatories: "إرسال بريد إلكتروني تلقائي للموقعين",
      autoEmailDescription: "إرسال تقرير حالة العقار الموقّع بصيغة PDF تلقائيًا عبر البريد الإلكتروني إلى جميع الموقعين فور التوقيع النهائي.",
      theme: "مظهر التطبيق",
      themeDescription: "تخصيص المظهر المرئي للواجهة.",
      themeLight: "فاتح",
      themeDark: "داكن",
      language: "لغة التطبيق",
      languageDescription: "اختر لغة العرض العامة الخاصة بك.",
      saveSuccess: "تم تحديث التفضيلات بنجاح",
      saveError: "حدث خطأ أثناء تحديث التفضيلات",
    }
  }
};
export type Dictionary = typeof dictionaries.fr;
export type LanguageCode = keyof typeof dictionaries;
