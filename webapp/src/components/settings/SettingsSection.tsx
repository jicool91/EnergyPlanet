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
    <div className="flex flex-col gap-3 p-4 rounded-lg bg-dark-secondary border border-cyan/[0.14]">
      <div className="flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        <div className="flex-1">
          <h3 className="m-0 text-base font-semibold text-white">{title}</h3>
          {description && <p className="m-0 mt-1 text-xs text-white/60">{description}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-3 border-t border-white/[0.05] pt-3">{children}</div>
    </div>
  );
};
