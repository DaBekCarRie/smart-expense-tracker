/** Supported locales for the application. */
export type Locale = "en" | "th";

/** All translation keys used in the application. */
export interface TranslationDictionary {
  // ── App Shell / Layout ──────────────────────────────────────────
  appName: string;

  // Navigation
  navDashboard: string;
  navExpenses: string;
  navInventory: string;
  navShopping: string;
  navCategories: string;
  navProfile: string;
  signOut: string;

  // ── Dashboard ───────────────────────────────────────────────────
  dashboardTitle: string;
  dashboardTotalExpenses: string;
  dashboardThisMonth: string;
  dashboardRecentExpenses: string;
  dashboardNoExpenses: string;
  dashboardViewAll: string;
  dashboardCategoryBreakdown: string;
  dashboardMonthlySummary: string;
  dashboardUploadReceipt: string;
  dashboardOverview: string;
  dashboardTopCategory: string;
  dashboardMostSpent: string;
  dashboardLast6Months: string;
  dashboardAvgPerMonth: string;
  dashboardOver6Months: string;
  dashboardMonthlySpending: string;
  dashboardSpendingByCategory: string;
  dashboardUncategorized: string;


  // ── Expenses ────────────────────────────────────────────────────
  expensesTitle: string;
  expensesAddNew: string;
  expensesSearch: string;
  expensesFilterCategory: string;
  expensesFilterDateFrom: string;
  expensesFilterDateTo: string;
  expensesClearFilters: string;
  expensesNoResults: string;
  expensesLoadMore: string;
  expensesMerchant: string;
  expensesAmount: string;
  expensesDate: string;
  expensesCategory: string;
  expensesNotes: string;
  expensesCurrency: string;
  expensesSave: string;
  expensesCancel: string;
  expensesDelete: string;
  expensesEdit: string;
  expensesDeleteConfirm: string;
  expensesAddTitle: string;
  expensesEditTitle: string;
  expensesAllCategories: string;
  expensesShowingOf: string;

  // ── Upload / OCR ────────────────────────────────────────────────
  uploadTitle: string;
  uploadDragDrop: string;
  uploadOr: string;
  uploadBrowse: string;
  uploadMaxSize: string;
  uploadCompressing: string;
  uploadUploading: string;
  uploadProcessing: string;
  uploadSuccess: string;
  uploadError: string;
  uploadRetry: string;

  // OCR Result Preview
  ocrTitle: string;
  ocrMerchant: string;
  ocrAmount: string;
  ocrDate: string;
  ocrConfidence: string;
  ocrItems: string;
  ocrSaveExpense: string;
  ocrRawText: string;
  ocrNoItems: string;
  ocrItemName: string;
  ocrItemQty: string;
  ocrItemPrice: string;
  ocrItemUnit: string;
  ocrResultTitle: string;
  ocrCurrency: string;
  ocrNotDetected: string;
  ocrExtractedItems: string;
  ocrApplyToForm: string;
  ocrConfidenceBadge: string;
  // ReceiptUploader states
  uploadDragActive: string;
  uploadIdleHint: string;
  uploadCompressingState: string;
  uploadUploadingState: string;
  uploadDoneState: string;
  uploadFailedState: string;
  uploadFailedHint: string;
  uploadDifferentReceipt: string;
  uploadOcrFailed: string;

  // ── Inventory ───────────────────────────────────────────────────
  inventoryTitle: string;
  inventoryAddProduct: string;
  inventoryProductName: string;
  inventoryUnit: string;
  inventoryCurrentStock: string;
  inventoryMinStock: string;
  inventoryAvgPrice: string;
  inventoryLastPrice: string;
  inventoryLowStock: string;
  inventoryExpiringAlert: string;
  inventoryNoProducts: string;
  inventoryAddBatch: string;
  inventoryQuantity: string;
  inventoryExpiryDate: string;
  inventorySave: string;
  inventoryCancel: string;
  inventoryDelete: string;
  inventoryDeleteConfirm: string;
  inventoryBatches: string;
  inventorySearch: string;
  // additional inventory keys
  inventoryTotalItems: string;
  inventoryExpiredBatches: string;
  inventoryExpiringBatches: string;
  inventoryEdit: string;
  inventoryMinThreshold: string;
  inventoryNotSet: string;
  inventoryNoBatchData: string;
  inventoryBatchReceived: string;
  inventoryBatchExpires: string;
  inventoryBatchExpiredLabel: string;
  inventoryBatchExpiringSoonLabel: string;
  inventoryNoSearchResults: string;
  inventoryAutoCreatedNote: string;
  inventoryViewBatches: string;
  inventoryCurrentStockLabel: string;
  inventoryDescription: string;

  // ── Shopping List ───────────────────────────────────────────────
  shoppingTitle: string;
  shoppingAddItem: string;
  shoppingItemName: string;
  shoppingQuantity: string;
  shoppingUnit: string;
  shoppingNoItems: string;
  shoppingMarkPurchased: string;
  shoppingMarkPending: string;
  shoppingDelete: string;
  shoppingSave: string;
  shoppingCancel: string;
  shoppingPurchased: string;
  shoppingPending: string;
  // additional shopping keys
  shoppingDescription: string;
  shoppingAutoGenerate: string;
  shoppingManualAddTitle: string;
  shoppingChecklistTitle: string;
  shoppingItemsRemaining: string;
  shoppingOrderQty: string;
  shoppingAllSufficient: string;
  shoppingAdding: string;
  shoppingIngredientPlaceholder: string;
  shoppingAutoGenerateSuccessTitle: string;
  shoppingAutoGenerateSuccessDesc: string;
  shoppingAutoGenerateEmptyTitle: string;
  shoppingAutoGenerateEmptyDesc: string;
  shoppingAutoGenerateDetail: string;

  // ── Categories ──────────────────────────────────────────────────
  categoriesTitle: string;
  categoriesAddNew: string;
  categoriesCategoryName: string;
  categoriesColor: string;
  categoriesIcon: string;
  categoriesNoCategories: string;
  categoriesSave: string;
  categoriesCancel: string;
  categoriesDelete: string;
  categoriesDeleteConfirm: string;
  categoriesEdit: string;
  // additional categories keys
  categoriesDescription: string;
  categoriesSetupDefault: string;
  categoriesSettingUp: string;
  categoriesColorLabel: string;
  categoriesIconLabel: string;
  categoriesUploadIcon: string;
  categoriesUploading: string;
  categoriesUpdateButton: string;
  categoriesCancelEdit: string;
  categoriesNoneYet: string;
  categoriesGetStarted: string;

  // ── Profile ─────────────────────────────────────────────────────
  profileTitle: string;
  profileName: string;
  profileEmail: string;
  profileCurrentPassword: string;
  profileNewPassword: string;
  profileConfirmPassword: string;
  profileUpdateInfo: string;
  profileChangePassword: string;
  profileSave: string;
  profileCancel: string;
  profileUpdated: string;
  profilePasswordChanged: string;
  // additional profile keys
  profileDisplayName: string;
  profileChangePasswordTitle: string;
  profileLeaveBlank: string;
  profileSaving: string;
  profileChangePasswordToggle: string;
  profileCancelPasswordChange: string;

  // ── New Expense Page ─────────────────────────────────────────────
  newExpenseTitle: string;
  newExpenseBreadcrumb: string;
  newExpenseAddNew: string;
  newExpenseScanSection: string;
  newExpenseDetailsSection: string;
  newExpenseMerchantLabel: string;
  newExpenseDateLabel: string;
  newExpenseAmountLabel: string;
  newExpenseAmountNote: string;
  newExpenseCategoryLabel: string;
  newExpenseItemsTitle: string;
  newExpenseNoItems: string;
  newExpenseAddItem: string;
  newExpenseColItemName: string;
  newExpenseColQty: string;
  newExpenseColUnit: string;
  newExpenseColPriceUnit: string;
  newExpenseColTotal: string;
  newExpenseColExpiry: string;
  newExpenseColCategory: string;
  newExpenseBillTotal: string;
  newExpenseNotesSection: string;
  newExpenseSave: string;
  newExpenseSaving: string;
  newExpenseSyncWarning: string;
  newExpenseSyncAmount: string;
  newExpenseRecommended: string;
  newExpenseIngredients: string;

  // ── Expense Detail Dialog (ExpenseList) ──────────────────────────
  expenseDetailTitle: string;
  expenseDetailMerchant: string;
  expenseDetailDate: string;
  expenseDetailCategory: string;
  expenseDetailTotal: string;
  expenseDetailNotes: string;
  expenseDetailItemsTitle: string;
  expenseDetailNoItems: string;
  expenseDetailReceiptTitle: string;
  expenseDetailNoReceipt: string;
  expenseDetailClose: string;
  expenseDetailInventoryBadge: string;
  expenseDetailInventorySync: string;
  expenseDetailQtyUnit: string;
  expenseDetailPricePerUnit: string;
  expenseDetailExpiryDate: string;
  expenseDetailSaving: string;
  expenseDetailInventoryNote: string;
  expenseDetailEditFailed: string;

  // ── Auth ────────────────────────────────────────────────────────
  loginTitle: string;
  loginEmail: string;
  loginPassword: string;
  loginSubmit: string;
  loginForgotPassword: string;
  loginNoAccount: string;
  loginRegister: string;

  registerTitle: string;
  registerName: string;
  registerEmail: string;
  registerPassword: string;
  registerConfirmPassword: string;
  registerSubmit: string;
  registerHaveAccount: string;
  registerLogin: string;

  forgotPasswordTitle: string;
  forgotPasswordEmail: string;
  forgotPasswordSubmit: string;
  forgotPasswordBackToLogin: string;
  forgotPasswordSuccess: string;

  resetPasswordTitle: string;
  resetPasswordNewPassword: string;
  resetPasswordConfirmPassword: string;
  resetPasswordSubmit: string;
  resetPasswordSuccess: string;

  // ── Charts ──────────────────────────────────────────────────────
  chartNoData: string;
  chartTotal: string;
  chartMonth: string;
  chartAmount: string;
  chartOther: string;

  // ── Common / Misc ───────────────────────────────────────────────
  loading: string;
  error: string;
  success: string;
  confirm: string;
  close: string;
  yes: string;
  no: string;
  required: string;
  optional: string;
  actions: string;
  selectLanguage: string;

  // ── Formatters ──────────────────────────────────────────────────
  timeJustNow: string;
  timeMinutesAgo: string;
  timeHoursAgo: string;
  timeDaysAgo: string;

  // ── Units ────────────────────────────────────────────────────────
  unitKg: string;
  unitG: string;
  unitL: string;
  unitMl: string;
  unitPcs: string;
  unitPack: string;
  unitBottle: string;
  unitBag: string;
  unitBox: string;
  unitCan: string;
  unitUnit: string;
}
