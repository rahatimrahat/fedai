
import React from 'react';
import Tab from './Tab.tsx'; // Assuming TabProps is exported or use React.ComponentProps<typeof Tab>

interface TabsProps {
  activeTab: string;
  onTabChange: (name: string) => void;
  children: React.ReactElement<React.ComponentProps<typeof Tab>>[] | React.ReactElement<React.ComponentProps<typeof Tab>>;
  ariaLabel?: string;
  className?: string; // For custom styling of the tablist container
  tabPanelIdPrefix?: string; // Prefix for generating tabPanel IDs if not explicitly provided by Tab children
}

const Tabs: React.FC<TabsProps> = ({
  activeTab,
  onTabChange,
  children,
  ariaLabel,
  className = "flex space-x-2 sm:space-x-3 border-b border-[var(--glass-border)]",
  tabPanelIdPrefix = "tabpanel",
}) => {
  return (
    <div role="tablist" aria-label={ariaLabel} className={className}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child) || child.type !== Tab) {
          console.warn("Tabs component only accepts Tab components as children.");
          return null;
        }
        const tabName = child.props.name;
        // Ensure child.props.id and child.props.ariaControls are used if provided, otherwise generate them
        const tabId = child.props.id || `${tabPanelIdPrefix}-${tabName}-tab`;
        const controlledPanelId = child.props.ariaControls || `${tabPanelIdPrefix}-${tabName}-content`;

        return React.cloneElement(child, {
          isActive: activeTab === tabName,
          onClick: onTabChange,
          id: tabId,
          ariaControls: controlledPanelId,
        });
      })}
    </div>
  );
};

export default Tabs;
