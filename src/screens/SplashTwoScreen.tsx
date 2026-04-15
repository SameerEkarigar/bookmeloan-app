import { useEffect, useRef } from 'react';

import { Fetch } from '../api';
import { RootStackParamList } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Animated, Image, StatusBar, StyleSheet, View } from 'react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'SplashTwo'>;

const SplashTwoScreen = ({ navigation }: Props) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    loopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    loopRef.current.start();

    let isMounted = true;

    const checkAuthAndNavigate = async () => {
      try {
        await Fetch('user/get-current-user', undefined, 10000, false);
        if (isMounted) navigation.replace('Home');
      } catch {
        if (isMounted) navigation.replace('LoginMobile');
      }
    };

    checkAuthAndNavigate();

    return () => {
      loopRef.current?.stop();
      isMounted = false;
    };
  }, [navigation, pulseAnim]);

  const accentAnimatedStyle = {
    transform: [
      {
        scale: pulseAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 1.06, 1],
        }),
      },
      { rotate: '-4deg' },
    ],
  };

  const logoAnimatedStyle = {
    transform: [
      {
        scale: pulseAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.92, 1, 0.92],
        }),
      },
    ],
    opacity: pulseAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.8, 1, 0.8],
    }),
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#00BE99" />
      <Animated.Image
        source={require('../../assets/ellipse.png')}
        style={[styles.ellipse, accentAnimatedStyle]}
        resizeMode="contain"
      />
      <Animated.View style={[styles.iconWrap, logoAnimatedStyle]}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.icon}
          resizeMode="contain"
        />
      </Animated.View>
      <View style={styles.content}>
        <Animated.Image
          source={require('../../assets/logo.png')}
          style={[styles.logo, logoAnimatedStyle]}
          resizeMode="contain"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00BE99',
  },
  ellipse: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 220,
    height: 220,
    opacity: 0.9,
  },
  iconWrap: {
    position: 'absolute',
    top: 40,
    right: 36,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#00BE99',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  icon: {
    width: 32,
    height: 32,
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    width: 400,
    height: 400,
  },
});

export default SplashTwoScreen;
