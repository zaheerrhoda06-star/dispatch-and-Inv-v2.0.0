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
        win.document.write(`<iframe src="${invoice.pdfData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
      } else {
        // For images, just show the image in the new window
        win.document.write(`
          <html>
            <body style="margin:0; background:#525659; display:flex; justify-content:center; padding:20px;">
              <img src="${invoice.pdfData}" style="max-width:100%; box-shadow:0 0 20px rgba(0,0,0,0.5); background:white;" />
            </body>
          </html>
        `);
      }
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
