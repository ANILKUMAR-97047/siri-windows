// ============================================================
// Siri Windows — GSAP Animation Helpers
// ============================================================

import gsap from "gsap";

/** Check if user prefers reduced motion */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Default animation config */
export const ANIM = {
  duration: 0.8,
  ease: "power3.out",
  stagger: 0.1,
  start: "top 85%",
} as const;

/** Fade-up animation properties (from state) */
export const fadeUpFrom = {
  y: 40,
  opacity: 0,
  duration: ANIM.duration,
  ease: ANIM.ease,
};

/** Fade-up animation properties (to state) */
export const fadeUpTo = {
  y: 0,
  opacity: 1,
  duration: ANIM.duration,
  ease: ANIM.ease,
};

/** Create a count-up tween for a stat number */
export function createCountUp(
  element: HTMLElement,
  endValue: number,
  duration = 2
) {
  if (prefersReducedMotion()) {
    element.textContent = endValue.toString();
    return null;
  }
  const obj = { value: 0 };
  return gsap.to(obj, {
    value: endValue,
    duration,
    ease: "power2.out",
    onUpdate: () => {
      element.textContent = Math.round(obj.value).toString();
    },
    scrollTrigger: {
      trigger: element,
      start: "top 90%",
      once: true,
    },
  });
}

/** Stagger children animation config for ScrollTrigger */
export function staggerRevealConfig(
  trigger: HTMLElement | string,
  targets: HTMLElement | string,
  options?: { stagger?: number; delay?: number }
) {
  return {
    ...fadeUpFrom,
    stagger: options?.stagger ?? ANIM.stagger,
    delay: options?.delay ?? 0,
    scrollTrigger: {
      trigger,
      start: ANIM.start,
      once: true,
    },
  };
}
