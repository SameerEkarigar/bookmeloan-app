import { useMemo } from 'react';
import LoanApplicationTemplate from './LoanApplicationTemplate';
import { buildLoanApplicationConfig } from '../config/loanApplicationFormRef';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EducationLoan'>;

const EducationLoanScreen = ({ route }: Props) => {
  const prefill = route.params?.prefill;
  const hasPrefill = Boolean(
    prefill?.amount || prefill?.tenureMonths || prefill?.purpose,
  );
  const config = useMemo(
    () =>
      buildLoanApplicationConfig({
      title: 'Education Loan',
      subtitle:
        'Plan tuition, living, and forex coverage for an upcoming intake with clarity on timelines.',
      badge: 'Admissions ready',
      endpoint: 'loan-applications',
      loanType: 'Education Loan',
      prefill,
      disableDraftAutofill: hasPrefill,
    }),
    [hasPrefill, prefill],
  );

  return <LoanApplicationTemplate config={config} />;
};

export default EducationLoanScreen;
