import { ComponentType, useState, useEffect } from 'react';
import { LucideProps } from 'lucide-react';

interface ResponsiveIconProps extends Omit<LucideProps, 'size'> {
  icon: ComponentType<LucideProps>;
  mobileSize?: number;
  tabletSize?: number;
  desktopSize?: number;
}

export function ResponsiveIcon({ 
  icon: Icon, 
  mobileSize = 16, 
  tabletSize = 20, 
  desktopSize = 24, 
  className = '',
  ...props 
}: ResponsiveIconProps) {
  const [size, setSize] = useState(mobileSize);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSize(desktopSize);
      } else if (window.innerWidth >= 768) {
        setSize(tabletSize);
      } else {
        setSize(mobileSize);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileSize, tabletSize, desktopSize]);

  return (
    <Icon
      size={size}
      className={className}
      {...props}
    />
  );
}

