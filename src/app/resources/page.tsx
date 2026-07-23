'use client';

import Link from 'next/link';

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4">

        {/* Hero */}
        <div className="text-center mb-16">
          <span className="text-6xl block mb-4">📚</span>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">领取中考提分资料</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            专业整理的中考备考资料包，涵盖各科重难点、答题技巧、真题解析，免费领取！
          </p>
        </div>

        {/* 网站功能介绍 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">🎯 中考提分AI私教 — 你能获得什么</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="font-bold text-gray-900 mb-2">AI一对一私教</h3>
              <p className="text-sm text-gray-600">7大学科覆盖，随时在线答疑。不是简单给答案，而是引导思路、讲解方法，像真人老师一样辅导。</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="text-3xl mb-3">📝</div>
              <h3 className="font-bold text-gray-900 mb-2">个性化学习方案</h3>
              <p className="text-sm text-gray-600">根据你的薄弱环节智能推荐练习，针对数学压轴题、物理实验题、英语阅读理解等重难点精准突破。</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="text-3xl mb-3">💡</div>
              <h3 className="font-bold text-gray-900 mb-2">解题思路拆解</h3>
              <p className="text-sm text-gray-600">不仅告诉你怎么做，更教你为什么这么做。每道题都有详细的思路拆解和方法总结，举一反三。</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-bold text-gray-900 mb-2">学习进度追踪</h3>
              <p className="text-sm text-gray-600">记录每次对话和提问，随时回顾学习轨迹。了解自己在哪些知识点上进步，哪些还需要加强。</p>
            </div>
          </div>
        </section>

        {/* 适用场景 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">📌 适合哪些场景</h2>
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">✅</span>
              <div>
                <p className="font-semibold text-gray-900">课后作业遇到难题</p>
                <p className="text-sm text-gray-600">晚上写作业卡住了，AI老师随时在线帮你理清思路，不再等老师答疑。</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">✅</span>
              <div>
                <p className="font-semibold text-gray-900">周末自主复习</p>
                <p className="text-sm text-gray-600">周末在家复习效率低？AI私教帮你梳理知识点，针对性练习，高效利用每一分钟。</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">✅</span>
              <div>
                <p className="font-semibold text-gray-900">考前冲刺提分</p>
                <p className="text-sm text-gray-600">距离中考还有几个月，想快速提分？AI根据历年真题帮你总结高频考点和答题套路。</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">✅</span>
              <div>
                <p className="font-semibold text-gray-900">家长辅导孩子</p>
                <p className="text-sm text-gray-600">家长不会教？让AI私教来帮忙。专业的方法讲解，孩子听得懂，家长也放心。</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">✅</span>
              <div>
                <p className="font-semibold text-gray-900">薄弱科目专项突破</p>
                <p className="text-sm text-gray-600">某科成绩拖后腿？选择对应学科，从基础概念到拔高题型，系统提升。</p>
              </div>
            </div>
          </div>
        </section>

        {/* 适合人群 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">👥 适合谁使用</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-xl p-5 text-center border border-blue-100">
              <div className="text-4xl mb-2">👦</div>
              <p className="font-bold text-gray-900">初三学生</p>
              <p className="text-xs text-gray-600 mt-1">备战中考，需要各科提分帮助</p>
            </div>
            <div className="bg-green-50 rounded-xl p-5 text-center border border-green-100">
              <div className="text-4xl mb-2">👨‍👩‍👧</div>
              <p className="font-bold text-gray-900">家长</p>
              <p className="text-xs text-gray-600 mt-1">想帮孩子但力不从心，需要专业辅助</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-5 text-center border border-purple-100">
              <div className="text-4xl mb-2">📖</div>
              <p className="font-bold text-gray-900">初二预习</p>
              <p className="text-xs text-gray-600 mt-1">提前了解中考难度，做好衔接准备</p>
            </div>
          </div>
        </section>

        {/* 免费体验 */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-3">🎁 注册即送100积分</h2>
            <p className="text-blue-100 mb-6 max-w-lg mx-auto">新用户注册自动赠送100积分，可免费体验20-30次AI对话，感受AI私教的辅导效果。</p>
            <Link href="/login" className="inline-block bg-white text-blue-600 font-bold px-8 py-3 rounded-full hover:bg-blue-50 transition-colors">
              立即免费体验
            </Link>
          </div>
        </section>

        {/* 领取资料 + 联系客服 */}
        <section className="mb-16">
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📥 免费领取中考备考资料包</h2>
            <p className="text-gray-600 mb-6 max-w-lg mx-auto">
              包含中考各科知识思维导图、必背公式汇总、历年真题精选、答题技巧手册等，添加客服微信即可免费领取。
            </p>
            <div className="bg-gray-50 rounded-xl p-6 inline-block border border-gray-200">
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="text-3xl">💬</span>
                <div className="text-left">
                  <p className="text-sm text-gray-500">客服微信号</p>
                  <p className="text-xl font-bold text-gray-900 tracking-wide">hugnet168</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">微信搜索添加，备注"中考资料"即可</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}