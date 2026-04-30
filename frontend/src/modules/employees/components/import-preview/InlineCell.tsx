import { useState, useEffect, useRef } from 'react';
import { Text } from '@mantine/core';
import s from './ImportPreview.module.css';

interface InlineCellProps {
  value: string;
  hasError: boolean;
  errorMsg?: string;
  onCommit: (v: string) => void;
}

export function InlineCell({ value, hasError, errorMsg, onCommit }: InlineCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [editing]);

  const commit = () => {
    onCommit(draft.trim());
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  return (
    <div className={s.inlineCellWrapper}>
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              cancel();
            }
            e.stopPropagation();
          }}
          className={`${s.inlineInput} ${hasError ? s.inlineInputError : s.inlineInputFocus}`}
        />
      ) : (
        <div
          onClick={() => setEditing(true)}
          title="Click to edit"
          className={`${s.inlineDisplay} ${hasError ? s.inlineDisplayError : s.inlineDisplayNormal} ${!value ? s.inlineDisplayEmpty : ''}`}
        >
          {value || '—'}
        </div>
      )}
      {hasError && errorMsg && (
        <Text size="xs" c="red" className={s.errorText}>
          {errorMsg}
        </Text>
      )}
    </div>
  );
}
