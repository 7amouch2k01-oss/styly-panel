import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "fr" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation & Common
    feed: "Feed",
    explore: "Explore",
    shop: "Shop",
    mannequin: "Mannequin",
    profile: "Profile",
    brandStore: "Brand Store",
    settings: "Settings",
    logout: "Logout",
    search: "Search...",
    filter: "Filter",
    allCategories: "All Categories",
    addBag: "Add to Bag",
    bag: "Shopping Bag",
    checkout: "Checkout",
    orders: "Orders",
    outfits: "Outfits",
    followers: "Followers",
    profits: "Profits",
    editProfile: "Edit Profile",
    yourGrade: "Your Grade",
    help: "Help",
    generalCondition: "General Conditions",
    privacyPolicy: "Privacy Policy",
    languageLabel: "Language / Langue / اللغة",
    openStore: "Open Store",
    verifyEmail: "Verify your Email",
    verifyCode: "Verify Code",
    resendCode: "Resend Code",
    signOut: "Sign out",
    priceText: "Price",
    stockText: "Stock",
    descriptionText: "Description",
    categoryText: "Category",
    brandText: "Brand",
    createPost: "Create Post",
    postButton: "Post",
    tagProducts: "Tag Products",
    placeOrder: "Place Order",
    brandDashboard: "Brand Dashboard",
    cancel: "Cancel",
    save: "Save",
    name: "Name",
    email: "Email",
    phone: "Phone",
    address: "Shipping Address",
    city: "City",
    postcode: "Post Code",
    country: "Country",
  },
  fr: {
    // Navigation & Common
    feed: "Flux",
    explore: "Explorer",
    shop: "Boutique",
    mannequin: "Mannequin",
    profile: "Profil",
    brandStore: "Boutique",
    settings: "Paramètres",
    logout: "Déconnexion",
    search: "Rechercher...",
    filter: "Filtrer",
    allCategories: "Toutes Catégories",
    addBag: "Ajouter au Panier",
    bag: "Mon Panier",
    checkout: "Passer commande",
    orders: "Commandes",
    outfits: "Tenues",
    followers: "Abonnés",
    profits: "Bénéfices",
    editProfile: "Modifier le Profil",
    yourGrade: "Votre Grade",
    help: "Aide",
    generalCondition: "Conditions Générales",
    privacyPolicy: "Confidentialité",
    languageLabel: "Langue / Language / اللغة",
    openStore: "Ouvrir boutique",
    verifyEmail: "Vérifier votre Email",
    verifyCode: "Vérifier le Code",
    resendCode: "Renvoyer le Code",
    signOut: "Déconnexion",
    priceText: "Prix",
    stockText: "Stock",
    descriptionText: "Description",
    categoryText: "Catégorie",
    brandText: "Marque",
    createPost: "Créer une publication",
    postButton: "Publier",
    tagProducts: "Marquer des produits",
    placeOrder: "Commander",
    brandDashboard: "Tableau de Bord",
    cancel: "Annuler",
    save: "Enregistrer",
    name: "Nom",
    email: "Email",
    phone: "Téléphone",
    address: "Adresse de livraison",
    city: "Ville",
    postcode: "Code Postal",
    country: "Pays",
  },
  ar: {
    // Navigation & Common
    feed: "الرئيسية",
    explore: "اكتشف",
    shop: "المتجر",
    mannequin: "المجسم",
    profile: "الحساب",
    brandStore: "العلامة التجارية",
    settings: "الإعدادات",
    logout: "خروج",
    search: "بحث...",
    filter: "تصفية",
    allCategories: "جميع الفئات",
    addBag: "أضف للسلة",
    bag: "سلة التسوق",
    checkout: "الدفع",
    orders: "طلباتي",
    outfits: "أزيائي",
    followers: "المتابعون",
    profits: "الأرباح",
    editProfile: "تعديل الحساب",
    yourGrade: "تقييمي",
    help: "المساعدة",
    generalCondition: "الشروط العامة",
    privacyPolicy: "سياسة الخصوصية",
    languageLabel: "اللغة / Language / Langue",
    openStore: "فتح متجر",
    verifyEmail: "تأكيد بريدك الإلكتروني",
    verifyCode: "تأكيد الرمز",
    resendCode: "إعادة إرسال الرمز",
    signOut: "خروج",
    priceText: "السعر",
    stockText: "المخزون",
    descriptionText: "الوصف",
    categoryText: "الفئة",
    brandText: "العلامة التجارية",
    createPost: "إنشاء منشور",
    postButton: "نشر",
    tagProducts: "إشارة للمنتجات",
    placeOrder: "تأكيد الطلب",
    brandDashboard: "لوحة تحكم العلامة",
    cancel: "إلغاء",
    save: "حفظ",
    name: "الاسم",
    email: "البريد الإلكتروني",
    phone: "الهاتف",
    address: "عنوان الشحن",
    city: "المدينة",
    postcode: "الرمز البريدي",
    country: "البلد",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem("styly_language") as Language) || "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("styly_language", lang);
  };

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
    
    // Toggle body RTL styling helper class
    if (language === "ar") {
      document.body.classList.add("rtl-mode");
      document.body.style.textAlign = "right";
    } else {
      document.body.classList.remove("rtl-mode");
      document.body.style.textAlign = "left";
    }
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || translations["en"][key] || key;
  };

  const isRtl = language === "ar";

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
