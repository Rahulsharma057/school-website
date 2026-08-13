"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

import { Box, Divider, IconButton, Stack, Tooltip } from "@mui/material";

import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import TitleIcon from "@mui/icons-material/Title";

function ToolbarButton({ active, onClick, disabled, title, children }) {
  return (
    <Tooltip title={title}>
      <span>
        <IconButton
          size="small"
          onClick={onClick}
          disabled={disabled}
          sx={{
            color: active ? "#fff" : "#3f3f46",
            bgcolor: active ? "#18181b" : "transparent",
            "&:hover": { bgcolor: active ? "#27272a" : "#f4f4f5" },
            borderRadius: 1,
          }}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}

/**
 * Drop-in replacement for a plain multiline TextField wherever the
 * content is meant to support real formatting (bold, links, lists) —
 * used for section "Content" and the page's "Legacy Content" field.
 *
 * `value`/`onChange` work like a controlled TextField: `value` is an
 * HTML string, `onChange(html)` fires on every edit. Existing plain-text
 * content (no HTML tags) loads and displays fine — Tiptap treats it as
 * a single paragraph.
 */
export default function RichTextEditor({ value, onChange, placeholder = "Write something…", minHeight = 160 }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        style: `min-height: ${minHeight}px; outline: none; padding: 12px 14px; font-size: 14.5px; line-height: 1.7;`,
      },
    },
    immediatelyRender: false,
  });

  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Link URL", previousUrl || "https://");
    if (url === null) return; // cancelled
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <Box sx={{ border: "1px solid #d4d4d8", borderRadius: 1.5, overflow: "hidden", bgcolor: "#fff" }}>
      <Stack direction="row" alignItems="center" spacing={0.25} sx={{ p: 0.75, bgcolor: "#fafafa", borderBottom: "1px solid #e4e4e7", flexWrap: "wrap" }}>
        <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <FormatBoldIcon fontSize="small" />
        </ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <FormatItalicIcon fontSize="small" />
        </ToolbarButton>
        <ToolbarButton title="Heading" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <TitleIcon fontSize="small" />
        </ToolbarButton>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.75 }} />

        <ToolbarButton title="Bullet List" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <FormatListBulletedIcon fontSize="small" />
        </ToolbarButton>
        <ToolbarButton title="Numbered List" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <FormatListNumberedIcon fontSize="small" />
        </ToolbarButton>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.75 }} />

        <ToolbarButton title="Add Link" active={editor.isActive("link")} onClick={setLink}>
          <LinkIcon fontSize="small" />
        </ToolbarButton>
        <ToolbarButton title="Remove Link" onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive("link")}>
          <LinkOffIcon fontSize="small" />
        </ToolbarButton>

        <Box sx={{ flex: 1 }} />

        <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <UndoIcon fontSize="small" />
        </ToolbarButton>
        <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <RedoIcon fontSize="small" />
        </ToolbarButton>
      </Stack>

      <Box
        sx={{
          "& .ProseMirror p": { my: 0.75 },
          "& .ProseMirror h3": { fontSize: 18, fontWeight: 700, mt: 1.5, mb: 0.5 },
          "& .ProseMirror ul, & .ProseMirror ol": { pl: 3, my: 0.75 },
          "& .ProseMirror a": { color: "#18181b", fontWeight: 600, textDecoration: "underline" },
          "& .ProseMirror p.is-editor-empty:first-of-type::before": {
            content: `"${placeholder}"`,
            color: "#a1a1aa",
            float: "left",
            height: 0,
            pointerEvents: "none",
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
}
