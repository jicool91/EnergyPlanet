import React, { ReactNode } from 'react';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  icon?: string;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  description,
  children,
  icon,
}) => {
  return (
    <div className="flex flex-col gap-sm-plus rounded-2xl border border-border-cyan/60 bg-surface-glass-strong shadow-elevation-2 p-md">
      <div className="flex items-center gap-2">
        {icon && <span className="text-title">{icon}</span>}
        <div className="flex-1">
          <h3 className="m-0 text-subheading font-semibold text-text-primary">{title}</h3>
          {description && (
            <p className="m-0 mt-xs text-caption text-text-secondary">{description}</p>
          )}
        </div>
      </div>
      <div
        className="flex flex-col gap-sm-plus pt-sm-plus"
        style={{
          borderTop: '1px solid color-mix(in srgb, var(--color-border-subtle) 40%, transparent)',
        }}
      >
        {children}
      </div>
    </div>
  );
};
