import { Injectable, computed, inject } from '@angular/core';
import { DirectionService, Language } from './direction';

export interface UiTextDictionary {
  // Sidebar Menu Items
  dashboard: string;
  pos: string;
  tables: string;
  orders: string;
  transactions: string;
  shift: string;
  settings: string;
  logout: string;
  schedulerBooking: string;
  // Header
  companyName: string;
  searchPlaceholder: string;
  toggleDarkMode: string;
  toggleDirection: string;
  userProfile: string;

  // Common Actions
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  add: string;
  close: string;
  confirm: string;
  back: string;
  clear: string;
  search: string;
  loading: string;
  noResults: string;

  // Page Titles
  dashboardTitle: string;
  dashboardDescription: string;
  posTitle: string;
  posDescription: string;
  tablesTitle: string;
  tablesDescription: string;
  ordersTitle: string;
  ordersDescription: string;
  transactionsTitle: string;
  transactionsDescription: string;
  shiftTitle: string;
  shiftDescription: string;
  settingsTitle: string;
  settingsDescription: string;
  schedulerBookingTitle: string;
  schedulerBookingDescription: string;

  // Placeholder Content
  comingSoon: string;
  workInProgress: string;

  // Login Page
  loginTitle: string;
  loginSubtitle: string;
  loginPlaceholder: string;
  goToDashboard: string;

  // Login Form
  username: string;
  password: string;
  usernameRequired: string;
  passwordRequired: string;
  loginButton: string;
  loggingIn: string;
  loginError: string;
  invalidCredentials: string;
  rememberMe: string;
  forgotPassword: string;
  demoCredentials: string;

  // Validation Messages
  fieldRequired: string;
  minLength: string;

  // POS Page
  allCategories: string;
  products: string;
  cart: string;
  emptyCart: string;
  emptyCartMessage: string;
  addToCart: string;
  quantity: string;
  unit: string;
  units: string;
  additions: string;
  notes: string;
  notesPlaceholder: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  checkout: string;
  clearCart: string;
  orderSummary: string;
  item: string;
  items: string;
  price: string;
  remove: string;
  productDetails: string;
  outOfStock: string;
  inStock: string;
  addedToCart: string;
  viewCart: string;
  continueShopping: string;
  noProductsFound: string;
  searchProducts: string;
  filterByCategory: string;
  showingProducts: string;
  of: string;
  previous: string;
  next: string;
  piece: string;
  half: string;
  quarter: string;
  dozen: string;
  extraSauce: string;
  extraCheese: string;
  spicy: string;
  giftWrap: string;
  discountPercentage: string;
  applyDiscount: string;
  placeOrder: string;
  orderPlaced: string;
  orderPlacedMessage: string;
}

const EN_DICTIONARY: UiTextDictionary = {
  // Sidebar Menu Items
  dashboard: 'Dashboard',
  pos: 'POS',
  tables: 'Tables',
  orders: 'Orders',
  transactions: 'Transactions',
  shift: 'Shift',
  settings: 'Settings',
  logout: 'Log out',
  schedulerBooking: 'Scheduler Booking',

  // Header
  companyName: 'POS Dashboard',
  searchPlaceholder: 'Search products...',
  toggleDarkMode: 'Toggle Dark Mode',
  toggleDirection: 'Toggle RTL/LTR',
  userProfile: 'User Profile',

  // Common Actions
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  edit: 'Edit',
  add: 'Add',
  close: 'Close',
  confirm: 'Confirm',
  back: 'Back',
  clear: 'Clear',
  search: 'Search',
  loading: 'Loading...',
  noResults: 'No results found',

  // Page Titles
  dashboardTitle: 'Dashboard',
  dashboardDescription: 'Overview of your POS system performance and statistics.',
  posTitle: 'POS',
  posDescription: 'Point of Sale terminal for processing transactions.',
  tablesTitle: 'Tables',
  tablesDescription: 'Manage restaurant tables and seating arrangements.',
  ordersTitle: 'Orders',
  ordersDescription: 'View and manage all customer orders.',
  transactionsTitle: 'Transactions',
  transactionsDescription: 'Track all payment transactions and financial records.',
  shiftTitle: 'Shift',
  shiftDescription: 'Manage employee shifts and work schedules.',
  settingsTitle: 'Settings',
  settingsDescription: 'Configure application settings and preferences.',
  schedulerBookingTitle: 'Scheduler Booking',
  schedulerBookingDescription: 'Manage bookings and schedules.',
  // Placeholder Content
  comingSoon: 'Coming Soon',
  workInProgress: 'Work in Progress',

  // Login Page
  loginTitle: 'POS Dashboard',
  loginSubtitle: 'Welcome back! Please sign in to continue.',
  loginPlaceholder: 'Login form will be implemented in a future step.',
  goToDashboard: 'Go to Dashboard',

  // Login Form
  username: 'Username',
  password: 'Password',
  usernameRequired: 'Username is required',
  passwordRequired: 'Password is required',
  loginButton: 'Sign In',
  loggingIn: 'Signing In...',
  loginError: 'Login failed. Please try again.',
  invalidCredentials: 'Invalid username or password',
  rememberMe: 'Remember me',
  forgotPassword: 'Forgot password?',
  demoCredentials: 'Demo: emilys / emilyspass',

  // Validation Messages
  fieldRequired: 'This field is required',
  minLength: 'Minimum length is {0} characters',

  // POS Page
  allCategories: 'All Categories',
  products: 'Products',
  cart: 'Cart',
  emptyCart: 'Cart is empty',
  emptyCartMessage: 'Add products to start your order',
  addToCart: 'Add to Cart',
  quantity: 'Quantity',
  unit: 'Unit',
  units: 'Units',
  additions: 'Additions',
  notes: 'Notes',
  notesPlaceholder: 'Add special instructions...',
  subtotal: 'Subtotal',
  discount: 'Discount',
  tax: 'Tax (VAT)',
  total: 'Total',
  checkout: 'Checkout',
  clearCart: 'Clear Cart',
  orderSummary: 'Order Summary',
  item: 'item',
  items: 'items',
  price: 'Price',
  remove: 'Remove',
  productDetails: 'Product Details',
  outOfStock: 'Out of Stock',
  inStock: 'In Stock',
  addedToCart: 'Added to cart!',
  viewCart: 'View Cart',
  continueShopping: 'Continue Shopping',
  noProductsFound: 'No products found',
  searchProducts: 'Search products',
  filterByCategory: 'Filter by category',
  showingProducts: 'Showing',
  of: 'of',
  previous: 'Previous',
  next: 'Next',
  piece: 'Piece',
  half: 'Half',
  quarter: 'Quarter',
  dozen: 'Dozen',
  extraSauce: 'Extra Sauce',
  extraCheese: 'Extra Cheese',
  spicy: 'Spicy',
  giftWrap: 'Gift Wrap',
  discountPercentage: 'Discount %',
  applyDiscount: 'Apply Discount',
  placeOrder: 'Place Order',
  orderPlaced: 'Order Placed!',
  orderPlacedMessage: 'Your order has been placed successfully.'
};

const AR_DICTIONARY: UiTextDictionary = {
  // Sidebar Menu Items
  dashboard: 'لوحة التحكم',
  pos: 'نقاط البيع',
  tables: 'الطاولات',
  orders: 'الطلبات',
  transactions: 'العمليات',
  shift: 'الدوام',
  settings: 'الإعدادات',
  logout: 'تسجيل الخروج',
  schedulerBooking: 'جدول الحجزات',
  // Header
  companyName: 'لوحة نقاط البيع',
  searchPlaceholder: 'البحث عن منتجات...',
  toggleDarkMode: 'تبديل الوضع الداكن',
  toggleDirection: 'تبديل اتجاه الصفحة',
  userProfile: 'الملف الشخصي',

  // Common Actions
  save: 'حفظ',
  cancel: 'إلغاء',
  delete: 'حذف',
  edit: 'تعديل',
  add: 'إضافة',
  close: 'إغلاق',
  confirm: 'تأكيد',
  back: 'رجوع',
  clear: 'مسح',
  search: 'بحث',
  loading: 'جاري التحميل...',
  noResults: 'لا توجد نتائج',

  // Page Titles
  dashboardTitle: 'لوحة التحكم',
  dashboardDescription: 'نظرة عامة على أداء نظام نقاط البيع والإحصائيات.',
  posTitle: 'نقاط البيع',
  posDescription: 'محطة نقاط البيع لمعالجة المعاملات.',
  tablesTitle: 'الطاولات',
  tablesDescription: 'إدارة طاولات المطعم وترتيبات الجلوس.',
  ordersTitle: 'الطلبات',
  ordersDescription: 'عرض وإدارة جميع طلبات العملاء.',
  transactionsTitle: 'العمليات',
  transactionsDescription: 'تتبع جميع معاملات الدفع والسجلات المالية.',
  shiftTitle: 'الدوام',
  shiftDescription: 'إدارة ورديات الموظفين وجداول العمل.',
  settingsTitle: 'الإعدادات',
  settingsDescription: 'تكوين إعدادات التطبيق والتفضيلات.',
  schedulerBookingTitle: 'حجوزات الجدول',
  schedulerBookingDescription: 'إدارة الحجوزات والمواعيد.',
  // Placeholder Content
  comingSoon: 'قريباً',
  workInProgress: 'قيد التطوير',

  // Login Page
  loginTitle: 'لوحة نقاط البيع',
  loginSubtitle: 'مرحباً بعودتك! يرجى تسجيل الدخول للمتابعة.',
  loginPlaceholder: 'سيتم تنفيذ نموذج تسجيل الدخول في خطوة مستقبلية.',
  goToDashboard: 'الذهاب للوحة التحكم',

  // Login Form
  username: 'اسم المستخدم',
  password: 'كلمة المرور',
  usernameRequired: 'اسم المستخدم مطلوب',
  passwordRequired: 'كلمة المرور مطلوبة',
  loginButton: 'تسجيل الدخول',
  loggingIn: 'جاري تسجيل الدخول...',
  loginError: 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.',
  invalidCredentials: 'اسم المستخدم أو كلمة المرور غير صحيحة',
  rememberMe: 'تذكرني',
  forgotPassword: 'نسيت كلمة المرور؟',
  demoCredentials: 'تجريبي: emilys / emilyspass',

  // Validation Messages
  fieldRequired: 'هذا الحقل مطلوب',
  minLength: 'الحد الأدنى للطول هو {0} أحرف',

  // POS Page
  allCategories: 'جميع الفئات',
  products: 'المنتجات',
  cart: 'السلة',
  emptyCart: 'السلة فارغة',
  emptyCartMessage: 'أضف منتجات لبدء طلبك',
  addToCart: 'أضف للسلة',
  quantity: 'الكمية',
  unit: 'الوحدة',
  units: 'الوحدات',
  additions: 'الإضافات',
  notes: 'ملاحظات',
  notesPlaceholder: 'أضف تعليمات خاصة...',
  subtotal: 'المجموع الفرعي',
  discount: 'الخصم',
  tax: 'الضريبة',
  total: 'الإجمالي',
  checkout: 'الدفع',
  clearCart: 'مسح السلة',
  orderSummary: 'ملخص الطلب',
  item: 'منتج',
  items: 'منتجات',
  price: 'السعر',
  remove: 'إزالة',
  productDetails: 'تفاصيل المنتج',
  outOfStock: 'نفذت الكمية',
  inStock: 'متوفر',
  addedToCart: 'تمت الإضافة للسلة!',
  viewCart: 'عرض السلة',
  continueShopping: 'متابعة التسوق',
  noProductsFound: 'لا توجد منتجات',
  searchProducts: 'البحث عن منتجات',
  filterByCategory: 'تصفية حسب الفئة',
  showingProducts: 'عرض',
  of: 'من',
  previous: 'السابق',
  next: 'التالي',
  piece: 'قطعة',
  half: 'نصف',
  quarter: 'ربع',
  dozen: 'درزن',
  extraSauce: 'صوص إضافي',
  extraCheese: 'جبنة إضافية',
  spicy: 'حار',
  giftWrap: 'تغليف هدية',
  discountPercentage: 'نسبة الخصم %',
  applyDiscount: 'تطبيق الخصم',
  placeOrder: 'تأكيد الطلب',
  orderPlaced: 'تم الطلب!',
  orderPlacedMessage: 'تم تقديم طلبك بنجاح.'
};

const DICTIONARIES: Record<Language, UiTextDictionary> = {
  en: EN_DICTIONARY,
  ar: AR_DICTIONARY
};

@Injectable({
  providedIn: 'root'
})
export class UiTextService {
  private readonly directionService = inject(DirectionService);

  /**
   * Computed signal that returns the current dictionary based on direction
   */
  readonly texts = computed<UiTextDictionary>(() => {
    const language = this.directionService.currentLanguage();
    return DICTIONARIES[language];
  });

  /**
   * Get a specific text by key
   */
  getText(key: keyof UiTextDictionary): string {
    return this.texts()[key];
  }

  /**
   * Get the current language
   */
  getLanguage(): Language {
    return this.directionService.getLanguage();
  }

  /**
   * Check if current language is Arabic
   */
  isArabic(): boolean {
    return this.directionService.getLanguage() === 'ar';
  }

  /**
   * Check if current language is English
   */
  isEnglish(): boolean {
    return this.directionService.getLanguage() === 'en';
  }
}