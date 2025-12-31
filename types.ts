export interface SalesSummary {
  grossSalesExclVat: number;
  taxAmount: number;
  netSalesInclVat: number;
  discounts: number;
  salesReturnNet: number;
}

export interface PaymentBreakdown {
  cash: number;
  posCard: number;
  bankTransfer: number;
  creditSales: number;
  other: number;
}

export interface CashControl {
  openingBalance: number;
  cashSales: number;
  cashExpenses: number;
  headOfficeDeposits: number;
  actualCashCount: number;
}

export interface ExpenseItem {
  id: string;
  description: string;
  category: string;
  amount: number;
}

export interface CreditControl {
  todayCreditSales: number;
  paymentsReceived: number;
  openingOutstanding: number;
  outstandingCreditBalance: number;
  oldestInvoiceAge: number;
  oldestInvoiceCustomerName: string;
}

export interface InventorySnapshot {
  openingStockValue: number;
  stockReceivedValue: number;
  costOfGoodsSold: number;
  erpClosingStockValue: number;
}

export interface StaffingSnapshot {
  staffAbsent: number;
  absentStaffNames: string[];
  staffHalfDay: number;
  halfDayStaffNames: string[];
}

export interface IssuesAction {
  incidents: string;
  equipmentIssues: string;
  actionRequired: string;
}

export interface DailyReport {
  branchName: string;
  managerName: string;
  cashierName: string;
  openingTime: string;
  closingTime: string;
  date: string;
  salesSummary: SalesSummary;
  paymentBreakdown: PaymentBreakdown;
  cashControl: CashControl;
  expenses: ExpenseItem[];
  creditControl: CreditControl;
  inventory: InventorySnapshot;
  staffing: StaffingSnapshot;
  issues: IssuesAction;
}