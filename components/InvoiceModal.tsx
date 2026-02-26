import React, { useState, useEffect } from 'react';
import { FinancialData, PaymentMethod } from '../types';
import { Logo } from './Logo';
import { X, Printer, Download, CreditCard, Smartphone, Landmark, QrCode, FileCheck, Loader2 } from 'lucide-react';
import { generateAndUploadPDF } from '../lib/pdfService';

interface Props {
  transaction: FinancialData | null;
  userRole: 'admin' | 'viewer';
  onClose: () => void;
}

export const InvoiceModal: React.FC<Props> = ({ transaction, userRole, onClose }) => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');

  // Initialize defaults when transaction opens
  useEffect(() => {
    if (transaction) {
      const today = new Date();
      const due = new Date();
      due.setDate(today.getDate() + 14); // Default Net 14

      setInvoiceNumber(`INV-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000)}`);
      setIssueDate(today.toISOString().split('T')[0]);
      setDueDate(due.toISOString().split('T')[0]);

      // Client Name Logic
      let displayName = transaction.description;
      if (transaction.responsibleName) {
        displayName += `\nAttn: ${transaction.responsibleName}`;
      }
      setClientName(displayName);

      setClientAddress('Client Address Line 1\nCity, State, Zip Code\nCountry');
    }
  }, [transaction]);

  if (!transaction) return null;

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const url = await generateAndUploadPDF(
        'invoice-capture-area',
        `Invoice_${invoiceNumber}.pdf`,
        transaction.id
      );
      if (url) alert("PDF gerado e arquivado com sucesso!");
    } catch (error) {
      alert("Erro ao gerar PDF profissional.");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const renderPaymentInstructions = () => {
    switch (transaction.paymentMethod) {
      case PaymentMethod.ZELLE:
        return (
          <div className="bg-purple-50 p-6 rounded-lg border border-purple-100 print:bg-slate-50 print:border-slate-200">
            <h3 className="text-sm font-bold text-purple-900 uppercase mb-4 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-purple-600" />
              Zelle Payment Instructions
            </h3>
            <div className="space-y-2 text-sm text-slate-600">
              <p>Please send the total amount to our verified business handle:</p>
              <div className="font-bold text-lg text-slate-800">finance@onebridge.llc</div>
              <p className="text-xs text-slate-500">Recipient: ONEBRIDGE STALWART LLC</p>
            </div>
          </div>
        );
      case PaymentMethod.PARCELADO_USA:
        return (
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 print:bg-slate-50 print:border-slate-200">
            <h3 className="text-sm font-bold text-blue-900 uppercase mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              Credit Card / Installments
            </h3>
            <div className="space-y-4 text-sm text-slate-600">
              <p>You can pay this invoice securely via ParceladoUSA using the link below:</p>

              {/* Screen View: Clickable Button */}
              <div className="print:hidden">
                {transaction.paymentLink ? (
                  <a
                    href={transaction.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                  >
                    Pay Now with ParceladoUSA
                  </a>
                ) : (
                  <p className="text-red-500 italic">Payment link not generated.</p>
                )}
              </div>

              {/* Print View: QR Code Placeholder & URL */}
              <div className="hidden print:block">
                <div className="flex gap-4 items-center">
                  <div className="w-24 h-24 bg-white border border-slate-200 flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-slate-800" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Scan to Pay</p>
                    <p className="text-xs font-mono text-slate-500 break-all max-w-sm mt-1">
                      {transaction.paymentLink || 'Link not available'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default: // WIRE
        return (
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 print:bg-slate-50 print:border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 uppercase mb-4 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-600" />
              Wire Transfer Instructions
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
              <div>
                <span className="block text-xs text-slate-400 uppercase">Bank Name</span>
                <span className="font-medium">JPMORGAN CHASE BANK</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400 uppercase">Account Holder</span>
                <span className="font-medium">ONEBRIDGE STALWART LLC</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400 uppercase">Routing Number (ABA)</span>
                <span className="font-mono">267084131</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400 uppercase">Account Number</span>
                <span className="font-mono">2905038708</span>
              </div>
              <div className="col-span-2 mt-2">
                <span className="block text-xs text-slate-400 uppercase">Bank Address</span>
                <span className="text-xs">270 Park Avenue, New York, NY 10017, USA</span>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm print:bg-white print:p-0">

      {/* Container - Hidden during print, handles scrolling/layout on screen */}
      <div className="bg-white w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col print:h-auto print:shadow-none print:w-full print:max-w-none print:rounded-none">

        {/* Header / Controls (Hidden on Print) */}
        <div className="flex justify-between items-center p-4 border-b border-slate-200 print:hidden">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Emissão de Invoice
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded">US Commercial Standard</span>
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileCheck className="w-4 h-4" />
              )}
              Gerar e Arquivar PDF
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-slate-100 p-8 print:p-0 print:bg-white print:overflow-visible">

          {/* A4 Paper Simulation */}
          <div
            id="invoice-capture-area"
            className="bg-white max-w-[210mm] mx-auto min-h-[297mm] shadow-lg p-[15mm] print:shadow-none print:m-0 print:w-full print:max-w-none print:h-auto text-slate-900"
          >

            {/* INVOICE HEADER */}
            <div className="flex justify-between items-start mb-12">
              <div className="scale-75 origin-top-left">
                <Logo />
              </div>
              <div className="text-right">
                <h1 className="text-4xl font-light text-slate-300 tracking-widest uppercase mb-2">Invoice</h1>
                <div className="text-sm font-medium text-slate-600">
                  <div className="print:hidden">
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="text-right border-b border-dashed border-slate-300 focus:border-emerald-500 outline-none w-40"
                    />
                  </div>
                  <div className="hidden print:block text-slate-800 text-lg font-bold">{invoiceNumber}</div>
                </div>
              </div>
            </div>

            {/* BILLING INFO */}
            <div className="flex justify-between mb-12">
              <div className="w-1/2 pr-8">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bill From</h3>
                <p className="font-bold text-slate-800">ONEBRIDGE STALWART LLC</p>
                <p className="text-sm text-slate-500 whitespace-pre-line leading-relaxed">
                  30 N Gould St Ste R
                  Sheridan, WY 82801
                  United States
                  finance@onebridge.llc
                </p>
              </div>
              <div className="w-1/2 pl-8 border-l border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bill To</h3>

                {/* Editable Area (Admin Only) */}
                {userRole === 'admin' ? (
                  <div className="print:hidden space-y-2">
                    <textarea
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full font-bold text-slate-800 border-b border-dashed border-slate-300 focus:border-emerald-500 outline-none resize-none h-16"
                      placeholder="Client Name & Attn"
                    />
                    <textarea
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      className="w-full text-sm text-slate-500 border border-dashed border-slate-300 rounded p-1 focus:border-emerald-500 outline-none resize-none h-20"
                      placeholder="Client Address..."
                    />
                  </div>
                ) : (
                  <div className="print:hidden bg-slate-50 p-2 rounded text-slate-400 text-xs italic mb-2">
                    View-only mode (Contact Admin for edits)
                  </div>
                )}

                {/* Print/Static View */}
                <div className={`${userRole === 'admin' ? 'hidden print:block' : ''}`}>
                  <p className="font-bold text-slate-800 whitespace-pre-line">{clientName}</p>
                  <p className="text-sm text-slate-500 whitespace-pre-line leading-relaxed">{clientAddress}</p>
                </div>
              </div>
            </div>

            {/* DATES */}
            <div className="flex gap-12 mb-12">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Issue Date</h3>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="font-medium text-slate-700 bg-transparent outline-none print:hidden"
                />
                <span className="hidden print:block font-medium text-slate-700">{issueDate}</span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Due Date</h3>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="font-medium text-slate-700 bg-transparent outline-none print:hidden"
                />
                <span className="hidden print:block font-medium text-slate-700">{dueDate}</span>
              </div>
            </div>

            {/* LINE ITEMS */}
            <div className="mb-12">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-slate-800 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <th className="py-3">Description / Service</th>
                    <th className="py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-4 text-slate-700 font-medium">
                      {transaction.serviceType || transaction.description}
                    </td>
                    <td className="py-4 text-right text-slate-900 font-bold">
                      {formatCurrency(transaction.grossRevenue)}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td className="pt-6 text-right font-medium text-slate-500">Total</td>
                    <td className="pt-6 text-right text-2xl font-bold text-emerald-600">
                      {formatCurrency(transaction.grossRevenue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* DYNAMIC PAYMENT INSTRUCTIONS */}
            {renderPaymentInstructions()}

            <div className="mt-12 text-center text-xs text-slate-400">
              <p>Thank you for your business.</p>
              <p>OneBridge Stalwart LLC is a registered company in Wyoming, USA.</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};