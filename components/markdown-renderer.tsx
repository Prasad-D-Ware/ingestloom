"use client";
import { useEffect, useRef } from 'react';
import MarkdownIt from 'markdown-it';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer = ({ content, className = '' }: MarkdownRendererProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (contentRef.current) {
      const md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
        breaks: true,
      });
      
      const rendered = md.render(content);
      contentRef.current.innerHTML = rendered;
    }
  }, [content]);

  return (
    <div 
      ref={contentRef}
      className={`markdown-content ${className}`}
    />
  );
};

export default MarkdownRenderer;
