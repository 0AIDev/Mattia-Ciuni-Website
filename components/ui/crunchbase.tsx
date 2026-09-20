"use client";

import { cn } from "@/lib/utils";
import type { Variants } from "motion/react";
import {
  LazyMotion,
  domMin,
  m,
  useAnimation,
  useReducedMotion,
} from "motion/react";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
} from "react";

export interface CrunchbaseIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface CrunchbaseIconProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  | "color"
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
> {
  size?: number;
  duration?: number;
  isAnimated?: boolean;
  color?: string;
}

const CrunchbaseIcon = forwardRef<CrunchbaseIconHandle, CrunchbaseIconProps>(
  (
    {
      onMouseEnter,
      onMouseLeave,
      className,
      size = 24,
      duration = 1,
      isAnimated = true,
      color,
      ...props
    },
    ref,
  ) => {
    const controls = useAnimation();
    const reduced = useReducedMotion();
    const isControlled = useRef(false);

    useImperativeHandle(ref, () => {
      isControlled.current = true;
      return {
        startAnimation: () =>
          reduced ? controls.start("normal") : controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleEnter = useCallback(
      (e: ReactMouseEvent<HTMLSpanElement>) => {
        if (!isAnimated || reduced) return;
        if (!isControlled.current) controls.start("animate");
        else onMouseEnter?.(e);
      },
      [controls, reduced, isAnimated, onMouseEnter],
    );

    const handleLeave = useCallback(
      (e: ReactMouseEvent<HTMLSpanElement>) => {
        if (!isControlled.current) controls.start("normal");
        else onMouseLeave?.(e);
      },
      [controls, onMouseLeave],
    );

    const svgVariants: Variants = {
      normal: { y: 0, scale: 1, rotate: 0 },
      animate: {
        y: [0, -4, 0, -2, 0],
        scale: [1, 1.08, 0.95, 1],
        rotate: [0, -2, 2, 0],
        transition: { duration: 1.2 * duration, ease: "easeInOut" },
      },
    };

    const pathVariants: Variants = {
      normal: { opacity: 1, scale: 1 },
      animate: {
        opacity: [0.9, 1, 1],
        scale: [1, 1.12, 1],
        transition: { duration: 0.8 * duration, ease: "easeOut", delay: 0.15 },
      },
    };

    return (
      <LazyMotion features={domMin} strict>
        <m.span
          className={cn("inline-flex items-center justify-center", className)}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          {...props}
          style={{ color, ...props.style }}
        >
          <m.svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            height={size}
            width={size}
            animate={controls}
            initial="normal"
            variants={svgVariants}
          >
            <m.path
              d="M21.6 0H2.4A2.41 2.41 0 0 0 0 2.4v19.2A2.41 2.41 0 0 0 2.4 24h19.2a2.41 2.41 0 0 0 2.4-2.4V2.4A2.41 2.41 0 0 0 21.6 0zM7.045 14.465A2.11 2.11 0 0 0 9.84 13.42h1.66a3.69 3.69 0 1 1 0-1.75H9.84a2.11 2.11 0 1 0-2.795 2.795zm11.345.845a3.55 3.55 0 0 1-1.06.63 3.68 3.68 0 0 1-3.39-.38v.38h-1.51V5.37h1.5v4.11a3.74 3.74 0 0 1 1.8-.63H16a3.67 3.67 0 0 1 2.39 6.46zm-.223-2.766a2.104 2.104 0 1 1-4.207 0 2.104 2.104 0 0 1 4.207 0z"
              variants={pathVariants}
              initial="normal"
              animate={controls}
            />
          </m.svg>
        </m.span>
      </LazyMotion>
    );
  },
);

CrunchbaseIcon.displayName = "CrunchbaseIcon";
export { CrunchbaseIcon };