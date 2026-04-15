import { useMemo } from 'react';
import LoanApplicationTemplate from './LoanApplicationTemplate';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  buildLoanApplicationConfig,
} from '../config/loanApplicationFormRef';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PersonalLoan'>;

const PersonalLoanScreen = ({ route }: Props) => {
  const prefill = route.params?.prefill;
  const hasPrefill = Boolean(
    prefill?.amount || prefill?.tenureMonths || prefill?.purpose,
  );
  const config = useMemo(
    () =>
      buildLoanApplicationConfig({
      title: 'Personal Loan',
      subtitle:
        'Cover a wedding, travel, or debt consolidation with a fast-moving unsecured offer.',
      badge: 'Express review',
      endpoint: 'loan-applications',
      loanType: 'Personal Loan',
      prefill,
      disableDraftAutofill: hasPrefill,
    }),
    [hasPrefill, prefill],
  );

  return <LoanApplicationTemplate config={config} />;
};

export default PersonalLoanScreen;
