"use client";

import * as React from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";

type ImageSize = "xs" | "sm" | "md" | "lg" | "xl" | "full";

interface OptimizedImageProps extends Omit<ImageProps, "alt"> {
  alt: string;
  size?: ImageSize;
  rounded?: boolean;
  fallback?: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

const sizeStyles: Record<ImageSize, string> = {
  xs: "h-8 w-8",
  sm: "h-12 w-12",
  md: "h-16 w-16",
  lg: "h-24 w-24",
  xl: "h-32 w-32",
  full: "h-full w-full",
};

export function OptimizedImage({
  alt,
  size = "md",
  rounded = true,
  fallback,
  className,
  containerClassName,
  ...props
}: OptimizedImageProps) {
  const [error, setError] = React.useState(false);

  if (error && fallback) {
    return (
      <div className={cn(sizeStyles[size], containerClassName)}>
        {fallback}
      </div>
    );
  }

  return (
    <div className={cn(sizeStyles[size], containerClassName)}>
      <Image
        alt={alt}
        className={cn(
          "object-cover",
          rounded && "rounded-full",
          className
        )}
        onError={() => setError(true)}
        placeholder="blur"
        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        {...props}
      />
    </div>
  );
}

interface PropertyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
}

export function PropertyImage({
  src,
  alt,
  width = 400,
  height = 300,
  priority = false,
  className,
}: PropertyImageProps) {
  const [error, setError] = React.useState(false);

  return (
    <div className={cn("relative overflow-hidden bg-gray-100", className)}>
      {!error ? (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          className="object-cover"
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
          onError={() => setError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-200">
          <svg
            className="h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

interface UserAvatarProps {
  src?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const avatarSizes = {
  sm: { width: 32, height: 32 },
  md: { width: 40, height: 40 },
  lg: { width: 56, height: 56 },
};

export function UserAvatar({
  src,
  alt,
  size = "md",
  className,
}: UserAvatarProps) {
  const [error, setError] = React.useState(false);
  const dimensions = avatarSizes[size];

  return (
    <div
      className={cn(
        "relative rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden",
        className
      )}
    >
      {src && !error ? (
        <Image
          src={src}
          alt={alt}
          width={dimensions.width}
          height={dimensions.height}
          className="object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <svg
            className="h-1/2 w-1/2 text-gray-400"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
      )}
    </div>
  );
}
