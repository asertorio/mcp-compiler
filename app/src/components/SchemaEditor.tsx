import { useState, useEffect } from 'react';
import { validateSchema } from '../lib/validation';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface SchemaEditorProps {
  value: any;
  onChange: (value: any) => void;
  readOnly?: boolean;
}

export function SchemaEditor({ value, onChange, readOnly }: SchemaEditorProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Sync text with value prop when value changes externally (e.g. switching tools)
  // We need to be careful not to overwrite user's in-progress editing if they are just typing.
  // But since we only propagate valid changes, 'value' should track valid state.
  // Ideally, we reset 'text' only when the 'value' prop changes to something *different* than what we last parsed.
  
  // A simple heuristic: if we switch to a different object (different reference or deep different), reset.
  // But since we create a new object on every parse, reference always changes.
  // We can track the ID of the tool in the parent, but here we just have value.
  
  // Strategy: key this component by tool ID in the parent. 
  // Inside here, simply init state from prop, and update prop on valid change.
  // If prop updates from outside, we accept it.
  
  useEffect(() => {
    // Only update text if it's not currently dirty/focused? 
    // Or simpler: The parent should key this component so it remounts on tool change.
    // If it remounts, we just init.
    // If we assume it remounts or we want to force sync:
    setText(JSON.stringify(value, null, 2));
    setError(null);
  }, [value]);

  const handleChange = (newText: string) => {
    setText(newText);
    setIsDirty(true);
    
    try {
      const parsed = JSON.parse(newText);
      const validationError = validateSchema(parsed);
      
      if (validationError) {
        setError(validationError);
      } else {
        setError(null);
        // It's valid, propagate up
        // Note: this will trigger the useEffect above unless we are careful.
        // But if JSON.stringify(parsed) === text (normalized), it might be fine.
        // However, user formatting (whitespace) might be lost if we re-set from prop.
        // The parent should probably NOT update the prop if the semantic content hasn't changed, 
        // OR we should accept that auto-formatting happens on valid save.
        onChange(parsed);
      }
    } catch (e) {
      setError("Invalid JSON syntax");
    }
  };

  return (
    <div className="schema-editor">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          readOnly={readOnly}
          className="w-full p-3 font-mono text-sm bg-neutral-900 border border-neutral-700 rounded text-neutral-200 focus:outline-none focus:border-blue-500"
          rows={12}
          spellCheck={false}
        />
        <div className={`absolute bottom-3 right-3 px-2 py-1 rounded text-xs flex items-center gap-1 ${error ? 'bg-red-900/50 text-red-200 border border-red-800' : 'bg-green-900/50 text-green-200 border border-green-800'}`}>
          {error ? (
            <>
              <AlertCircle size={12} />
              {error}
            </>
          ) : (
            <>
              <CheckCircle size={12} />
              Valid JSON Schema
            </>
          )}
        </div>
      </div>
    </div>
  );
}
