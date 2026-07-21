import React, { useState } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, Animated } from 'react-native';
import { theme } from '../theme';

interface DuoButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  color?: 'primary' | 'secondary' | 'accent' | 'surface';
  disabled?: boolean;
}

export default function DuoButton({ title, onPress, style, textStyle, color = 'primary', disabled = false }: DuoButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const scale = new Animated.Value(1);

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  let bgColor = theme.colors.primary;
  let shadowColor = '#D88D22'; // darker pastel amber for primary
  let textColor = theme.colors.onPrimary;

  if (color === 'secondary') {
    bgColor = theme.colors.secondary;
    shadowColor = '#5B9BA6'; // darker pastel blue for secondary
  } else if (color === 'accent') {
    bgColor = theme.colors.accentFocus;
    shadowColor = '#B33434'; // darker red
  } else if (color === 'surface') {
    bgColor = theme.colors.surfaceMuted;
    shadowColor = theme.colors.borderSubtle;
    textColor = theme.colors.onSurface;
  }

  if (disabled) {
    bgColor = theme.colors.surfaceMuted;
    shadowColor = theme.colors.surface;
    textColor = theme.colors.onSurfaceVariant;
  }

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={disabled ? undefined : handlePressIn}
      onPressOut={disabled ? undefined : handlePressOut}
      style={({ pressed }) => [
        styles.container,
        style,
        {
          backgroundColor: bgColor,
          borderColor: shadowColor,
          transform: [{ translateY: isPressed ? 4 : 0 }],
          borderBottomWidth: isPressed ? 0 : 4,
          marginTop: isPressed ? 4 : 0,
          opacity: disabled ? 0.6 : 1,
        }
      ]}
    >
      <Text style={[styles.text, { color: textColor }, textStyle]}>
        {title.toUpperCase()}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.rounded.lg,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  text: {
    fontFamily: theme.typography.headlineMd.fontFamily,
    fontSize: 16,
    letterSpacing: 1,
  },
});
