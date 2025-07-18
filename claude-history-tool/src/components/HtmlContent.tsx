import React from 'react';

interface HtmlContentProps {
  html: string;
  className?: string;
}

export const HtmlContent: React.FC<HtmlContentProps> = ({ html, className = '' }) => {
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};