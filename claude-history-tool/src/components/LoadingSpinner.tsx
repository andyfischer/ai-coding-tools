import React from 'react';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 40, 
  color = '#007acc',
  message = 'Loading...'
}) => {
  return (
    <div className="LoadingSpinner">
      <div
        className="LoadingSpinner__spinner"
        style={{
          width: size,
          height: size
        }}
      />
      {message && (
        <div className="LoadingSpinner__message">
          {message}
        </div>
      )}
    </div>
  );
};