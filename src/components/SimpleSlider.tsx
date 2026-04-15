import { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { Animated, LayoutChangeEvent, PanResponder, StyleSheet, View } from 'react-native';

const THUMB_SIZE = 22;

type SimpleSliderProps = {
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  value: number;
  onValueChange: (value: number) => void;
  activeColor?: string;
  trackColor?: string;
};

const SimpleSlider = ({
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  value,
  onValueChange,
  activeColor = '#00BE99',
  trackColor = '#E5F7F1',
}: SimpleSliderProps) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const progress = useMemo(
    () => (value - minimumValue) / (maximumValue - minimumValue || 1),
    [value, minimumValue, maximumValue],
  );
  const thumbAnim = useRef(new Animated.Value(0)).current;

  const updateThumb = useCallback(
    (layoutWidth: number) => {
      const position = Math.min(Math.max(progress * layoutWidth, 0), layoutWidth);
      Animated.timing(thumbAnim, {
        toValue: position,
        duration: 0,
        useNativeDriver: false,
      }).start();
    },
    [progress, thumbAnim],
  );

  const calculateValue = useCallback(
    (locationX: number) => {
      const relative = Math.min(Math.max(0, locationX), trackWidth);
      const percent = relative / (trackWidth || 1);
      const rawValue = minimumValue + (maximumValue - minimumValue) * percent;
      const stepped = Math.round(rawValue / step) * step;
      const clamped = Math.min(Math.max(stepped, minimumValue), maximumValue);
      onValueChange(clamped);
    },
    [maximumValue, minimumValue, step, trackWidth, onValueChange],
  );

  const handlePan = useCallback(
    (evt: any) => {
      calculateValue(evt.nativeEvent.locationX);
    },
    [calculateValue],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: handlePan,
        onPanResponderMove: handlePan,
      }),
    [handlePan],
  );

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width } = event.nativeEvent.layout;
      setTrackWidth(width);
      updateThumb(width);
    },
    [updateThumb],
  );

  useEffect(() => {
    updateThumb(trackWidth);
  }, [progress, trackWidth, updateThumb]);

  const thumbOffset = Animated.subtract(thumbAnim, THUMB_SIZE / 2);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <View style={[styles.track, { backgroundColor: trackColor }]} />
      <View
        style={[
          styles.activeTrack,
          {
            backgroundColor: activeColor,
            width: `${Math.round(progress * 100)}%`,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.thumb,
          {
            transform: [{ translateX: thumbOffset }],
            backgroundColor: activeColor,
          },
        ]}
        {...panResponder.panHandlers}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 32,
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
    width: '100%',
  },
  activeTrack: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    top: -8,
  },
});

export default SimpleSlider;
