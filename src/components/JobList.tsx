import React from 'react';
import { Job } from '../types';
import { motion } from 'motion/react';
import { Trash2 } from 'lucide-react';

interface JobListProps {
  jobs: Job[];
  onGenerateInvoice: (job: Job) => void;
  onViewDetails: (job: Job) => void;
  onEditJob: (job: Job) => void;
  onDeleteJob: (jobId: string) => void;
}

const JobList: React.FC<JobListProps> = ({ jobs, onGenerateInvoice, onViewDetails, onEditJob, onDeleteJob }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {jobs.length === 0 ? (
        <p className="text-center text-gray-400">No jobs dispatched yet. Go to 'Dispatch Job' to add one.</p>
      ) : (
        jobs.map((job) => (
          <div key={job.id} className="bg-gray-700 p-4 rounded-xl border border-gray-600 shadow-md">
            <h3 className="text-lg font-bold text-emerald-300">Job OB: {job.obNumber}</h3>
            {job.invoiceNumber && <p className="text-purple-300 text-xs font-mono mb-1">{job.invoiceNumber}</p>}
            <p className="text-gray-300">Customer: {job.customerName}</p>
            <p className="text-gray-300">Pickup: {job.pickupLocation}</p>
            <p className="text-gray-400 text-sm">Date: {job.date} | Time: {job.timeReceived}</p>
            {job.price && <p className="text-gray-300 text-sm">Price: R{job.price.toFixed(2)}</p>}
            {/* Add more job details here */}
            <div className="mt-4 flex flex-wrap gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onViewDetails(job)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded-lg"
              >
                View Details
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onEditJob(job)}
                className="bg-amber-600 hover:bg-amber-700 text-white text-sm py-2 px-4 rounded-lg"
              >
                Edit
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onGenerateInvoice(job)}
                className="bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 px-4 rounded-lg"
              >
                Generate Invoice
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDeleteJob(job.id)}
                className="bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 rounded-lg"
              >
                Delete
              </motion.button>
            </div>
          </div>
        ))
      )}
    </motion.div>
  );
};

export default JobList;
