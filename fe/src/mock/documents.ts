// src/mock/documents.ts
export type DocumentLite = {
  id: string;
  orgId: string;
  orgName: string;
  title: string;
  points?: string;
  viewCount: number;
  isPremium: boolean;
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

function doc(
  id: string,
  orgId: string,
  orgName: string,
  title: string,
  points: string | undefined,
  specialization: string,
  up: number,
  down: number,
  uploader: string,
  viewCount: number = 0,
  isPremium = false,
): DocumentLite {
  return {
    id,
    orgId,
    orgName,
    title,
    points,
    viewCount,
    isPremium,
    specialization,
    upvote_counts: up,
    downvote_counts: down,
    vote_scores: up - down,
    uploader,
    thumbnail: makeThumb(title, Number(id.replace(/\D/g, "")) || 0),
  };
}

// --- existing type and makeThumb(), doc() stay the same ---

// Example organizations for diversity
const ORGS = [
  { id: "org_001", name: "Capstone Library" },
  { id: "org_002", name: "EduTech Hub" },
  { id: "org_003", name: "Global Academy" },
  { id: "org_004", name: "NextGen Institute" },
  { id: "org_005", name: "Nihongo Center" },
  { id: "org_006", name: "STEM Research Group" },
  { id: "org_007", name: "AI Innovation Lab" },
  { id: "org_008", name: "Open Learning Society" },
  { id: "org_009", name: "International Language Hub" },
  { id: "org_010", name: "Data Science Foundation" },
];

// Helper: random org for variety
function randomOrg(seed: number) {
  const org = ORGS[seed % ORGS.length];
  return { orgId: org.id, orgName: org.name };
}

// Helper to assign points if premium
function assignPoints(isPremium: boolean): string | undefined {
  if (!isPremium) return undefined;
  const value = Math.floor(120 + Math.random() * 380);
  return value.toString();
}

// Create mock docs with varying orgs
export const mockLibraryDocs: DocumentLite[] = [
  doc(
    "doc_001",
    randomOrg(1).orgId,
    randomOrg(1).orgName,
    "Report Sample - Final Project Assignment",
    "Software Requirement",
    "Software",
    86,
    2,
    "Nguyễn Tất Quân",
    1540,
    false,
  ),
  doc(
    "doc_002",
    randomOrg(2).orgId,
    randomOrg(2).orgName,
    "SWE201c – Introduction to Software Engineering",
    "Software Engineering",
    "Software",
    120,
    5,
    "Trần Gia Huy",
    1895,
    true,
  ),
  doc(
    "doc_003",
    randomOrg(3).orgId,
    randomOrg(3).orgName,
    "Dekiru Sơ cấp – Ngữ pháp 06",
    "Japanese Grammar",
    "Japanese",
    77,
    3,
    "Mai Lan",
    642,
    false,
  ),
  doc(
    "doc_004",
    randomOrg(4).orgId,
    randomOrg(4).orgName,
    "Key-SSL101 – New Words List Dekiru Nihongo",
    "Vocabulary",
    "Japanese",
    64,
    1,
    "Đặng Phương",
    910,
    false,
  ),
  doc(
    "doc_005",
    randomOrg(5).orgId,
    randomOrg(5).orgName,
    "Intro to Database Systems - Lecture Notes",
    "Database Systems",
    "Database",
    210,
    8,
    "Hoàng Minh",
    2011,
    false,
  ),
  doc(
    "doc_006",
    randomOrg(6).orgId,
    randomOrg(6).orgName,
    "Python for Data Science Handbook",
    "Data Science",
    "Data",
    350,
    12,
    "Trần Ngọc Bảo",
    3400,
    true,
  ),
  doc(
    "doc_007",
    randomOrg(7).orgId,
    randomOrg(7).orgName,
    "Object-Oriented Programming Examples (C++)",
    "OOP in C++",
    "Software",
    98,
    7,
    "Nguyễn Tuấn Kiệt",
    804,
    false,
  ),
  doc(
    "doc_008",
    randomOrg(8).orgId,
    randomOrg(8).orgName,
    "100 Essential Grammar Quizzes for Beginners",
    "English Grammar",
    "English",
    55,
    0,
    "Phạm Yến Nhi",
    503,
    false,
  ),
  doc(
    "doc_009",
    randomOrg(9).orgId,
    randomOrg(9).orgName,
    "Final Practice Quiz – Software Design Patterns",
    "Software Design",
    "Software",
    140,
    4,
    "Đỗ Văn Bình",
    1602,
    false,
  ),
  doc(
    "doc_010",
    randomOrg(10).orgId,
    randomOrg(10).orgName,
    "N5 Listening Practice – 20 Lessons",
    "Japanese Listening",
    "Japanese",
    75,
    1,
    "Vũ Mai Anh",
    742,
    false,
  ),
  doc(
    "doc_011",
    randomOrg(11).orgId,
    randomOrg(11).orgName,
    "Deep Learning Fundamentals",
    "Artificial Intelligence",
    "AI",
    480,
    10,
    "Nguyễn Minh Châu",
    4205,
    true,
  ),
  doc(
    "doc_012",
    randomOrg(12).orgId,
    randomOrg(12).orgName,
    "Data Visualization with Tableau",
    "Data Visualization",
    "Data",
    220,
    5,
    "Phan Hữu Thắng",
    2030,
    false,
  ),
  doc(
    "doc_013",
    randomOrg(13).orgId,
    randomOrg(13).orgName,
    "Machine Learning – Linear Regression",
    "Machine Learning",
    "AI",
    410,
    15,
    "Lê Hồng Hạnh",
    3988,
    true,
  ),
  doc(
    "doc_014",
    randomOrg(14).orgId,
    randomOrg(14).orgName,
    "Big Data Architecture Overview",
    "Big Data",
    "Data",
    260,
    7,
    "Trần Bảo Long",
    1600,
    false,
  ),
  doc(
    "doc_015",
    randomOrg(15).orgId,
    randomOrg(15).orgName,
    "Neural Networks Explained",
    "Deep Learning",
    "AI",
    520,
    20,
    "Phan Gia Khang",
    5022,
    true,
  ),
  doc(
    "doc_016",
    randomOrg(16).orgId,
    randomOrg(16).orgName,
    "SQL Optimization and Indexing",
    "Database Optimization",
    "Database",
    180,
    6,
    "Nguyễn Trung Kiên",
    1344,
    false,
  ),
  doc(
    "doc_017",
    randomOrg(17).orgId,
    randomOrg(17).orgName,
    "NoSQL Systems Overview",
    "Databases",
    "Database",
    135,
    4,
    "Lê Quang Phúc",
    1012,
    false,
  ),
  doc(
    "doc_018",
    randomOrg(18).orgId,
    randomOrg(18).orgName,
    "Cybersecurity Essentials",
    "Information Security",
    "Security",
    330,
    12,
    "Hoàng Bảo Trâm",
    2108,
    false,
  ),
  doc(
    "doc_019",
    randomOrg(19).orgId,
    randomOrg(19).orgName,
    "Network Topology and Routing Basics",
    "Computer Networking",
    "Networking",
    290,
    8,
    "Lý Hữu Phước",
    1882,
    false,
  ),
  doc(
    "doc_020",
    randomOrg(20).orgId,
    randomOrg(20).orgName,
    "Ethical Hacking for Beginners",
    "Penetration Testing",
    "Security",
    400,
    18,
    "Nguyễn Trọng Vũ",
    2550,
    true,
  ),
  // ... rest unchanged ...
  doc(
    "doc_035",
    randomOrg(35).orgId,
    randomOrg(35).orgName,
    "Introduction to Statistics",
    "Mathematics",
    "Math",
    260,
    3,
    "Phan Thanh Bình",
    1120,
    false,
  ),
];

// Add points for premium docs
mockLibraryDocs.forEach((d, i) => {
  if (d.isPremium) d.points = assignPoints(true);
});

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
