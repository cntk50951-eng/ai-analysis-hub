import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TopicTagsProps {
  tags: string[];
  topicId?: number;
  userId?: string | null;
  onTagAdd?: (tag: string) => void;
}

export const TopicTags: React.FC<TopicTagsProps> = ({ tags, topicId: _topicId, userId, onTagAdd }) => {
  const [input, setInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const clean = input.trim();
    if (clean && onTagAdd) {
      onTagAdd(clean);
      setInput('');
      setShowInput(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
    if (e.key === 'Escape') {
      setShowInput(false);
      setInput('');
    }
  };

  return (
    <div className="topic-tags">
      <AnimatePresence>
        {tags.map((tag, i) => (
          <motion.span
            key={`${tag}-${i}`}
            className="topic-tag"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ delay: i * 0.04, duration: 0.2 }}
          >
            {tag}
          </motion.span>
        ))}
      </AnimatePresence>

      {userId && (
        <AnimatePresence>
          {showInput ? (
            <motion.input
              ref={inputRef}
              className="topic-tag-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => { if (!input.trim()) setShowInput(false); }}
              placeholder="添加標籤..."
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 120, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              autoFocus
              maxLength={20}
            />
          ) : (
            <motion.button
              className="topic-tag-add"
              onClick={() => setShowInput(true)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="添加標籤"
            >
              <span className="material-symbols-outlined">add</span>
            </motion.button>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};
