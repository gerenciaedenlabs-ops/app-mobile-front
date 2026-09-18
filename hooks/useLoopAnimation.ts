import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

/** Bucle infinito de una animación, detenido al desmontar. */
export function useLoop(factory: (value: Animated.Value) => Animated.CompositeAnimation, initial = 0) {
  const value = useRef(new Animated.Value(initial)).current;
  useEffect(() => {
    // Solo arranca una vez: `factory` construye el bucle inicial.
    const loop = Animated.loop(factory(value));
    loop.start();
    return () => loop.stop();
  }, [value]);
  return value;
}

/** Rebote vertical suave: devuelve el valor para `translateY`. */
export function useBounce(distance: number, duration: number) {
  return useLoop((value) =>
    Animated.sequence([
      Animated.timing(value, {
        toValue: -distance,
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 0,
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]),
  );
}
