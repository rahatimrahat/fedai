
import React from 'react';

interface TabProps {
  name: string;
  label: string;
  isActive?: boolean; 
  onClick?: (name: string) => void; 
  id: string;
  ariaControls: string;
  className?: string; 
  buttonRef?: React.RefObject<HTMLButtonElement>; // Added buttonRef
}

const Tab: React.FC<TabProps> = ({
  name,
  label,
  isActive,
  onClick,
  id,
  ariaControls,
  className = '',
  buttonRef, // Destructure buttonRef
}) => {
  const baseClasses = "tab-button";
  const activeClasses = "tab-button-active";
  const inactiveClasses = "tab-button-inactive";

  return (
    <button
      id={id}
      ref={buttonRef} // Apply the ref here
      role="tab"
      aria-selected={isActive}
      aria-controls={ariaControls}
      onClick={() => onClick?.(name)}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${className}`}
    >
      {label}
    </button>
  );
};

export default Tab;
