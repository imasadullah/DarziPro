import { ipcMain } from 'electron';
import { ReportService } from '../services/report.service';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export function registerReportIPCHandlers(): void {
  // ── KPI Summary ─────────────────────────────────────────────────────────────

  ipcMain.handle('report:getKpiSummary', async () => {
    try {
      const data = await ReportService.getKpiSummary();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ── Revenue Report ───────────────────────────────────────────────────────────

  ipcMain.handle('report:getRevenueReport', async (_event, params?: any) => {
    try {
      const data = await ReportService.getRevenueReport(params ?? {});
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ── Orders Report ────────────────────────────────────────────────────────────

  ipcMain.handle('report:getOrdersReport', async (_event, params?: any) => {
    try {
      const data = await ReportService.getOrdersReport(params ?? {});
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ── Customer Report ──────────────────────────────────────────────────────────

  ipcMain.handle('report:getCustomerReport', async (_event, params?: any) => {
    try {
      const data = await ReportService.getCustomerReport(params ?? {});
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ── Outstanding Report ───────────────────────────────────────────────────────

  ipcMain.handle('report:getOutstandingReport', async (_event, params?: any) => {
    try {
      const data = await ReportService.getOutstandingReport(params ?? {});
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ── Delivery Report ──────────────────────────────────────────────────────────

  ipcMain.handle('report:getDeliveryReport', async () => {
    try {
      const data = await ReportService.getDeliveryReport();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ── Payment Method Report ────────────────────────────────────────────────────

  ipcMain.handle('report:getPaymentMethodReport', async (_event, params?: any) => {
    try {
      const data = await ReportService.getPaymentMethodReport(params ?? {});
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ── Revenue Trend ────────────────────────────────────────────────────────────

  ipcMain.handle('report:getRevenueTrend', async (_event, params?: any) => {
    try {
      const data = await ReportService.getRevenueTrend(params ?? {});
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ── CSV Export ───────────────────────────────────────────────────────────────

  ipcMain.handle('report:exportCsv', async (_event, payload: { type: string; params?: any }) => {
    try {
      const { type, params } = payload;
      let csvContent = '';
      let fileName = `darzi-pro-${type}-report-${new Date().toISOString().split('T')[0]}.csv`;

      switch (type) {
        case 'revenue':
          csvContent = await ReportService.exportRevenueCsv(params ?? {});
          break;
        case 'orders':
          csvContent = await ReportService.exportOrdersCsv(params ?? {});
          break;
        case 'outstanding':
          csvContent = await ReportService.exportOutstandingCsv(params ?? {});
          break;
        case 'delivery':
          csvContent = await ReportService.exportDeliveryCsv();
          break;
        case 'customers':
          csvContent = await ReportService.exportCustomerCsv(params ?? {});
          break;
        default:
          return { success: false, error: `Unknown report type: ${type}` };
      }

      const downloadsPath = app.getPath('downloads');
      const filePath = path.join(downloadsPath, fileName);
      fs.writeFileSync(filePath, '\uFEFF' + csvContent, 'utf8'); // BOM for Excel UTF-8

      return { success: true, data: { filePath, fileName } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ── PDF Export ───────────────────────────────────────────────────────────────

  ipcMain.handle('report:exportPdf', async (_event, payload: { type: string; params?: any }) => {
    try {
      const { type, params } = payload;
      const pdfmake = await import('pdfmake/build/pdfmake');
      const pdfFonts = await import('pdfmake/build/vfs_fonts');
      (pdfmake as any).default.vfs = (pdfFonts as any).default.pdfMake?.vfs ?? (pdfFonts as any).pdfMake?.vfs;
      const PdfPrinter = (pdfmake as any).default;

      const formatCurrency = (n: number) => `Rs ${Number(n).toLocaleString('en-PK')}`;
      const formatDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

      const docDefinition: any = await buildPdfContent(type, params, formatCurrency, formatDate);

      const fileName = `darzi-pro-${type}-report-${new Date().toISOString().split('T')[0]}.pdf`;
      const downloadsPath = app.getPath('downloads');
      const filePath = path.join(downloadsPath, fileName);

      await new Promise<void>((resolve, reject) => {
        const pdfDoc = PdfPrinter.createPdf(docDefinition);
        pdfDoc.getBuffer((buffer: Buffer) => {
          try {
            fs.writeFileSync(filePath, buffer);
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });

      return { success: true, data: { filePath, fileName } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}

async function buildPdfContent(
  type: string,
  params: any,
  formatCurrency: (n: number) => string,
  formatDate: (d: string) => string
): Promise<any> {
  const today = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' });
  const titleMap: Record<string, string> = {
    revenue: 'Revenue Report',
    orders: 'Orders Report',
    outstanding: 'Outstanding Balance Report',
    delivery: 'Delivery Report',
    customers: 'Customer Report',
    paymentMethod: 'Payment Method Report',
  };

  const header = {
    text: [
      { text: 'Darzi Pro\n', style: 'shopName' },
      { text: (titleMap[type] ?? 'Report') + '\n', style: 'reportTitle' },
      { text: `Generated: ${today}`, style: 'meta' },
    ],
    margin: [0, 0, 0, 16],
  };

  const styles = {
    shopName: { fontSize: 18, bold: true, color: '#2563EB' },
    reportTitle: { fontSize: 13, bold: true, color: '#0F172A' },
    meta: { fontSize: 10, color: '#64748B' },
    tableHeader: { bold: true, fillColor: '#EFF6FF', color: '#1E40AF', fontSize: 9 },
    tableCell: { fontSize: 9 },
  };

  let tableBody: any[][] = [];

  if (type === 'revenue') {
    const report = await ReportService.getRevenueReport(params ?? {});
    tableBody = [
      [{ text: 'Date', style: 'tableHeader' }, { text: 'Total (Rs)', style: 'tableHeader' }],
      ...report.dailyTrend.map((d) => [
        { text: d.date, style: 'tableCell' },
        { text: formatCurrency(d.total), style: 'tableCell', alignment: 'right' },
      ]),
    ];
  } else if (type === 'orders') {
    const report = await ReportService.getOrdersReport(params ?? {});
    tableBody = [
      [
        { text: 'Order #', style: 'tableHeader' },
        { text: 'Customer', style: 'tableHeader' },
        { text: 'Status', style: 'tableHeader' },
        { text: 'Delivery Date', style: 'tableHeader' },
        { text: 'Total (Rs)', style: 'tableHeader' },
      ],
      ...report.items.map((o) => [
        { text: o.orderNumber, style: 'tableCell' },
        { text: o.customerName, style: 'tableCell' },
        { text: o.status, style: 'tableCell' },
        { text: formatDate(o.deliveryDate), style: 'tableCell' },
        { text: formatCurrency(o.totalAmount), style: 'tableCell', alignment: 'right' },
      ]),
    ];
  } else if (type === 'outstanding') {
    const report = await ReportService.getOutstandingReport(params ?? {});
    tableBody = [
      [
        { text: 'Order #', style: 'tableHeader' },
        { text: 'Customer', style: 'tableHeader' },
        { text: 'Total', style: 'tableHeader' },
        { text: 'Paid', style: 'tableHeader' },
        { text: 'Remaining', style: 'tableHeader' },
      ],
      ...report.items.map((o) => [
        { text: o.orderNumber, style: 'tableCell' },
        { text: o.customerName, style: 'tableCell' },
        { text: formatCurrency(o.totalAmount), style: 'tableCell', alignment: 'right' },
        { text: formatCurrency(o.totalPaid), style: 'tableCell', alignment: 'right' },
        { text: formatCurrency(o.remaining), style: 'tableCell', alignment: 'right', color: '#DC2626' },
      ]),
    ];
  } else if (type === 'delivery') {
    const report = await ReportService.getDeliveryReport();
    tableBody = [
      [
        { text: 'Order #', style: 'tableHeader' },
        { text: 'Customer', style: 'tableHeader' },
        { text: 'Delivery Date', style: 'tableHeader' },
        { text: 'Days Overdue', style: 'tableHeader' },
        { text: 'Status', style: 'tableHeader' },
      ],
      ...report.overdueItems.map((o) => [
        { text: o.orderNumber, style: 'tableCell' },
        { text: o.customerName, style: 'tableCell' },
        { text: formatDate(o.deliveryDate), style: 'tableCell' },
        { text: String(o.daysOverdue), style: 'tableCell', color: '#DC2626', alignment: 'center' },
        { text: o.status, style: 'tableCell' },
      ]),
    ];
  } else if (type === 'customers') {
    const report = await ReportService.getCustomerReport(params ?? {});
    tableBody = [
      [
        { text: 'Customer', style: 'tableHeader' },
        { text: 'Phone', style: 'tableHeader' },
        { text: 'Orders', style: 'tableHeader' },
        { text: 'Total Spent (Rs)', style: 'tableHeader' },
      ],
      ...report.topBySpending.map((c) => [
        { text: c.fullName, style: 'tableCell' },
        { text: c.phoneNumber, style: 'tableCell' },
        { text: String(c.orderCount), style: 'tableCell', alignment: 'center' },
        { text: formatCurrency(c.totalSpent), style: 'tableCell', alignment: 'right' },
      ]),
    ];
  }

  return {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 40],
    content: [
      header,
      {
        table: {
          headerRows: 1,
          widths: Array(tableBody[0]?.length ?? 1).fill('*'),
          body: tableBody,
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#E2E8F0',
          vLineColor: () => '#E2E8F0',
        },
      },
    ],
    styles,
    defaultStyle: { font: 'Helvetica' },
  };
}
