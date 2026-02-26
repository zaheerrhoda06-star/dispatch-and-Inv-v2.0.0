import React, { useState, useEffect, FormEvent } from 'react';
import { motion } from 'motion/react';
import { CompanyInfo } from '../types';
import { Building, MapPin, Phone, Mail, Hash } from 'lucide-react';

interface CompanySettingsProps {
  companyInfo: CompanyInfo;
  onSave: (info: CompanyInfo) => void;
}

const CompanySettings: React.FC<CompanySettingsProps> = ({ companyInfo, onSave }) => {
  const [name, setName] = useState(companyInfo.name);
  const [address, setAddress] = useState(companyInfo.address);
  const [phone, setPhone] = useState(companyInfo.phone);
  const [email, setEmail] = useState(companyInfo.email);
  const [registrationNumber, setRegistrationNumber] = useState(companyInfo.registrationNumber || '');
  const [bankName, setBankName] = useState(companyInfo.bankName || '');
  const [accountNumber, setAccountNumber] = useState(companyInfo.accountNumber || '');
  const [sortCode, setSortCode] = useState(companyInfo.sortCode || '');
  const [logoUrl, setLogoUrl] = useState(companyInfo.logoUrl || '');
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(companyInfo.nextInvoiceNumber || 1001);
  const [message, setMessage] = useState('');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    setName(companyInfo.name);
    setAddress(companyInfo.address);
    setPhone(companyInfo.phone);
    setEmail(companyInfo.email);
    setRegistrationNumber(companyInfo.registrationNumber || '');
    setBankName(companyInfo.bankName || '');
    setAccountNumber(companyInfo.accountNumber || '');
    setSortCode(companyInfo.sortCode || '');
    setLogoUrl(companyInfo.logoUrl || '');
    setNextInvoiceNumber(companyInfo.nextInvoiceNumber || 1001);
  }, [companyInfo]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const updatedInfo: CompanyInfo = {
      name,
      address,
      phone,
      email,
      registrationNumber: registrationNumber || undefined,
      bankName: bankName || undefined,
      accountNumber: accountNumber || undefined,
      sortCode: sortCode || undefined,
      logoUrl: logoUrl || undefined,
      nextInvoiceNumber: Number(nextInvoiceNumber),
    };
    onSave(updatedInfo);
    setMessage('Company information saved successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <h2 className="text-3xl font-bold text-center text-emerald-400">Company Information</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            id="companyName"
            className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-400"
            placeholder="Company Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            id="companyAddress"
            className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-400"
            placeholder="Company Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="tel"
            id="companyPhone"
            className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-400"
            placeholder="Company Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="email"
            id="companyEmail"
            className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-400"
            placeholder="Company Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="relative">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            id="registrationNumber"
            className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-400"
            placeholder="Company Registration Number (Optional)"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
          />
        </div>
        <div className="relative">
          <input
            type="text"
            id="bankName"
            className="w-full pl-3 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-400"
            placeholder="Bank Name (Optional)"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
          />
        </div>
        <div className="relative">
          <input
            type="text"
            id="accountNumber"
            className="w-full pl-3 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-400"
            placeholder="Account Number (Optional)"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
          />
        </div>
        <div className="relative">
          <input
            type="text"
            id="sortCode"
            className="w-full pl-3 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-400"
            placeholder="Branch Code (Optional)"
            value={sortCode}
            onChange={(e) => setSortCode(e.target.value)}
          />
        </div>
        <div className="relative">
          <label htmlFor="logoUpload" className="block text-sm font-medium text-gray-300 mb-1">Company Logo (Upload)</label>
          <input
            type="file"
            id="logoUpload"
            accept="image/*"
            className="w-full pl-3 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            onChange={handleLogoUpload}
          />
          {logoUrl && (
            <div className="mt-4">
              <img src={logoUrl} alt="Company Logo Preview" className="max-h-24 object-contain" referrerPolicy="no-referrer" />
            </div>
          )}
        </div>
        <div className="relative">
          <label htmlFor="nextInvoiceNumber" className="block text-sm font-medium text-gray-300 mb-1">Starting Invoice Number</label>
          <input
            type="number"
            id="nextInvoiceNumber"
            className="w-full pl-3 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-400"
            placeholder="e.g., 1001"
            value={nextInvoiceNumber}
            onChange={(e) => setNextInvoiceNumber(Number(e.target.value))}
            required
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 ease-in-out"
        >
          Save Company Info
        </motion.button>
      </form>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-xl text-center bg-green-600 text-white"
        >
          {message}
        </motion.div>
      )}
    </motion.div>
  );
};

export default CompanySettings;
