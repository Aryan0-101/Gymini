import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withDelay, 
  withTiming, 
  withSequence, 
  Easing, 
  withRepeat 
} from 'react-native-reanimated';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

export default function LoadingBarbell({ size = 200 }: { size?: number }) {
  const p1_x = useSharedValue(100);
  const p1_op = useSharedValue(0);
  const p2_x = useSharedValue(100);
  const p2_op = useSharedValue(0);
  const p3_x = useSharedValue(100);
  const p3_op = useSharedValue(0);
  const p4_x = useSharedValue(100);
  const p4_op = useSharedValue(0);

  const startAnimation = (xVal: any, opVal: any, delayMs: number) => {
    xVal.value = withRepeat(
      withSequence(
        withDelay(delayMs, withTiming(-2, { duration: 320, easing: Easing.bezier(0.34, 1.56, 0.64, 1) })),
        withTiming(0, { duration: 80 }),
        withDelay(1200, withTiming(100, { duration: 0 }))
      ),
      -1,
      false
    );
    opVal.value = withRepeat(
      withSequence(
        withDelay(delayMs, withTiming(1, { duration: 320 })),
        withDelay(1280, withTiming(0, { duration: 0 }))
      ),
      -1,
      false
    );
  };

  useEffect(() => {
    startAnimation(p1_x, p1_op, 100);
    startAnimation(p2_x, p2_op, 300);
    startAnimation(p3_x, p3_op, 500);
    startAnimation(p4_x, p4_op, 700);
  }, []);

  const props1 = useAnimatedProps(() => ({
    transform: [{ translateX: p1_x.value }],
    opacity: p1_op.value
  }));
  const props2 = useAnimatedProps(() => ({
    transform: [{ translateX: p2_x.value }],
    opacity: p2_op.value
  }));
  const props3 = useAnimatedProps(() => ({
    transform: [{ translateX: p3_x.value }],
    opacity: p3_op.value
  }));
  const props4 = useAnimatedProps(() => ({
    transform: [{ translateX: p4_x.value }],
    opacity: p4_op.value
  }));

  return (
    <View style={{ width: size, height: size * 0.3, justifyContent: 'center', alignItems: 'center' }}>
      <Svg fill="none" viewBox="0 0 200 60" width="100%" height="100%">
        {/* Barbell Shaft */}
        <Line x1="20" x2="180" y1="30" y2="30" stroke="#26211D" strokeWidth="4" strokeLinecap="round" />
        {/* Left Collar */}
        <Rect x="45" y="20" width="4" height="20" rx="1" fill="#26211D" />
        
        {/* Plates */}
        <AnimatedRect animatedProps={props1} x="49" y="10" width="8" height="40" rx="2" fill="#E2725A" stroke="#26211D" strokeWidth="1.5" />
        <AnimatedRect animatedProps={props2} x="58" y="12" width="7" height="36" rx="2" fill="#E2725A" stroke="#26211D" strokeWidth="1.5" />
        <AnimatedRect animatedProps={props3} x="66" y="15" width="6" height="30" rx="2" fill="#EAA765" stroke="#26211D" strokeWidth="1.5" />
        <AnimatedRect animatedProps={props4} x="73" y="18" width="4" height="24" rx="2" fill="#EAA765" stroke="#26211D" strokeWidth="1.5" />
      </Svg>
    </View>
  );
}
