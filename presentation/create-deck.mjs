import path from "node:path";
import { fileURLToPath } from "node:url";
import pptxgen from "pptxgenjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Newscrap";
pptx.subject = "Newscrap을 만들며 겪은 아이디어 구체화와 바이브코딩 경험";
pptx.title = "신문 숙제 밀리다가, 서비스까지 만들게 됐습니다";
pptx.company = "Newscrap";
pptx.lang = "ko-KR";
pptx.theme = {
  headFontFace: "Malgun Gothic",
  bodyFontFace: "Malgun Gothic",
  lang: "ko-KR",
};
pptx.defineLayout({ name: "NEWSCRAP_WIDE", width: 13.333, height: 7.5 });
pptx.layout = "NEWSCRAP_WIDE";
pptx.margin = 0;

const W = 13.333;
const H = 7.5;
const FONT = "Malgun Gothic";
const C = {
  ink: "202522",
  forest: "293A34",
  green: "3F735A",
  greenLight: "E8EEE9",
  paper: "F5F5F1",
  white: "FFFFFF",
  gray: "777E78",
  line: "D9DDD7",
  light: "ECEEEA",
  coral: "D49373",
  coralLight: "F3E7DF",
};

function addText(slide, text, x, y, w, h, size, color = C.ink, options = {}) {
  slide.addText(text, {
    x,
    y,
    w,
    h,
    fontFace: FONT,
    fontSize: size,
    color,
    margin: 0,
    breakLine: false,
    valign: "mid",
    fit: "shrink",
    paraSpaceAfterPt: 0,
    ...options,
  });
}

function rect(slide, x, y, w, h, fill, options = {}) {
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w,
    h,
    line: { color: options.line ?? fill, transparency: options.line ? 0 : 100 },
    fill: { color: fill, transparency: options.transparency ?? 0 },
    radius: options.radius,
  });
}

function line(slide, x, y, w, h, color = C.line, width = 1) {
  slide.addShape(pptx.ShapeType.line, {
    x,
    y,
    w,
    h,
    line: { color, width },
  });
}

function circle(slide, x, y, d, fill, lineColor = fill) {
  slide.addShape(pptx.ShapeType.ellipse, {
    x,
    y,
    w: d,
    h: d,
    line: { color: lineColor, transparency: lineColor === fill ? 100 : 0 },
    fill: { color: fill },
  });
}

function addBase(slide, index, label, title, subtitle) {
  slide.background = { color: C.paper };
  addText(slide, "NEWSCRAP  /  BUILD NOTES", 0.72, 0.35, 4.2, 0.22, 9, C.green, {
    bold: true,
  });
  addText(slide, label.toUpperCase(), 9.1, 0.35, 3.5, 0.22, 9, C.gray, {
    align: "right",
  });
  line(slide, 0.72, 0.73, 11.9, 0, C.line, 0.8);
  addText(slide, title, 0.78, 0.98, 11.8, 0.66, 28, C.ink, { bold: true });
  addText(slide, subtitle, 0.8, 1.72, 11.6, 0.42, 13, C.gray);
  line(slide, 0.72, 7.04, 11.9, 0, C.line, 0.8);
  addText(slide, "오늘의 신문, 더 넓은 시선으로", 0.74, 7.15, 6.2, 0.18, 8, C.gray);
  addText(slide, `${String(index).padStart(2, "0")}  /  07`, 11.0, 7.12, 1.6, 0.22, 9, C.green, {
    align: "right",
    bold: true,
  });
}

function label(slide, text, x, y, color = C.green) {
  addText(slide, text, x, y, 2.9, 0.22, 9, color, { bold: true });
}

// 1. Why the idea started: a daily economics-newspaper assignment.
{
  const slide = pptx.addSlide();
  slide.background = { color: C.forest };
  addText(slide, "NEWSCRAP  /  STUDY SHARE", 0.78, 0.48, 4.7, 0.24, 10, "D7E0D8", {
    bold: true,
  });
  line(slide, 0.78, 0.88, 11.78, 0, "829188", 0.8);
  addText(slide, "신문 숙제 밀리다가,\n서비스까지 만들게 됐습니다", 0.82, 1.45, 7.35, 2.05, 31, C.white, {
    bold: true,
    breakLine: false,
    valign: "mid",
    lineSpacingMultiple: 1.05,
  });
  rect(slide, 0.84, 3.86, 0.72, 0.08, C.coral);
  addText(slide, "교수님의 경제신문 과제에서 시작한 바이브코딩 기록", 0.84, 4.22, 7.3, 0.45, 15, "E0E5DF");

  // Editable newspaper stack illustration.
  rect(slide, 9.15, 1.55, 2.45, 3.65, "D9DED8", { line: "B6C0B8" });
  rect(slide, 8.83, 1.28, 2.45, 3.65, "F5F5F1", { line: "D9DDD7" });
  addText(slide, "TODAY'S PAPER", 9.08, 1.58, 1.92, 0.25, 9, C.gray, { bold: true });
  line(slide, 9.08, 1.95, 1.92, 0, C.line, 0.8);
  addText(slide, "뉴스를\n한눈에", 9.08, 2.2, 1.9, 0.9, 23, C.ink, { bold: true });
  const letters = ["P", "E", "S", "T", "I"];
  const fills = ["C9745E", "4A8769", "D49373", "5F7CA4", "52769B"];
  letters.forEach((letter, index) => {
    rect(slide, 9.08 + index * 0.39, 3.48, 0.29, 0.33, fills[index]);
    addText(slide, letter, 9.08 + index * 0.39, 3.53, 0.29, 0.17, 10, C.white, {
      bold: true,
      align: "center",
    });
  });
  line(slide, 9.08, 4.08, 1.9, 0, C.line, 0.7);
  line(slide, 9.08, 4.28, 1.56, 0, C.line, 0.7);
  line(slide, 9.08, 4.48, 1.77, 0, C.line, 0.7);
  addText(slide, "01 — 07", 0.84, 6.68, 1.4, 0.24, 10, "D7E0D8", { bold: true });
  addText(slide, "경험 공유  ·  약 5–7분", 8.8, 6.68, 3.75, 0.24, 10, "D7E0D8", {
    align: "right",
  });
}

// 2. The assignment and the personal bottleneck.
{
  const slide = pptx.addSlide();
  addBase(slide, 2, "01 / 아이디어 계기", "과제는 매일, 신문은 두껍고", "경제신문을 끝까지 읽고 PESTI로 분류한 뒤 내 인사이트까지 정리해야 했다.");
  rect(slide, 0.82, 2.42, 5.3, 2.55, C.white, { line: C.line });
  label(slide, "교수님의 과제", 1.12, 2.75);
  addText(slide, "매일 경제신문을\n처음부터 끝까지 읽기", 1.12, 3.12, 4.55, 0.9, 22, C.ink, { bold: true });
  addText(slide, "기사별 PESTI 분류 + 나만의 인사이트", 1.12, 4.27, 4.5, 0.32, 12, C.gray);
  rect(slide, 7.18, 2.42, 5.3, 2.55, C.coralLight, { line: "E7D4C7" });
  label(slide, "나의 현실", 7.48, 2.75, "A96D52");
  addText(slide, "시간이 없어\n신문 읽기가 계속 밀림", 7.48, 3.12, 4.55, 0.9, 22, C.ink, { bold: true });
  addText(slide, "밀린 신문을 몰아 읽고 AI로 일일이 분류", 7.48, 4.27, 4.5, 0.32, 12, C.gray);
  circle(slide, 6.34, 3.35, 0.55, C.green);
  addText(slide, ">", 6.34, 3.43, 0.55, 0.24, 19, C.white, { align: "center", bold: true });
  rect(slide, 0.82, 5.52, 11.66, 0.82, C.greenLight);
  addText(slide, "두껍고 큰 신문을 한눈에 봐서 내 시간을 아낄 순 없을까?", 1.12, 5.77, 10.95, 0.28, 17, C.forest, { bold: true });
  addText(slide, "매일 하라는 숙제였는데, 제 신문 읽기는 어느새 몰아보기 콘텐츠가 됐다.", 1.12, 6.48, 10.9, 0.25, 10, C.gray);
}

// 3. Turning the question into product direction and specs.
{
  const slide = pptx.addSlide();
  addBase(slide, 3, "02 / 아이디어 구체화", "Manifest에서 아이디어를 제품 기획으로", "PRD와 기능명세서를 쓰며 ‘뉴스를 요약한다’에서 ‘관심 이슈를 쌓고 추적한다’로 확장했다.");
  const steps = [
    { x: 0.82, n: "01", title: "PRD", body: "누구의 어떤\n불편을 풀까?", fill: C.white },
    { x: 4.78, n: "02", title: "기능명세서", body: "사용자가 어떤\n순서로 쓸까?", fill: C.white },
    { x: 8.74, n: "03", title: "프로토타입 방향", body: "먼저 무엇을\n작동시킬까?", fill: C.greenLight },
  ];
  steps.forEach((step, index) => {
    rect(slide, step.x, 2.55, 3.42, 2.15, step.fill, { line: index === 2 ? "C9D7CB" : C.line });
    addText(slide, step.n, step.x + 0.22, 2.78, 0.62, 0.25, 10, C.coral, { bold: true });
    addText(slide, step.title, step.x + 0.22, 3.2, 2.95, 0.42, 19, C.ink, { bold: true });
    addText(slide, step.body, step.x + 0.22, 3.83, 2.92, 0.55, 13, C.gray, { breakLine: false });
    if (index < 2) addText(slide, ">", step.x + 3.55, 3.35, 0.35, 0.32, 18, C.green, { bold: true, align: "center" });
  });
  addText(slide, "아이디어가 자란 기능들", 0.86, 5.2, 3.2, 0.28, 11, C.gray, { bold: true });
  const chips = ["PESTI 태그", "관심 폴더", "폴더별 이슈 추적", "스크랩북 디자인"];
  chips.forEach((chip, index) => {
    const x = 0.86 + index * 2.96;
    rect(slide, x, 5.68, 2.62, 0.52, index === 2 ? C.coralLight : C.white, { line: index === 2 ? "E7D4C7" : C.line });
    addText(slide, chip, x + 0.12, 5.83, 2.38, 0.2, 10, C.ink, { bold: index === 2, align: "center" });
  });
  addText(slide, "문서가 생기니 만들 대상도 조금씩 선명해졌다.", 0.86, 6.48, 11.4, 0.24, 11, C.green, { bold: true });
}

// 4. The one-click expectation meets source and rights constraints.
{
  const slide = pptx.addSlide();
  addBase(slide, 4, "03–04 / 바이브코딩과 현실", "PRD 넣고 딸깍하면 끝? 그런데…", "Codex에 기획과 기능명세를 넣으면 바로 완성될 줄 알았다.");
  rect(slide, 0.84, 2.42, 4.82, 2.7, C.white, { line: C.line });
  label(slide, "처음 기대", 1.14, 2.75);
  addText(slide, "PRD + 기능명세서", 1.14, 3.25, 3.95, 0.38, 18, C.ink, { bold: true });
  addText(slide, "+", 2.7, 3.83, 0.45, 0.32, 20, C.green, { bold: true, align: "center" });
  addText(slide, "Codex", 1.14, 4.28, 3.95, 0.44, 24, C.forest, { bold: true });
  addText(slide, "= 완성?", 3.1, 4.32, 1.3, 0.34, 15, C.gray);
  rect(slide, 7.65, 2.42, 4.82, 2.7, C.coralLight, { line: "E7D4C7" });
  label(slide, "가장 큰 고비", 7.95, 2.75, "A96D52");
  addText(slide, "기사 원문과\n사진을 그대로 쓰기 어려움", 7.95, 3.25, 4.05, 0.98, 20, C.ink, { bold: true });
  addText(slide, "저작권과 이용 조건을 확인해야 했다.", 7.95, 4.54, 4.05, 0.28, 11, C.gray);
  circle(slide, 6.22, 3.45, 0.72, C.coral);
  addText(slide, "!", 6.22, 3.56, 0.72, 0.34, 22, C.white, { bold: true, align: "center" });
  addText(slide, "딸깍은 짧았고, 확인할 조건은 길었다.", 0.9, 5.7, 11.4, 0.42, 19, C.forest, { bold: true, align: "center" });
  addText(slide, "여기서부터는 원문을 복제하지 않는 방향으로 제품을 다시 설계했다.", 1.0, 6.28, 11.1, 0.26, 11, C.gray, { align: "center" });
}

// 5. Redesigning the content layer around links.
{
  const slide = pptx.addSlide();
  addBase(slide, 5, "04 / 데이터 범위 재설계", "원문을 담는 대신, 원문으로 연결하기", "기사 전문·사진 활용에 제약이 있어 프로토타입의 데이터 범위를 줄였다.");
  const columns = [
    { x: 0.86, label: "보관하지 않기", title: "기사 전문", body: "Newscrap 안에\n복제하지 않음", color: C.coralLight, accent: "A96D52" },
    { x: 4.9, label: "연결하기", title: "원문 URL", body: "더 자세한 내용은\n매일경제 원문에서", color: C.greenLight, accent: C.green },
    { x: 8.94, label: "프로토타입", title: "날짜별 샘플", body: "2026.09.21–23\nA1–A20에서 하루 10건", color: C.white, accent: C.forest },
  ];
  columns.forEach((item, index) => {
    rect(slide, item.x, 2.55, 3.52, 2.5, item.color, { line: index === 2 ? C.line : "D8DED7" });
    addText(slide, item.label, item.x + 0.22, 2.85, 2.95, 0.25, 9, item.accent, { bold: true });
    addText(slide, item.title, item.x + 0.22, 3.3, 2.98, 0.4, 20, C.ink, { bold: true });
    addText(slide, item.body, item.x + 0.22, 3.93, 3.0, 0.62, 12, C.gray);
  });
  addText(slide, "사진과 요약도 이용 가능 범위를 고려해 다루기", 0.9, 5.55, 11.3, 0.38, 16, C.ink, { bold: true, align: "center" });
  addText(slide, "‘더 많이 가져오기’보다 ‘허용된 범위 안에서 잘 연결하기’로", 0.9, 6.15, 11.3, 0.28, 11, C.green, { align: "center" });
}

// 6. Supabase and Gemini make the prototype personal and trackable.
{
  const slide = pptx.addSlide();
  addBase(slide, 6, "05–06 / 연결에 성공하다", "스터디에서 배운 Supabase, Gemini까지", "사용자별 저장 공간과 관심 폴더의 흐름 요약을 실제로 연결했다.");
  const flow = [
    { x: 0.86, n: "01", title: "회원가입·로그인", sub: "Supabase Auth" },
    { x: 4.88, n: "02", title: "폴더에 기사 저장", sub: "사용자별 스크랩" },
    { x: 8.9, n: "03", title: "이슈 흐름 요약", sub: "Gemini API" },
  ];
  flow.forEach((step, index) => {
    rect(slide, step.x, 2.48, 3.42, 1.52, index === 2 ? C.greenLight : C.white, { line: C.line });
    addText(slide, step.n, step.x + 0.2, 2.7, 0.42, 0.22, 9, C.coral, { bold: true });
    addText(slide, step.title, step.x + 0.2, 3.05, 3.0, 0.32, 16, C.ink, { bold: true });
    addText(slide, step.sub, step.x + 0.2, 3.55, 2.9, 0.2, 10, C.gray);
    if (index < 2) addText(slide, ">", step.x + 3.57, 3.02, 0.35, 0.3, 19, C.green, { bold: true, align: "center" });
  });
  rect(slide, 0.86, 4.56, 11.46, 1.15, C.forest);
  addText(slide, "폴더별 흐름 요약", 1.15, 4.82, 2.55, 0.32, 16, C.white, { bold: true });
  addText(slide, "대화형 챗봇 대신, 폴더 상단에서 읽기만 하는 요약으로", 3.78, 4.84, 5.95, 0.28, 12, "E2E8E2");
  rect(slide, 10.05, 4.82, 1.9, 0.48, C.coral);
  addText(slide, "하루 1회", 10.05, 4.94, 1.9, 0.19, 11, C.white, { bold: true, align: "center" });
  addText(slide, "무료 사용량을 고려해 호출은 폴더당 하루 한 번으로 제한", 0.9, 6.12, 11.2, 0.28, 11, C.gray, { align: "center" });
}

// 7. Future collaboration and the user's own product aspiration.
{
  const slide = pptx.addSlide();
  slide.background = { color: C.forest };
  addText(slide, "NEWSCRAP  /  NEXT CHAPTER", 0.78, 0.48, 5.0, 0.24, 10, "D7E0D8", { bold: true });
  line(slide, 0.78, 0.88, 11.78, 0, "829188", 0.8);
  addText(slide, "신문사와 진짜 협업하게 된다면", 0.84, 1.28, 11.5, 0.52, 25, C.white, { bold: true });
  addText(slide, "더 다양한 신문을 다루고,\n허가된 범위에서 원문과 원래 이미지도 활용하고", 0.88, 2.16, 7.55, 1.38, 21, "E7ECE6", { bold: true });
  rect(slide, 0.88, 4.05, 0.7, 0.08, C.coral);
  addText(slide, "그런 서비스라면, 나부터 구독하고 싶다.", 0.88, 4.48, 9.7, 0.58, 21, C.white, { bold: true });
  addText(slide, "숙제를 덜 미루고 싶다는 마음에서 시작한 Newscrap의 다음 장면.", 0.9, 5.35, 9.8, 0.32, 12, "D7E0D8");
  // Editable masthead and collaboration motif.
  rect(slide, 9.6, 2.55, 2.12, 2.3, C.paper);
  addText(slide, "Newscrap", 9.78, 2.88, 1.75, 0.4, 20, C.forest, { bold: true, align: "center" });
  line(slide, 9.88, 3.48, 1.54, 0, C.line, 0.8);
  addText(slide, "매경  +  더 많은\n신문사", 9.8, 3.7, 1.75, 0.65, 13, C.ink, { bold: true, align: "center" });
  addText(slide, "07 — 07", 0.84, 6.68, 1.4, 0.24, 10, "D7E0D8", { bold: true });
  addText(slide, "고맙습니다", 10.0, 6.64, 2.55, 0.3, 12, C.white, { align: "right", bold: true });
}

const outputPath = path.resolve(here, "..", "Newscrap 개발 경험 공유.pptx");
await pptx.writeFile({ fileName: outputPath });
console.log(`Created editable deck: ${outputPath}`);