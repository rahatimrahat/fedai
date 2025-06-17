
import React, { useState, useEffect, useRef, useId } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  idSuffix?: string; // Optional suffix for unique ID, now defaults to useId based if not provided
}

const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  position = 'top', 
  className = '',
  idSuffix 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const reactGeneratedId = useId(); // Generate a unique, stable ID from React
  // Use provided idSuffix, or fall back to the React-generated ID (replacing colons for safety)
  const tooltipId = `zekai-tooltip-${idSuffix || reactGeneratedId.replace(/:/g, '_')}`;


  useEffect(() => {
    // Check for touch device only once on mount
    const touchCheck = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(touchCheck);
    // console.log("Is Touch Device:", touchCheck); // Removed
  }, []);

  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);
  
  const toggleTooltip = (event?: React.MouseEvent | React.FocusEvent) => {
    // Prevent event from bubbling up to document click listener if any
    event?.stopPropagation(); 
    setIsVisible(prev => !prev);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVisible) {
        setIsVisible(false);
        // Optionally return focus to the trigger
        if (wrapperRef.current && wrapperRef.current.contains(document.activeElement)) {
          (wrapperRef.current.firstChild as HTMLElement)?.focus();
        }
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        if (isTouchDevice && isVisible) { 
          hideTooltip();
        }
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
      // For touch devices, we manage outside click to close.
      // For non-touch, onBlur on the child or wrapper handles it.
      if (isTouchDevice) {
        document.addEventListener('mousedown', handleClickOutside);
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (isTouchDevice) {
        document.removeEventListener('mousedown', handleClickOutside);
      }
    };
  }, [isVisible, isTouchDevice]);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2.5', 
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2.5', 
    left: 'right-full top-1/2 -translate-y-1/2 mr-2.5', 
    right: 'left-full top-1/2 -translate-y-1/2 ml-2.5', 
  };
  
  const arrowBaseColorClass = "text-[var(--glass-bg-secondary)]"; 

  const arrowClasses = {
    top: `absolute ${arrowBaseColorClass} h-2 w-full left-0 top-full`, 
    bottom: `absolute ${arrowBaseColorClass} h-2 w-full left-0 bottom-full rotate-180`, 
    left: `absolute ${arrowBaseColorClass} w-2 h-full top-0 left-full -rotate-90 origin-top-left`, 
    right: `absolute ${arrowBaseColorClass} w-2 h-full top-0 right-full rotate-90 origin-top-right`, 
  };
  
  const arrowPolygon = {
    top: "0,0 127.5,127.5 255,0",
    bottom: "0,0 127.5,127.5 255,0",
    left: "0,0 127.5,127.5 255,0", 
    right: "0,0 127.5,127.5 255,0",
  };

  const childOriginalProps = children.props as any;
  const childProps: any = {
    'aria-describedby': isVisible ? tooltipId : undefined,
  };

  // Determine if the child is inherently focusable
  const isChildFocusableElementType = typeof children.type === 'string' && ['button', 'a', 'input', 'select', 'textarea'].includes(children.type);
  const isChildProgrammaticallyFocusable = childOriginalProps.tabIndex !== undefined && childOriginalProps.tabIndex >= 0;
  const isChildEffectivelyFocusable = isChildFocusableElementType || isChildProgrammaticallyFocusable;


  if (isTouchDevice) {
    childProps.onClick = (e: React.MouseEvent) => {
      toggleTooltip(e);
      if (childOriginalProps.onClick) {
        childOriginalProps.onClick(e);
      }
    };
    // For touch devices, we don't need hover/focus on child to show tooltip
  } else {
    // Non-touch: use mouse enter/leave and focus/blur
    childProps.onMouseEnter = (e: React.MouseEvent) => {
      showTooltip();
      if (childOriginalProps.onMouseEnter) childOriginalProps.onMouseEnter(e);
    };
    childProps.onMouseLeave = (e: React.MouseEvent) => {
      hideTooltip();
      if (childOriginalProps.onMouseLeave) childOriginalProps.onMouseLeave(e);
    };
    childProps.onFocus = (e: React.FocusEvent) => {
      showTooltip();
      if (childOriginalProps.onFocus) childOriginalProps.onFocus(e);
    };
    childProps.onBlur = (e: React.FocusEvent) => {
      // Small delay to allow clicking inside tooltip if it were interactive
      setTimeout(() => {
        if (wrapperRef.current && !wrapperRef.current.contains(document.activeElement)) {
          hideTooltip();
        }
      }, 100);
      if (childOriginalProps.onBlur) childOriginalProps.onBlur(e);
    };
  }
  
  const wrapperTabIndex = (!isTouchDevice && !isChildEffectivelyFocusable) ? 0 : undefined;

  return (
    <div 
      className={`relative flex items-center group ${className}`}
      ref={wrapperRef}
      tabIndex={wrapperTabIndex} // Make wrapper focusable only if child isn't and not touch
      onFocus={wrapperTabIndex === 0 ? showTooltip : undefined}
      onBlur={wrapperTabIndex === 0 ? hideTooltip : undefined}
      // For touch devices, clicking the child toggles. Clicks on wrapper itself are not primary interaction.
    >
      {React.cloneElement(children, childProps)}
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`absolute z-20 px-3 py-2 text-xs font-medium text-[var(--text-primary)] rounded-md shadow-lg 
                     bg-glass 
                     whitespace-normal break-words max-w-xs sm:max-w-sm md:max-w-md 
                     ${positionClasses[position]} 
                     opacity-0 animate-fadeInTooltip group-hover:opacity-100 group-focus:opacity-100 data-[visible=true]:opacity-100`}
          data-visible={isVisible} // For direct state-driven visibility if needed
          style={{ background: 'var(--glass-bg-secondary)' }} 
        >
          {content.split('\n').map((line, index) => (
            <React.Fragment key={index}>
              {line}
              {index < content.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
          <svg className={arrowClasses[position]} x="0px" y="0px" viewBox="0 0 255 255">
            <polygon className="fill-current" points={arrowPolygon[position]}/>
          </svg>
        </div>
      )}
      {/* Moved style tag out. If this was intended to be global, it should be in index.html or a global CSS file.
          If component-specific, consider CSS modules or styled-components.
          For this exercise, assuming it's a minor animation that can be inlined or handled by Tailwind if possible.
          The keyframes are simple enough to be a utility class or in a global scope if needed.
          For now, removing it to avoid non-standard <style jsx global> for this component context.
      */}
    </div>
  );
};

export default Tooltip;
