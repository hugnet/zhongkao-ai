'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

var variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
  ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
  danger: 'bg-red-600 text-white hover:bg-red-700'
};

var sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export function Button(props: any) {
  var { className, variant, size, children, ...rest } = props;
  var v = variant || 'primary';
  var s = size || 'md';
  return React.createElement("button", Object.assign({}, rest, {
    className: cn('inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none', variants[v as keyof typeof variants] || variants.primary, sizes[s as keyof typeof sizes] || sizes.md, className),
  }), children);
};