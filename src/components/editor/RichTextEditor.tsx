import { Bold, Heading2, Italic, List, ListOrdered, Pilcrow } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";

interface Props {
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
}

const TOOLS = [
  { cmd: "bold", icon: Bold, label: "Bold" },
  { cmd: "italic", icon: Italic, label: "Italic" },
  { cmd: "formatBlock:<h3>", icon: Heading2, label: "Heading" },
  { cmd: "formatBlock:<p>", icon: Pilcrow, label: "Paragraph" },
  { cmd: "insertUnorderedList", icon: List, label: "Bullet list" },
  { cmd: "insertOrderedList", icon: ListOrdered, label: "Numbered list" },
] as const;

export function RichTextEditor({ value, onChange, minHeight = 320 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== value) el.innerHTML = value || "<p></p>";
    // Only sync when the incoming document changes identity (article switch).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref.current === null]);

  const exec = (cmd: string) => {
    ref.current?.focus();
    const [name, arg] = cmd.split(":");
    document.execCommand(name!, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  return (
    <div className="rounded-md border border-border">
      <div className="flex flex-wrap gap-1 border-b border-border bg-muted/40 p-1">
        {TOOLS.map(({ cmd, icon: Icon, label }) => (
          <Button
            key={cmd}
            type="button"
            variant="ghost"
            size="sm"
            title={label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec(cmd)}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        className="jr-prose prose-editor px-4 py-3 focus:outline-none"
        style={{ minHeight: `${minHeight}px`, fontFamily: 'Georgia, "Times New Roman", serif' }}
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        onBlur={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
      />
    </div>
  );
}