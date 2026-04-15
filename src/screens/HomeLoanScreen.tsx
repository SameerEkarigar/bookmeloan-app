import { useMemo } from 'react';
import LoanApplicationTemplate from './LoanApplicationTemplate';
import { buildLoanApplicationConfig } from '../config/loanApplicationFormRef';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'HomeLoan'>;

const HomeLoanScreen = ({ route }: Props) => {
  const prefill = route.params?.prefill;
  const hasPrefill = Boolean(
    prefill?.amount || prefill?.tenureMonths || prefill?.purpose,
  );
  const config = useMemo(
    () =>
      buildLoanApplicationConfig({
      title: 'Vehicle / Asset Loan',
      subtitle:
        'Finance vehicle, equipment, or asset purchases with clear terms and faster approvals.',
      badge: 'Asset backed',
      endpoint: 'loan-applications',
      loanType: 'Vehicle/Asset Loan',
      prefill,
      disableDraftAutofill: hasPrefill,
    }),
    [hasPrefill, prefill],
  );

  return <LoanApplicationTemplate config={config} />;
};

export default HomeLoanScreen;
