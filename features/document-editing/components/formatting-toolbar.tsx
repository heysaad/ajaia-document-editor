import type { Editor } from "@tiptap/react";
import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Underline,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type FormattingToolbarProps = {
  editor: Editor | null;
};

const controls = [
  {
    key: "bold",
    label: "Bold",
    shortcut: "Ctrl+B",
    icon: Bold,
    isActive: (editor: Editor) => editor.isActive("bold"),
    run: (editor: Editor) => editor.chain().focus().toggleBold().run(),
  },
  {
    key: "italic",
    label: "Italic",
    shortcut: "Ctrl+I",
    icon: Italic,
    isActive: (editor: Editor) => editor.isActive("italic"),
    run: (editor: Editor) => editor.chain().focus().toggleItalic().run(),
  },
  {
    key: "underline",
    label: "Underline",
    shortcut: "Ctrl+U",
    icon: Underline,
    isActive: (editor: Editor) => editor.isActive("underline"),
    run: (editor: Editor) => editor.chain().focus().toggleUnderline().run(),
  },
  {
    key: "heading-1",
    label: "Heading 1",
    shortcut: "Ctrl+Alt+1",
    icon: Heading1,
    isActive: (editor: Editor) => editor.isActive("heading", { level: 1 }),
    run: (editor: Editor) =>
      editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    key: "heading-2",
    label: "Heading 2",
    shortcut: "Ctrl+Alt+2",
    icon: Heading2,
    isActive: (editor: Editor) => editor.isActive("heading", { level: 2 }),
    run: (editor: Editor) =>
      editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    key: "bullet-list",
    label: "Bulleted list",
    shortcut: "Ctrl+Shift+7",
    icon: List,
    isActive: (editor: Editor) => editor.isActive("bulletList"),
    run: (editor: Editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    key: "ordered-list",
    label: "Numbered list",
    shortcut: "Ctrl+Shift+8",
    icon: ListOrdered,
    isActive: (editor: Editor) => editor.isActive("orderedList"),
    run: (editor: Editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    key: "undo",
    label: "Undo",
    shortcut: "Ctrl+Z",
    icon: Undo2,
    isActive: () => false,
    run: (editor: Editor) => editor.chain().focus().undo().run(),
  },
  {
    key: "redo",
    label: "Redo",
    shortcut: "Ctrl+Shift+Z",
    icon: Redo2,
    isActive: () => false,
    run: (editor: Editor) => editor.chain().focus().redo().run(),
  },
];

export function FormattingToolbar({ editor }: FormattingToolbarProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <div
        role="toolbar"
        aria-label="Formatting toolbar"
        className="flex flex-wrap gap-2 rounded-2xl border border-border/70 bg-card/90 p-3"
      >
        {controls.map((control) => {
          const Icon = control.icon;
          const isActive = editor ? control.isActive(editor) : false;

          return (
            <Tooltip key={control.key}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant={isActive ? "secondary" : "ghost"}
                  aria-label={`${control.label} (${control.shortcut})`}
                  aria-pressed={isActive}
                  disabled={!editor}
                  onClick={() => {
                    if (editor) {
                      control.run(editor);
                    }
                  }}
                >
                  <Icon aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {control.label} · {control.shortcut}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
