import { createClient } from "@supabase/supabase-js";
import { ARTICLES } from "@/lib/articles";

export const runtime = "nodejs";

type SavedArticleRow = { article_id: string };
type FolderInsightRow = {
  id: string;
  folder_id: string;
  summary_date: string;
  summary_text: string;
  article_ids: string[];
  created_at: string;
};

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function todayInKorea() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!accessToken) return jsonError("로그인이 필요합니다.", 401);
  if (!supabaseUrl || !anonKey) {
    return jsonError("Supabase 환경 설정이 필요합니다.", 503);
  }
  if (!geminiKey) {
    return jsonError("서버에 GEMINI_API_KEY를 설정해 주세요.", 503);
  }

  let folderId: string;
  try {
    ({ folderId } = await request.json());
  } catch {
    return jsonError("요청 형식이 올바르지 않습니다.", 400);
  }
  if (typeof folderId !== "string" || !/^[0-9a-f-]{36}$/i.test(folderId)) {
    return jsonError("폴더를 선택해 주세요.", 400);
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
  const user = authData.user;
  if (authError || !user) return jsonError("로그인 상태를 확인해 주세요.", 401);

  const { data: folder, error: folderError } = await supabase
    .from("folders")
    .select("id,name")
    .eq("id", folderId)
    .maybeSingle();
  if (folderError) return jsonError("폴더를 확인하지 못했습니다.", 500);
  if (!folder) return jsonError("폴더를 찾을 수 없습니다.", 404);

  const summaryDate = todayInKorea();
  const { data: existing, error: existingError } = await supabase
    .from("folder_insights")
    .select("id,folder_id,summary_date,summary_text,article_ids,created_at")
    .eq("folder_id", folderId)
    .eq("summary_date", summaryDate)
    .maybeSingle();
  if (existingError) return jsonError("요약 기록을 읽지 못했습니다. DB 스키마를 확인해 주세요.", 500);
  if (existing) return Response.json({ insight: existing, cached: true });

  const { data: savedRows, error: savedError } = await supabase
    .from("saved_articles")
    .select("article_id")
    .eq("folder_id", folderId);
  if (savedError) return jsonError("저장 기사를 불러오지 못했습니다.", 500);

  const articleById = new Map(ARTICLES.map((article) => [article.id, article]));
  const selectedArticles = ((savedRows ?? []) as SavedArticleRow[])
    .map((row) => articleById.get(row.article_id))
    .filter((article) => article !== undefined)
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-30);

  if (selectedArticles.length < 2) {
    return jsonError("흐름을 정리하려면 이 폴더에 샘플 기사 2개 이상을 저장해 주세요.", 400);
  }

  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const sourceContext = selectedArticles.map((article) => ({
    date: article.date,
    page: article.paper,
    title: article.title,
    tags: article.tags,
    core: article.summary.core,
    background: article.summary.background,
    impact: article.summary.impact,
    takeaway: article.summary.oneLine,
  }));

  let summaryText: string;
  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(geminiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "당신은 개인 뉴스 스크랩의 흐름을 정리하는 분석 도우미입니다. 아래에 제공된 저장 기사 요약만 근거로 한국어로 답하세요. 제공된 요약에 없는 사실이나 외부 지식을 추가하지 마세요. 날짜 순으로 반복·변화·연결되는 이슈를 짚고, 근거가 부족하면 추세를 단정하지 마세요. 3~5문장, 500자 이내로 간결하게 작성하세요.",
            }],
          },
          contents: [{
            role: "user",
            parts: [{ text: `폴더명: ${folder.name}\n분석 대상 저장 기사 요약:\n${JSON.stringify(sourceContext)}` }],
          }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 650 },
        }),
        cache: "no-store",
      },
    );

    if (!geminiResponse.ok) {
      const errorPayload = await geminiResponse.json().catch(() => null);
      const providerMessage = errorPayload?.error?.message;
      return jsonError(
        geminiResponse.status === 429
          ? "AI 무료 사용량 한도에 도달했습니다. 나중에 다시 시도해 주세요."
          : geminiResponse.status === 404
            ? `Gemini 모델 ${model}을(를) 사용할 수 없습니다. GEMINI_MODEL을 현재 지원 모델로 설정해 주세요.`
            : typeof providerMessage === "string"
              ? `Gemini API 오류: ${providerMessage.slice(0, 220)}`
              : "AI 요약을 생성하지 못했습니다. API 설정을 확인해 주세요.",
        geminiResponse.status === 429 ? 429 : 502,
      );
    }

    const payload = await geminiResponse.json();
    summaryText = (payload.candidates?.[0]?.content?.parts ?? [])
      .map((part: { text?: string }) => part.text ?? "")
      .join("\n")
      .trim();
    if (!summaryText) return jsonError("AI가 요약을 반환하지 않았습니다.", 502);
  } catch {
    return jsonError("AI 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.", 502);
  }

  const articleIds = selectedArticles.map((article) => article.id);
  const { data: insight, error: insertError } = await supabase
    .from("folder_insights")
    .insert({
      folder_id: folderId,
      summary_date: summaryDate,
      summary_text: summaryText,
      article_ids: articleIds,
    })
    .select("id,folder_id,summary_date,summary_text,article_ids,created_at")
    .single();

  if (insertError?.code === "23505") {
    const { data: racedInsight } = await supabase
      .from("folder_insights")
      .select("id,folder_id,summary_date,summary_text,article_ids,created_at")
      .eq("folder_id", folderId)
      .eq("summary_date", summaryDate)
      .maybeSingle();
    if (racedInsight) return Response.json({ insight: racedInsight, cached: true });
  }
  if (insertError || !insight) {
    return jsonError("요약은 생성했지만 저장하지 못했습니다. DB 스키마를 확인해 주세요.", 500);
  }

  return Response.json({ insight: insight as FolderInsightRow, cached: false });
}
