import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: '中考提分 AI 私教 | 6位AI专家·55个核心技能',
  description: '6位AI专家组成的中考提分教练团队，汇聚55个核心技能，以系统化方法助力学生突破中考各科压轴难关',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50 text-gray-900 min-h-screen pt-16">
        <Header />
        {children}
      </body>
    </html>
  );
}