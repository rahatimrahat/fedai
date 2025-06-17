import React from 'react';
import { motion } from 'framer-motion';

interface BounceInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

const BounceIn: React.FC<BounceInProps> = ({ children, className, delay = 0, duration = 0.5 }) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay, 
        duration, 
        ease: "circOut", // "backOut" or "circOut" or "easeOut" can give a nice bounce
        // For a more spring-like bounce:
        // type: "spring",
        // stiffness: 260,
        // damping: 20,
      }}
    >
      {children}
    </motion.div>
  );
};

export default BounceIn;