"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

type SortField = 'created_at' | 'company_name' | 'avg_score';
type SortOrder = 'asc' | 'desc';

export default function BrandCheckAdminPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [industryFilter, setIndustryFilter] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('');
  const [industries, setIndustries] = useState<string[]>([]);
  const [phases, setPhases] = useState<string[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 認証チェック
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await fetch('/api/admin/auth');
      if (response.ok) {
        setAuthenticated(true);
        fetchAssessments();
      } else {
        router.push('/admin/login');
      }
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setCheckingAuth(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  useEffect(() => {
    if (authenticated) {
      filterAndSortAssessments();
    }
  }, [assessments, searchTerm, sortField, sortOrder, industryFilter, phaseFilter, authenticated]);

  async function fetchAssessments() {
    try {
      const { data, error } = await supabase
        .from("survey_results")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const assessmentData = data || [];
      setAssessments(assessmentData);

      const uniqueIndustries = [...new Set(assessmentData.map(a => a.industry).filter(Boolean))] as string[];
      const uniquePhases = [...new Set(assessmentData.map(a => a.business_phase).filter(Boolean))] as string[];
      
      setIndustries(uniqueIndustries.sort());
      setPhases(uniquePhases.sort());
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  function filterAndSortAssessments() {
    let filtered = [...assessments];

    if (searchTerm) {
      filtered = filtered.filter(a => 
        (a.company_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.respondent_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.respondent_email?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (industryFilter) {
      filtered = filtered.filter(a => a.industry === industryFilter);
    }

    if (phaseFilter) {
      filtered = filtered.filter(a => a.business_phase === phaseFilter);
    }

    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (aValue === null) return 1;
      if (bValue === null) return -1;

      if (sortField === 'created_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredAssessments(filtered);
  }

  function exportToCSV() {
    const headers = ['作成日時', '会社名', '回答者名', 'メールアドレス', '業界', 'ビジネスフェーズ', '平均スコア'];
    
    const rows = filteredAssessments.map(a => [
      new Date(a.created_at).toLocaleString('ja-JP'),
      a.company_name || '',
      a.respondent_name || '',
      a.respondent_email || '',
      a.industry || '',
      a.business_phase || '',
      (a.avg_score || 0).toFixed(1)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `brand-check-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function clearFilters() {
    setSearchTerm('');
    setIndustryFilter('');
    setPhaseFilter('');
    setSortField('created_at');
    setSortOrder('desc');
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

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">認証確認中...</div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
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
          {/* ヘッダー */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">ブランドチェック管理画面</h1>
            <div className="flex gap-3">
              <button
                onClick={exportToCSV}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <span>📥</span>
                CSVエクスポート ({filteredAssessments.length}件)
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                ログアウト
              </button>
            </div>
          </div>

          {/* フィルター・ソートセクション */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* 検索 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">検索</label>
                <input
                  type="text"
                  placeholder="会社名、回答者..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 業界フィルター */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">業界</label>
                <select
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">すべて</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>

              {/* フェーズフィルター */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ビジネスフェーズ</label>
                <select
                  value={phaseFilter}
                  onChange={(e) => setPhaseFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">すべて</option>
                  {phases.map(phase => (
                    <option key={phase} value={phase}>{phase}</option>
                  ))}
                </select>
              </div>

              {/* ソート項目 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">並び替え</label>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="created_at">作成日時</option>
                  <option value="company_name">会社名</option>
                  <option value="avg_score">平均スコア</option>
                </select>
              </div>

              {/* ソート順 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">順序</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="desc">降順 (新しい順 / 大きい順)</option>
                  <option value="asc">昇順 (古い順 / 小さい順)</option>
                </select>
              </div>
            </div>

            {/* クリアボタン */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
              >
                フィルターをクリア
              </button>
            </div>
          </div>

          {/* テーブル */}
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
                {filteredAssessments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-gray-500">
                      データがありません
                    </td>
                  </tr>
                ) : (
                  filteredAssessments.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="p-3 border border-gray-300">{new Date(a.created_at).toLocaleString('ja-JP')}</td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* フッター */}
          <div className="mt-6 flex justify-between items-center text-sm text-gray-600">
            <div>
              表示中: <strong>{filteredAssessments.length}件</strong> 
              {(searchTerm || industryFilter || phaseFilter) && ` / 全${assessments.length}件`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
