export type LoanFormPrefill = {
  amount?: number | string;
  tenureMonths?: number | string;
  purpose?: string;
  applicationId?: string;
  sourceOfferId?: string;
};

export type RootStackParamList = {
  SplashOne: undefined;
  SplashTwo: undefined;
  LoginMobile: undefined;
  LoginOtp:
    | {
        from: 'mobile' | 'email';
        contact: string;
        otpHint?: string;
      }
    | undefined;
  LoginEmail: undefined;
  Home: undefined;
  EMICalculator: undefined;
  UploadDocuments: undefined;
   HomeLoanDocumentsScreen: undefined;
  CallbackRequest: undefined;
  TrueHomeLoan: { prefill?: LoanFormPrefill } | undefined;
  ProfessionalDetails: undefined;
  BankDetails: undefined;
  KycVerification: undefined;
  ContactAddress: undefined;
  LoanDetails: undefined;
  Profile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  NotificationCenter: undefined;
  Faqs: undefined;
  PrivacyPolicy: undefined;
  TermsConditions: undefined;
  HelpSupport: undefined;
  LoanOffers: undefined;
  LoanStatus: undefined;
  LoanRequests: undefined;
  ExploreLoans: undefined;
  ActiveLoans: undefined;
  CreditScore: undefined;
  Chat: undefined;
  Signup: undefined;
  PersonalLoan: { prefill?: LoanFormPrefill } | undefined;
  HomeLoan: { prefill?: LoanFormPrefill } | undefined;
  EducationLoan: { prefill?: LoanFormPrefill } | undefined;
  BusinessLoan: { prefill?: LoanFormPrefill } | undefined;
};
