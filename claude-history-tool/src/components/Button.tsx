import React from 'react';

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  onClick, 
  children, 
  className = '' 
}) => {
  return (
    <button
      onClick={onClick}
      className={`button ${className}`}
    >
      {children}
    </button>
  );
};