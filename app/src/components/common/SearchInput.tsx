import React, { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchInput({ value, onChange, placeholder = 'Search...', autoFocus = false }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Keyboard shortcut to focus search (Ctrl/Cmd + F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
      <Search 
        size={16} 
        style={{ 
          position: 'absolute', 
          left: '10px', 
          top: '50%', 
          transform: 'translateY(-50%)', 
          color: '#888',
          pointerEvents: 'none'
        }} 
      />
      <input 
        ref={inputRef}
        type="text" 
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ 
          width: '100%',
          padding: '8px 32px 8px 32px', 
          background: '#252526', 
          border: '1px solid #333', 
          color: '#fff', 
          borderRadius: '4px',
          outline: 'none',
          transition: 'border-color 0.2s',
          fontSize: '0.9rem'
        }}
        onFocus={(e) => e.target.style.borderColor = '#007acc'}
        onBlur={(e) => e.target.style.borderColor = '#333'}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
