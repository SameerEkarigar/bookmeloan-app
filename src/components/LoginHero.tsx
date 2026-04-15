import { Image, StyleSheet, Text, View } from 'react-native';

const stars = [
  { top: 6, right: -6 },
  { top: 32, right: -8 },
  { top: 16, right: -18 },
];

const LoginHero = () => (
  <View style={styles.heroWrapper}>
    {/* top-left small icon */}
    <Image
      resizeMode="contain"
      style={styles.smallIcon}
      source={require('../../assets/icon.png')}
    />

    {/* frame (speech bubble + white card) */}
    <Image
      style={styles.frame}
      resizeMode="stretch"
      source={require('../../assets/frame.png')}
    />

    {/* text + right icon inside the bubble */}
    <View style={styles.heroCard}>
      <View style={styles.heroTextBlock}>
        <Text style={styles.heroTitle}>
          Money when you need it, minus the paperwork
        </Text>
        <Text style={styles.heroSub}>Your loan. Your terms.{'\n'}Your way</Text>
      </View>

      <View style={styles.filledIconWrapper}>
        <Image
          resizeMode="contain"
          style={styles.filledIcon}
          source={require('../../assets/filledIcon.png')}
        />
        {stars.map((position, index) => (
          <Text key={index} style={[styles.star, position]}>
            ✦
          </Text>
        ))}
      </View>
    </View>

    {/* person image bottom-right */}
    <Image
      resizeMode="contain"
      style={styles.heroImage}
      source={require('../../assets/person.png')}
    />
  </View>
);

const styles = StyleSheet.create({
  heroWrapper: {
    height: 420,
    width: '100%',
    position: 'relative',
    paddingHorizontal: 20,
    justifyContent: 'center',
    backgroundColor: '#00BE99', // teal background like the design
  },

  frame: {
    top: 50,
    left: 0,
    height: 220,
    width: '110%',
    position: 'absolute',
  },

  smallIcon: {
    top: 0,
    left: 18,
    width: 36,
    height: 36,
    position: 'absolute',
  },

  heroCard: {
    marginTop: -170,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  heroTextBlock: {
    flex: 1,
    paddingRight: 24,
  },

  heroTitle: {
    fontSize: 18,
    color: '#00BE99',
    fontWeight: '600',
  },

  heroSub: {
    fontSize: 16,
    marginTop: 14,
    lineHeight: 20,
    color: '#475467',
  },

  filledIconWrapper: {
    width: 60,
    height: 60,
    marginTop: 8,
    alignItems: 'center',
    position: 'relative',
    justifyContent: 'center',
  },

  filledIcon: {
    width: 48,
    height: 48,
  },

  star: {
    fontSize: 12,
    color: '#00BE99',
    fontWeight: '700',
    position: 'absolute',
  },

  heroImage: {
    right: 8,
    bottom: 0,
    width: 200,
    height: 240,
    position: 'absolute',
  },
});

export default LoginHero;
