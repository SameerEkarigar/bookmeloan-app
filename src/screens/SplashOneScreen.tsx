import { useEffect } from 'react';
import { RootStackParamList } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image, StatusBar, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'SplashOne'>;

const SplashOneScreen = ({ navigation }: Props) => {
  useEffect(() => {
    const timer = setTimeout(() => navigation.replace('SplashTwo'), 1200);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#00BE99" />
      <Image
        source={require('../../assets/ellipse.png')}
        style={styles.ellipse}
        resizeMode="contain"
      />
      <View style={styles.iconWrapper}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.icon}
          resizeMode="contain"
        />
      </View>
      <View style={styles.center}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#00BE99',
    overflow: 'hidden',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ellipse: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 220,
    height: 220,
    opacity: 0.9,
  },
  iconWrapper: {
    position: 'absolute',
    top: 40,
    right: 36,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#00BE99',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  icon: {
    width: 32,
    height: 32,
  },
  logo: {
    width: '100%',
  },
});

export default SplashOneScreen;
