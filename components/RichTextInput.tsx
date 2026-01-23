
import React, { useRef, useEffect } from 'react';

interface RichTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextInput: React.FC<RichTextInputProps> = ({ value, onChange, placeholder, className }) => {
  const editorRef = useRef<HTMLDivElement>(null);

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
            // On insère l'image avec un style initial pour s'assurer qu'elle est traitable
            const imgHtml = `<img src="${base64}" style="width: 200px; height: auto;" />`;
            document.execCommand('insertHTML', false, imgHtml);
          };
          reader.readAsDataURL(blob);
          e.preventDefault();
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
      className={`rich-content min-h-[100px] p-4 border rounded bg-white overflow-y-auto outline-none focus:ring-2 focus:ring-emerald-500 ${className}`}
      placeholder={placeholder}
      style={{ whiteSpace: 'pre-wrap' }}
    />
  );
};
