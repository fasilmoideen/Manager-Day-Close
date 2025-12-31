import { GoogleGenAI } from "@google/genai";
import { DailyReport } from "../types";

export const analyzeReport = async (report: DailyReport): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Align with new manual entry for netSalesInclVat
  const netSalesInclVat = report.salesSummary.netSalesInclVat;
  const finalNetSales = netSalesInclVat - report.salesSummary.salesReturnNet;
  const totalExpenses = report.expenses.reduce((sum, e) => sum + e.amount, 0);
  const expectedCash = report.cashControl.openingBalance + report.cashControl.cashSales - report.cashControl.cashExpenses - report.cashControl.headOfficeDeposits;
  const variance = report.cashControl.actualCashCount - expectedCash;
  const estClosingStock = report.inventory.openingStockValue + report.inventory.stockReceivedValue - report.inventory.costOfGoodsSold;
  const inventoryVariance = report.inventory.erpClosingStockValue - estClosingStock;
  const calculatedTax = netSalesInclVat - report.salesSummary.grossSalesExclVat;

  const prompt = `
    As a retail operations expert, analyze this branch daily closing report:
    Branch: ${report.branchName}
    Manager: ${report.managerName || 'Not specified'}
    Cashier: ${report.cashierName || 'Not specified'}
    Hours: ${report.openingTime || 'N/A'} - ${report.closingTime || 'N/A'}
    Date: ${report.date}
    
    FINANCIALS:
    - Final Net Sales: ﷼${finalNetSales.toLocaleString()}
    - Computed VAT: ﷼${calculatedTax.toLocaleString()}
    - Daily Expenses: ﷼${totalExpenses.toLocaleString()}
    - Cash Variance: ﷼${variance.toLocaleString()}
    
    STAFFING:
    - Absent Staff: ${report.staffing.staffAbsent} (${report.staffing.absentStaffNames.filter(n => n).join(', ') || 'No names listed'})
    - Half Day Staff: ${report.staffing.staffHalfDay} (${report.staffing.halfDayStaffNames.filter(n => n).join(', ') || 'No names listed'})
    
    INVENTORY & CREDIT:
    - Inventory Variance: ﷼${inventoryVariance.toLocaleString()}
    - Oldest Invoice: ${report.creditControl.oldestInvoiceAge} days (Customer: ${report.creditControl.oldestInvoiceCustomerName || 'N/A'})
    
    ISSUES: ${report.issues.incidents || 'None reported'}
    
    Provide a brief 3-bullet point executive summary highlighting:
    1. Financial health (sales performance vs expenses).
    2. Operational risks (variance, staff shortages, or aging receivables).
    3. Actionable recommendations for the team tomorrow.
    Keep it professional and concise.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Unable to generate analysis at this time.";
  } catch (error) {
    console.error("AI analysis error:", error);
    return "Error connecting to analysis engine.";
  }
};