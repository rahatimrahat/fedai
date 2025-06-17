import React from 'react';
import { motion } from 'framer-motion';

interface TypingTextProps {
  text: string;
  className?: string;
  charDelay?: number; // Delay between each character appearing
  overallDelay?: number; // Initial delay before animation starts
}

const TypingText: React.FC<TypingTextProps> = ({ 
  text, 
  className, 
  charDelay = 0.03, // Faster typing
  overallDelay = 0 
}) => {
  const letters = Array.from(text);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: charDelay, delayChildren: overallDelay },
    }),
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', damping: 15, stiffness: 300 } // Subtle spring for letters
    },
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      aria-label={text}
    >
      {letters.map((char, index) => (
        <motion.span key={index} variants={letterVariants} style={{ display: 'inline-block' /* Prevents layout shifts for spaces */}}>
          {char === ' ' ? '\u00A0' : char} {/* Use non-breaking space for spaces to maintain inline-block behavior */}
        </motion.span>
      ))}
    </motion.div>
  );
};

export default TypingText;