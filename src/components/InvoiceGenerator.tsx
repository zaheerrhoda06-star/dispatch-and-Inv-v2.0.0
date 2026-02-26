import React, { useRef } from 'react';
import { Job, CompanyInfo } from '../types';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoiceGeneratorProps {
  job: Job;
  companyInfo: CompanyInfo;
  onBack: () => void;
}

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({ job, companyInfo, onBack }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);

  // Basic invoice details
  const invoiceNumber = job.invoiceNumber || `INV-${job.obNumber}-${job.id.slice(-4)}`;
  const invoiceDate = new Date().toLocaleDateString();

  const downloadPDF = async () => {
    if (!invoiceRef.current || isGenerating) return;
    setIsGenerating(true);

    try {
      // Small delay to ensure any UI transitions are finished
      await new Promise(resolve => setTimeout(resolve, 300));

      const element = invoiceRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('invoice-container');
          if (clonedElement) {
            clonedElement.style.width = '794px';
            clonedElement.style.maxWidth = '794px';
            clonedElement.style.margin = '0';
            clonedElement.style.padding = '0'; // Padding is already inside the internal divs
            clonedElement.style.boxShadow = 'none';
            clonedElement.style.borderRadius = '0';
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      // Create PDF in A4 format
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pdfWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add subsequent pages if content is longer than one A4 page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      // Save to Local Storage (Record only)
      try {
        const savedInvoices = JSON.parse(localStorage.getItem('savedInvoices') || '[]');
        const existingIndex = savedInvoices.findIndex((inv: any) => inv.invoiceNumber === invoiceNumber);
        
        const invoiceRecord = {
          id: Date.now(),
          invoiceNumber,
          date: invoiceDate,
          customerName: job.customerName,
          obNumber: job.obNumber,
          amount: job.price,
          pdfData: imgData 
        };

        if (existingIndex >= 0) {
          savedInvoices[existingIndex] = invoiceRecord;
        } else {
          savedInvoices.push(invoiceRecord);
        }

        if (savedInvoices.length > 30) savedInvoices.shift();
        localStorage.setItem('savedInvoices', JSON.stringify(savedInvoices));
      } catch (storageError) {
        console.warn('LocalStorage storage failed:', storageError);
      }

      // Trigger download using Blob for better compatibility
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-full mx-auto pb-20">
      <div className="flex justify-between items-center no-print px-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg font-medium"
          disabled={isGenerating}
        >
          Back to Jobs
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={downloadPDF}
          className={`py-2 px-8 rounded-lg font-bold shadow-lg text-white transition-colors ${isGenerating ? 'bg-gray-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Download PDF'}
        </motion.button>
      </div>

      <div className="overflow-x-auto pb-4 rounded-2xl">
        <div
          ref={invoiceRef}
          id="invoice-container"
          className="bg-white mx-auto shadow-2xl"
          style={{ 
            width: '794px', 
            minHeight: '1123px', // A4 height at 96 DPI
            color: '#111827', 
            backgroundColor: '#ffffff',
            fontFamily: 'sans-serif',
            margin: '0 auto'
          }}
        >
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '40px', borderBottom: '2px solid #f3f4f6' }}>
          <div style={{ flex: 1 }}>
            {companyInfo.logoUrl && (
              <img src={companyInfo.logoUrl} alt="Logo" style={{ height: '80px', marginBottom: '20px', objectFit: 'contain' }} referrerPolicy="no-referrer" />
            )}
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#047857', margin: '0 0 10px 0' }}>INVOICE</h1>
            <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 5px 0' }}>{companyInfo.name}</p>
            <p style={{ fontSize: '14px', color: '#4b5563', margin: '0', maxWidth: '300px' }}>{companyInfo.address}</p>
            <p style={{ fontSize: '14px', color: '#4b5563', margin: '5px 0 0 0' }}>Phone: {companyInfo.phone}</p>
            <p style={{ fontSize: '14px', color: '#4b5563', margin: '0' }}>Email: {companyInfo.email}</p>
            {companyInfo.registrationNumber && <p style={{ fontSize: '14px', color: '#4b5563', margin: '0' }}>Reg: {companyInfo.registrationNumber}</p>}
          </div>
          
          <div style={{ textAlign: 'right', minWidth: '200px' }}>
            <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280', margin: '0 0 5px 0', textTransform: 'uppercase' }}>Invoice #</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: '0 0 15px 0' }}>{invoiceNumber}</p>
              
              <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280', margin: '0 0 5px 0', textTransform: 'uppercase' }}>Date</p>
              <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', margin: '0' }}>{invoiceDate}</p>
            </div>
          </div>
        </div>

        {/* Billing & Job Info */}
        <div style={{ padding: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#047857', borderBottom: '1px solid #d1fae5', paddingBottom: '8px', marginBottom: '15px', textTransform: 'uppercase' }}>Bill To</h3>
            <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 5px 0' }}>{job.customerName}</p>
            <p style={{ fontSize: '14px', color: '#4b5563', margin: '0' }}>OB Number: {job.obNumber}</p>
          </div>
          
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#047857', borderBottom: '1px solid #d1fae5', paddingBottom: '8px', marginBottom: '15px', textTransform: 'uppercase' }}>Job Details</h3>
            <p style={{ fontSize: '14px', margin: '0 0 5px 0' }}><strong>Vehicle:</strong> {job.vehicleDetails}</p>
            <p style={{ fontSize: '14px', margin: '0 0 5px 0' }}><strong>Received:</strong> {job.timeReceived}</p>
            <p style={{ fontSize: '14px', margin: '0' }}><strong>Type:</strong> {job.towClass} - {job.vehicleUse}</p>
          </div>
        </div>

        {/* Locations Section */}
        <div style={{ padding: '0 40px 40px 40px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#047857', borderBottom: '1px solid #d1fae5', paddingBottom: '8px', marginBottom: '15px', textTransform: 'uppercase' }}>Service Locations</h3>
          <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ marginBottom: '15px' }}>
              <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#059669', margin: '0 0 5px 0', textTransform: 'uppercase' }}>Pickup Location</p>
              <p style={{ fontSize: '14px', margin: '0' }}>{job.pickupLocation}</p>
            </div>
            {job.dropoffLocation && (
              <div>
                <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#dc2626', margin: '0 0 5px 0', textTransform: 'uppercase' }}>Dropoff Location</p>
                <p style={{ fontSize: '14px', margin: '0' }}>{job.dropoffLocation}</p>
              </div>
            )}
          </div>
        </div>

        {/* Notes Section */}
        {job.notes && (
          <div style={{ padding: '0 40px 40px 40px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#047857', borderBottom: '1px solid #d1fae5', paddingBottom: '8px', marginBottom: '15px', textTransform: 'uppercase' }}>Notes</h3>
            <p style={{ fontSize: '14px', color: '#4b5563', fontStyle: 'italic', margin: '0' }}>{job.notes}</p>
          </div>
        )}

        {/* Footer & Payment Info */}
        <div style={{ marginTop: 'auto', padding: '40px', borderTop: '2px solid #047857', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            {(companyInfo.bankName || companyInfo.accountNumber || companyInfo.sortCode) && (
              <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #f3f4f6', maxWidth: '300px' }}>
                <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#111827', margin: '0 0 10px 0', textTransform: 'uppercase' }}>Payment Details</p>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <tbody>
                    {companyInfo.bankName && (
                      <tr>
                        <td style={{ color: '#6b7280', padding: '2px 0' }}>Bank:</td>
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>{companyInfo.bankName}</td>
                      </tr>
                    )}
                    {companyInfo.accountNumber && (
                      <tr>
                        <td style={{ color: '#6b7280', padding: '2px 0' }}>Account:</td>
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>{companyInfo.accountNumber}</td>
                      </tr>
                    )}
                    {companyInfo.sortCode && (
                      <tr>
                        <td style={{ color: '#6b7280', padding: '2px 0' }}>Branch Code:</td>
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>{companyInfo.sortCode}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#6b7280', margin: '0 0 5px 0', textTransform: 'uppercase' }}>Total Amount</p>
            <p style={{ fontSize: '42px', fontWeight: 'bold', color: '#047857', margin: '0' }}>
              {job.price ? `R${job.price.toFixed(2)}` : 'R [Manual]'}
            </p>
            {!job.price && <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '5px' }}>* Please enter amount manually *</p>}
          </div>
        </div>

        <div style={{ padding: '20px 40px 40px 40px', textAlign: 'center', color: '#9ca3af', fontSize: '12px' }}>
          <p>Thank you for choosing {companyInfo.name}!</p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;
