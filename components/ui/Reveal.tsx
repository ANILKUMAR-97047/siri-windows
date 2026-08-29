"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion, ANIM } from "@/lib/animations";

gsap.registerPlugin(ScrollTrigger);

interface RevealProps {
  children: React.ReactNode;
  direction?: "up" | "left" | "right";
  delay?: number;
  duration?: number;
  className?: string;
  as?: keyof HTMLElementTagNameMap;
}

export default function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = ANIM.duration,
  className = "",
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return;

      const fromVars: gsap.TweenVars = {
        opacity: 0,
        y: direction === "up" ? 40 : 0,
        x: direction === "left" ? -40 : direction === "right" ? 40 : 0,
      };

      gsap.from(ref.current, {
        ...fromVars,
        duration,
        delay,
        ease: ANIM.ease,
        scrollTrigger: {
          trigger: ref.current,
          start: ANIM.start,
          once: true,
        },
      });
    },
    { scope: ref }
  );

  // @ts-expect-error -- dynamic tag element
  return <Tag ref={ref} className={className}>{children}</Tag>;
}
