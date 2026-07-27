import type { Editor } from "@tiptap/react";
import { EditorContent } from "@tiptap/react";

type EditorCanvasProps = {
  editor: Editor | null;
};

export function EditorCanvas({ editor }: EditorCanvasProps) {
  return (
    <section
      aria-label="Document editor"
      className="min-h-[60vh] rounded-2xl border border-border bg-card shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)]"
    >
      <EditorContent
        editor={editor}
        className="min-h-[60vh] px-5 py-8 sm:px-10 lg:px-16"
      />
    </section>
  );
}
