'use client';

// ビルド時の静的生成をスキップ
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createBrowserClient } from "@supabase/ssr";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

type AIReport = {
  overallComment: string;
  contradictionsAndRisks: string[];
  improvementRecommendations: string[];
  actionPlan3Months: string[];
  actionPlan6Months: string[];
  actionPlan1Year: string[];
  phaseAdvice: string;
};

interface SurveyResult {
  id: string;
  created_at: string;
  company_name: string;
  respondent_name: string;
  respondent_email: string;
  industry: string;
  business_phase: string;
  memo: string;
  consultation_memo: string | null;
  q1_market_understanding: number;
  q2_competitive_analysis: number;
  q3_self_analysis: number;
  q4_value_proposition: number;
  q5_uniqueness: number;
  q6_product_service: number;
  q7_communication: number;
  q8_inner_branding: number;
  q9_kpi_management: number;
  q10_results: number;
  q11_ip_protection: number;
  q12_growth_intent: number;
  avg_score: number;
  ai_report: AIReport | null;
}

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

export default function ResultPage() {
  const params = useParams();
  const [result, setResult] = useState<SurveyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedReport, setEditedReport] = useState<AIReport | null>(null);
  const [originalScores, setOriginalScores] = useState<any>(null);
  const [consultationMemo, setConsultationMemo] = useState<string>('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchResult = async () => {
      const { data, error } = await supabase
        .from('survey_results')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) {
        console.error('Error fetching result:', error);
      } else {
        setResult(data);
        setConsultationMemo(data.consultation_memo || '');
        
        // AI レポートがない場合は自動生成
        if (!data.ai_report) {
          await generateAIReport(data);
        }
      }
      setLoading(false);
    };

    if (params.id) {
      fetchResult();
    }
  }, [params.id]);

  async function generateAIReport(assessmentData: SurveyResult) {
    try {
      setGeneratingAI(true);

      const response = await fetch("/api/analyze-with-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scores: [
            assessmentData.q1_market_understanding,
            assessmentData.q2_competitive_analysis,
            assessmentData.q3_self_analysis,
            assessmentData.q4_value_proposition,
            assessmentData.q5_uniqueness,
            assessmentData.q6_product_service,
            assessmentData.q7_communication,
            assessmentData.q8_inner_branding,
            assessmentData.q9_kpi_management,
            assessmentData.q10_results,
            assessmentData.q11_ip_protection,
            assessmentData.q12_growth_intent,
          ],
          memo: assessmentData.memo,
          consultationMemo: consultationMemo || assessmentData.consultation_memo,
          businessPhase: assessmentData.business_phase,
          companyName: assessmentData.company_name,
        }),
      });

      if (!response.ok) throw new Error("AI分析に失敗しました");

      const aiReport = await response.json();

      // データベースを更新
      const { error: updateError } = await supabase
        .from("survey_results")
        .update({ ai_report: aiReport })
        .eq("id", assessmentData.id);

      if (updateError) throw updateError;

      // 状態を更新
      setResult((prev) => (prev ? { ...prev, ai_report: aiReport } : null));
    } catch (err) {
      console.error("Error generating AI report:", err);
      alert("AI分析に失敗しました: " + (err as Error).message);
    } finally {
      setGeneratingAI(false);
    }
  }

  function handleEdit() {
    if (result?.ai_report) {
      // 深いコピーを作成
      setEditedReport(JSON.parse(JSON.stringify(result.ai_report)));
      // 元のスコアを保存
      setOriginalScores({
        q1_market_understanding: result.q1_market_understanding,
        q2_competitive_analysis: result.q2_competitive_analysis,
        q3_self_analysis: result.q3_self_analysis,
        q4_value_proposition: result.q4_value_proposition,
        q5_uniqueness: result.q5_uniqueness,
        q6_product_service: result.q6_product_service,
        q7_communication: result.q7_communication,
        q8_inner_branding: result.q8_inner_branding,
        q9_kpi_management: result.q9_kpi_management,
        q10_results: result.q10_results,
        q11_ip_protection: result.q11_ip_protection,
        q12_growth_intent: result.q12_growth_intent,
      });
      setEditMode(true);
    }
  }

  function handleCancelEdit() {
    setEditedReport(null);
    setEditMode(false);
    if (result) {
      setConsultationMemo(result.consultation_memo || '');
    }
  }

  async function handleSaveEdit() {
    if (!editedReport || !result) return;

    try {
      // スコアと壁打ちメモも保存する
      const updatedData: any = { 
        ai_report: editedReport,
        consultation_memo: consultationMemo
      };
      
      // 編集されたスコアをデータベースに保存
      if (editMode && result) {
        updatedData.q1_market_understanding = (result as any).q1_market_understanding;
        updatedData.q2_competitive_analysis = (result as any).q2_competitive_analysis;
        updatedData.q3_self_analysis = (result as any).q3_self_analysis;
        updatedData.q4_value_proposition = (result as any).q4_value_proposition;
        updatedData.q5_uniqueness = (result as any).q5_uniqueness;
        updatedData.q6_product_service = (result as any).q6_product_service;
        updatedData.q7_communication = (result as any).q7_communication;
        updatedData.q8_inner_branding = (result as any).q8_inner_branding;
        updatedData.q9_kpi_management = (result as any).q9_kpi_management;
        updatedData.q10_results = (result as any).q10_results;
        updatedData.q11_ip_protection = (result as any).q11_ip_protection;
        updatedData.q12_growth_intent = (result as any).q12_growth_intent;
      }

      const { error } = await supabase
        .from("survey_results")
        .update(updatedData)
        .eq("id", result.id);

      if (error) throw error;

      setResult({ ...result, ai_report: editedReport, consultation_memo: consultationMemo });
      setEditMode(false);
      setEditedReport(null);
      setOriginalScores(null);
      alert("レポートを保存しました");
    } catch (err) {
      console.error("Error saving report:", err);
      alert("保存に失敗しました: " + (err as Error).message);
    }
  }

  async function handleResetToAI() {
    if (!result) return;
    
    const confirm = window.confirm("AI生成の内容に戻しますか？編集内容は失われます。");
    if (!confirm) return;

    await generateAIReport(result);
    setEditMode(false);
    setEditedReport(null);
    setOriginalScores(null);
  }

  function updateField(field: keyof AIReport, value: any) {
    if (editedReport) {
      setEditedReport({ ...editedReport, [field]: value });
    }
  }

  function updateArrayField(field: keyof AIReport, index: number, value: string) {
    if (editedReport && Array.isArray(editedReport[field])) {
      const newArray = [...(editedReport[field] as string[])];
      newArray[index] = value;
      setEditedReport({ ...editedReport, [field]: newArray });
    }
  }

  function updateScore(questionId: string, value: number) {
    if (result) {
      setResult({ ...result, [questionId]: value });
    }
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">結果が見つかりません</h1>
          <p className="text-gray-600">指定されたIDのデータが存在しません。</p>
        </div>
      </div>
    );
  }

  const scores = [
    result.q1_market_understanding,
    result.q2_competitive_analysis,
    result.q3_self_analysis,
    result.q4_value_proposition,
    result.q5_uniqueness,
    result.q6_product_service,
    result.q7_communication,
    result.q8_inner_branding,
    result.q9_kpi_management,
    result.q10_results,
    result.q11_ip_protection,
    result.q12_growth_intent,
  ];

  const avgScore = Number(
    result.avg_score || (scores.reduce((a, b) => a + b, 0) / 12)
  ).toFixed(1);

  const chartData = QUESTIONS.map((q) => {
    const currentValue = (result as any)[q.id];
    const originalValue = originalScores ? originalScores[q.id] : currentValue;
    return {
      category: q.label,
      current: currentValue,
      original: originalValue,
    };
  });

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600 bg-green-50';
    if (score >= 3) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const displayAnalysis = editMode && editedReport ? editedReport : result.ai_report;

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* ヘッダーボタン */}
          <div className="no-print mb-6 flex justify-end gap-3">
            {!editMode ? (
              <>
                <button
                  onClick={handlePrint}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  PDF印刷
                </button>
                <button
                  onClick={handleEdit}
                  disabled={!result.ai_report}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  編集
                </button>
                <a
                  href="/admin/brand-check"
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors inline-block"
                >
                  管理画面に戻る
                </a>
              </>
            ) : (
              <>
                <button
                  onClick={handleResetToAI}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  AI生成に戻す
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  保存
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  キャンセル
                </button>
              </>
            )}
          </div>

          {/* ヘッダー */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg p-8 mb-8">
            <h1 className="text-3xl font-bold mb-2">ブランドチェック診断結果</h1>
            <p className="text-blue-100">Brand Check Assessment Report</p>
          </div>

          {/* AI生成中の表示 */}
          {generatingAI && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-blue-700 font-semibold">AI分析中...（10-20秒お待ちください）</p>
            </div>
          )}

          {/* 基本情報 */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">基本情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">企業名</p>
                <p className="text-lg font-semibold text-gray-900">{result.company_name} 御中</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">回答者</p>
                <p className="text-lg font-semibold text-gray-900">{result.respondent_name} 様</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">業種</p>
                <p className="text-lg font-semibold text-gray-900">{result.industry || '未回答'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">事業フェーズ</p>
                <p className="text-lg font-semibold text-gray-900">{result.business_phase}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 mb-1">回答日時</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(result.created_at).toLocaleString('ja-JP')}
                </p>
              </div>
            </div>
          </div>

          {/* 総合スコア */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">総合スコア</h2>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-8 mb-4">
                  <p className="text-6xl font-bold text-white">{avgScore}</p>
                  <p className="text-xl text-blue-100">/ 5.0</p>
                </div>
              </div>
            </div>
          </div>

          {/* レーダーチャート */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">スコア分布</h2>
            <div className="flex justify-center">
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={chartData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis domain={[0, 5]} />
                  <Radar
                    name="元のスコア"
                    dataKey="original"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="現在のスコア"
                    dataKey="current"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 詳細スコア */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">項目別スコア</h2>
            <div className="space-y-4">
              {QUESTIONS.map((question, index) => {
                const score = (result as any)[question.id];
                return (
                  <div key={question.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-500">Q{index + 1}</span>
                          <h3 className="text-lg font-bold text-gray-900">{question.label}</h3>
                        </div>
                        <p className="text-sm text-gray-600">{question.description}</p>
                      </div>
                      <div className="ml-4">
                        {editMode ? (
                          <input
                            type="number"
                            min="1"
                            max="5"
                            step="0.1"
                            value={score}
                            onChange={(e) => updateScore(question.id, Number(e.target.value))}
                            className="w-20 text-2xl font-bold px-4 py-2 rounded-lg border-2 border-blue-500 text-center"
                          />
                        ) : (
                          <span className={`text-2xl font-bold px-4 py-2 rounded-lg ${getScoreColor(score)}`}>
                            {score}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${(score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 壁打ちメモ */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">💬</span>
              当日の壁打ち内容
            </h3>
            {editMode ? (
              <textarea
                value={consultationMemo}
                onChange={(e) => setConsultationMemo(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={6}
                placeholder="相談時に話した内容や気づいたことを記録してください"
              />
            ) : (
              <p className="text-base text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                {consultationMemo || '未記入'}
              </p>
            )}
            {!editMode && !consultationMemo && (
              <p className="text-sm text-gray-500 mt-2">
                ※ 編集モードで壁打ち内容を記録できます。記録後にAI生成すると、この内容も踏まえた分析が行われます。
              </p>
            )}
          </div>

          {/* AI分析レポート */}
          {displayAnalysis && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-blue-600 mb-6 border-b-2 border-blue-200 pb-2">
                AI分析レポート
              </h2>

              {/* 総合評価 */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <h3 className="text-xl font-bold text-blue-600 mb-2 flex items-center gap-2">
                  <span className="text-2xl">📊</span> 総合評価
                </h3>
                <p className="text-sm text-blue-600 mb-4 italic">現在の立ち位置と、これから伸ばせる可能性を総合的に評価します</p>
                {editMode ? (
                  <textarea
                    value={editedReport?.overallComment || ''}
                    onChange={(e) => updateField('overallComment', e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-lg"
                    rows={6}
                  />
                ) : (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {displayAnalysis.overallComment}
                  </p>
                )}
              </div>

              {/* 矛盾点とリスク */}
              {displayAnalysis.contradictionsAndRisks && displayAnalysis.contradictionsAndRisks.length > 0 && (
                <div className="bg-gradient-to-r from-yellow-50 to-red-50 border-2 border-orange-300 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-orange-700 mb-2 flex items-center gap-2">
                    <span className="text-2xl">⚠️</span> 矛盾点とリスク
                  </h3>
                  <p className="text-sm text-orange-600 mb-4 italic">成長の機会として捉えられる改善ポイントと、早めに対処することで回避できるリスクをお伝えします</p>
                  <ul className="space-y-4">
                    {displayAnalysis.contradictionsAndRisks.map((item: string, i: number) => (
                      <li key={i} className="bg-white rounded-lg p-4 border-l-4 border-orange-500 shadow-sm">
                        <div className="flex items-start gap-3">
                          <span className="bg-orange-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {editMode ? (
                            <textarea
                              value={editedReport?.contradictionsAndRisks?.[i] || ''}
                              onChange={(e) => updateArrayField('contradictionsAndRisks', i, e.target.value)}
                              className="flex-1 p-2 border border-gray-300 rounded"
                              rows={3}
                            />
                          ) : (
                            <span className="text-gray-800 flex-1 leading-relaxed">{item}</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 改善提案と具体的アクション */}
              {displayAnalysis.improvementRecommendations && displayAnalysis.improvementRecommendations.length > 0 && (
                <div className="bg-white rounded-lg p-6 shadow-md border-2 border-blue-300">
                  <h3 className="text-xl font-bold text-blue-700 mb-2 flex items-center gap-2">
                    <span className="text-2xl">💡</span> 改善提案と具体的アクション
                  </h3>
                  <p className="text-sm text-blue-600 mb-4 italic">事業をさらに成長させるための、優先度の高い実践的なアクションをご提案します</p>
                  
                  {/* 緊急度基準の説明 */}
                  <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-700 mb-3">
                      <strong className="text-blue-700">緊急度の判断基準：</strong> 
                      事業の根幹に関わり、すぐに取り組むことで大きな成果が期待できる項目を★★★、競争力向上に直結する項目を★★、中長期的な成長に貢献する項目を★としています。
                    </p>
                    <div className="flex items-center gap-4 text-sm flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="text-red-500 font-bold">★★★</span>
                        <span className="text-gray-700">最優先（今すぐ）</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-orange-500 font-bold">★★</span>
                        <span className="text-gray-700">重要（3ヶ月以内）</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500 font-bold">★</span>
                        <span className="text-gray-700">通常（6ヶ月以内）</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {displayAnalysis.improvementRecommendations.map((item: string, i: number) => {
                      // 緊急度を抽出（★★★、★★、★で判定）
                      const urgencyMatch = item.match(/^(★+)/);
                      const urgency = urgencyMatch ? urgencyMatch[1].length : 0;
                      const content = item.replace(/^★+\s*/, '');
                      
                      // 緊急度に応じた色とラベル
                      let urgencyColor = 'bg-yellow-500';
                      let urgencyBorder = 'border-yellow-500';
                      let urgencyBg = 'from-yellow-50 to-yellow-100';
                      let urgencyLabel = '★ 通常';
                      
                      if (urgency === 3) {
                        urgencyColor = 'bg-red-500';
                        urgencyBorder = 'border-red-500';
                        urgencyBg = 'from-red-50 to-red-100';
                        urgencyLabel = '★★★ 最優先';
                      } else if (urgency === 2) {
                        urgencyColor = 'bg-orange-500';
                        urgencyBorder = 'border-orange-500';
                        urgencyBg = 'from-orange-50 to-orange-100';
                        urgencyLabel = '★★ 重要';
                      }
                      
                      return (
                        <div key={i} className={`bg-gradient-to-r ${urgencyBg} rounded-lg p-4 border-l-4 ${urgencyBorder} shadow-sm hover:shadow-md transition-shadow`}>
                          <div className="flex items-start gap-3">
                            <div className="flex flex-col items-center gap-1 flex-shrink-0">
                              <span className={`${urgencyColor} text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold`}>
                                {i + 1}
                              </span>
                              <span className={`text-xs font-bold whitespace-nowrap ${urgency === 3 ? 'text-red-600' : urgency === 2 ? 'text-orange-600' : 'text-yellow-600'}`}>
                                {urgencyLabel}
                              </span>
                            </div>
                            {editMode ? (
                              <textarea
                                value={editedReport?.improvementRecommendations?.[i] || ''}
                                onChange={(e) => updateArrayField('improvementRecommendations', i, e.target.value)}
                                className="flex-1 p-2 border border-gray-300 rounded"
                                rows={3}
                              />
                            ) : (
                              <span className="text-gray-800 leading-relaxed flex-1">{content}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* アクションプラン - タイムライン */}
              {displayAnalysis.actionPlan3Months && displayAnalysis.actionPlan6Months && displayAnalysis.actionPlan1Year && (
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-8 border-2 border-slate-200">
                  <h3 className="text-2xl font-bold text-slate-800 mb-2 text-center flex items-center justify-center gap-2">
                    <span className="text-3xl">🗓️</span> アクションプラン・ロードマップ
                  </h3>
                  <p className="text-center text-slate-600 mb-8 italic">1年後の成長に向けて、段階的に取り組むべき具体的な施策をご提案します</p>
                  
                  {/* タイムライングリッド */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
                    {/* 矢印（デスクトップのみ表示） */}
                    <div className="hidden lg:block absolute top-1/2 left-1/3 transform -translate-y-1/2 text-4xl text-blue-400 z-10" style={{ marginLeft: '-1rem' }}>
                      →
                    </div>
                    <div className="hidden lg:block absolute top-1/2 left-2/3 transform -translate-y-1/2 text-4xl text-purple-400 z-10" style={{ marginLeft: '-1rem' }}>
                      →
                    </div>

                    {/* 3ヶ月後 */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-6 border-2 border-green-300 shadow-lg hover:shadow-xl transition-shadow">
                      <div className="flex items-center justify-center mb-4">
                        <div className="bg-green-600 text-white rounded-full px-6 py-2 font-bold text-lg">
                          3ヶ月後
                        </div>
                      </div>
                      <div className="space-y-3">
                        {displayAnalysis.actionPlan3Months.map((action: string, i: number) => (
                          <div key={i} className="bg-white rounded-lg p-3 border-l-4 border-green-600 shadow-sm">
                            <div className="flex items-start gap-2">
                              <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              {editMode ? (
                                <textarea
                                  value={editedReport?.actionPlan3Months?.[i] || ''}
                                  onChange={(e) => updateArrayField('actionPlan3Months', i, e.target.value)}
                                  className="flex-1 p-2 border border-gray-300 rounded text-sm"
                                  rows={2}
                                />
                              ) : (
                                <span className="text-sm text-gray-800 leading-relaxed">{action}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 6ヶ月後 */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-lg p-6 border-2 border-blue-300 shadow-lg hover:shadow-xl transition-shadow">
                      <div className="flex items-center justify-center mb-4">
                        <div className="bg-blue-600 text-white rounded-full px-6 py-2 font-bold text-lg">
                          6ヶ月後
                        </div>
                      </div>
                      <div className="space-y-3">
                        {displayAnalysis.actionPlan6Months.map((action: string, i: number) => (
                          <div key={i} className="bg-white rounded-lg p-3 border-l-4 border-blue-600 shadow-sm">
                            <div className="flex items-start gap-2">
                              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              {editMode ? (
                                <textarea
                                  value={editedReport?.actionPlan6Months?.[i] || ''}
                                  onChange={(e) => updateArrayField('actionPlan6Months', i, e.target.value)}
                                  className="flex-1 p-2 border border-gray-300 rounded text-sm"
                                  rows={2}
                                />
                              ) : (
                                <span className="text-sm text-gray-800 leading-relaxed">{action}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 1年後 */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-lg p-6 border-2 border-purple-300 shadow-lg hover:shadow-xl transition-shadow">
                      <div className="flex items-center justify-center mb-4">
                        <div className="bg-purple-600 text-white rounded-full px-6 py-2 font-bold text-lg">
                          1年後
                        </div>
                      </div>
                      <div className="space-y-3">
                        {displayAnalysis.actionPlan1Year.map((action: string, i: number) => (
                          <div key={i} className="bg-white rounded-lg p-3 border-l-4 border-purple-600 shadow-sm">
                            <div className="flex items-start gap-2">
                              <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              {editMode ? (
                                <textarea
                                  value={editedReport?.actionPlan1Year?.[i] || ''}
                                  onChange={(e) => updateArrayField('actionPlan1Year', i, e.target.value)}
                                  className="flex-1 p-2 border border-gray-300 rounded text-sm"
                                  rows={2}
                                />
                              ) : (
                                <span className="text-sm text-gray-800 leading-relaxed">{action}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* モバイル用の矢印 */}
                  <div className="lg:hidden flex justify-center my-4 text-3xl text-slate-400">↓</div>
                </div>
              )}

              {/* 事業フェーズ別アドバイス */}
              {displayAnalysis.phaseAdvice && (
                <div className="bg-gradient-to-r from-indigo-100 to-blue-100 rounded-lg p-6 shadow-md border border-indigo-300">
                  <h3 className="text-xl font-bold text-indigo-700 mb-2 flex items-center gap-2">
                    <span className="text-2xl">💡</span> {result.business_phase}フェーズのアドバイス
                  </h3>
                  <p className="text-sm text-indigo-600 mb-4 italic">現在のフェーズならではの強みを活かし、次のステージへ進むためのアドバイスをお届けします</p>
                  {editMode ? (
                    <textarea
                      value={editedReport?.phaseAdvice || ''}
                      onChange={(e) => updateField('phaseAdvice', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      rows={3}
                    />
                  ) : (
                    <p className="text-gray-800 leading-relaxed font-medium">{displayAnalysis.phaseAdvice}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* メモ（回答時） */}
          {result.memo && (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 mt-8">
              <h3 className="text-xl font-bold mb-4">現状の課題・将来の展望（回答時）</h3>
              <p className="text-base text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                {result.memo}
              </p>
            </div>
          )}

          {/* フッター */}
          <div className="text-center text-gray-600 text-sm mt-12">
            <p>© 2025 HUV DESIGN OFFICE</p>
          </div>
        </div>
      </div>
    </>
  );
}
