/* eslint-disable @typescript-eslint/no-unused-vars */

export type DocumentLite = {
  id: string;
  title: string;
  subject?: string;
  pageCount?: number;
  owned?: boolean;
  specialization: string;
  upvote_counts: number;
  downvote_counts: number;
  vote_scores: number;
  uploader: string;
  thumbnail: string;
};

function makeThumb(title: string, seed = 0): string {
  const initials =
    title
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "DOC";

  // palette mềm cho sáng/tối
  const palettes = [
    ["#E0E7FF", "#C7D2FE", "#4F46E5"],
    ["#DCFCE7", "#BBF7D0", "#16A34A"],
    ["#FFE4E6", "#FECDD3", "#E11D48"],
    ["#FFF7ED", "#FFEDD5", "#EA580C"],
    ["#E0F2FE", "#BAE6FD", "#0284C7"],
    ["#F5F3FF", "#DDD6FE", "#7C3AED"],
  ];
  const [c1, c2, cText] = palettes[Math.abs(seed) % palettes.length];

  const svg = `
  <svg xmlns='http://www.w3.org/2000/svg' width='400' height='260'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='${c1}'/>
        <stop offset='100%' stop-color='${c2}'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' rx='18' fill='url(#g)'/>
    <g font-family='ui-sans-serif, -apple-system, Segoe UI, Roboto' text-anchor='middle'>
      <text x='200' y='145' font-size='84' font-weight='700' fill='${cText}' opacity='0.9'>${initials}</text>
    </g>
  </svg>`.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Helper tạo doc nhanh */
function doc(
  id: string,
  title: string,
  subject: string,
  pageCount: number,
  specialization: string,
  up: number,
  down: number,
  uploader: string,
  thumbnail?: string,
): DocumentLite {
  return {
    id,
    title,
    subject,
    pageCount,
    specialization,
    upvote_counts: up,
    downvote_counts: down,
    vote_scores: up - down,
    uploader,
    thumbnail: makeThumb(title, Number(id.replace(/\D/g, "")) || 0), // ảnh mock
  };
}

/* ===================== LIBRARY DOCUMENTS ===================== */
export const mockLibraryDocs: DocumentLite[] = [
  doc(
    "doc_001",
    "Report Sample - Final Project Assignment",
    "Software Requirement",
    15,
    "Software",
    86,
    2,
    "Nguyễn Tất Quân",
  ),
  doc(
    "doc_002",
    "SWE201c – Introduction to Software Engineering",
    "Software Engineering",
    18,
    "Software",
    120,
    5,
    "Trần Gia Huy",
  ),
  doc(
    "doc_003",
    "Dekiru Sơ cấp – Ngữ pháp 06",
    "Japanese Grammar",
    6,
    "Japanese",
    77,
    3,
    "Mai Lan",
  ),
  doc(
    "doc_004",
    "Key-SSL101 – New Words List Dekiru Nihongo",
    "Vocabulary",
    195,
    "Japanese",
    64,
    1,
    "Đặng Phương",
  ),
  doc(
    "doc_005",
    "Intro to Database Systems - Lecture Notes",
    "Database Systems",
    32,
    "Database",
    210,
    8,
    "Hoàng Minh",
  ),
  doc(
    "doc_006",
    "Python for Data Science Handbook",
    "Data Science",
    420,
    "Data",
    350,
    12,
    "Trần Ngọc Bảo",
  ),
  doc(
    "doc_007",
    "Object-Oriented Programming Examples (C++)",
    "OOP in C++",
    68,
    "Software",
    98,
    7,
    "Nguyễn Tuấn Kiệt",
  ),
  doc(
    "doc_008",
    "100 Essential Grammar Quizzes for Beginners",
    "English Grammar",
    52,
    "English",
    55,
    0,
    "Phạm Yến Nhi",
  ),
  doc(
    "doc_009",
    "Final Practice Quiz – Software Design Patterns",
    "Software Design",
    20,
    "Software",
    140,
    4,
    "Đỗ Văn Bình",
  ),
  doc(
    "doc_010",
    "N5 Listening Practice – 20 Lessons",
    "Japanese Listening",
    27,
    "Japanese",
    75,
    1,
    "Vũ Mai Anh",
  ),

  // Data & AI
  doc(
    "doc_011",
    "Deep Learning Fundamentals",
    "Artificial Intelligence",
    180,
    "AI",
    480,
    10,
    "Nguyễn Minh Châu",
  ),
  doc(
    "doc_012",
    "Data Visualization with Tableau",
    "Data Visualization",
    95,
    "Data",
    220,
    5,
    "Phan Hữu Thắng",
  ),
  doc(
    "doc_013",
    "Machine Learning – Linear Regression",
    "Machine Learning",
    60,
    "AI",
    410,
    15,
    "Lê Hồng Hạnh",
  ),
  doc(
    "doc_014",
    "Big Data Architecture Overview",
    "Big Data",
    35,
    "Data",
    260,
    7,
    "Trần Bảo Long",
  ),
  doc(
    "doc_015",
    "Neural Networks Explained",
    "Deep Learning",
    85,
    "AI",
    520,
    20,
    "Phan Gia Khang",
  ),

  // Database & Security
  doc(
    "doc_016",
    "SQL Optimization and Indexing",
    "Database Optimization",
    45,
    "Database",
    180,
    6,
    "Nguyễn Trung Kiên",
  ),
  doc(
    "doc_017",
    "NoSQL Systems Overview",
    "Databases",
    70,
    "Database",
    135,
    4,
    "Lê Quang Phúc",
  ),
  doc(
    "doc_018",
    "Cybersecurity Essentials",
    "Information Security",
    150,
    "Security",
    330,
    12,
    "Hoàng Bảo Trâm",
  ),
  doc(
    "doc_019",
    "Network Topology and Routing Basics",
    "Computer Networking",
    105,
    "Networking",
    290,
    8,
    "Lý Hữu Phước",
  ),
  doc(
    "doc_020",
    "Ethical Hacking for Beginners",
    "Penetration Testing",
    78,
    "Security",
    400,
    18,
    "Nguyễn Trọng Vũ",
  ),

  // English & Japanese
  doc(
    "doc_021",
    "IELTS Writing Task 2 – Band 8 Samples",
    "English Writing",
    50,
    "English",
    275,
    6,
    "Phạm Minh Thảo",
  ),
  doc(
    "doc_022",
    "English Idioms & Phrasal Verbs",
    "English Vocabulary",
    42,
    "English",
    210,
    2,
    "Nguyễn Mỹ Duyên",
  ),
  doc(
    "doc_023",
    "N3 Kanji Reading Practice",
    "Japanese Reading",
    35,
    "Japanese",
    80,
    2,
    "Trần Đức An",
  ),
  doc(
    "doc_024",
    "JLPT Vocabulary Flashcards",
    "Japanese Vocabulary",
    60,
    "Japanese",
    95,
    3,
    "Đỗ Hương Trà",
  ),
  doc(
    "doc_025",
    "TOEIC Listening Strategies",
    "English Listening",
    40,
    "English",
    160,
    5,
    "Nguyễn Quỳnh Nhi",
  ),

  // Software & Development
  doc(
    "doc_026",
    "Frontend Essentials with React",
    "Web Development",
    120,
    "Software",
    300,
    9,
    "Đoàn Minh Hải",
  ),
  doc(
    "doc_027",
    "Spring Boot Microservices",
    "Backend Development",
    190,
    "Software",
    270,
    8,
    "Bùi Khánh Linh",
  ),
  doc(
    "doc_028",
    "Clean Code Principles",
    "Software Engineering",
    75,
    "Software",
    500,
    11,
    "Phạm Duy Tân",
  ),
  doc(
    "doc_029",
    "DevOps and CI/CD Pipelines",
    "DevOps",
    100,
    "Software",
    260,
    7,
    "Hoàng Văn Dũng",
  ),
  doc(
    "doc_030",
    "Design Patterns Explained",
    "Software Architecture",
    85,
    "Software",
    310,
    9,
    "Đặng Quốc Việt",
  ),

  // Science, Math, Others
  doc(
    "doc_031",
    "Calculus for Computer Science",
    "Mathematics",
    115,
    "Math",
    190,
    4,
    "Võ Thị Mai",
  ),
  doc(
    "doc_032",
    "Linear Algebra – Vector Spaces",
    "Mathematics",
    135,
    "Math",
    205,
    6,
    "Phạm Văn Quân",
  ),
  doc(
    "doc_033",
    "Physics for Engineering Students",
    "Physics",
    155,
    "Science",
    230,
    9,
    "Lê Tấn Tài",
  ),
  doc(
    "doc_034",
    "Fundamentals of Chemistry",
    "Chemistry",
    120,
    "Science",
    180,
    5,
    "Nguyễn Thị Hương",
  ),
  doc(
    "doc_035",
    "Introduction to Statistics",
    "Mathematics",
    98,
    "Math",
    260,
    3,
    "Phan Thanh Bình",
  ),
];

/* ===================== GROUPS ===================== */
export const mockContinueReading = mockLibraryDocs.slice(0, 4);
export const mockTopUpvoted = [...mockLibraryDocs]
  .sort((a, b) => b.upvote_counts - a.upvote_counts)
  .slice(0, 6);

export const mockSpecializationGroups = (() => {
  const map = new Map<string, DocumentLite[]>();
  mockLibraryDocs.forEach((doc) => {
    if (!map.has(doc.specialization)) map.set(doc.specialization, []);
    map.get(doc.specialization)!.push(doc);
  });
  return Array.from(map.entries()).map(([name, items]) => ({
    name,
    items: items.sort((a, b) => b.vote_scores - a.vote_scores),
  }));
})();
