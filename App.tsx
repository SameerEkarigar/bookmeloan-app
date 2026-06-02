import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';

import AppShell from './src/components/AppShell';
import ChatScreen from './src/screens/ChatScreen';
import HomeScreen from './src/screens/HomeScreen';
import FaqsScreen from './src/screens/FaqsScreen';
import SignupScreen from './src/screens/SignupScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LoginOtpScreen from './src/screens/LoginOtpScreen';
import HomeLoanScreen from './src/screens/HomeLoanScreen';
import TrueHomeLoanScreen from './src/screens/TrueHomeLoanScreen';
import { RootStackParamList } from './src/navigation/types';
import SplashOneScreen from './src/screens/SplashOneScreen';
import SplashTwoScreen from './src/screens/SplashTwoScreen';
import LoanOffersScreen from './src/screens/LoanOffersScreen';
import LoanStatusScreen from './src/screens/LoanStatusScreen';
import LoginEmailScreen from './src/screens/LoginEmailScreen';
import CreditScoreScreen from './src/screens/CreditScoreScreen';
import LoginMobileScreen from './src/screens/LoginMobileScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import LoanDetailsScreen from './src/screens/LoanDetailsScreen';
import BankDetailsScreen from './src/screens/BankDetailsScreen';
import PersonalLoanScreen from './src/screens/PersonalLoanScreen';
import BusinessLoanScreen from './src/screens/BusinessLoanScreen';
import EducationLoanScreen from './src/screens/EducationLoanScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import EMICalculatorScreen from './src/screens/EMICalculatorScreen';
import ContactAddressScreen from './src/screens/ContactAddressScreen';
import MyLoanRequestsScreen from './src/screens/MyLoanRequestsScreen';
import TermsConditionsScreen from './src/screens/TermsConditionsScreen';
import KycVerificationScreen from './src/screens/KycVerificationScreen';
import UploadDocumentsScreen from './src/screens/UploadDocumentsScreen';
import NotificationCenterScreen from './src/screens/NotificationCenterScreen';
import ProfessionalDetailsScreen from './src/screens/ProfessionalDetailsScreen';
import ExploreLoansScreen from './src/screens/ExploreLoansScreen';
import ActiveLoansScreen from './src/screens/ActiveLoansScreen';
import HomeLoanDocumentsScreen from './src/screens/HomeLoanDocumentsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#00BE99' },
};

const App = () => (
  <SafeAreaProvider>
    <AppShell>
      <NavigationContainer theme={theme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="SplashOne" component={SplashOneScreen} />
          <Stack.Screen name="SplashTwo" component={SplashTwoScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="LoginOtp" component={LoginOtpScreen} />
          <Stack.Screen name="LoginEmail" component={LoginEmailScreen} />
          <Stack.Screen name="LoginMobile" component={LoginMobileScreen} />
          <Stack.Screen name="EMICalculator" component={EMICalculatorScreen} />
          <Stack.Screen
            name="UploadDocuments"
            component={UploadDocumentsScreen}
          />
            <Stack.Screen
  name="HomeLoanDocumentsScreen"
  component={HomeLoanDocumentsScreen}
/>
          <Stack.Screen
            name="KycVerification"
            component={KycVerificationScreen}
          />
          <Stack.Screen
            name="ContactAddress"
            component={ContactAddressScreen}
          />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="LoanDetails" component={LoanDetailsScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen
            name="NotificationCenter"
            component={NotificationCenterScreen}
          />
          <Stack.Screen name="Faqs" component={FaqsScreen} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          <Stack.Screen
            name="TermsConditions"
            component={TermsConditionsScreen}
          />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="LoanOffers" component={LoanOffersScreen} />
          <Stack.Screen name="LoanStatus" component={LoanStatusScreen} />
          <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
          <Stack.Screen name="CreditScore" component={CreditScoreScreen} />
          <Stack.Screen name="ExploreLoans" component={ExploreLoansScreen} />
          <Stack.Screen name="LoanRequests" component={MyLoanRequestsScreen} />
          <Stack.Screen name="ActiveLoans" component={ActiveLoansScreen} />
          <Stack.Screen
            name="ProfessionalDetails"
            component={ProfessionalDetailsScreen}
          />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="TrueHomeLoan" component={TrueHomeLoanScreen} />
          <Stack.Screen name="HomeLoan" component={HomeLoanScreen} />
          <Stack.Screen name="BankDetails" component={BankDetailsScreen} />
          <Stack.Screen name="PersonalLoan" component={PersonalLoanScreen} />
          <Stack.Screen name="BusinessLoan" component={BusinessLoanScreen} />
          <Stack.Screen name="EducationLoan" component={EducationLoanScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppShell>
  </SafeAreaProvider>
);

export default App;
