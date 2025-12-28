'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const QUESTIONS = [
  { id: 'q1_market_understanding', label: '市場理解', description: '自社の「理想的な顧客像（ターゲット）」が明確で、社内でも共有されている。' },
  { id: 'q2_competitive_analysis', label: '競合分析', description: '主な競合と自社の違いを、言語化して説明できる。' },
  { id: 'q3_self_analysis', label: '自社分析', description: '自社の強み・弱みを、第三者に説明できるレベルで把握している。' },
  { id: 'q4_value_proposition', label: '価値提案', description: '自社が「誰に」「どんな価値を」「なぜ提供できるのか」が明文化されている。' },
  { id: 'q5_uniqueness', label: '独自性', description: '競合が真似できない「独自の意味」や「世界観」がある。' },
  { id: 'q6_product_service', label: '商品・サービス', description: '提供する商品・サービスが、ブランドの理念と整合している。' },
  { id: 'q7_communication', label: 'コミュニケーション', description: 'ブランドのメッセージが、Web・営業・採用など全てで一貫している。' },
  { id: 'q8_inner_branding', label: 'インナーブランディング', description: '社員が自社のブランド価値を理解し、日常業務で体現している。' },
  { id: 'q9_kpi_management', label: 'KPI運用', description: 'ブランドに関する目標（KPI）や指標を定期的にモニタリングしている。' },
  { id: 'q10_results', label: '成果実感', description: 'ブランド施策によって、売上・採用・顧客満足度などに変化が出ている。' },
  { id: 'q11_ip_protection', label: '知的保護', description: 'ブランド名・ロゴ・デザインなど、法的保護（商標・特許）を意識している。' },
  { id: 'q12_growth_intent', label: '今後の方向性', description: '自社のブランドを資産として成長させたいという意思がある。' },
];

const BUSINESS_PHASES = ['構想中', '売り出し中', '成長中', '見直し中'];

const REVENUE_SCALES = [
  '1億円未満',
  '1〜3億円',
  '3〜10億円',
  '10〜30億円',
  '30〜100億円',
  '100億円以上',
  '分からない／回答したくない',
];

const INDUSTRIES = [
  // IT・テクノロジー
  "ソフトウェア開発",
  "SaaS・クラウドサービス",
  "Web制作・デザイン",
  "システムインテグレーション",
  "ITコンサルティング",
  "セキュリティ",
  
  // 製造業
  "食品製造",
  "繊維・アパレル製造",
  "化学・医薬品製造",
  "金属・機械製造",
  "電子部品・デバイス製造",
  "自動車・輸送機器製造",
  
  // 小売・EC
  "百貨店・総合小売",
  "専門小売（食品）",
  "専門小売（アパレル）",
  "専門小売（家電・雑貨）",
  "EC・オンライン販売",
  "卸売",
  
  // 飲食・宿泊
  "飲食店（レストラン）",
  "カフェ・喫茶店",
  "居酒屋・バー",
  "ホテル・旅館",
  "民泊",
  "観光・レジャー施設",
  
  // 建設・不動産
  "建設・土木",
  "建築設計",
  "不動産売買・仲介",
  "不動産管理",
  "リフォーム・リノベーション",
  
  // 医療・福祉
  "病院・クリニック",
  "歯科医院",
  "介護・福祉施設",
  "薬局・ドラッグストア",
  "整体・鍼灸",
  
  // 教育
  "学習塾・予備校",
  "語学教室",
  "専門学校・各種スクール",
  "企業研修",
  "オンライン教育",
  
  // 金融・保険
  "銀行・信用金庫",
  "証券",
  "保険",
  "ファイナンス",
  
  // 専門サービス
  "経営コンサルティング",
  "マーケティング・PR",
  "広告代理店",
  "デザイン事務所",
  "法律事務所",
  "会計・税理士事務所",
  "人材紹介・派遣",
  
  // その他
  "運輸・物流",
  "美容・エステ",
  "フィットネス・スポーツ",
  "清掃・メンテナンス",
  "イベント・企画",
  "その他",
];

export default function SurveyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [formData, setFormData] = useState({
    company_name: '',
    respondent_name: '',
    respondent_email: '',
    industry: '',
    business_phase: '',
    revenue_scale: '',
    memo: '',
  });

  const [scores, setScores] = useState<{ [key: string]: number }>({
    q1_market_understanding: 0,
    q2_competitive_analysis: 0,
    q3_self_analysis: 0,
    q4_value_proposition: 0,
    q5_uniqueness: 0,
    q6_product_service: 0,
    q7_communication: 0,
    q8_inner_branding: 0,
    q9_kpi_management: 0,
    q10_results: 0,
    q11_ip_protection: 0,
    q12_growth_intent: 0,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleScoreChange = (questionId: string, score: number) => {
    setScores({
      ...scores,
      [questionId]: score,
    });
  };

  const validateForm = () => {
    if (!formData.company_name || !formData.respondent_name || !formData.respondent_email) {
      alert('企業名、回答者名、メールアドレスは必須です。');
      return false;
    }

    if (!formData.business_phase) {
      alert('事業フェーズを選択してください。');
      return false;
    }

    const allAnswered = Object.values(scores).every(score => score > 0);
    if (!allAnswered) {
      alert('すべての質問に回答してください。');
      return false;
    }
    if (!agreedToPrivacy) {
      alert('個人情報保護方針に同意してください。');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Supabaseにデータを保存
      const { data, error } = await supabase
        .from('survey_results')
        .insert([
          {
            ...formData,
            ...scores,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Success! Data:', data);

      // 管理者にメール通知を送信
      try {
        await fetch('/api/send-survey-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_name: data.company_name,
            respondent_name: data.respondent_name,
            respondent_email: data.respondent_email,
            industry: data.industry,
            revenue_scale: data.revenue_scale,
            business_phase: data.business_phase,
            avg_score: data.avg_score,
            result_id: data.id,
          }),
        });
        console.log('Email notification sent successfully');
      } catch (emailError) {
        // メール送信失敗してもサーベイは完了
        console.error('Email notification failed:', emailError);
      }

      // AI分析を実行して結果を保存
      try {
        const aiResponse = await fetch('/api/analyze-with-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resultId: data.id,
            scores: [
              data.q1_market_understanding,
              data.q2_competitive_analysis,
              data.q3_self_analysis,
              data.q4_value_proposition,
              data.q5_uniqueness,
              data.q6_product_service,
              data.q7_communication,
              data.q8_inner_branding,
              data.q9_kpi_management,
              data.q10_results,
              data.q11_ip_protection,
              data.q12_growth_intent,
            ],
            memo: data.memo,
            businessPhase: data.business_phase,
            companyName: data.company_name,
          }),
        });

        if (aiResponse.ok) {
          const aiReport = await aiResponse.json();
          
          // AI分析結果をSupabaseに保存
          const { error: updateError } = await supabase
            .from('survey_results')
            .update({ ai_report: aiReport })
            .eq('id', data.id);

          if (updateError) {
            console.error('Failed to save AI report:', updateError);
          } else {
            console.log('AI report saved successfully');
          }
        } else {
          console.error('AI analysis failed:', await aiResponse.text());
        }
      } catch (aiError) {
        console.error('AI analysis failed:', aiError);
      }

      // サンキューページにリダイレクト
      router.push('/thank-you');
    } catch (error) {
      console.error('Error submitting survey:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : JSON.stringify(error);
      
      alert(`エラーが発生しました: ${errorMessage}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
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

        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg p-8 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">ブランドチェック診断</h1>
          <p className="text-blue-100">Brand Check Assessment</p>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          {/* 基本情報 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-blue-200">基本情報</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  企業名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  回答者名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="respondent_name"
                  value={formData.respondent_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="respondent_email"
                  value={formData.respondent_email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">診断結果をお送りするメールアドレスをご入力ください</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">業種</label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">選択してください</option>
                  {INDUSTRIES.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  事業フェーズ <span className="text-red-500">*</span>
                </label>
                <select
                  name="business_phase"
                  value={formData.business_phase}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">選択してください</option>
                  {BUSINESS_PHASES.map((phase) => (
                    <option key={phase} value={phase}>
                      {phase}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">売上規模（年間）</label>
                <select
                  name="revenue_scale"
                  value={formData.revenue_scale}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">選択してください</option>
                  {REVENUE_SCALES.map((scale) => (
                    <option key={scale} value={scale}>
                      {scale}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  現状の課題・将来の展望
                </label>
                <textarea
                  name="memo"
                  value={formData.memo}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="自由にご記入ください"
                />
              </div>
            </div>
          </section>

          {/* 診断質問 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-blue-200">診断項目</h2>
            <p className="text-sm text-gray-600 mb-6">
              各項目について、現在の状況に最も近いものを5段階で評価してください。
              <br />
              <strong>1 = まったく当てはまらない</strong>　〜　<strong>5 = 完全に当てはまる</strong>
            </p>

            <div className="space-y-6">
              {QUESTIONS.map((question, index) => (
                <div key={question.id} className="bg-gray-50 rounded-lg p-6">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-blue-600">Q{index + 1}</span>
                      <h3 className="text-lg font-bold text-gray-900">{question.label}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{question.description}</p>
                  </div>

                  <div className="flex justify-center gap-4">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => handleScoreChange(question.id, score)}
                        className={`w-12 h-12 rounded-full font-bold transition-all ${
                          scores[question.id] === score
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg scale-110'
                            : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-400'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* プライバシーポリシー */}
          <section className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="privacy"
                checked={agreedToPrivacy}
                onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="privacy" className="text-sm text-gray-700">
                <a
                  href="/privacy"
                  target="_blank"
                  className="text-blue-600 hover:underline font-medium"
                >
                  個人情報保護方針
                </a>
                に同意する <span className="text-red-500">*</span>
              </label>
            </div>
          </section>

          {/* 送信ボタン */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className={`px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-bold rounded-lg shadow-lg transition-all ${
                loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
              }`}
            >
              {loading ? '送信中...' : '診断結果を送信'}
            </button>
          </div>
        </form>

        {/* フッター */}
        <div className="text-center text-gray-600 text-sm mt-8">
          <p>© 2025 HUV DESIGN OFFICE</p>
        </div>
      </div>
    </div>
  );
}
