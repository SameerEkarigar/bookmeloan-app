import { ReactNode } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AppShellProps = {
  children: ReactNode;
  statusBarStyle?: 'dark-content' | 'light-content';
};

const AppShell = ({
  children,
  statusBarStyle = 'dark-content',
}: AppShellProps) => (
  <SafeAreaView style={styles.shell}>
    <StatusBar barStyle={statusBarStyle} backgroundColor="#00BE99" />
    {children}
  </SafeAreaView>
);

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#F3F5F7',
  },
});

export default AppShell;
