import { useMemo } from 'react';
import LoanApplicationTemplate from './LoanApplicationTemplate';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  buildLoanApplicationConfig,
} from '../config/loanApplicationFormRef';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'BusinessLoan'>;

const BusinessLoanScreen = ({ route }: Props) => {
  const prefill = route.params?.prefill;
  const hasPrefill = Boolean(
    prefill?.amount || prefill?.tenureMonths || prefill?.purpose,
  );
  const config = useMemo(
    () =>
      buildLoanApplicationConfig({
      title: 'Business Loan',
      subtitle:
        'Fuel working capital, expansion, or equipment purchases with fast-moving business credit.',
      badge: 'SME priority',
      endpoint: 'loan-applications',
      loanType: 'Business Loan',
      prefill,
      disableDraftAutofill: hasPrefill,
    }),
    [hasPrefill, prefill],
  );

  return <LoanApplicationTemplate config={config} />;
};

export default BusinessLoanScreen;
