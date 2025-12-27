"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Assessment = {
  id: string;
  created_at: string;
  company_name: string | null;
  respondent_name: string | null;
  respondent_email: string | null;
  industry: string | null;
  business_phase: string | null;
  avg_score: number | null;
};

export default function BrandCheckAdminPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchAssessments();
  }, []);

  async function fetchAssessments() {
    try {
      const { data, error } = await supabase
        .from("survey_results")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("本当に削除しますか？")) return;

    try {
      const { error } = await supabase
        .from("survey_results")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setAssessments(assessments.filter((a) => a.id !== id));
      alert("削除しました");
    } catch (err) {
      console.error("Error:", err);
      alert("削除に失敗しました");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-6">ブランドチェック管理画面</h1>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left border border-gray-300">作成日時</th>
                  <th className="p-3 text-left border border-gray-300">会社名</th>
                  <th className="p-3 text-left border border-gray-300">回答者名</th>
                  <th className="p-3 text-left border border-gray-300">メールアドレス</th>
                  <th className="p-3 text-left border border-gray-300">業界</th>
                  <th className="p-3 text-left border border-gray-300">ビジネスフェーズ</th>
                  <th className="p-3 text-left border border-gray-300">平均スコア</th>
                  <th className="p-3 text-center border border-gray-300">詳細</th>
                  <th className="p-3 text-center border border-gray-300">削除</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a) => (
                  <tr key={a.id}>
                    <td className="p-3 border border-gray-300">{new Date(a.created_at).toLocaleString()}</td>
                    <td className="p-3 border border-gray-300">{a.company_name || "-"}</td>
                    <td className="p-3 border border-gray-300">{a.respondent_name || "-"}</td>
                    <td className="p-3 border border-gray-300">{a.respondent_email || "-"}</td>
                    <td className="p-3 border border-gray-300">{a.industry || "-"}</td>
                    <td className="p-3 border border-gray-300">{a.business_phase || "-"}</td>
                    <td className="p-3 border border-gray-300">{(a.avg_score || 0).toFixed(1)}</td>
                    <td className="p-3 border border-gray-300 text-center">
                      <a href={`/results/${a.id}`} className="text-blue-600 hover:underline">詳細</a>
                    </td>
                    <td className="p-3 border border-gray-300 text-center">
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6">総件数: {assessments.length}件</div>
        </div>
      </div>
    </div>
  );
}