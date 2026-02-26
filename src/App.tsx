/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { Job, CompanyInfo } from './types';
import { motion } from 'motion/react';
import { Car, MapPin, Phone, User, MessageSquareText, Calendar, Clock, Hash, Building } from 'lucide-react';
import JobList from './components/JobList';
import InvoiceGenerator from './components/InvoiceGenerator';
import CompanySettings from './components/CompanySettings';
import SavedInvoices from './components/SavedInvoices';

export default function App() {
  const [date, setDate] = useState('');
  const [timeReceived, setTimeReceived] = useState('');
  const [obNumber, setObNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [contactOnScene, setContactOnScene] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [vehicleDetails, setVehicleDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [towClass, setTowClass] = useState('Normal Recovery'); // Default to Normal Recovery
  const [vehicleUse, setVehicleUse] = useState('Normal Sling'); // Default to Normal Sling
  const [price, setPrice] = useState<number | ''>('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: 'Your Company Name',
    address: 'Your Company Address',
    phone: 'Your Company Phone',
    email: 'your@company.com',
  });
  const [currentView, setCurrentView] = useState<'dispatch' | 'jobList' | 'invoice' | 'settings' | 'savedInvoices'>('dispatch');
  const [selectedJobForInvoice, setSelectedJobForInvoice] = useState<Job | null>(null);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<Job | null>(null);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  useEffect(() => {
    const storedJobs = localStorage.getItem('towingJobs');
    if (storedJobs) {
      setJobs(JSON.parse(storedJobs));
    }

    const storedCompanyInfo = localStorage.getItem('companyInfo');
    if (storedCompanyInfo) {
      setCompanyInfo(JSON.parse(storedCompanyInfo));
    }

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months start at 0!
    const dd = String(today.getDate()).padStart(2, '0');
    setDate(`${yyyy}-${mm}-${dd}`);

    const hh = String(today.getHours()).padStart(2, '0');
    const min = String(today.getMinutes()).padStart(2, '0');
    setTimeReceived(`${hh}:${min}`);

    if (storedCompanyInfo) {
      const info = JSON.parse(storedCompanyInfo);
      setInvoiceNumber(info.nextInvoiceNumber?.toString() || '1001');
    }
  }, []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const jobDetails = `*${editingJobId ? 'Updated' : 'New'} Towing Job*\n\n` +
                       `*Invoice Number:* INV-${invoiceNumber}\n` +
                       `*Date:* ${date}\n` +
                       `*Time Received:* ${timeReceived}\n` +
                       `*OB Number:* ${obNumber}\n` +
                       `*Customer:* ${customerName}\n` +
                       `*Contact on Scene:* ${contactOnScene}\n` +
                       `*Pickup:* ${pickupLocation}\n` +
                       (dropoffLocation ? `*Dropoff:* ${dropoffLocation}\n` : '') +
                       `*Vehicle:* ${vehicleDetails}\n` +
                       `*Tow Class:* ${towClass}\n` +
                       `*Vehicle Use:* ${vehicleUse}\n` +
                       (notes ? `*Notes:* ${notes}\n` : '');

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(jobDetails)}`;

    // Clear price field only if it was set for the job, but not sent to WhatsApp
    setPrice('');

    try {
      window.open(whatsappUrl, '_blank');
      setMessage('WhatsApp opened with job details. Please select a contact to send.');
      
      if (editingJobId) {
        const updatedJobs = jobs.map(j => j.id === editingJobId ? {
          ...j,
          date,
          timeReceived,
          obNumber,
          customerName,
          contactOnScene,
          pickupLocation,
          dropoffLocation,
          vehicleDetails,
          towClass,
          vehicleUse,
          notes,
          price: price === '' ? undefined : price,
          invoiceNumber: `INV-${invoiceNumber}`
        } : j);
        setJobs(updatedJobs);
        localStorage.setItem('towingJobs', JSON.stringify(updatedJobs));
        setEditingJobId(null);
        setMessage('Job updated successfully and WhatsApp opened.');
      } else {
        const nextNum = (parseInt(invoiceNumber) || 1000) + 1;
        setInvoiceNumber(nextNum.toString());

        const newJob: Job = {
          id: Date.now().toString(), // Simple unique ID
          date,
          timeReceived,
          obNumber,
          customerName,
          contactOnScene,
          pickupLocation,
          dropoffLocation,
          vehicleDetails,
          towClass,
          vehicleUse,
          notes,
          price: price === '' ? undefined : price,
          invoiceGenerated: true, // Mark as generated since we provided a number
          invoiceNumber: `INV-${invoiceNumber}`,
        };

        const updatedJobs = [...jobs, newJob];
        setJobs(updatedJobs);
        localStorage.setItem('towingJobs', JSON.stringify(updatedJobs));

        // Update company info with the next number
        const updatedCompanyInfo = {
          ...companyInfo,
          nextInvoiceNumber: nextNum
        };
        setCompanyInfo(updatedCompanyInfo);
        localStorage.setItem('companyInfo', JSON.stringify(updatedCompanyInfo));
      }

      // Clear form AFTER processing
      setCustomerName('');
      setContactOnScene('');
      setPickupLocation('');
      setDropoffLocation('');
      setVehicleDetails('');
      setNotes('');
      setTowClass('Normal Recovery');
      setVehicleUse('Normal Sling');
      setObNumber('');
      setPrice('');
      
      // Reset date and time to current
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`);
      const hh = String(today.getHours()).padStart(2, '0');
      const min = String(today.getMinutes()).padStart(2, '0');
      setTimeReceived(`${hh}:${min}`);

    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      setMessage('An error occurred while trying to open WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = (job: Job) => {
    if (job.invoiceGenerated && job.invoiceNumber) {
      setSelectedJobForInvoice(job);
      setCurrentView('invoice');
      return;
    }

    const nextNum = companyInfo.nextInvoiceNumber || 1001;
    const invoiceNumber = `INV-${nextNum}`;
    
    // Update the job with the new invoice number
    const updatedJobs = jobs.map(j => 
      j.id === job.id ? { ...j, invoiceGenerated: true, invoiceNumber } : j
    );
    setJobs(updatedJobs);
    localStorage.setItem('towingJobs', JSON.stringify(updatedJobs));

    // Update company info with the next number
    const updatedCompanyInfo = {
      ...companyInfo,
      nextInvoiceNumber: nextNum + 1
    };
    setCompanyInfo(updatedCompanyInfo);
    localStorage.setItem('companyInfo', JSON.stringify(updatedCompanyInfo));

    setSelectedJobForInvoice({ ...job, invoiceGenerated: true, invoiceNumber });
    setCurrentView('invoice');
  };

  const handleSaveCompanyInfo = (info: CompanyInfo) => {
    setCompanyInfo(info);
    localStorage.setItem('companyInfo', JSON.stringify(info));
  };

  const handleEditJob = (job: Job) => {
    setEditingJobId(job.id);
    setDate(job.date);
    setTimeReceived(job.timeReceived);
    setObNumber(job.obNumber);
    setCustomerName(job.customerName);
    setContactOnScene(job.contactOnScene);
    setPickupLocation(job.pickupLocation);
    setDropoffLocation(job.dropoffLocation || '');
    setVehicleDetails(job.vehicleDetails);
    setTowClass(job.towClass);
    setVehicleUse(job.vehicleUse);
    setNotes(job.notes || '');
    setPrice(job.price || '');
    setInvoiceNumber(job.invoiceNumber?.replace('INV-', '') || '');
    setCurrentView('dispatch');
    setSelectedJobForDetails(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4 sm:p-6 lg:p-8"
    >
      <div className={`${currentView === 'invoice' ? 'max-w-5xl' : 'max-w-3xl'} mx-auto bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8 lg:p-10 border border-gray-700 transition-all duration-300`}>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center mb-8 text-emerald-400 font-sans tracking-tight">
          Towing Job Manager
        </h1>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentView('dispatch')}
            className={`py-2 px-4 rounded-xl font-semibold transition-colors text-sm ${currentView === 'dispatch' ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            Dispatch
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentView('jobList')}
            className={`py-2 px-4 rounded-xl font-semibold transition-colors text-sm ${currentView === 'jobList' ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            Job List
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentView('savedInvoices')}
            className={`py-2 px-4 rounded-xl font-semibold transition-colors text-sm ${currentView === 'savedInvoices' ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            Saved Invoices
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentView('settings')}
            className={`py-2 px-4 rounded-xl font-semibold transition-colors text-sm ${currentView === 'settings' ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            Settings
          </motion.button>
        </div>

        {currentView === 'dispatch' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {editingJobId && (
              <div className="bg-blue-600/20 border border-blue-500 p-3 rounded-xl flex justify-between items-center">
                <span className="text-blue-300 font-semibold">Editing Job: {obNumber}</span>
                <button 
                  type="button"
                  onClick={() => {
                    setEditingJobId(null);
                    setCustomerName('');
                    setContactOnScene('');
                    setPickupLocation('');
                    setDropoffLocation('');
                    setVehicleDetails('');
                    setNotes('');
                    setTowClass('Normal Recovery');
                    setVehicleUse('Normal Sling');
                    setObNumber('');
                    setPrice('');
                    // Reset to next invoice number
                    const storedCompanyInfo = localStorage.getItem('companyInfo');
                    if (storedCompanyInfo) {
                      const info = JSON.parse(storedCompanyInfo);
                      setInvoiceNumber(info.nextInvoiceNumber?.toString() || '1001');
                    }
                  }}
                  className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
                >
                  Cancel Edit
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  id="invoiceNumber"
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-400"
                  placeholder="Invoice Number"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  id="obNumber"
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-400"
                  placeholder="OB Number"
                  value={obNumber}
                  onChange={(e) => setObNumber(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="relative">
                <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="date"
                    id="date"
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-400"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="relative">
                <label htmlFor="timeReceived" className="block text-sm font-medium text-gray-300 mb-1">Time Received</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="time"
                    id="timeReceived"
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-400"
                    value={timeReceived}
                    onChange={(e) => setTimeReceived(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  id="customerName"
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-400"
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="tel"
                  id="contactOnScene"
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-400"
                  placeholder="Contact on Scene Phone"
                  value={contactOnScene}
                  onChange={(e) => setContactOnScene(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="relative">
              <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-1">Price (Optional)</label>
              <input
                type="number"
                id="price"
                className="w-full pl-3 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-400"
                placeholder="e.g., 150.00"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || '')}
              />
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                id="pickupLocation"
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-400"
                placeholder="Pickup Location"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                id="dropoffLocation"
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-400"
                placeholder="Dropoff Location (Optional)"
                value={dropoffLocation}
                onChange={(e) => setDropoffLocation(e.target.value)}
              />
            </div>

            <div className="relative">
              <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                id="vehicleDetails"
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-400"
                placeholder="Vehicle Details (e.g., Make, Model, Color, Plate)"
                value={vehicleDetails}
                onChange={(e) => setVehicleDetails(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <label htmlFor="towClass" className="block text-sm font-medium text-gray-300 mb-1">Tow Class</label>
              <select
                id="towClass"
                className="w-full pl-3 pr-10 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-white"
                value={towClass}
                onChange={(e) => setTowClass(e.target.value)}
                required
              >
                <option value="Normal Recovery">Normal Recovery</option>
                <option value="Heavy under 8 Ton">Heavy under 8 Ton</option>
              </select>
            </div>

            <div className="relative">
              <label htmlFor="vehicleUse" className="block text-sm font-medium text-gray-300 mb-1">Type of Vehicle Use</label>
              <select
                id="vehicleUse"
                className="w-full pl-3 pr-10 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-white"
                value={vehicleUse}
                onChange={(e) => setVehicleUse(e.target.value)}
                required
              >
                <option value="Normal Sling">Normal Sling</option>
                <option value="4x4">4x4</option>
                <option value="Flatbed">Flatbed</option>
                <option value="4x4 and Flatbed">4x4 and Flatbed</option>
              </select>
            </div>

            <div className="relative">
              <MessageSquareText className="absolute left-3 top-4 text-gray-400" size={20} />
              <textarea
                id="notes"
                rows={4}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-400"
                placeholder="Additional Notes (e.g., special instructions, hazards)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Dispatching...' : 'Dispatch Job via WhatsApp'}
            </motion.button>
          </form>
        )}

        {currentView === 'jobList' && (
          <JobList 
            jobs={jobs} 
            onGenerateInvoice={handleGenerateInvoice} 
            onViewDetails={(job) => setSelectedJobForDetails(job)} 
            onEditJob={handleEditJob}
          />
        )}

        {/* Job Details Modal */}
        {selectedJobForDetails && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-emerald-400">Job Details</h2>
                <button 
                  onClick={() => setSelectedJobForDetails(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4 text-gray-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 uppercase font-bold">OB Number</p>
                    <p>{selectedJobForDetails.obNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase font-bold">Date/Time</p>
                    <p>{selectedJobForDetails.date} {selectedJobForDetails.timeReceived}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 uppercase font-bold">Customer</p>
                  <p>{selectedJobForDetails.customerName}</p>
                  <p className="text-sm">{selectedJobForDetails.contactOnScene}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 uppercase font-bold">Locations</p>
                  <p><span className="text-emerald-500 text-xs font-bold">PICKUP:</span> {selectedJobForDetails.pickupLocation}</p>
                  {selectedJobForDetails.dropoffLocation && (
                    <p><span className="text-red-500 text-xs font-bold">DROPOFF:</span> {selectedJobForDetails.dropoffLocation}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 uppercase font-bold">Vehicle</p>
                  <p>{selectedJobForDetails.vehicleDetails}</p>
                  <p className="text-xs text-gray-400">{selectedJobForDetails.towClass} | {selectedJobForDetails.vehicleUse}</p>
                </div>
                {selectedJobForDetails.price && (
                  <div>
                    <p className="text-sm text-gray-500 uppercase font-bold">Price</p>
                    <p className="text-emerald-400 font-bold">R{selectedJobForDetails.price.toFixed(2)}</p>
                  </div>
                )}
                {selectedJobForDetails.notes && (
                  <div>
                    <p className="text-sm text-gray-500 uppercase font-bold">Notes</p>
                    <p className="italic text-sm">{selectedJobForDetails.notes}</p>
                  </div>
                )}
                {selectedJobForDetails.invoiceNumber && (
                  <div>
                    <p className="text-sm text-gray-500 uppercase font-bold">Invoice Number</p>
                    <p className="text-purple-400 font-bold">{selectedJobForDetails.invoiceNumber}</p>
                  </div>
                )}
              </div>
              <div className="mt-8 flex space-x-3">
                <button 
                  onClick={() => handleEditJob(selectedJobForDetails)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Edit Job
                </button>
                <button 
                  onClick={() => setSelectedJobForDetails(null)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {currentView === 'invoice' && selectedJobForInvoice && (
          <InvoiceGenerator job={selectedJobForInvoice} companyInfo={companyInfo} onBack={() => setCurrentView('jobList')} />
        )}

        {currentView === 'settings' && (
          <CompanySettings companyInfo={companyInfo} onSave={handleSaveCompanyInfo} />
        )}

        {currentView === 'savedInvoices' && (
          <SavedInvoices />
        )}

        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 p-4 rounded-xl text-center ${message.includes('successfully') ? 'bg-green-600' : 'bg-red-600'} text-white`}
          >
            {message}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
