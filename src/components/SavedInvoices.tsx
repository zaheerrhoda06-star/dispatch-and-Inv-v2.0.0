import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, Download, Trash2, Eye } from 'lucide-react';
import jsPDF from 'jspdf';

interface SavedInvoice {
  id: number;
  invoiceNumber: string;
  date: string;
  customerName: string;
  obNumber: string;
  amount: number;
  pdfData: string;
}

const SavedInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<SavedInvoice[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('savedInvoices');
    if (stored) {
      setInvoices(JSON.parse(stored));
    }
  }, []);

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this invoice record?')) {
      const updated = invoices.filter(inv => inv.id !== id);
      setInvoices(updated);
      localStorage.setItem('savedInvoices', JSON.stringify(updated));
    }
  };

  const handleDownload = (invoice: SavedInvoice) => {
    try {
      // If it's already a PDF data URI, download it
      if (invoice.pdfData.startsWith('data:application/pdf')) {
        const link = document.createElement('a');
        link.href = invoice.pdfData;
        link.download = `Invoice-${invoice.invoiceNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // If it's an image (new format), wrap it in a PDF first
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const imgProps = pdf.getImageProperties(invoice.pdfData);
        const imgWidth = pdfWidth;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        
        let heightLeft = imgHeight;
        let position = 0;

        // Add first page
        pdf.addImage(invoice.pdfData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        // Add subsequent pages if content is longer than one A4 page
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(invoice.pdfData, 'JPEG', 0, position, imgWidth, imgHeight);
          heightLeft -= pdfHeight;
        }
        
        const pdfBlob = pdf.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Invoice-${invoice.invoiceNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const handleView = (invoice: SavedInvoice) => {
    const win = window.open();
    if (win) {
      if (invoice.pdfData.startsWith('data:application/pdf')) {
        win.document.write(`
          <html>
            <head>
              <title>Invoice ${invoice.invoiceNumber}</title>
              <style>
                body { margin: 0; padding: 0; background: #525659; font-family: sans-serif; }
                .toolbar {
                  position: fixed;
                  top: 0;
                  left: 0;
                  right: 0;
                  background: #1f2937;
                  padding: 10px 20px;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  z-index: 1000;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }
                .close-btn {
                  background: #dc2626;
                  color: white;
                  border: none;
                  padding: 8px 16px;
                  border-radius: 6px;
                  cursor: pointer;
                  font-weight: bold;
                  font-size: 14px;
                }
                .close-btn:hover { background: #b91c1c; }
                .invoice-info { color: white; font-size: 14px; }
                .iframe-container {
                  margin-top: 50px;
                  height: calc(100vh - 50px);
                }
                iframe { width: 100%; height: 100%; border: none; }
              </style>
            </head>
            <body>
              <div class="toolbar">
                <div class="invoice-info">Invoice: ${invoice.invoiceNumber} - ${invoice.customerName}</div>
                <button class="close-btn" onclick="window.close()">← Back</button>
              </div>
              <div class="iframe-container">
                <iframe src="${invoice.pdfData}" frameborder="0" allowfullscreen></iframe>
              </div>
            </body>
          </html>
        `);
      } else {
        // For images, show with a back button
        win.document.write(`
          <html>
            <head>
              <title>Invoice ${invoice.invoiceNumber}</title>
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  background: #525659;
                  font-family: sans-serif;
                  display: flex;
                  flex-direction: column;
                  min-height: 100vh;
                }
                .toolbar {
                  position: fixed;
                  top: 0;
                  left: 0;
                  right: 0;
                  background: #1f2937;
                  padding: 10px 20px;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  z-index: 1000;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }
                .close-btn {
                  background: #dc2626;
                  color: white;
                  border: none;
                  padding: 8px 16px;
                  border-radius: 6px;
                  cursor: pointer;
                  font-weight: bold;
                  font-size: 14px;
                }
                .close-btn:hover { background: #b91c1c; }
                .invoice-info { color: white; font-size: 14px; }
                .content {
                  margin-top: 50px;
                  flex: 1;
                  display: flex;
                  justify-content: center;
                  padding: 20px;
                  overflow: auto;
                }
                img {
                  max-width: 100%;
                  box-shadow: 0 0 20px rgba(0,0,0,0.5);
                  background: white;
                }
              </style>
            </head>
            <body>
              <div class="toolbar">
                <div class="invoice-info">Invoice: ${invoice.invoiceNumber} - ${invoice.customerName}</div>
                <button class="close-btn" onclick="window.close()">← Back</button>
              </div>
              <div class="content">
                <img src="${invoice.pdfData}" />
              </div>
            </body>
          </html>
        `);
      }
      win.document.close();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <h2 className="text-2xl font-bold text-emerald-400 mb-6">Saved Invoices</h2>
      
      {invoices.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-2xl border border-gray-700">
          <FileText className="mx-auto text-gray-600 mb-4" size={48} />
          <p className="text-gray-400">No invoices saved yet. Generate an invoice and click "Save as PDF" to see it here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="bg-gray-700 p-4 rounded-xl border border-gray-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-500/20 p-3 rounded-lg">
                  <FileText className="text-emerald-400" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-white">{invoice.invoiceNumber}</h3>
                  <p className="text-xs text-gray-400">{invoice.date} | OB: {invoice.obNumber}</p>
                  <p className="text-sm text-gray-300">{invoice.customerName}</p>
                  {invoice.amount && <p className="text-emerald-400 font-bold text-sm">R{invoice.amount.toFixed(2)}</p>}
                </div>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleView(invoice)}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg flex items-center justify-center gap-2 text-sm px-4"
                  title="View PDF"
                >
                  <Eye size={18} />
                  <span className="sm:hidden">View</span>
                </button>
                <button
                  onClick={() => handleDownload(invoice)}
                  className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg flex items-center justify-center gap-2 text-sm px-4"
                  title="Download PDF"
                >
                  <Download size={18} />
                  <span className="sm:hidden">Download</span>
                </button>
                <button
                  onClick={() => handleDelete(invoice.id)}
                  className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg flex items-center justify-center gap-2 text-sm px-4"
                  title="Delete"
                >
                  <Trash2 size={18} />
                  <span className="sm:hidden">Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default SavedInvoices;
