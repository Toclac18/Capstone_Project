export type DocumentItem = {
  id: string;
  title: string;

  orgName: string;
  domain: string;
  specialization: string;
  uploader: string;

  publicYear: number;

  isPremium: boolean;
  points?: number | null;

  description: string;

  summarizations: {
    short: string;
    medium: string;
    detailed: string;
  };

  viewCount: number;
  upvote_counts: number;
  downvote_counts: number;
  voteScore?: number;

  tags?: {
    id: string;
    code: number;
    name: string;
  }[];

  thumbnail: string;

  organization?: {
    id: string;
    name: string;
    logoUrl: string;
  };
};
