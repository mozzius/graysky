import { useEffect, useMemo } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
  cancelAnimation,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { Image, type ImageSource } from "expo-image";
import colors from "tailwindcss/colors";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ConfettiImage = require("../../assets/confetti.png") as ImageSource;

// with thanks to @imjamescrain
// https://gist.github.com/imjamescrain/e86893a1d6f85328174d036a9b263dd0

const NUM_CONFETTI = 100;
const COLORS = Object.values(colors.blue);
const CONFETTI_SIZE = 16;

const styles = StyleSheet.create({
  confettiContainer: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  confetti: {
    width: CONFETTI_SIZE,
    height: CONFETTI_SIZE,
  },
});

interface ConfettiPieceProps {
  x: number;
  y: number;
  xVel: number;
  angle: number;
  delay: number;
  yVel: number;
  angleVel: number;
  color: string;
  elasticity: number;
}

const ConfettiPiece = ({
  x,
  y,
  xVel,
  angle,
  delay,
  yVel,
  angleVel,
  color,
  elasticity,
}: ConfettiPieceProps) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const clock = useSharedValue(0);
  const duration = useSharedValue(getDuration());
  const localX = useSharedValue(x);
  const localY = useSharedValue(y);
  const localXVel = useSharedValue(xVel);
  const localAngle = useSharedValue(angle);
  const timeDiff = useSharedValue(0);
  const dt = useSharedValue(0);
  const dy = useSharedValue(0);
  const dx = useSharedValue(0);
  const dAngle = useSharedValue(0);

  function getDuration() {
    // Adding an extra 100 to the screen's height to ensure it goes off the screen.
    // Then using time = distance / speed for the time calc.
    const a = screenHeight + 100;
    return (a / yVel) * 1000;
  }

  useEffect(() => {
    // delay is multiplied by 1000 to convert into milliseconds
    clock.value = withDelay(
      delay * 1000,
      withTiming(1, { duration: duration.value }),
    );
    return () => {
      cancelAnimation(clock);
    };
  }, [clock, delay, duration]);

  const uas = useAnimatedStyle(() => {
    // Because our clock.value is going from 0 to 1, it's value will let us
    // get the actual number of milliseconds by taking it multiplied by the
    // total duration of the animation.
    timeDiff.value = clock.value * duration.value;
    dt.value = timeDiff.value / 1000;

    dy.value = dt.value * yVel;
    dx.value = dt.value * localXVel.value;
    dAngle.value = dt.value * angleVel;
    localY.value = y + dy.value;
    localX.value = x + dx.value;
    localAngle.value += dAngle.value;

    if (localX.value > screenWidth - CONFETTI_SIZE) {
      localX.value = screenWidth - CONFETTI_SIZE;
      localXVel.value = localXVel.value * -1 * elasticity;
    }

    if (localX.value < 0) {
      localX.value = 0;
      localXVel.value = xVel * -1 * elasticity;
    }

    return {
      transform: [
        { translateX: localX.value },
        { translateY: localY.value },
        { rotate: localAngle.value + "deg" },
        { rotateX: localAngle.value + "deg" },
        { rotateY: localAngle.value + "deg" },
      ],
    };
  });

  return (
    <Animated.View style={[styles.confettiContainer, uas]}>
      <Image source={ConfettiImage} tintColor={color} style={styles.confetti} />
    </Animated.View>
  );
};

interface Props {
  run: boolean;
}

export const Confetti = ({ run }: Props) => {
  const { width: screenWidth } = useWindowDimensions();
  const confetti = useMemo(
    () =>
      new Array(NUM_CONFETTI).fill(0).map((_, index) => {
        // For 'x', spawn confetti from two different sources, a quarter
        // from the left and a quarter from the right edge of the screen.
        return {
          key: index,
          x: screenWidth * (index % 2 ? 0.25 : 0.75) - CONFETTI_SIZE / 2,
          y: -60,
          angle: 0,
          xVel: Math.random() * 400 - 200,
          yVel: Math.random() * 165 + 165,
          angleVel: (Math.random() * 3 - 1.5) * Math.PI,
          delay: Math.floor(index / 10) * 0.5,
          elasticity: Math.random() * 0.3 + 0.1,
          color: COLORS[index % COLORS.length]!,
        };
      }),
    [screenWidth],
  );
  return (
    run && (
      <Animated.View
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        exiting={FadeOut.duration(500)}
      >
        {confetti.map(({ key, ...confettum }) => (
          <ConfettiPiece key={key} {...confettum} />
        ))}
      </Animated.View>
    )
  );
};
