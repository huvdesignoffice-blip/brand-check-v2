'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 text-center">
          {/* ロゴ */}
          <div className="flex justify-center mb-8">
            <Image
              src="/variation logo_1.png"
              alt="HUV Design Office Logo"
              width={120}
              height={48}
              className="object-contain"
              priority
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>

          {/* チェックマークアイコン */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* メインメッセージ */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            ご回答ありがとうございました
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            ブランドチェック診断へのご協力、誠にありがとうございます。
          </p>

          {/* 詳細メッセージ */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-8 text-left">
            <h2 className="text-xl font-bold text-blue-900 mb-3">今後の流れ</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 mt-1">📧</span>
                <span>診断結果は、ご入力いただいたメールアドレス宛に<strong>3営業日以内</strong>にお送りいたします。</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 mt-1">📊</span>
                <span>AIによる詳細な分析レポートと、改善提案をまとめてお届けします。</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 mt-1">💡</span>
                <span>ご希望の方には、別途相談も承っております。レポートと合わせてご案内いたします。</span>
              </li>
            </ul>
          </div>

          {/* 注意事項 */}
          <div className="text-sm text-gray-500 mb-8">
            <p>※ メールが届かない場合は、迷惑メールフォルダをご確認ください。</p>
            <p>※ 3営業日を過ぎても届かない場合は、お手数ですがお問い合わせください。</p>
          </div>

          {/* ボタン */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg shadow-md transition-all"
            >
              ホームに戻る
            </Link>
          </div>
        </div>

        {/* フッター */}
        <div className="text-center text-gray-600 text-sm mt-8">
          <p>© 2025 HUV DESIGN OFFICE</p>
        </div>
      </div>
    </div>
  );
}
