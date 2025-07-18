import React from 'react';

interface TypographyProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'small';
  children: React.ReactNode;
  color?: string;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  className?: string;
  style?: React.CSSProperties;
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  children,
  color,
  weight,
  align,
  className,
  style,
}) => {
  const getClassName = () => {
    const classes: string[] = [];
    
    // Base variant class
    switch (variant) {
      case 'h1':
        classes.push('heading-1');
        break;
      case 'h2':
        classes.push('heading-2');
        break;
      case 'h3':
        classes.push('heading-3');
        break;
      case 'h4':
        classes.push('heading-4');
        break;
      case 'caption':
        classes.push('text-sm');
        break;
      case 'small':
        classes.push('text-sm');
        break;
      default:
        break;
    }
    
    // Add color class if specified
    if (color === 'secondary') classes.push('text-secondary');
    if (color === 'tertiary') classes.push('text-tertiary');
    
    // Add custom className
    if (className) classes.push(className);
    
    return classes.join(' ');
  };

  const getInlineStyles = (): React.CSSProperties => {
    const styles: React.CSSProperties = {};
    
    if (color && !['secondary', 'tertiary'].includes(color)) {
      styles.color = color;
    }
    
    if (weight) {
      styles.fontWeight = weight === 'normal' ? 'var(--font-weight-normal)' : 
                          weight === 'medium' ? 'var(--font-weight-medium)' :
                          weight === 'semibold' ? 'var(--font-weight-semibold)' : 
                          'var(--font-weight-bold)';
    }
    
    if (align && align !== 'left') {
      styles.textAlign = align;
    }
    
    return { ...styles, ...style };
  };

  const Tag = variant.startsWith('h') ? variant as keyof JSX.IntrinsicElements : 'p';

  return (
    <Tag className={getClassName()} style={getInlineStyles()}>
      {children}
    </Tag>
  );
};