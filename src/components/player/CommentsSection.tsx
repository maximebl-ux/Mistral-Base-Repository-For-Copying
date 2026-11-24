"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button, Input } from "@/components/ui/primitives";
import { useStore } from "@/stores/store";
import { timeAgo } from "@/lib/format";

export function CommentsSection({ contentId }: { contentId: string }) {
  const { comments, addComment, deleteComment, user } = useStore();
  const [text, setText] = useState("");

  const list = comments.filter((c) => c.contentId === contentId);

  return (
    <section className="mt-10 max-w-3xl">
      <h2 className="text-lg font-semibold text-ink">Comments ({list.length})</h2>

      {user ? (
        <form
          className="mt-4 flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            addComment(contentId, text);
            setText("");
          }}
        >
          <Avatar profile={user} size={36} />
          <div className="flex-1 space-y-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment…"
              aria-label="Add a comment"
              rows={2}
              className="w-full resize-none rounded-md border border-hairline bg-surface-1 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
            />
            {text.trim() && (
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setText("")}>Cancel</Button>
                <Button type="submit" disabled={!text.trim()}>Comment</Button>
              </div>
            )}
          </div>
        </form>
      ) : (
        <p className="mt-4 rounded-lg bg-surface-1 p-3 text-sm text-ink-dim">
          <Link href="/login" className="text-brand hover:underline">Sign in</Link> to join the conversation.
        </p>
      )}

      <ul className="mt-6 space-y-5">
        {list.map((c) => (
          <li key={c.id} className="flex gap-3">
            <Avatar profile={{ username: c.userName, avatarPalette: c.avatarPalette }} size={36} />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-ink-dim">
                <span className="font-semibold text-ink">{c.userName}</span> · {timeAgo(c.createdAt)}
              </p>
              <p className="mt-0.5 text-sm text-ink">{c.text}</p>
              {user?.id === c.userId && (
                <button onClick={() => deleteComment(c.id)} className="mt-1 text-xs text-ink-faint hover:text-danger">
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
        {list.length === 0 && <li className="text-sm text-ink-faint">No comments yet. Be the first.</li>}
      </ul>
    </section>
  );
}
