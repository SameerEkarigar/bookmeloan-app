import { LoanApplicationConfig } from '../screens/LoanApplicationTemplate';

type LoanTypeValue =
  | 'Personal Loan'
  | 'Business Loan'
  | 'Education Loan'
  | 'Vehicle/Asset Loan'
  | 'Home Loan';

type LoanFormPrefill = {
  amount?: number | string;
  tenureMonths?: number | string;
  purpose?: string;
};

const baseFields: LoanApplicationConfig['fields'] = [
  {
    key: 'requestedLoan.amount',
    label: 'Requested amount',
    placeholder: 'e.g., ₹10,00,000',
    helper: 'Enter the exact amount you need.',
    prefix: '₹',
    keyboardType: 'numeric',
  },
  {
    key: 'requestedLoan.tenureMonths',
    label: 'Preferred tenure (months)',
    placeholder: '12',
    helper: 'Common terms: 12 / 18 / 24 / 36 months.',
    icon: 'clock',
    keyboardType: 'numeric',
  },
  {
    key: 'requestedLoan.purpose',
    label: 'Purpose of loan',
    placeholder: 'Tell us the use case',
    helper: 'More context leads to better offers.',
    icon: 'edit-2',
    multiline: true,
  },
];

const baseDefaults: Record<string, string> = {
  'requestedLoan.amount': '',
  'requestedLoan.tenureMonths': '',
  'requestedLoan.purpose': '',
  'requestedLoan.loanType': '',
};

export const buildLoanApplicationConfig = (options: {
  title: string;
  subtitle: string;
  badge: string;
  endpoint: string;
  loanType: LoanTypeValue;
  prefill?: LoanFormPrefill;
  disableDraftAutofill?: boolean;
}): LoanApplicationConfig => {
  const hasPrefill = Boolean(
    options.prefill?.amount ||
      options.prefill?.tenureMonths ||
      options.prefill?.purpose,
  );

  const toStringValue = (value?: number | string) =>
    value === undefined || value === null ? '' : String(value);

  return {
    title: options.title,
    subtitle: options.subtitle,
    badge: options.badge,
    endpoint: options.endpoint,
    fields: baseFields,
    disableDraftAutofill: options.disableDraftAutofill ?? hasPrefill,
    defaultValues: {
      ...baseDefaults,
      'requestedLoan.amount': toStringValue(options.prefill?.amount),
      'requestedLoan.tenureMonths': toStringValue(
        options.prefill?.tenureMonths,
      ),
      'requestedLoan.purpose': options.prefill?.purpose || '',
      'requestedLoan.loanType': options.loanType,
    },
  };
};
