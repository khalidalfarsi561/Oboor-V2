"use client";

import React, { useState } from "react";
import Image from "next/image";
import { User } from "lucide-react";

interface UserAvatarProps {
  src?: string | null;
  alt?: string | null;
  size?: number;
  className?: string;
}

export function UserAvatar({ src, alt, size = 40, className = "" }: UserAvatarProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div 
        className={`bg-slate-200 flex items-center justify-center rounded-full shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <User className="text-slate-400" style={{ width: size * 0.6, height: size * 0.6 }} />
      </div>
    );
  }

  return (
    <div className={`relative shrink-0 overflow-hidden rounded-full ${className}`} style={{ width: size, height: size }}>
      <Image
        src={src}
        alt={alt || "User Profile"}
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        onError={() => setError(true)}
        className="object-cover"
        sizes={`${size}px`}
        quality={90}
      />
    </div>
  );
}
