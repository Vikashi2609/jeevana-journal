import { createFileRoute } from "@tanstack/react-router";
import FlipbookViewer from "@/components/journal/FlipbookViewer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jeevana E-Journal" },
      {
        name: "description",
        content: "Read the latest issue of Jeevana E-Journal.",
      },
      { property: "og:title", content: "Jeevana E-Journal" },
    ],
  }),
  component: FlipbookViewer,
});