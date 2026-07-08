'use client';

import Link from 'next/link';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">&#127919;</span>
          <span className="font-bold text-lg text-gray-900">中考提分AI私教</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/chat" className="text-gray-600 hover:text-blue-600 transition-colors">AI对话</Link>
          <Link href="/pricing" className="text-gray-600 hover:text-blue-600 transition-colors">定价</Link>
          <Link href="/skills" className="text-gray-600 hover:text-blue-600 transition-colors">技能地图</Link>
          <Link href="/settings" className="text-gray-600 hover:text-blue-600 transition-colors">设置</Link>
          <Link href="/login" className="text-gray-600 hover:text-blue-600 transition-colors">登录</Link>
          <Link href="/admin" className="text-gray-300 hover:text-gray-400 text-xs" title="管理后台">&#9881;</Link>
        </nav>
      </div>
    </header>
  );
}
