import { useMemo } from 'react';
import LoanApplicationTemplate from './LoanApplicationTemplate';
import { buildLoanApplicationConfig } from '../config/loanApplicationFormRef';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'TrueHomeLoan'>;

const TrueHomeLoanScreen = ({ route }: Props) => {
  const prefill = route.params?.prefill;
  const hasPrefill = Boolean(
    prefill?.amount || prefill?.tenureMonths || prefill?.purpose,
  );
  const config = useMemo(
    () =>
      buildLoanApplicationConfig({
        title: 'Home Loan',
        subtitle:
          'Get property-backed financing for purchase or refinance with custom tenure.',
        badge: 'Low rates',
        endpoint: 'loan-applications',
        loanType: 'Home Loan',
        prefill,
        disableDraftAutofill: hasPrefill,
      }),
    [hasPrefill, prefill],
  );

  return <LoanApplicationTemplate config={config} />;
};

export default TrueHomeLoanScreen;
