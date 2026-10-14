/**
 * Centralized Business Identity and Compliance Configuration
 * 
 * Used across legal policies, contact pages, footer, and compliance disclosures
 * to ensure 100% consistency for PayU merchant verification and Indian statutory regulations.
 */

export const BUSINESS_INFO = {
  brandName: 'MarketMyIdea',
  legalName: 'AMIT KUMAR SHARMA',
  proprietorName: 'Amit Kumar Sharma',
  legalStructure: 'Sole Proprietorship',
  address: {
    locality: 'Jeonathpur',
    state: 'Uttar Pradesh',
    country: 'India',
    fullDisplayAddress: 'Jeonathpur, Uttar Pradesh, India',
  },
  contact: {
    officialEmail: 'contact@marketmyidea.online',
    supportEmail: 'contact@marketmyidea.online',
    grievanceEmail: 'contact@marketmyidea.online',
    websiteUrl: 'https://marketmyidea.online',
  },
  support: {
    hours: 'Monday through Saturday: 9:30 AM – 6:30 PM IST',
    responseTime: '24–48 business hours',
    disputeTurnaround: '24–48 business hours',
    refundSettlementWindow: '5–7 business days to original payment method',
    autoApproveDays: 4,
  },
  grievance: {
    officerName: 'Amit Kumar Sharma',
    designation: 'Grievance Officer',
    email: 'contact@marketmyidea.online',
    address: 'Jeonathpur, Uttar Pradesh, India',
    acknowledgementHours: 48,
    resolutionDays: 30,
  },
  economics: {
    currency: 'INR (₹)',
    platformFeePercentage: 5,
    subscriptionFees: '₹0 (Free to browse and join)',
  },
} as const;
