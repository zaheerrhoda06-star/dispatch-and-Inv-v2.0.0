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
        scale: 1.5,
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

      // Only add image if it fits on one page, otherwise scale to fit
      if (imgHeight <= pdfHeight) {
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      } else {
        // Scale down to fit on one page
        const scaleFactor = pdfHeight / imgHeight;
        const scaledWidth = imgWidth * scaleFactor;
        const scaledHeight = imgHeight * scaleFactor;
        const xOffset = (pdfWidth - scaledWidth) / 2;
        pdf.addImage(imgData, 'JPEG', xOffset, 0, scaledWidth, scaledHeight);
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
            color: '#1f2937',
            backgroundColor: '#ffffff',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            margin: '0 auto'
          }}
        >
        {/* Modern Header with accent bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '0',
          borderBottom: '4px solid #10b981',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)'
        }}>
          <div style={{ flex: 1, padding: '20px 24px 20px 24px' }}>
            {companyInfo.logoUrl && (
              <img src={companyInfo.logoUrl} alt="Logo" style={{ height: '48px', marginBottom: '12px', objectFit: 'contain' }} referrerPolicy="no-referrer" />
            )}
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#10b981', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>INVOICE</h1>
            <p style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937', margin: '0 0 4px 0' }}>{companyInfo.name}</p>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0', maxWidth: '320px', lineHeight: '1.5' }}>{companyInfo.address}</p>
            <div style={{ display: 'flex', gap: '16px', marginTop: '6px', flexWrap: 'wrap' }}>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '0' }}>📞 {companyInfo.phone}</p>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '0' }}>✉ {companyInfo.email}</p>
            </div>
            {companyInfo.registrationNumber && <p style={{ fontSize: '13px', color: '#6b7280', margin: '6px 0 0 0' }}>Reg: {companyInfo.registrationNumber}</p>}
          </div>
          
          <div style={{ textAlign: 'right', padding: '20px 24px 20px 24px', minWidth: '180px' }}>
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invoice Number</p>
              <p style={{ fontSize: '20px', fontWeight: '800', color: '#10b981', margin: '0 0 12px 0', letterSpacing: '-0.5px' }}>{invoiceNumber}</p>
              
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invoice Date</p>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', margin: '0' }}>{invoiceDate}</p>
            </div>
          </div>
        </div>

        {/* Two-column info section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{
            padding: '20px 24px 20px 24px',
            borderRight: '1px solid #e5e7eb'
          }}>
            <h2 style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#10b981',
              margin: '0 0 12px 0',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>Bill To</h2>
            <p style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937', margin: '0 0 6px 0' }}>{job.customerName}</p>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0' }}>OB Number: <span style={{ fontWeight: '600', color: '#1f2937' }}>{job.obNumber}</span></p>
          </div>
          
          <div style={{ padding: '20px 24px 20px 24px' }}>
            <h2 style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#10b981',
              margin: '0 0 12px 0',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>Job Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: '13px', color: '#4b5563' }}>
              <div style={{ fontWeight: '600', color: '#1f2937' }}>Vehicle:</div>
              <div style={{ color: '#4b5563' }}>{job.vehicleDetails}</div>
              <div style={{ fontWeight: '600', color: '#1f2937' }}>Received:</div>
              <div style={{ color: '#4b5563' }}>{job.timeReceived}</div>
              <div style={{ fontWeight: '600', color: '#1f2937' }}>Type:</div>
              <div style={{ color: '#4b5563' }}>{job.towClass} - {job.vehicleUse}</div>
            </div>
          </div>
        </div>

        {/* Locations Section */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{
            fontSize: '12px',
            fontWeight: '700',
            color: '#10b981',
            margin: '0 0 12px 0',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>Service Locations</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{
              backgroundColor: '#f0fdf4',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #d1fae5',
              borderLeft: '3px solid #10b981'
            }}>
              <p style={{ fontSize: '10px', fontWeight: '700', color: '#059669', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pickup Location</p>
              <p style={{ fontSize: '14px', color: '#1f2937', margin: '0', lineHeight: '1.5' }}>{job.pickupLocation}</p>
            </div>
            {job.dropoffLocation && (
              <div style={{
                backgroundColor: '#fef2f2',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #fecaca',
                borderLeft: '3px solid #ef4444'
              }}>
                <p style={{ fontSize: '10px', fontWeight: '700', color: '#dc2626', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dropoff Location</p>
                <p style={{ fontSize: '14px', color: '#1f2937', margin: '0', lineHeight: '1.5' }}>{job.dropoffLocation}</p>
              </div>
            )}
          </div>
        </div>

        {/* Notes Section */}
        {job.notes && (
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#10b981',
              margin: '0 0 12px 0',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>Notes</h2>
            <p style={{
              fontSize: '14px',
              color: '#4b5563',
              fontStyle: 'italic',
              margin: '0',
              lineHeight: '1.6',
              backgroundColor: '#f9fafb',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #f3f4f6'
            }}>{job.notes}</p>
          </div>
        )}

        {/* Footer & Payment Info */}
        <div style={{
          marginTop: 'auto',
          padding: '24px',
          backgroundColor: '#f9fafb',
          borderTop: '3px solid #10b981',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '24px'
        }}>
          <div style={{ flex: 1 }}>
            {(companyInfo.bankName || companyInfo.accountNumber || companyInfo.sortCode) && (
              <div style={{
                backgroundColor: '#ffffff',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                maxWidth: '300px'
              }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment Details</p>
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                  <tbody>
                    {companyInfo.bankName && (
                      <tr>
                        <td style={{ color: '#6b7280', padding: '6px 0', fontWeight: '500' }}>Bank:</td>
                        <td style={{ fontWeight: '700', textAlign: 'right', color: '#1f2937' }}>{companyInfo.bankName}</td>
                      </tr>
                    )}
                    {companyInfo.accountNumber && (
                      <tr>
                        <td style={{ color: '#6b7280', padding: '6px 0', fontWeight: '500' }}>Account:</td>
                        <td style={{ fontWeight: '700', textAlign: 'right', color: '#1f2937' }}>{companyInfo.accountNumber}</td>
                      </tr>
                    )}
                    {companyInfo.sortCode && (
                      <tr>
                        <td style={{ color: '#6b7280', padding: '6px 0', fontWeight: '500' }}>Branch Code:</td>
                        <td style={{ fontWeight: '700', textAlign: 'right', color: '#1f2937' }}>{companyInfo.sortCode}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Amount Due</p>
            <p style={{ fontSize: '36px', fontWeight: '800', color: '#10b981', margin: '0', letterSpacing: '-1px' }}>
              {job.price ? `R${job.price.toFixed(2)}` : 'R [Manual]'}
            </p>
            {!job.price && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px', fontWeight: '500' }}>* Amount needs to be entered *</p>}
          </div>
        </div>

        <div style={{
          padding: '16px 24px',
          textAlign: 'center',
          backgroundColor: '#10b981',
          color: 'white',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          <p style={{ margin: 0 }}>Thank you for choosing {companyInfo.name}!</p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;
