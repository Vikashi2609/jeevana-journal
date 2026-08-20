export interface Photo {
  id: string; // key into image store
  name: string;
  width: number;
  height: number;
}

export interface Article {
  id: string;
  title: string;
  category: string;
  className: string;
  date: string;
  content: string; // simple HTML
  photos: Photo[];
}

export interface Journal {
  id: string;
  title: string;
  subtitle?: string;
  month: string;
  year: number;
  coverImageId?: string;
  editorsNote?: string;
  articles: Article[];
  createdAt: number;
  updatedAt: number;
}

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function emptyArticle(): Article {
  return {
    id: uid("art"),
    title: "Untitled Article",
    category: "",
    className: "",
    date: "",
    content: "<p></p>",
    photos: [],
  };
}

/** Rough page estimate used only for editor summaries. */
export function estimateArticlePages(article: Article): number {
  const text = article.content.replace(/<[^>]+>/g, " ");
  const chars = text.trim().length;
  const photoRows = Math.ceil(article.photos.length / 3);
  const units = chars / 2600 + photoRows * 0.28 + 0.25;
  return Math.max(1, Math.ceil(units));
}