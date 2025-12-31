import React, { useState, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import { 
  Calculator, DollarSign, Wallet, AlertCircle, ShoppingBag, 
  Users, ClipboardList, Trash2, Plus, TrendingUp, Save, ChevronDown, MapPin, User, Clock, UserCircle, Printer, Eye, X, CheckCircle, Info, Download, FileDown, Loader2
} from 'lucide-react';
import { DailyReport, ExpenseItem } from './types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const INITIAL_STATE: DailyReport = {
  branchName: '',
  managerName: '',
  cashierName: '',
  openingTime: '',
  closingTime: '',
  date: new Date().toISOString().split('T')[0],
  salesSummary: { grossSalesExclVat: 0, taxAmount: 0, netSalesInclVat: 0, discounts: 0, salesReturnNet: 0 },
  paymentBreakdown: { cash: 0, posCard: 0, bankTransfer: 0, creditSales: 0, other: 0 },
  cashControl: { openingBalance: 0, cashSales: 0, cashExpenses: 0, headOfficeDeposits: 0, actualCashCount: 0 },
  expenses: [],
  creditControl: { todayCreditSales: 0, paymentsReceived: 0, openingOutstanding: 5000, outstandingCreditBalance: 0, oldestInvoiceAge: 0, oldestInvoiceCustomerName: '' },
  inventory: { openingStockValue: 0, stockReceivedValue: 0, costOfGoodsSold: 0, erpClosingStockValue: 0 },
  staffing: { staffAbsent: 0, absentStaffNames: [], staffHalfDay: 0, halfDayStaffNames: [] },
  issues: { incidents: '', equipmentIssues: '', actionRequired: '' }
};

const BRANCHES = [
  "[B1021]Al HAIR - HR",
  "[B1001]CENTRAL STORE - CS",
  "[B1002]AZIZIA - AZ",
  "[B1003]OLD SHOP - OS",
  "[B1004]NEW SHOP - NS",
  "[B1005]RABWA - RA",
  "[B1006]ATIKA - AT",
  "[B1007]DAR AL BAIDA - DB"
];

const MANAGERS = [
  "MOHAMMED FAYIS KARAPARAMBIL",
  "SHAMEER ELAMBILATTU",
  "HARIS KORAKKOTTIL HAMSA",
  "ASHMIN ALI ALIYARRAWTHER",
  "ABDUL MUNEER KOZHIKKODAN",
  "MUHAMMED SHAFI KANNITHODIYIL"
];

const EXPENSE_CATEGORIES = [
  "Printing & Stationery (S&D)",
  "Drinking Water Expense",
  "Miscellaneous Expenses",
  "Medical Expenses (S&D)",
  "Tea Expense",
  "Travelling Expenses (S&D)",
  "Staff Mess /Food Expenses (S&D)",
  "Telephone/Mobile Bills (S&D)",
  "Petrol - Forklift"
];

const formatCurrency = (value: number) => {
  return `﷼${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const DataRow: React.FC<{ label: string; value: string | number; bold?: boolean; red?: boolean }> = ({ label, value, bold, red }) => (
  <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
    <span className="text-sm text-slate-500 font-medium">{label}</span>
    <span className={`text-sm ${bold ? 'font-bold' : ''} ${red ? 'text-rose-600' : 'text-slate-800'}`}>{value}</span>
  </div>
);

const ReportPaper: React.FC<{ 
  report: DailyReport; 
  stats: any; 
  issuesEmpty: boolean; 
  innerRef?: React.RefObject<HTMLDivElement | null>;
}> = ({ report, stats, issuesEmpty, innerRef }) => (
  <div ref={innerRef} className="p-10 text-slate-900 font-sans print:p-0 bg-white">
    <div className="flex justify-between items-start mb-8 border-b-2 border-slate-800 pb-4">
      <div>
        <h1 className="text-2xl font-black text-slate-900 uppercase">Daily Branch Closing Report</h1>
        <p className="text-slate-500 font-bold tracking-tight">{report.date} | {new Date(report.date).toLocaleDateString('en-US', { weekday: 'long' })}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-slate-800">{report.branchName || 'BRANCH NOT SELECTED'}</p>
        <p className="text-xs text-slate-500">Manager: {report.managerName || 'N/A'}</p>
        <p className="text-xs text-slate-500">Hours: {report.openingTime} - {report.closingTime}</p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-10">
      {/* Left Column */}
      <div className="space-y-8">
        <section>
          <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-3 border-b border-blue-100 pb-1">1. Financial Performance</h3>
          <DataRow label="Gross Sales (Excl. VAT)" value={formatCurrency(report.salesSummary.grossSalesExclVat)} />
          <DataRow label="VAT Amount (Computed)" value={formatCurrency(stats.calculatedTax)} />
          <DataRow label="Net Sales (Incl. VAT)" value={formatCurrency(report.salesSummary.netSalesInclVat)} bold />
          <DataRow label="Sales Returns" value={formatCurrency(report.salesSummary.salesReturnNet)} red />
          <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-slate-400 uppercase">Final Net Revenue</span>
              <span className="text-xl font-black text-blue-700">{formatCurrency(stats.finalNetSales)}</span>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3 border-b border-indigo-100 pb-1">2. Payment Reconcilliation</h3>
          <DataRow label="Cash Payments" value={formatCurrency(report.paymentBreakdown.cash)} />
          <DataRow label="Card / POS" value={formatCurrency(report.paymentBreakdown.posCard)} />
          <DataRow label="Bank Transfers" value={formatCurrency(report.paymentBreakdown.bankTransfer)} />
          <DataRow label="Credit Sales" value={formatCurrency(report.paymentBreakdown.creditSales)} />
          <div className={`mt-2 p-2 rounded text-right text-xs font-bold ${Math.abs(stats.totalPayments - stats.finalNetSales) > 0.01 ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50'}`}>
             Total: {formatCurrency(stats.totalPayments)} {Math.abs(stats.totalPayments - stats.finalNetSales) > 0.01 ? '(MISMTACH)' : '(MATCHED)'}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-3 border-b border-emerald-100 pb-1">3. Cash Accountability</h3>
          <DataRow label="Expected Cash" value={formatCurrency(stats.expectedCash)} />
          <DataRow label="Actual Physical Count" value={formatCurrency(report.cashControl.actualCashCount)} bold />
          <div className={`mt-2 p-2 rounded text-center text-sm font-black ${stats.variance < 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
            Variance: {formatCurrency(stats.variance)}
          </div>
        </section>
      </div>

      {/* Right Column */}
      <div className="space-y-8">
        <section>
          <h3 className="text-xs font-black text-rose-600 uppercase tracking-widest mb-3 border-b border-rose-100 pb-1">4. Operational Expenses</h3>
          {report.expenses.length > 0 ? report.expenses.map(e => (
            <DataRow key={e.id} label={e.description || 'Misc'} value={formatCurrency(e.amount)} />
          )) : <p className="text-xs text-slate-400 italic">No expenses reported today.</p>}
          <div className="text-right pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500 mr-2">Total Expenses:</span>
            <span className="text-sm font-black text-rose-600">{formatCurrency(stats.totalExpenses)}</span>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-3 border-b border-amber-100 pb-1">5. Credit & Receivables</h3>
          <DataRow label="New Credit Issued" value={formatCurrency(report.creditControl.todayCreditSales)} />
          <DataRow label="Oldest Invoice Age" value={`${report.creditControl.oldestInvoiceAge} Days`} />
          <DataRow label="Oldest Customer" value={report.creditControl.oldestInvoiceCustomerName || 'N/A'} bold />
        </section>

        <section>
          <h3 className="text-xs font-black text-violet-600 uppercase tracking-widest mb-3 border-b border-violet-100 pb-1">6. Staffing Attendance</h3>
          <DataRow label="Total Absent" value={report.staffing.staffAbsent} />
          <DataRow label="Total Half Day" value={report.staffing.staffHalfDay} />
          {report.staffing.absentStaffNames.length > 0 && (
            <p className="text-[10px] text-slate-500 mt-1">Absentees: {report.staffing.absentStaffNames.filter(n => n).join(', ') || 'N/A'}</p>
          )}
        </section>
      </div>
    </div>

    <div className="mt-10 pt-6 border-t border-slate-200">
       <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4">8. Issues & Management Notes</h3>
       {issuesEmpty ? (
         <p className="text-sm text-slate-400 italic py-2">No issues reported today.</p>
       ) : (
         <div className="space-y-4">
            {report.issues.incidents?.trim() && (
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Incidents & Errors</p>
                <p className="text-sm text-slate-700 leading-relaxed">{report.issues.incidents}</p>
              </div>
            )}
            {report.issues.equipmentIssues?.trim() && (
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Equipment/Facility Issues</p>
                <p className="text-sm text-slate-700 leading-relaxed">{report.issues.equipmentIssues}</p>
              </div>
            )}
            {report.issues.actionRequired?.trim() && (
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Action Required Tomorrow</p>
                <p className="text-sm text-slate-700 leading-relaxed">{report.issues.actionRequired}</p>
              </div>
            )}
         </div>
       )}
    </div>

    <div className="mt-20 flex justify-between gap-20 no-print-visible">
      <div className="flex-1 border-t border-slate-900 pt-2 text-center">
        <p className="text-xs font-bold text-slate-900 uppercase">Cashier Signature</p>
        <p className="text-[10px] text-slate-400 mt-1">{report.cashierName || '........................................'}</p>
      </div>
      <div className="flex-1 border-t border-slate-900 pt-2 text-center">
        <p className="text-xs font-bold text-slate-900 uppercase">Manager Approval</p>
        <p className="text-[10px] text-slate-400 mt-1">{report.managerName || '........................................'}</p>
      </div>
    </div>
  </div>
);

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; color: string }> = ({ icon, title, color }) => (
  <div className={`flex items-center gap-2 p-4 border-b ${color} bg-opacity-5 rounded-t-xl`}>
    <div className={`p-2 rounded-lg ${color} text-white print:bg-slate-800`}>
      {icon}
    </div>
    <h2 className="text-xl font-bold text-slate-800">{title}</h2>
  </div>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-slate-300 ${className}`}>
    {children}
  </div>
);

const InputField: React.FC<{ 
  label: string; 
  value: number | string; 
  onChange: (val: any) => void; 
  type?: string; 
  suffix?: string; 
  highlight?: boolean;
  readOnly?: boolean;
  placeholder?: string;
}> = ({ label, value, onChange, type = "number", suffix, highlight, readOnly, placeholder }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
    <div className="relative">
      <input
        type={type}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all 
          ${readOnly ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed font-medium' : 
            highlight ? 'bg-blue-50 border-blue-200 focus:ring-blue-500 font-bold text-blue-700' : 
            'bg-slate-50 border-slate-200 focus:ring-blue-500 text-slate-700'} 
          print:bg-white print:border-slate-300 print:text-black`}
        value={value}
        onChange={(e) => !readOnly && onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
      />
      {suffix && <span className="absolute right-3 top-2 text-slate-400 print:text-slate-600">{suffix}</span>}
    </div>
  </div>
);

const HeaderInput: React.FC<{
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  type?: string;
}> = ({ label, icon, value, onChange, placeholder, type = "text" }) => (
  <div className="flex flex-col gap-1 min-w-[140px]">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
      {icon} {label}
    </label>
    <input
      type={type}
      className="bg-slate-50 border border-slate-200 rounded-md px-3 py-1 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-300 print:bg-white print:border-slate-300 print:text-black"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

const HeaderSelect: React.FC<{
  label: string;
  icon: React.ReactNode;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  placeholder: string;
}> = ({ label, icon, value, options, onChange, placeholder }) => (
  <div className="flex flex-col gap-1 min-w-[180px]">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
      {icon} {label}
    </label>
    <div className="relative">
      <select
        className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer print:bg-white print:border-slate-300 print:text-black"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <div className="absolute right-2 top-1.5 pointer-events-none text-slate-400 no-print">
        <ChevronDown className="w-3 h-3" />
      </div>
    </div>
  </div>
);

const SelectField: React.FC<{
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
}> = ({ label, value, options, onChange }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
    <div className="relative">
      <select
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700 appearance-none cursor-pointer print:bg-white print:border-slate-300 print:text-black"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>Select Item...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400 no-print">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [report, setReport] = useState<DailyReport>(INITIAL_STATE);
  const [isPreview, setIsPreview] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    // Net Sales (Incl. VAT) is now a primary manual entry
    const netSalesInclVat = report.salesSummary.netSalesInclVat;
    // Tax is computed as Net - Gross
    const calculatedTax = netSalesInclVat - report.salesSummary.grossSalesExclVat;
    // Final Net is Net Sales (Incl. VAT) minus Returns
    const finalNetSales = netSalesInclVat - report.salesSummary.salesReturnNet;
    
    const totalPayments = (Object.values(report.paymentBreakdown) as number[]).reduce((a: number, b: number) => a + b, 0);
    const totalExpenses = report.expenses.reduce((sum: number, e: ExpenseItem) => sum + e.amount, 0);
    const expectedCash = report.cashControl.openingBalance + report.cashControl.cashSales - report.cashControl.cashExpenses - report.cashControl.headOfficeDeposits;
    const variance = report.cashControl.actualCashCount - expectedCash;
    const closingStock = report.inventory.openingStockValue + report.inventory.stockReceivedValue - report.inventory.costOfGoodsSold;
    const inventoryVariance = report.inventory.erpClosingStockValue - closingStock;
    const netReceivables = report.creditControl.openingOutstanding + report.creditControl.todayCreditSales - report.creditControl.paymentsReceived;

    return { netSalesInclVat, finalNetSales, totalPayments, totalExpenses, expectedCash, variance, closingStock, inventoryVariance, netReceivables, calculatedTax };
  }, [report]);

  const issuesEmpty = useMemo(() => {
    return !report.issues.incidents?.trim() && 
           !report.issues.equipmentIssues?.trim() && 
           !report.issues.actionRequired?.trim();
  }, [report.issues]);

  const handleUpdate = (section: keyof DailyReport, field: string, value: any) => {
    setReport(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value
      }
    }));
  };

  const handleTopLevelUpdate = (field: keyof DailyReport, value: string) => {
    setReport(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStaffCountUpdate = (field: 'staffAbsent' | 'staffHalfDay', count: number) => {
    const nameField = field === 'staffAbsent' ? 'absentStaffNames' : 'halfDayStaffNames';
    const safeCount = Math.max(0, Math.floor(count));
    
    setReport(prev => {
      const currentNames = prev.staffing[nameField];
      let newNames = [...currentNames];
      
      if (newNames.length < safeCount) {
        newNames = [...newNames, ...Array(safeCount - newNames.length).fill('')];
      } else if (newNames.length > safeCount) {
        newNames = newNames.slice(0, safeCount);
      }
      
      return {
        ...prev,
        staffing: {
          ...prev.staffing,
          [field]: safeCount,
          [nameField]: newNames
        }
      };
    });
  };

  const handleStaffNameUpdate = (field: 'absentStaffNames' | 'halfDayStaffNames', index: number, name: string) => {
    setReport(prev => {
      const newNames = [...prev.staffing[field]];
      newNames[index] = name;
      return {
        ...prev,
        staffing: {
          ...prev.staffing,
          [field]: newNames
        }
      };
    });
  };

  const addExpense = () => {
    const newExpense: ExpenseItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      category: '',
      amount: 0
    };
    setReport(prev => ({ ...prev, expenses: [...prev.expenses, newExpense] }));
  };

  const removeExpense = (id: string) => {
    setReport(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
  };

  const handleExpenseUpdate = (id: string, field: string, value: any) => {
    setReport(prev => ({
      ...prev,
      expenses: prev.expenses.map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSavePDF = async () => {
    if (!pdfRef.current || isGeneratingPDF) return;
    
    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfWidthPx = pdfWidth * 3.7795275591; // Convert mm to pixels approx
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Closing_Report_${report.branchName || 'Branch'}_${report.date}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try printing to PDF instead.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const paymentChartData = [
    { name: 'Cash', value: report.paymentBreakdown.cash },
    { name: 'POS(Card)', value: report.paymentBreakdown.posCard },
    { name: 'Bank Transfer', value: report.paymentBreakdown.bankTransfer },
    { name: 'Credit Sales', value: report.paymentBreakdown.creditSales },
    { name: 'Other', value: report.paymentBreakdown.other },
  ].filter(d => d.value > 0);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const PreviewModal = () => (
    <div className="fixed inset-0 z-[100] bg-slate-900 bg-opacity-90 overflow-y-auto backdrop-blur-sm p-4 md:p-10 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white shadow-2xl rounded-xl overflow-hidden print:shadow-none print:rounded-none">
        {/* Preview Toolbar */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between no-print sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Eye className="text-blue-600 w-5 h-5" />
            <h2 className="font-bold text-slate-800">Print Preview</h2>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsPreview(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
            >
              <X className="w-4 h-4" /> Close
            </button>
            <button 
              onClick={handleSavePDF}
              disabled={isGeneratingPDF}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 flex items-center gap-2 disabled:opacity-50"
            >
              {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} Save PDF
            </button>
          </div>
        </div>

        {/* Paper Content */}
        <ReportPaper report={report} stats={stats} issuesEmpty={issuesEmpty} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20 print:bg-white print:pb-0">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .no-print-visible { display: flex !important; }
          body { background: white !important; }
          .print-full-width { width: 100% !important; margin: 0 !important; }
          .chart-container { page-break-inside: avoid; }
          header { position: static !important; box-shadow: none !important; border-bottom: 2px solid #e2e8f0 !important; }
          main { margin-top: 20px !important; }
          .Card { page-break-inside: avoid; margin-bottom: 20px !important; border-color: #cbd5e1 !important; }
          input, select, textarea { 
            border: 1px solid #cbd5e1 !important; 
            background: transparent !important; 
            -webkit-appearance: none; 
          }
          @page { size: auto; margin: 10mm; }
        }
        .no-print-visible { display: none; }
      `}</style>

      {isPreview && <PreviewModal />}
      
      {/* Hidden container for PDF generation to ensure perfect rendering */}
      <div className="fixed -left-[9999px] -top-[9999px] pointer-events-none" aria-hidden="true">
        <div style={{ width: '210mm' }}>
          <ReportPaper innerRef={pdfRef} report={report} stats={stats} issuesEmpty={issuesEmpty} />
        </div>
      </div>
      
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm no-print">
        <div className="flex flex-col gap-4 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-slate-800 flex items-center gap-2 whitespace-nowrap">
                <ClipboardList className="text-blue-600" /> Daily Closing Portal - Branch Manager
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {new Date(report.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={handleSavePDF}
                disabled={isGeneratingPDF}
                className="bg-emerald-600 text-white px-5 py-2 rounded-full font-bold shadow hover:bg-emerald-700 transition-all flex items-center gap-2 text-sm active:scale-95 disabled:opacity-50"
              >
                {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} Save as PDF
              </button>
              <button type="button" className="bg-slate-800 text-white px-5 py-2 rounded-full font-bold shadow hover:bg-slate-900 transition-all flex items-center gap-2 text-sm">
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2 border-t border-slate-100">
            <HeaderSelect 
              label="Branch" 
              icon={<MapPin className="w-3 h-3" />} 
              value={report.branchName} 
              options={BRANCHES}
              onChange={(v) => handleTopLevelUpdate('branchName', v)} 
              placeholder="Select Branch"
            />
            <HeaderSelect 
              label="Manager" 
              icon={<User className="w-3 h-3" />} 
              value={report.managerName} 
              options={MANAGERS}
              onChange={(v) => handleTopLevelUpdate('managerName', v)} 
              placeholder="Select Manager"
            />
            <HeaderInput 
              label="Cashier" 
              icon={<UserCircle className="w-3 h-3" />} 
              value={report.cashierName} 
              onChange={(v) => handleTopLevelUpdate('cashierName', v)} 
              placeholder="Cashier Name"
            />
            <HeaderInput 
              label="Opening Time" 
              icon={<Clock className="w-3 h-3" />} 
              value={report.openingTime} 
              onChange={(v) => handleTopLevelUpdate('openingTime', v)} 
              placeholder="e.g. 08:00 AM"
              type="text"
            />
            <HeaderInput 
              label="Closing Time" 
              icon={<Clock className="w-3 h-3" />} 
              value={report.closingTime} 
              onChange={(v) => handleTopLevelUpdate('closingTime', v)} 
              placeholder="e.g. 10:00 PM"
              type="text"
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 print:block print:w-full print:px-0">
        <div className="lg:col-span-4 space-y-8 print:w-full print:mb-8">
          <Card className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 text-white print:from-slate-100 print:to-slate-100 print:text-black print:border-2 print:border-slate-800">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="text-blue-400 print:text-blue-600" /> Key Performance
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-slate-400 text-sm print:text-slate-600">Final Net Sales</span>
                <span className="text-3xl font-black">{formatCurrency(stats.finalNetSales)}</span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden no-print">
                <div 
                  className="bg-blue-500 h-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (stats.finalNetSales / 10000) * 100)}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs text-slate-400 uppercase print:text-slate-600">Cash Variance</p>
                  <p className={`text-lg font-bold ${stats.variance >= 0 ? 'text-emerald-400 print:text-emerald-600' : 'text-rose-400 print:text-rose-600'}`}>
                    {formatCurrency(stats.variance)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase print:text-slate-600">Total Exp.</p>
                  <p className="text-lg font-bold text-rose-400 print:text-rose-600">{formatCurrency(stats.totalExpenses)}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 chart-container">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-6">Revenue Mix</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentChartData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {paymentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {paymentChartData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  {d.name}: {formatCurrency(d.value)}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-8 print:w-full">
          <Card className="Card">
            <SectionHeader icon={<DollarSign />} title="1. Sales Summary (Net View)" color="bg-blue-600" />
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InputField 
                label="Gross Sales (Excl. VAT)" 
                value={report.salesSummary.grossSalesExclVat} 
                onChange={(v) => handleUpdate('salesSummary', 'grossSalesExclVat', v)} 
              />
              <InputField 
                label="Net Sales (Incl. VAT)" 
                value={report.salesSummary.netSalesInclVat} 
                onChange={(v) => handleUpdate('salesSummary', 'netSalesInclVat', v)} 
              />
              <InputField 
                label="Tax Amount (VAT) [Computed]" 
                value={stats.calculatedTax.toFixed(2)} 
                readOnly={true}
                onChange={() => {}}
              />
              <InputField label="Sales Return(Net)" value={report.salesSummary.salesReturnNet} onChange={(v) => handleUpdate('salesSummary', 'salesReturnNet', v)} />
              <div className="hidden sm:block print:hidden"></div>
              <InputField label="Discounts" value={report.salesSummary.discounts} onChange={(v) => handleUpdate('salesSummary', 'discounts', v)} />
              <div className="col-span-full pt-4 border-t border-slate-100">
                <div className="bg-slate-900 p-4 rounded-xl flex justify-between items-center shadow-inner print:bg-slate-100 print:border print:border-slate-800">
                  <div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest print:text-blue-800">Calculated Figure</p>
                    <h4 className="text-white font-bold text-lg leading-none print:text-black">FINAL NET SALES</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-blue-400 print:text-blue-800">{formatCurrency(stats.finalNetSales)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="Card">
            <SectionHeader icon={<Wallet />} title="2. Payment Mode Breakdown" color="bg-indigo-600" />
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <InputField label="Cash" value={report.paymentBreakdown.cash} onChange={(v) => handleUpdate('paymentBreakdown', 'cash', v)} />
              <InputField label="POS(Card)" value={report.paymentBreakdown.posCard} onChange={(v) => handleUpdate('paymentBreakdown', 'posCard', v)} />
              <InputField label="Bank Transfer" value={report.paymentBreakdown.bankTransfer} onChange={(v) => handleUpdate('paymentBreakdown', 'bankTransfer', v)} />
              <InputField label="Credit Sales" value={report.paymentBreakdown.creditSales} onChange={(v) => handleUpdate('paymentBreakdown', 'creditSales', v)} />
              <InputField label="Other" value={report.paymentBreakdown.other} onChange={(v) => handleUpdate('paymentBreakdown', 'other', v)} />
              <div className="col-span-full pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-slate-500 font-bold uppercase text-xs">Total Reconciliation</span>
                <div className="text-right">
                   <p className="text-2xl font-black text-indigo-600">{formatCurrency(stats.totalPayments)}</p>
                   {Math.abs(stats.totalPayments - stats.finalNetSales) > 0.01 && (
                     <p className="text-xs text-rose-500 font-bold flex items-center justify-end gap-1 no-print">
                       <AlertCircle className="w-3 h-3" /> Breakdown does not match FINAL NET SALES
                     </p>
                   )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="Card">
            <SectionHeader icon={<Calculator />} title="3. Cash Control & Variance" color="bg-emerald-600" />
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <InputField label="Opening Cash" value={report.cashControl.openingBalance} onChange={(v) => handleUpdate('cashControl', 'openingBalance', v)} />
              <InputField label="Cash Sales (+)" value={report.cashControl.cashSales} onChange={(v) => handleUpdate('cashControl', 'cashSales', v)} />
              <InputField label="Cash Expenses (-)" value={report.cashControl.cashExpenses} onChange={(v) => handleUpdate('cashControl', 'cashExpenses', v)} />
              <InputField label="HO Deposits (-)" value={report.cashControl.headOfficeDeposits} onChange={(v) => handleUpdate('cashControl', 'headOfficeDeposits', v)} />
              <InputField label="Physical Cash Count" value={report.cashControl.actualCashCount} onChange={(v) => handleUpdate('cashControl', 'actualCashCount', v)} />
              <div className="col-span-full p-4 bg-slate-50 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4 border border-slate-200 mt-2 print:bg-white print:border-slate-800">
                <div>
                  <p className="text-xs text-slate-400 uppercase mb-1 print:text-slate-600">Expected Closing Cash</p>
                  <p className="text-lg font-bold text-slate-700">{formatCurrency(stats.expectedCash)}</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-600 uppercase mb-1 font-bold">Excess (+)</p>
                  <p className={`text-xl font-black ${stats.variance > 0 ? 'text-emerald-600' : 'text-slate-400 print:text-slate-300'}`}>
                    {stats.variance > 0 ? formatCurrency(stats.variance) : formatCurrency(0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-rose-600 uppercase mb-1 font-bold">Short (-)</p>
                  <p className={`text-xl font-black ${stats.variance < 0 ? 'text-rose-600' : 'text-slate-400 print:text-slate-300'}`}>
                    {stats.variance < 0 ? formatCurrency(Math.abs(stats.variance)) : formatCurrency(0)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="Card">
            <SectionHeader icon={<Trash2 className="text-rose-500" />} title="4. Daily Expenses" color="bg-rose-600" />
            <div className="p-6 space-y-4">
              {report.expenses.map((expense) => (
                <div key={expense.id} className="flex flex-col md:flex-row gap-4 items-start md:items-end bg-slate-50 p-4 rounded-lg group border border-transparent hover:border-slate-200 transition-all print:bg-white print:border-slate-200 print:mb-2">
                  <div className="flex-[3] w-full">
                    <SelectField label="Description" value={expense.description} options={EXPENSE_CATEGORIES} onChange={(v) => handleExpenseUpdate(expense.id, 'description', v)} />
                  </div>
                  <div className="flex-1 w-full md:w-48">
                    <InputField label="Amount" value={expense.amount} onChange={(v) => handleExpenseUpdate(expense.id, 'amount', v)} />
                  </div>
                  <button type="button" onClick={() => removeExpense(expense.id)} className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors no-print">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addExpense} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-500 hover:text-blue-500 transition-all font-bold flex items-center justify-center gap-2 no-print">
                <Plus className="w-5 h-5" /> Add Expense Item
              </button>
            </div>
          </Card>

          <Card className="Card">
            <SectionHeader icon={<AlertCircle />} title="5. Credit & Receivables Control" color="bg-amber-600" />
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InputField label="Today's Credit Sales" value={report.creditControl.todayCreditSales} onChange={(v) => handleUpdate('creditControl', 'todayCreditSales', v)} />
              <InputField label="Credit Collected Today" value={report.creditControl.paymentsReceived} onChange={(v) => handleUpdate('creditControl', 'paymentsReceived', v)} />
              <InputField label="Outstanding Credit Balance" value={report.creditControl.outstandingCreditBalance} onChange={(v) => handleUpdate('creditControl', 'outstandingCreditBalance', v)} />
              <InputField label="Oldest Invoice Age" value={report.creditControl.oldestInvoiceAge} suffix="Days" onChange={(v) => handleUpdate('creditControl', 'oldestInvoiceAge', v)} />
              <div className="col-span-full">
                <InputField label="Oldest Invoice Customer Name" value={report.creditControl.oldestInvoiceCustomerName} type="text" onChange={(v) => handleUpdate('creditControl', 'oldestInvoiceCustomerName', v)} placeholder="Enter customer name..." />
              </div>
            </div>
          </Card>

          <Card className="Card">
            <SectionHeader icon={<ShoppingBag />} title="6. Inventory Snapshot" color="bg-cyan-600" />
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <InputField label="Opening Value" value={report.inventory.openingStockValue} onChange={(v) => handleUpdate('inventory', 'openingStockValue', v)} />
              <InputField label="Stock Received" value={report.inventory.stockReceivedValue} onChange={(v) => handleUpdate('inventory', 'stockReceivedValue', v)} />
              <InputField label="Cost of Goods Sold" value={report.inventory.costOfGoodsSold} onChange={(v) => handleUpdate('inventory', 'costOfGoodsSold', v)} />
              <InputField label="Closing Value (ERP)" value={report.inventory.erpClosingStockValue} onChange={(v) => handleUpdate('inventory', 'erpClosingStockValue', v)} />
              <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 print:grid-cols-2">
                <div className="p-4 bg-cyan-50 rounded-xl flex justify-between items-center border border-cyan-100 print:bg-white print:border-slate-800">
                   <span className="text-cyan-800 font-bold uppercase text-[10px] tracking-wider print:text-black">Estimated Closing</span>
                   <span className="text-xl font-black text-cyan-900 print:text-black">{formatCurrency(stats.closingStock)}</span>
                </div>
                <div className={`p-4 rounded-xl flex justify-between items-center border ${stats.inventoryVariance >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'} print:bg-white print:border-slate-800`}>
                   <span className={`${stats.inventoryVariance >= 0 ? 'text-emerald-800' : 'text-rose-800'} font-bold uppercase text-[10px] tracking-wider print:text-black`}>Inventory Variance</span>
                   <span className={`text-xl font-black ${stats.inventoryVariance >= 0 ? 'text-emerald-900' : 'text-rose-900'} print:text-black`}>{formatCurrency(stats.inventoryVariance)}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="Card">
            <SectionHeader icon={<Users />} title="7. Staffing & Performance" color="bg-violet-600" />
            <div className="p-6 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 print:grid-cols-2">
                <div className="space-y-4">
                  <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 print:bg-white print:border-slate-300">
                    <InputField 
                      label="Staff Absent Count" 
                      value={report.staffing.staffAbsent} 
                      onChange={(v) => handleStaffCountUpdate('staffAbsent', v)} 
                    />
                  </div>
                  <div className="space-y-3">
                    {report.staffing.absentStaffNames.map((name, idx) => (
                      <InputField 
                        key={`absent-${idx}`}
                        label={`Absent Staff Name #${idx + 1}`} 
                        type="text"
                        value={name} 
                        onChange={(v) => handleStaffNameUpdate('absentStaffNames', idx, v)} 
                        placeholder="Employee Name"
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 print:bg-white print:border-slate-300">
                    <InputField 
                      label="Half Day Staff Count" 
                      value={report.staffing.staffHalfDay} 
                      onChange={(v) => handleStaffCountUpdate('staffHalfDay', v)} 
                    />
                  </div>
                  <div className="space-y-3">
                    {report.staffing.halfDayStaffNames.map((name, idx) => (
                      <InputField 
                        key={`halfday-${idx}`}
                        label={`Half Day Staff Name #${idx + 1}`} 
                        type="text"
                        value={name} 
                        onChange={(v) => handleStaffNameUpdate('halfDayStaffNames', idx, v)} 
                        placeholder="Employee Name"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="Card">
            <SectionHeader icon={<ClipboardList />} title="8. Issues & Action Notes" color="bg-slate-700" />
            <div className="p-6 space-y-6">
              {issuesEmpty && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-center gap-3 text-blue-700 text-sm no-print">
                  <Info className="w-5 h-5 flex-shrink-0" />
                  <p className="font-medium">No issues reported today. Add details below if any incidents occurred.</p>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Incidents (Returns, Errors, Fights)</label>
                <textarea 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg h-24 focus:ring-2 focus:ring-slate-500 focus:outline-none print:bg-white print:border-slate-300 print:text-black print:h-auto"
                  value={report.issues.incidents}
                  onChange={(e) => handleUpdate('issues', 'incidents', e.target.value)}
                  placeholder="Describe any noteworthy incidents..."
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Equipment/Facility Issues</label>
                <textarea 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg h-24 focus:ring-2 focus:ring-slate-500 focus:outline-none print:bg-white print:border-slate-300 print:text-black print:h-auto"
                  value={report.issues.equipmentIssues}
                  onChange={(e) => handleUpdate('issues', 'equipmentIssues', e.target.value)}
                  placeholder="AC not working, printer jam, etc..."
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Urgent Action Required</label>
                <textarea 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg h-24 focus:ring-2 focus:ring-slate-500 focus:outline-none print:bg-white print:border-slate-300 print:text-black print:h-auto"
                  value={report.issues.actionRequired}
                  onChange={(e) => handleUpdate('issues', 'actionRequired', e.target.value)}
                  placeholder="What needs priority tomorrow?"
                />
              </div>
            </div>
          </Card>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg md:hidden flex justify-between items-center z-40 no-print">
        <div>
          <p className="text-xs text-slate-400 uppercase font-bold">Today's Final Net</p>
          <p className="text-xl font-black text-blue-600">{formatCurrency(stats.finalNetSales)}</p>
        </div>
        <button 
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm"
        >
          Review Summary
        </button>
      </div>
    </div>
  );
};

export default App;