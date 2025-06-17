
import React from 'react';
import { motion } from 'framer-motion';

const UnfurlingLeafIcon: React.FC<React.SVGProps<SVGSVGElement>> = (svgProps) => {
  const leafVariants = { // Corrected variable name
    hidden: { pathLength: 0, opacity: 0, rotate: -30 },
    visible: {
      pathLength: 1,
      opacity: 1,
      rotate: 0,
      transition: { duration: 1.5, ease: "easeInOut" }
    }
  };

  const stemVariants = {
    hidden: { scaleY: 0, opacity: 0, originY: 1 },
    visible: {
      scaleY: 1,
      opacity: 1,
      transition: { duration: 0.8, ease: "easeOut", delay: 0.2 }
    }
  };

  // Destructure standard HTML event handlers and the conflicting onAnimationStart
  // to prevent them from being passed to motion.svg via `restProps` if they conflict.
  const {
    // HTML Drag Event Handlers (might conflict with Framer Motion gestures if used)
    onDrag,
    onDragEnd,
    onDragEnter,
    onDragExit,
    onDragLeave,
    onDragOver,
    onDragStart,
    onDrop,

    // Explicitly destructure the standard React onAnimationStart
    // to prevent it from conflicting with Framer Motion's onAnimationStart.
    onAnimationStart, // This is AnimationEventHandler<SVGSVGElement> from React.SVGProps

    // Destructure ref to remove it from restProps
    ref,

    ...restProps // These are the remaining React.SVGProps
  } = svgProps;


  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64" // Increased viewBox for more detail/space
      width="80" // Default size, can be overridden by props
      height="80"
      initial="hidden"
      animate="visible"
      {...restProps} // Spread the filtered remaining SVG props (ref is no longer here)
    >
      {/* Stem */}
      <motion.path
        d="M32 60 V30" // Simple vertical stem
        stroke="var(--primary-500)"
        strokeWidth="3"
        strokeLinecap="round"
        variants={stemVariants}
      />
      {/* Leaf Path 1 (example of a simple leaf shape) */}
      <motion.path
        d="M32,30 Q42,20 52,10 C45,20 40,35 32,50" // Adjusted path for more "unfurling"
        fill="var(--primary-100)"
        stroke="var(--primary-500)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        variants={leafVariants} // Updated usage
        custom={0} // For potential stagger if multiple leaves
      />
      {/* Leaf Path 2 (mirrored or slightly different) */}
      <motion.path
        d="M32,30 Q22,20 12,10 C19,20 24,35 32,50" // Adjusted path
        fill="var(--primary-100)"
        stroke="var(--primary-500)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        variants={leafVariants} // Updated usage
        custom={1}
        style={{ transformOrigin: "50% 90%" }} // Rotate from base
      />
       {/* Central Vein for Leaf 1 */}
      <motion.path
        d="M32,50 Q38,35 44,20" // Path along the center of leaf 1
        fill="none"
        stroke="var(--primary-900)"
        strokeWidth="1"
        strokeLinecap="round"
        variants={leafVariants} // Updated usage
         transition={{ duration: 1.5, ease: "easeInOut", delay: 0.3 }}
      />
      {/* Central Vein for Leaf 2 */}
      <motion.path
        d="M32,50 Q26,35 20,20" // Path along the center of leaf 2
        fill="none"
        stroke="var(--primary-900)"
        strokeWidth="1"
        strokeLinecap="round"
        variants={leafVariants} // Updated usage
        transition={{ duration: 1.5, ease: "easeInOut", delay: 0.4 }}
      />
    </motion.svg>
  );
};

export default UnfurlingLeafIcon;