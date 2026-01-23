
import React, { useRef, useEffect } from 'react';

interface RichTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextInput: React.FC<RichTextInputProps> = ({ value, onChange, placeholder, className }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Synchronize state with editor only if external value changed significantly (to avoid cursor jump)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            document.execCommand('insertImage', false, base64);
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  return (
    <div
      ref={editorRef}
      contentEditable
      onInput={handleInput}
      onPaste={handlePaste}
      className={`min-h-[100px] p-2 border rounded bg-white overflow-y-auto outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      placeholder={placeholder}
      style={{ whiteSpace: 'pre-wrap' }}
    />
  );
};
