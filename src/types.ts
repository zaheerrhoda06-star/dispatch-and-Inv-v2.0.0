export interface Job {
  id: string;
  date: string;
  timeReceived: string;
  obNumber: string;
  customerName: string;
  contactOnScene: string;
  pickupLocation: string;
  dropoffLocation?: string;
  vehicleDetails: string;
  towClass: string;
  vehicleUse: string;
  notes?: string;
  invoiceGenerated?: boolean;
  price?: number;
  invoiceNumber?: string;
}

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  registrationNumber?: string;
  bankName?: string;
  accountNumber?: string;
  sortCode?: string;
  logoUrl?: string;
  nextInvoiceNumber?: number;
}
