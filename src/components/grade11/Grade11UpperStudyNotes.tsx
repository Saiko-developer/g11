import { UPPER_STUDY_NOTES, UPPER_EMBEDDED_GROUPS } from "@/lib/grade11UpperStudy";

export function Grade11UpperStudyNotes({ groupId }: { groupId: string }) {
  const note = UPPER_STUDY_NOTES[groupId];
  if (!note || UPPER_EMBEDDED_GROUPS.has(groupId)) return null;
  return (
    <aside
      aria-label={note.title}
      className="my-4 rounded-xl border border-primary/20 bg-primary/5 p-4"
    >
      <h4 className="font-semibold text-primary">{note.title}</h4>
      <p className="mt-1 text-xs text-muted-foreground">
        Textbook {(note.pages?.length ?? 1) > 1 ? "pages" : "page"}{" "}
        {(note.pages ?? [note.page]).map((page) => page - 5).join(", ")}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {note.rows.map((row) => (
          <div key={row.en} className="min-w-0 rounded-lg border border-border bg-card p-3">
            <p lang="en" className="whitespace-pre-line text-sm font-medium leading-relaxed">
              {row.en}
            </p>
            <p
              lang="my"
              className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground"
            >
              {row.my}
            </p>
          </div>
        ))}
      </div>
    </aside>
  );
}
