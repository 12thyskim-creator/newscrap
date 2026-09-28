"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, CSSProperties } from "react";
import {
  ArrowRight,
  Bookmark,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  Folder,
  Grid2X2,
  LoaderCircle,
  LogOut,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { ARTICLES, AVAILABLE_DATES, type Article } from "@/lib/articles";
import { createSupabaseBrowserClient } from "@/lib/supabase";

type FolderItem = { id: string; name: string };
type SavedMap = Record<string, string[]>;
type FolderInsight = {
  id: string;
  folder_id: string;
  summary_date: string;
  summary_text: string;
  article_ids: string[];
  created_at: string;
};
type View = "publisher" | "today" | "mine";
type Tag = Article["tags"][number];
const TAGS = {
  P: ["정치", "#c45e4d"],
  E: ["경제", "#328a70"],
  S: ["사회", "#d88a50"],
  T: ["기술", "#547cb0"],
  I: ["국제", "#416f9c"],
} as const;
const storageKey = (email: string, kind: string) => `newscrap:${email}:${kind}`;

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand${compact ? " brand-small" : ""}`}>
      <span>Newscrap</span>
      <small>오늘의 신문, 더 넓은 시선으로</small>
    </div>
  );
}
function Tags({ tags }: { tags: Article["tags"] }) {
  return (
    <span
      className="tags"
      aria-label={tags.map((tag) => TAGS[tag][0]).join(", ")}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="tag"
          style={{ "--tag": TAGS[tag][1] } as CSSProperties}
        >
          {tag}
        </span>
      ))}
    </span>
  );
}
function dateText(date: string) {
  return date.replaceAll("-", ". ") + ".";
}
function todayInKorea() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function ArticleCard({
  article,
  index,
  isSaved,
  onSave,
  onOpen,
}: {
  article: Article;
  index: number;
  isSaved: boolean;
  onSave: () => void;
  onOpen: () => void;
}) {
  const layouts = ["lead", "portrait", "landscape", "standard", "strip"];

  return (
    <article
      className={`article-card layout-${layouts[index % layouts.length]}${
        article.image ? " has-image" : " text-only"
      }`}
    >
      {article.image && (
        <div
          className={`article-photo ${article.image}`}
          role="img"
          aria-label={article.imageAlt}
        />
      )}
      <div className="article-copy">
        <div className="article-meta">
          <Tags tags={article.tags} />
          <span>{article.paper}면</span>
          <i>/</i>
          <time>{dateText(article.date)}</time>
        </div>
        <button
          className="bookmark"
          onClick={onSave}
          aria-label="폴더에 저장"
        >
          <Bookmark size={17} fill={isSaved ? "currentColor" : "none"} />
        </button>
        <h2>{article.title}</h2>
        <p>{article.summary.core}</p>
        <div className="card-bottom">
          <button onClick={onOpen}>
            요약 보기 <ArrowRight size={14} />
          </button>
          <small>{article.reporter}</small>
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState("");
  const [authReady, setAuthReady] = useState(false);
  const [message, setMessage] = useState("");
  const [view, setView] = useState<View>("publisher");
  const [date, setDate] = useState(AVAILABLE_DATES[0]);
  const [page, setPage] = useState(1);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [saved, setSaved] = useState<SavedMap>({});
  const [folderId, setFolderId] = useState("");
  const [folderInsight, setFolderInsight] = useState<FolderInsight | null>(null);
  const [insightMessage, setInsightMessage] = useState("");
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [articleModal, setArticleModal] = useState<Article | null>(null);
  const [saveModal, setSaveModal] = useState<Article | null>(null);
  const [folderModal, setFolderModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    if (!supabase) {
      void Promise.resolve().then(() => {
        if (!active) return;
        setUser(localStorage.getItem("newscrap:demo-user") ?? "");
        setAuthReady(true);
      });
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setUser(data.session?.user.email ?? "");
        setAuthReady(true);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUser(session?.user.email ?? "");
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    async function load() {
      if (!supabase) {
        try {
          const localFolders: FolderItem[] = JSON.parse(
            localStorage.getItem(storageKey(user, "folders")) ?? "[]",
          );
          setFolders(localFolders);
          setFolderId((current) => current || localFolders[0]?.id || "");
          setSaved(
            JSON.parse(localStorage.getItem(storageKey(user, "saved")) ?? "{}"),
          );
        } catch {
          setFolders([]);
          setSaved({});
        }
        return;
      }
      const [folderResult, savedResult] = await Promise.all([
        supabase.from("folders").select("id,name").order("created_at"),
        supabase.from("saved_articles").select("folder_id,article_id"),
      ]);
      if (!active) return;
      if (!folderResult.error) {
        const loadedFolders = folderResult.data ?? [];
        setFolders(loadedFolders);
        setFolderId((current) => current || loadedFolders[0]?.id || "");
      }
      if (!savedResult.error) {
        const map: SavedMap = {};
        for (const row of savedResult.data ?? [])
          map[row.article_id] = [...(map[row.article_id] ?? []), row.folder_id];
        setSaved(map);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [supabase, user]);

  useEffect(() => {
    if (!user || !folderId || !supabase) return;
    let active = true;
    void supabase
      .from("folder_insights")
      .select("id,folder_id,summary_date,summary_text,article_ids,created_at")
      .eq("folder_id", folderId)
      .order("summary_date", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setInsightMessage("요약 기록을 불러오지 못했습니다. 최신 schema.sql을 실행했는지 확인해 주세요.");
          return;
        }
        setFolderInsight(data);
        setInsightMessage("");
      });
    return () => {
      active = false;
    };
  }, [folderId, supabase, user]);

  const dayArticles = ARTICLES.filter((article) => article.date === date);
  const filteredArticles = dayArticles.filter(
    (article) =>
      selectedTags.length === 0 ||
      selectedTags.some((tag) => article.tags.includes(tag)),
  );
  const pageCount = Math.max(1, Math.ceil(filteredArticles.length / 5));
  const visibleArticles = filteredArticles.slice((page - 1) * 5, page * 5);
  const toggleTag = (tag: Tag) => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
    setPage(1);
  };
  const folderArticles = ARTICLES.filter((article) =>
    saved[article.id]?.includes(folderId),
  ).filter((article) =>
    article.title.toLowerCase().includes(search.toLowerCase()),
  );
  const folderSavedArticleCount = ARTICLES.filter((article) =>
    saved[article.id]?.includes(folderId),
  ).length;
  const currentFolderInsight =
    folderInsight?.folder_id === folderId ? folderInsight : null;
  const insightSources = (currentFolderInsight?.article_ids ?? [])
    .map((articleId) => ARTICLES.find((article) => article.id === articleId))
    .filter((article) => article !== undefined);
  const insightGeneratedToday =
    currentFolderInsight?.summary_date === todayInKorea();

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (password.length < 6) {
      setMessage("비밀번호는 6자 이상 입력해 주세요.");
      return;
    }
    if (!supabase) {
      localStorage.setItem("newscrap:demo-user", email.trim());
      setUser(email.trim());
      return;
    }
    const result =
      mode === "signup"
        ? await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { emailRedirectTo: window.location.origin },
          })
        : await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
    if (result.error) {
      const alreadyRegistered =
        mode === "signup" &&
        result.error.message.toLowerCase().includes("already registered");
      if (alreadyRegistered) {
        const { error } = await supabase.auth.resend({
          type: "signup",
          email: email.trim(),
          options: { emailRedirectTo: window.location.origin },
        });
        setMessage(error ? error.message : "인증 메일을 다시 보냈습니다.");
      } else setMessage(result.error.message);
    } else if (mode === "signup" && !result.data.session)
      setMessage("확인 메일을 보냈습니다. 이메일 인증 후 로그인해 주세요.");
    else setUser(result.data.user?.email ?? email.trim());
  }

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    else localStorage.removeItem("newscrap:demo-user");
    setUser("");
    setView("publisher");
  }

  async function createFolder() {
    const name = folderName.trim();
    if (
      !name ||
      name.length > 30 ||
      folders.some((folder) => folder.name === name)
    ) {
      setMessage("폴더 이름을 입력해 주세요. 같은 이름은 사용할 수 없습니다.");
      return;
    }
    let item: FolderItem = { id: crypto.randomUUID(), name };
    if (supabase) {
      const { data, error } = await supabase
        .from("folders")
        .insert({ name })
        .select("id,name")
        .single();
      if (error || !data) {
        setMessage(error?.message ?? "폴더를 만들지 못했습니다.");
        return;
      }
      item = data;
    }
    const next = [...folders, item];
    setFolders(next);
    setFolderId(item.id);
    if (!supabase)
      localStorage.setItem(storageKey(user, "folders"), JSON.stringify(next));
    setFolderName("");
    setFolderModal(false);
    setMessage("");
  }

  async function toggleSave(article: Article, folder: FolderItem) {
    const current = saved[article.id] ?? [];
    const exists = current.includes(folder.id);
    const next = {
      ...saved,
      [article.id]: exists
        ? current.filter((id) => id !== folder.id)
        : [...current, folder.id],
    };
    setSaved(next);
    if (supabase) {
      if (exists)
        await supabase
          .from("saved_articles")
          .delete()
          .eq("article_id", article.id)
          .eq("folder_id", folder.id);
      else
        await supabase
          .from("saved_articles")
          .insert({ article_id: article.id, folder_id: folder.id });
    } else
      localStorage.setItem(storageKey(user, "saved"), JSON.stringify(next));
  }

  async function generateFolderInsight() {
    if (!supabase || !folderId) {
      setInsightMessage("AI 요약은 Supabase 계정으로 로그인해야 사용할 수 있습니다.");
      return;
    }
    if (folderArticles.length < 2) {
      setInsightMessage("흐름을 정리하려면 이 폴더에 기사 2개 이상을 저장해 주세요.");
      return;
    }
    setGeneratingInsight(true);
    setInsightMessage("");
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (sessionError || !accessToken) {
        setInsightMessage("로그인 상태를 확인해 주세요.");
        return;
      }
      const response = await fetch("/api/folder-insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ folderId }),
      });
      const result = (await response.json()) as {
        insight?: FolderInsight;
        cached?: boolean;
        error?: string;
      };
      if (!response.ok || !result.insight) {
        setInsightMessage(result.error ?? "요약을 생성하지 못했습니다.");
        return;
      }
      setFolderInsight(result.insight);
      setInsightMessage(
        result.cached ? "오늘 생성한 요약을 불러왔습니다." : "오늘의 흐름 요약을 저장했습니다.",
      );
    } catch {
      setInsightMessage("요약 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setGeneratingInsight(false);
    }
  }

  if (!authReady)
    return (
      <main className="loading">
        <Brand />
        <span />
      </main>
    );

  if (!user)
    return (
      <main className="auth-screen">
        <section className="auth-story">
          <div className="overline">
            <span>NEWS FOR A WIDER TOMORROW</span>
            <span>VOL. 01 / 2026</span>
          </div>
          <Brand />
          <div className="auth-pitch">
            <small>DAILY EDITION · MAEIL BUSINESS</small>
            <h1>
              하루의 이슈를
              <br />
              나만의 관점으로
              <br />
              <em>스크랩하다.</em>
            </h1>
            <p>
              신문이 고른 오늘의 흐름을 읽고,
              <br />
              내가 중요하게 본 기사를 차곡차곡 모아보세요.
            </p>
            <div className="pitch-footer">
              <b>01</b>
              <i /> READ · SORT · KEEP
            </div>
          </div>
          <div className="story-footer">
            <span>SEOUL · KOREA</span>
            <span>정리된 뉴스, 선명한 시선</span>
            <span>2026</span>
          </div>
        </section>
        <section className="auth-form-panel">
          <div className="panel-top">
            <span>YOUR DAILY CLIPPING DESK</span>
            <b>N.</b>
          </div>
          <div className="auth-box">
            <div className="auth-tabs">
              <button
                className={mode === "login" ? "active" : ""}
                onClick={() => {
                  setMode("login");
                  setMessage("");
                }}
              >
                로그인
              </button>
              <button
                className={mode === "signup" ? "active" : ""}
                onClick={() => {
                  setMode("signup");
                  setMessage("");
                }}
              >
                회원가입
              </button>
            </div>
            <h2>
              {mode === "login" ? "다시 오셨네요." : "스크랩북을 시작하세요."}
            </h2>
            <p>
              {mode === "login"
                ? "로그인해 오늘의 스크랩을 이어보세요."
                : "이메일로 계정을 만들고 나만의 스크랩을 시작하세요."}
            </p>
            <form onSubmit={authenticate}>
              <label htmlFor="email">이메일</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <label htmlFor="password">비밀번호</label>
              <input
                id="password"
                type="password"
                minLength={6}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                placeholder="6자 이상 입력"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              {message && <span className="message">{message}</span>}
              <button className="primary wide" type="submit">
                {mode === "login" ? "로그인" : "계정 만들기"}
                <ArrowRight size={17} />
              </button>
            </form>
            {!supabase && (
              <div className="demo-hint">
                <i /> 로컬 데모 · 이메일별로 저장 데이터가 구분됩니다
              </div>
            )}
          </div>
          <div className="panel-bottom">
            <span>ARCHIVE YOUR DAY</span>
            <CircleHelp size={15} />
          </div>
        </section>
      </main>
    );

  if (view === "publisher")
    return (
      <main className="publisher-screen">
        <header>
          <Brand compact />
          <button className="quiet-button" onClick={logout}>
            <LogOut size={16} /> 로그아웃
          </button>
        </header>
        <section className="publisher-choice">
          <span className="overline">YOUR READING DESK</span>
          <h1>
            오늘은 어떤 신문을
            <br />
            읽어볼까요?
          </h1>
          <p>구독 중인 신문을 선택해 오늘의 스크랩을 시작하세요.</p>
          <button onClick={() => setView("today")}>
            <b>매</b>
            <span>
              <strong>매일경제</strong>
              <small>오늘의 매경 · 2026년 9월 23일</small>
            </span>
            <ArrowRight size={20} />
          </button>
          <small className="publisher-note">
            <Check size={14} /> 현재 프로토타입은 매일경제를 제공합니다
          </small>
        </section>
        <footer>
          NEWSCRAP · PERSONAL NEWSPAPER <span>VOL. 01</span>
        </footer>
      </main>
    );

  return (
    <main className="app-shell">
      <header className="masthead">
        <div className="masthead-side">
          NEWS
          <br />
          FOR A WIDER
          <br />
          TOMORROW.
        </div>
        <button className="masthead-logo" onClick={() => setView("today")}>
          <strong>Newscrap</strong>
          <span>오늘의 신문, 더 넓은 시선으로</span>
        </button>
        <div className="masthead-note">
          Archive
          <br />
          <i>Today’s Insight</i>
          <br />
          Tomorrow.
        </div>
        <div className="masthead-date">
          <b>{dateText(date)}</b>
          <strong>WED</strong>
          <small>
            POLITICS
            <br />
            ECONOMY
            <br />
            SOCIETY
            <br />
            TECHNOLOGY
            <br />
            INTERNATIONAL
          </small>
        </div>
        <button
          className="logout-icon"
          onClick={logout}
          aria-label="로그아웃"
          title={user}
        >
          <LogOut size={17} />
        </button>
      </header>
      <nav className="main-nav">
        <button
          className={view === "today" ? "current" : ""}
          onClick={() => setView("today")}
        >
          오늘의 스크랩
        </button>
        <button
          className={view === "mine" ? "current" : ""}
          onClick={() => setView("mine")}
        >
          마이스크랩{" "}
          <small>
            {Object.values(saved).reduce((count, ids) => count + ids.length, 0)}
          </small>
        </button>
        <span>
          <i /> 매일경제
        </span>
      </nav>

      {view === "today" ? (
        <>
          <section className="edition-heading">
            <div>
              <small>DAILY PAPER · MAEIL BUSINESS</small>
              <h1>오늘의 스크랩</h1>
            </div>
            <label>
              발행일
              <select
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setPage(1);
                }}
              >
                {AVAILABLE_DATES.map((item) => (
                  <option key={item} value={item}>
                    {dateText(item)}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} />
            </label>
          </section>
          <div className="edition-meta">
            <span>
              <b>{dateText(date)}</b> · 매일경제 A섹션 주요 지면 · {filteredArticles.length}개 기사
            </span>
            <small>
              {filteredArticles.length} ARTICLES <i /> {pageCount} PAGES
            </small>
          </div>
          <div className="tag-filters" aria-label="PESTI 기사 필터">
            <button
              className={selectedTags.length === 0 ? "active" : ""}
              aria-pressed={selectedTags.length === 0}
              onClick={() => {
                setSelectedTags([]);
                setPage(1);
              }}
            >
              전체
            </button>
            {(Object.keys(TAGS) as Tag[]).map((tag) => (
              <button
                key={tag}
                className={selectedTags.includes(tag) ? "active" : ""}
                aria-pressed={selectedTags.includes(tag)}
                onClick={() => toggleTag(tag)}
                title={`${TAGS[tag][0]} 기사만 보기`}
              >
                <span className="filter-tag" style={{ "--tag": TAGS[tag][1] } as CSSProperties}>
                  {tag}
                </span>
                {TAGS[tag][0]}
              </button>
            ))}
          </div>
          <section className="article-grid">
            {visibleArticles.map((article, index) => (
              <ArticleCard
                key={article.id}
                article={article}
                index={index}
                isSaved={Boolean(saved[article.id]?.length)}
                onSave={() => setSaveModal(article)}
                onOpen={() => setArticleModal(article)}
              />
            ))}
          </section>
          {filteredArticles.length === 0 && (
            <p className="no-filter-results">선택한 태그에 해당하는 기사가 없습니다.</p>
          )}
          <footer className="page-nav">
            <button aria-label="처음으로" onClick={() => setPage(1)}>
              <Grid2X2 size={18} />
            </button>
            <div>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                aria-label="이전 페이지"
              >
                <ChevronLeft size={21} />
              </button>
              <span>
                {String(page).padStart(2, "0")} <i>/</i>{" "}
                {String(pageCount).padStart(2, "0")}
              </span>
              <button
                onClick={() => setPage(Math.min(pageCount, page + 1))}
                disabled={page === pageCount}
                aria-label="다음 페이지"
              >
                <ChevronRight size={21} />
              </button>
            </div>
            <button aria-label="마이스크랩" onClick={() => setView("mine")}>
              <Folder size={18} />
            </button>
          </footer>
        </>
      ) : (
        <section className="mine-view">
          <div className="mine-heading">
            <div>
              <small>YOUR PERSONAL ARCHIVE</small>
              <h1>마이스크랩</h1>
              <p>관심 기사를 폴더별로 모아보세요.</p>
            </div>
            <button
              className="primary"
              onClick={() => {
                setFolderName("");
                setFolderModal(true);
              }}
            >
              <Plus size={16} /> 새 폴더
            </button>
          </div>
          <div className="mine-layout">
            <aside>
              <b>
                내 폴더 <small>{folders.length}</small>
              </b>
              {folders.length ? (
                folders.map((folder) => (
                  <button
                    key={folder.id}
                    className={folderId === folder.id ? "selected" : ""}
                    onClick={() => setFolderId(folder.id)}
                  >
                    <Folder size={15} />
                    {folder.name}
                    <small>
                      {
                        Object.values(saved).filter((ids) =>
                          ids.includes(folder.id),
                        ).length
                      }
                    </small>
                  </button>
                ))
              ) : (
                <p>아직 폴더가 없습니다.</p>
              )}
              <button
                className="new-folder"
                onClick={() => {
                  setFolderName("");
                  setFolderModal(true);
                }}
              >
                <Plus size={15} /> 새 폴더 만들기
              </button>
            </aside>
            <div className="saved-content">
              <header>
                <div>
                  <small>SAVED ARTICLES</small>
                  <h2>
                    {folders.find((folder) => folder.id === folderId)?.name ??
                      "폴더를 선택하세요"}
                  </h2>
                </div>
                <label>
                  <Search size={15} />
                  <input
                    placeholder="저장 기사 검색"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
              </header>
              {folderId && (
                <section className="folder-insight-panel" aria-label="폴더 AI 흐름 요약">
                  <div className="folder-insight-heading">
                    <div className="folder-insight-title">
                      <Sparkles size={17} />
                      <div>
                        <small>FOLDER INSIGHT</small>
                        <h3>저장한 기사 흐름</h3>
                      </div>
                    </div>
                    {currentFolderInsight && (
                      <time>{dateText(currentFolderInsight.summary_date)} 기준</time>
                    )}
                  </div>
                  {currentFolderInsight ? (
                    <p className="folder-insight-summary">
                      {currentFolderInsight.summary_text}
                    </p>
                  ) : (
                    <p className="folder-insight-empty">
                      이 폴더에 저장한 기사 요약을 바탕으로 반복되는 이슈와 변화를 정리합니다.
                    </p>
                  )}
                  {currentFolderInsight && insightSources.length > 0 && (
                    <div className="insight-sources">
                      <span>분석 근거</span>
                      {insightSources.slice(0, 4).map((article) => (
                        <button
                          key={article.id}
                          onClick={() => setArticleModal(article)}
                        >
                          {article.title}
                        </button>
                      ))}
                      {insightSources.length > 4 && (
                        <small>외 {insightSources.length - 4}건</small>
                      )}
                    </div>
                  )}
                  <div className="folder-insight-actions">
                    <button
                      className="primary"
                      onClick={() => void generateFolderInsight()}
                      disabled={
                        generatingInsight ||
                        !supabase ||
                        folderSavedArticleCount < 2 ||
                        insightGeneratedToday
                      }
                    >
                      {generatingInsight ? (
                        <LoaderCircle className="insight-spinner" size={15} />
                      ) : (
                        <Sparkles size={15} />
                      )}
                      {generatingInsight
                        ? "흐름 정리 중"
                        : insightGeneratedToday
                          ? "오늘 요약 완료"
                          : "이 폴더의 이슈 흐름 정리"}
                    </button>
                    <small>
                      저장 기사 {folderSavedArticleCount}개 · 폴더당 하루 1회
                    </small>
                  </div>
                  <p className="insight-data-note">
                    기사 전문은 보내지 않고 Newscrap 요약만 Gemini에 전송합니다. 무료 API 입력은 Google 제품 개선에 사용될 수 있습니다.
                  </p>
                  {insightMessage && (
                    <p className="insight-status" role="status">
                      {insightMessage}
                    </p>
                  )}
                </section>
              )}
              {folderId && folderArticles.length ? (
                folderArticles.map((article) => (
                  <article className="saved-row" key={article.id}>
                    <Tags tags={article.tags} />
                    <div>
                      <time>
                        {dateText(article.date)} · {article.paper}면
                      </time>
                      <h3>{article.title}</h3>
                      <p>{article.summary.oneLine}</p>
                    </div>
                    <button
                      onClick={() => setArticleModal(article)}
                      aria-label="요약 보기"
                    >
                      <ArrowRight size={17} />
                    </button>
                  </article>
                ))
              ) : (
                <div className="empty-state">
                  <Bookmark size={24} />
                  <strong>
                    {folderId
                      ? "아직 저장한 기사가 없습니다"
                      : "왼쪽에서 폴더를 선택하세요"}
                  </strong>
                  <span>
                    {folderId
                      ? "오늘의 스크랩에서 관심 기사를 저장해보세요."
                      : "폴더별로 저장한 기사를 여기서 다시 볼 수 있습니다."}
                  </span>
                  {folderId && (
                    <button onClick={() => setView("today")}>
                      오늘의 스크랩 보기 <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {articleModal && (
        <div
          className="backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setArticleModal(null);
          }}
        >
          <section className="article-modal" role="dialog" aria-modal="true">
            <button
              className="close"
              onClick={() => setArticleModal(null)}
              aria-label="닫기"
            >
              <X size={18} />
            </button>
            <div className="article-meta">
              <Tags tags={articleModal.tags} />
              <span>{articleModal.paper}면</span>
              <i>/</i>
              <time>{dateText(articleModal.date)}</time>
            </div>
            <h2>{articleModal.title}</h2>
            <p className="byline">{articleModal.reporter}</p>
            {(
              [
                ["핵심", articleModal.summary.core],
                ["배경", articleModal.summary.background],
                ["영향", articleModal.summary.impact],
              ] as const
            ).map(([label, text]) => (
              <div className="summary-row" key={label}>
                <b>{label}</b>
                <p>{text}</p>
              </div>
            ))}
            <div className="takeaway">
              <b>한 줄 요약</b>
              <strong>{articleModal.summary.oneLine}</strong>
            </div>
            <div className="modal-actions">
              <button
                className="primary"
                onClick={() => {
                  setSaveModal(articleModal);
                  setArticleModal(null);
                }}
              >
                <Bookmark size={15} /> 폴더에 저장
              </button>
              <a href={articleModal.url} target="_blank" rel="noreferrer">
                매일경제 원문 <ExternalLink size={14} />
              </a>
            </div>
          </section>
        </div>
      )}

      {saveModal && (
        <div
          className="backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSaveModal(null);
          }}
        >
          <section className="save-modal" role="dialog" aria-modal="true">
            <button
              className="close"
              onClick={() => setSaveModal(null)}
              aria-label="닫기"
            >
              <X size={18} />
            </button>
            <small>KEEP THIS STORY</small>
            <h2>폴더에 저장</h2>
            <p className="save-title">{saveModal.title}</p>
            {folders.length ? (
              <div className="folder-options">
                {folders.map((folder) => (
                  <label key={folder.id}>
                    <input
                      type="checkbox"
                      checked={Boolean(
                        saved[saveModal.id]?.includes(folder.id),
                      )}
                      onChange={() => void toggleSave(saveModal, folder)}
                    />
                    <span>{folder.name}</span>
                    <Folder size={15} />
                  </label>
                ))}
              </div>
            ) : (
              <p className="no-folders">저장할 폴더가 아직 없습니다.</p>
            )}
            <button
              className="new-folder"
              onClick={() => {
                setFolderName("");
                setFolderModal(true);
              }}
            >
              <Plus size={15} /> 새 폴더 만들기
            </button>
            <button
              className="primary save-done"
              onClick={() => setSaveModal(null)}
            >
              완료
            </button>
          </section>
        </div>
      )}

      {folderModal && (
        <div
          className="backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setFolderModal(false);
          }}
        >
          <section
            className="save-modal folder-dialog"
            role="dialog"
            aria-modal="true"
          >
            <button
              className="close"
              onClick={() => setFolderModal(false)}
              aria-label="닫기"
            >
              <X size={18} />
            </button>
            <small>PERSONAL FOLDER</small>
            <h2>새 폴더</h2>
            <label className="folder-label" htmlFor="folder-name">
              폴더 이름
            </label>
            <div className="folder-input">
              <input
                id="folder-name"
                autoFocus
                maxLength={30}
                placeholder="예: AI 산업"
                value={folderName}
                onChange={(event) => setFolderName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void createFolder();
                }}
              />
              <button onClick={() => void createFolder()}>만들기</button>
            </div>
            <span className="help-text">
              최대 30자 · 같은 이름은 사용할 수 없습니다
            </span>
            {message && <p className="message">{message}</p>}
          </section>
        </div>
      )}
    </main>
  );
}
