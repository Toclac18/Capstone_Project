import type { IconProps } from "@/types/icon-props";
import { HTMLAttributes } from "react";

export function MenuIcon(props: IconProps) {
  return (
    <svg
      width="25"
      height="24"
      viewBox="0 0 25 24"
      fill="currentColor"
      {...props}
    >
      <path d="M3.5625 6C3.5625 5.58579 3.89829 5.25 4.3125 5.25H20.3125C20.7267 5.25 21.0625 5.58579 21.0625 6C21.0625 6.41421 20.7267 6.75 20.3125 6.75L4.3125 6.75C3.89829 6.75 3.5625 6.41422 3.5625 6Z" />
      <path d="M3.5625 18C3.5625 17.5858 3.89829 17.25 4.3125 17.25L20.3125 17.25C20.7267 17.25 21.0625 17.5858 21.0625 18C21.0625 18.4142 20.7267 18.75 20.3125 18.75L4.3125 18.75C3.89829 18.75 3.5625 18.4142 3.5625 18Z" />
      <path d="M4.3125 11.25C3.89829 11.25 3.5625 11.5858 3.5625 12C3.5625 12.4142 3.89829 12.75 4.3125 12.75L20.3125 12.75C20.7267 12.75 21.0625 12.4142 21.0625 12C21.0625 11.5858 20.7267 11.25 20.3125 11.25L4.3125 11.25Z" />
    </svg>
  );
}

interface AnimatedMenuIconProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
}

export function AnimatedMenuIcon({ isOpen, className, ...props }: AnimatedMenuIconProps) {
  return (
    <div className={`relative w-5 h-5 ${className || ''}`} {...props}>
      {/* Hamburger lines */}
      <div className="absolute inset-0 flex flex-col justify-center items-center">
        {/* Top line */}
        <div 
          className={`absolute w-4 h-0.5 bg-current transition-all duration-200 ease-out ${
            isOpen 
              ? 'opacity-0' 
              : '-translate-y-1'
          }`}
        />
        
        {/* Middle line */}
        <div 
          className={`absolute w-4 h-0.5 bg-current transition-all duration-200 ease-out ${
            isOpen 
              ? 'opacity-0' 
              : 'opacity-100'
          }`}
        />
        
        {/* Bottom line */}
        <div 
          className={`absolute w-4 h-0.5 bg-current transition-all duration-200 ease-out ${
            isOpen 
              ? 'opacity-0' 
              : 'translate-y-1'
          }`}
        />
      </div>
      
      {/* Arrow when open */}
      <div 
        className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ease-out ${
          isOpen 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-75'
        }`}
      >
        <svg 
          width="14" 
          height="14" 
          viewBox="0 0 16 16" 
          fill="none"
          className="transform transition-transform duration-200"
        >
          <path 
            d="M10 4L6 8L10 12" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
