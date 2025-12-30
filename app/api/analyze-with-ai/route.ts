import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const categoryNames = [
  "市場理解",
  "競合分析",
  "自社分析",
  "価値提案",
  "独自性",
  "製品・サービス",
  "コミュニケーション",
  "インナーブランディング",
  "KPI管理",
  "成果",
  "知財保護",
  "成長意欲",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scores, memo, businessPhase, companyName } = body;

    if (!scores || scores.length !== 12) {
      return NextResponse.json(
        { error: "12項目のスコアが必要です" },
        { status: 400 }
      );
    }

    // スコアと項目名を整形
    const scoresWithLabels = scores
      .map((score: number, i: number) => `${categoryNames[i]}: ${score}点`)
      .join("\n");

    const avgScore = (
      scores.reduce((a: number, b: number) => a + b, 0) / scores.length
    ).toFixed(1);

    // Claude APIに送るプロンプト
    const prompt = `あなたはブランディングの専門家です。以下の企業のブランドチェック診断結果を分析してください。

【企業情報】
会社名: ${companyName || "未入力"}
ビジネスフェーズ: ${businessPhase || "未入力"}

【診断スコア（5点満点）】
${scoresWithLabels}
平均スコア: ${avgScore}点

【経営者のメモ（課題・展望）】
${memo || "記載なし"}

---

以下の項目について、丁寧かつ具体的に分析してください。ですます調を使用し、配慮のある表現を心がけてください：

1. **総合評価**: 平均スコアと全体的な状況を4-5文で評価します。メモの内容も十分に考慮し、現状の強みと今後の可能性について触れてください。

2. **矛盾検知**: スコア間の矛盾、またはスコアとメモの矛盾を4-6個丁寧に指摘します。
   表現例：「〜は高評価である一方で、〜は低い点が気になります」「〜という認識がある一方で、〜の整理がまだ十分ではないように見受けられます」

3. **優先アクション（緊急度順）**: 最も優先度の高いアクションを4-5個提案します。「〜することをお勧めします」「〜に取り組まれることが効果的です」といった丁寧な表現を使ってください。

4. **改善が必要な領域**: スコアが3点以下の項目について、改善の余地と具体的な方向性を3-4個提示します。「〜の可能性があります」「〜する余地があります」といった柔らかい表現を使ってください。

5. **具体的な改善提案**: 実行可能な具体的アクションを6-8個提案します。「〜されることをお勧めします」「〜に注力されると良いでしょう」といった提案型の表現を使ってください。

6. **リスク分析**: 現状のまま進んだ場合に想定されるリスクを4-5個提示します。
   表現例：「〜のリスクが考えられます」「〜の可能性があります」といった配慮ある表現を使ってください。

7. **3ヶ月後のアクションプラン**: 今から3ヶ月で取り組むべき具体的なアクションを3-4個提案します。

8. **6ヶ月後のアクションプラン**: 3-6ヶ月の期間で取り組むべき具体的なアクションを3-4個提案します。

9. **1年後のアクションプラン**: 6ヶ月-1年の期間で取り組むべき具体的なアクションを3-4個提案します。

10. **事業フェーズ別アドバイス**: ${businessPhase}フェーズに特化したアドバイスを3-4文で提供します。このフェーズならではの重要なポイントを、前向きかつ具体的に示してください。

重要な注意事項：
- メモの内容を丁寧に読み取り、経営者の想いや課題認識を尊重した分析を行うこと
- 矛盾点を指摘する際も、「〜の可能性があります」「〜と考えられます」といった配慮ある表現を使うこと
- 断定的な表現を避け、「〜することをお勧めします」「〜に取り組まれると良いでしょう」といった提案型の表現を使うこと
- すべての文章をですます調で統一すること
- ポジティブな面も認めながら、建設的な改善提案を行うこと
- 各項目で十分な量の分析を提供すること

必ず以下のJSON形式で出力してください：
\`\`\`json
{
  "overallComment": "総合評価の文章",
  "contradictions": ["矛盾1", "矛盾2", "矛盾3", "矛盾4"],
  "priorityActions": ["アクション1", "アクション2", "アクション3", "アクション4"],
  "weaknesses": ["弱み1", "弱み2", "弱み3"],
  "recommendations": ["提案1", "提案2", "提案3", "提案4", "提案5", "提案6"],
  "risks": ["リスク1", "リスク2", "リスク3", "リスク4"],
  "actionPlan3Months": ["3ヶ月後アクション1", "3ヶ月後アクション2", "3ヶ月後アクション3"],
  "actionPlan6Months": ["6ヶ月後アクション1", "6ヶ月後アクション2", "6ヶ月後アクション3"],
  "actionPlan1Year": ["1年後アクション1", "1年後アクション2", "1年後アクション3"],
  "phaseAdvice": "事業フェーズ別アドバイスの文章"
}
\`\`\``;

    // Claude APIを呼び出し
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // レスポンスからテキストを抽出
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // JSONを抽出（```json と ``` の間）
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) {
      throw new Error("AIのレスポンス形式が不正です");
    }

    const analysis = JSON.parse(jsonMatch[1]);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("AI分析エラー:", error);
    return NextResponse.json(
      {
        error: "AI分析に失敗しました",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
