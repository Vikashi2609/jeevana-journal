import { listJournals, putImage, saveJournal } from "./db";
import type { Journal } from "./types";
import { uid } from "./types";

function placeholder(label: string, hue: number, w = 1200, h = 800): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="hsl(${hue},45%,88%)"/><rect x="16" y="16" width="${w - 32}" height="${h - 32}" fill="none" stroke="hsl(${hue},35%,55%)" stroke-width="4"/><text x="50%" y="50%" font-family="Georgia,serif" font-size="${Math.round(w / 16)}" fill="hsl(${hue},40%,32%)" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

function photo(label: string, hue: number, w = 1200, h = 800) {
  const id = uid("img");
  return { record: { id, name: `${label}.svg`, width: w, height: h }, dataUrl: placeholder(label, hue, w, h) };
}

const LONG = Array.from({ length: 9 }, (_, i) => {
  const n = i + 1;
  return `<p>ACTIVITY ${n}: Students of the middle school section gathered in the assembly hall for the ${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"} session of the Jeevana enrichment programme. The session began with a short prayer followed by an introduction to the theme of the day. Teachers explained the objectives clearly and divided the participants into small working groups so that every child had an opportunity to contribute. Each group prepared charts, models and short presentations describing what they had understood, and the class discussed the findings together. The activity encouraged teamwork, careful observation and confident communication, and the students recorded their observations in their journals for later reference. Parents who attended appreciated the effort taken by the children and the guidance given by the teachers throughout the session.</p>`;
}).join("");

export async function ensureSampleData(): Promise<void> {
  const existing = await listJournals();
  if (existing.length > 0) return;

  const cover = photo("Jeevana Journal", 210, 1240, 1754);
  const p1 = photo("Independence Day 1", 20);
  const p2 = photo("Independence Day 2", 140);
  const p3 = photo("Independence Day 3", 260);
  const p4 = photo("Science Fair 1", 90);
  const p5 = photo("Science Fair 2", 190);
  const p6 = photo("Enrichment", 320);

  const all = [cover, p1, p2, p3, p4, p5, p6];
  await Promise.all(all.map((p) => putImage(p.record.id, p.dataUrl)));

  const journal: Journal = {
    id: uid("jrn"),
    title: "Jeevana Journal",
    subtitle: "The Monthly Record of School Life",
    month: "August",
    year: 2026,
    coverImageId: cover.record.id,
    editorsNote:
      "<p>INTRODUCTION: This edition of the Jeevana Journal records the activities, achievements and learning experiences of our students during the month of August. We thank the teachers, students and parents who contributed reports and photographs.</p><p>The editorial board hopes that this journal serves as a lasting record of a busy and joyful month.</p>",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    articles: [
      {
        id: uid("art"),
        title: "Independence Day Celebration",
        category: "School Event",
        className: "Whole School",
        date: "15 August 2026",
        content:
          "<p>INTRODUCTION: The school celebrated the 80th Independence Day with great enthusiasm in the main quadrangle. The national flag was hoisted by the Principal at 8.00 a.m. in the presence of staff, students and invited guests.</p><p>ACTIVITY 1: The school band led the march past, followed by a patriotic song presented by the choir of classes VI to VIII.</p><p>ACTIVITY 2: Students of the primary section presented a short cultural programme on the theme of unity in diversity.</p><p>LEARNING OUTCOME: Students understood the value of freedom, responsible citizenship and respect for the national flag.</p><p>CONCLUSION: The programme concluded with the distribution of sweets and the national anthem.</p>",
        photos: [p1.record, p2.record, p3.record],
      },
      {
        id: uid("art"),
        title: "Inter-Class Science Exhibition",
        category: "Academics",
        className: "Classes VIII - X",
        date: "22 August 2026",
        content:
          "<p>OBJECTIVE: To encourage scientific thinking and hands-on model making among senior students.</p><ul><li>Twenty-eight working models were exhibited.</li><li>Themes included renewable energy, water conservation and robotics.</li><li>Judging was done by two visiting faculty members.</li></ul><p>ACTIVITY 1: Each team explained its model to the visitors and answered questions on the underlying scientific principle.</p><p>CONCLUSION: The exhibition was appreciated for the clarity of explanation and the originality of the models.</p>",
        photos: [p4.record, p5.record],
      },
      {
        id: uid("art"),
        title: "Jeevana Enrichment Programme - Monthly Report",
        category: "Report",
        className: "Classes VI - VIII",
        date: "August 2026",
        content: `<p>INTRODUCTION: The Jeevana enrichment programme was conducted through nine structured sessions during the month. A detailed record of each session is given below.</p>${LONG}<p>LEARNING OUTCOME: Students demonstrated improved collaboration, presentation skills and written expression across the nine sessions.</p>`,
        photos: [p6.record],
      },
    ],
  };

  await saveJournal(journal);
}