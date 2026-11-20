import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { AudioCatalogRow, AudioVersion } from "@/lib/permanent-audio/types";
type Clip = AudioCatalogRow & {
  script: string;
  source: string;
  pilot: boolean;
  legacyReady: boolean;
  versions: AudioVersion[];
  jobs: { version_id: string; state: string }[];
};
type Data = {
  clips: Clip[];
  requiredInRepository: number;
  stats: Record<string, number | string | null>;
  control: { blocked_until: string | null };
  archiveParts: Record<string, number>;
  unitArchiveParts: Record<string, number>;
};
function state(c: Clip) {
  if (["queued", "generating", "pending", "failed"].includes(c.versions[0]?.status))
    return c.versions[0].status;
  if (c.approved_version) return "approved";
  return c.versions[0]?.status ?? "missing";
}
async function requestJson(path: string, init?: RequestInit) {
  const response = await fetch(path, init);
  const data = await response.json();
  if (!response.ok) throw Error(data.error ?? "Audio operation failed");
  return data;
}
export function AudioManager() {
  const [data, setData] = useState<Data | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [grade, setGrade] = useState("11"),
    [unit, setUnit] = useState("1"),
    [lesson, setLesson] = useState("g11-u1-grammar-walkthrough"),
    [section, setSection] = useState("grammar"),
    [status, setStatus] = useState("pending"),
    [selected, setSelected] = useState<string[]>([]),
    [preview, setPreview] = useState(""),
    [previewVersion, setPreviewVersion] = useState(""),
    [message, setMessage] = useState(""),
    [page, setPage] = useState(0),
    [review, setReview] = useState<string[]>([]),
    [editing, setEditing] = useState<string | null>(null),
    [script, setScript] = useState("");
  const post = (action: string, ids: string[], script?: string) =>
    requestJson("/api/audio-manager", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ids, script, confirmed: true }),
    });
  const refresh = async () => {
    try {
      setData(await requestJson("/api/audio-manager"));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  };
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 15000);
    return () => clearInterval(timer);
  }, []);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  const filtered = useMemo(
    () =>
      data?.clips.filter(
        (c) =>
          (!grade || c.grade === Number(grade)) &&
          (!unit || c.unit === Number(unit)) &&
          (!lesson || c.lesson_id === lesson) &&
          (!section ||
            (section === "classroom" ? c.source === "classroom" : c.section === section)),
      ) ?? [],
    [data, grade, unit, lesson, section],
  );
  const visible = filtered.filter((c) => !status || state(c) === status);
  const pageIndex = Math.min(page, Math.max(0, Math.ceil(visible.length / 10) - 1));
  const reviewIds = filtered.flatMap((c) =>
    c.versions[0]?.status === "pending" ? [c.versions[0].id] : [],
  );
  const selectedReview = reviewIds.filter((id) => review.includes(id));
  const queue = filtered
    .filter((c) => c.pilot && c.jobs.some((j) => j.state === "queued"))
    .map((c) => c.id);
  const processQueue = async () => {
    if (
      !window.confirm(
        "Process the selected lesson queue? Missing WAV files may require TTS credits.",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      for (let i = 0; i < queue.length; i++) {
        let result = await post("process-selection", queue);
        if (result.state === "idle" && result.retryInMs) {
          setMessage("Waiting for the next provider slot…");
          await new Promise((resolve) => setTimeout(resolve, result.retryInMs));
          result = await post("process-selection", queue);
        }
        await refresh();
        if (result.state !== "pending") {
          setMessage(
            result.message ?? "Queue paused. Check pacing or an active worker before resuming.",
          );
          return;
        }
        setMessage(`Processed ${i + 1} of ${queue.length} queued clips`);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const editAction = async (action: "save-script" | "queue-script", id: string) => {
    if (
      action === "queue-script" &&
      !window.confirm("Queue revised narration? This may use TTS credits.")
    )
      return;
    setBusy(true);
    setError("");
    try {
      await post(action, [id], script);
      await refresh();
      if (action === "queue-script") setEditing(null);
      setMessage(action === "save-script" ? "Draft saved" : "Revised narration queued");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const playable = visible.flatMap((clip) => {
    const version = clip.versions.find((v) => v.storage_path);
    return version ? [version.id] : [];
  });
  const previewIndex = playable.indexOf(previewVersion);
  const stats = useMemo(
    () => ({
      total: filtered.length,
      generated: filtered.filter((c) => c.versions.some((v) => v.storage_path)).length,
      approved: filtered.filter((c) => c.approved_version).length,
      missing: filtered.filter((c) => !c.versions.length).length,
      failed: filtered.filter((c) => c.versions[0]?.status === "failed").length,
      queued: filtered.filter((c) => c.versions[0]?.status === "queued").length,
      generating: filtered.filter((c) => c.versions[0]?.status === "generating").length,
      pending: filtered.filter((c) => c.versions[0]?.status === "pending").length,
    }),
    [filtered],
  );
  const run = async (
    action: string,
    ids: string[] = [],
    confirmation = "Confirm this audio management action?",
  ) => {
    if (!window.confirm(confirmation)) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await requestJson("/api/audio-manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids, confirmed: true }),
      });
      setMessage(
        result.message ?? `Audio action: ${result.state ?? result.action ?? "catalog registered"}`,
      );
      await refresh();
      setSelected([]);
      setReview([]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const file = async (path: string, previewOnly = false) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(path);
      if (!response.ok) {
        const body = await response.json();
        throw Error(body.error ?? "Download failed");
      }
      const blob = await response.blob(),
        url = URL.createObjectURL(blob);
      if (previewOnly) {
        setPreview(url);
        setPreviewVersion(new URL(path, window.location.origin).searchParams.get("version") ?? "");
        return;
      }
      const name =
        response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ??
        "lesson-audio.mp3";
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.rel = "noopener";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const select = (id: string) =>
    setSelected((items) =>
      items.includes(id)
        ? items.filter((x) => x !== id)
        : items.length < 5
          ? [...items, id]
          : items,
    );
  const filter = (
    label: string,
    value: string,
    set: (v: string) => void,
    options: { value: string; label: string }[],
  ) => (
    <label className="space-y-1 text-sm">
      <span className="block font-medium">{label}</span>
      <select
        className="w-full rounded-lg border bg-background p-2"
        value={value}
        onChange={(e) => {
          set(e.target.value);
          setSelected([]);
          setPage(0);
        }}
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
  const approved = filtered.filter((c) => c.approved_version).length;
  return (
    <section className="space-y-5" aria-label="Audio Manager">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Permanent MP3 Audio Library</h2>
          <p className="text-sm text-muted-foreground">
            Pilot: Grade 11 · Unit 1 · Grammar. Existing scripts, Puck voice and WAV caches are
            preserved.
          </p>
        </div>
        <Button variant="outline" disabled={busy} onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
        >
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="rounded-xl bg-primary/5 p-3 text-sm">
          {message}
        </p>
      )}
      {busy && (
        <div role="status" className="flex items-center gap-3 text-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Processing audio action…
        </div>
      )}
      {data && (
        <p className="text-xs text-muted-foreground">
          Registered current clips: {data.clips.length} / {data.requiredInRepository} fixed-script
          clips in the repository. Register the catalog before generating.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {filter(
          "Grade",
          grade,
          (value) => {
            setGrade(value);
            setLesson("");
          },
          [10, 11].map((n) => ({ value: String(n), label: `Grade ${n}` })),
        )}
        {filter(
          "Unit",
          unit,
          (value) => {
            setUnit(value);
            setLesson("");
          },
          Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Unit ${i + 1}` })),
        )}
        {filter(
          "Lesson",
          lesson,
          setLesson,
          [
            ...new Set(
              data?.clips
                .filter((c) => !grade || c.grade === Number(grade))
                .map((c) => c.lesson_id),
            ),
          ].map((id) => ({ value: id, label: id })),
        )}
        {filter(
          "Section",
          section,
          setSection,
          ["reading", "grammar", "vocabulary", "writing", "classroom"].map((s) => ({
            value: s,
            label: s,
          })),
        )}
        {filter(
          "Status",
          status,
          setStatus,
          ["missing", "queued", "generating", "pending", "approved", "rejected", "failed"].map(
            (s) => ({ value: s, label: s === "pending" ? "Pending review" : s }),
          ),
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {Object.entries(stats).map(([label, value]) => (
          <div key={label} className="rounded-xl border bg-card p-3">
            <p className="text-xs capitalize text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <p className="text-sm">
          Approved {approved} / {filtered.length} registered clips
        </p>
        <progress
          className="h-2 w-full accent-teal-700"
          max={Math.max(1, filtered.length)}
          value={approved}
        />
      </div>
      <div className="sticky top-0 z-10 flex flex-wrap gap-2 border-b bg-background py-3">
        <Button disabled={busy || !queue.length} onClick={() => void processQueue()}>
          Process Unit Queue ({queue.length})
        </Button>
        <Button
          disabled={busy || !selectedReview.length}
          onClick={() =>
            void run("approve", selectedReview, "Approve the selected reviewed MP3 files?")
          }
        >
          Approve selected ({selectedReview.length})
        </Button>
        {unit && grade && (data?.unitArchiveParts[`${grade}-${unit}`] ?? 0) > 0 && (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              void file(`/api/audio-manager?format=zip&grade=${grade}&unit=${unit}&part=0`)
            }
          >
            Download Unit ZIP
            {(data?.unitArchiveParts[`${grade}-${unit}`] ?? 0) > 1 ? " · part 1" : ""}
          </Button>
        )}
        <Button
          variant="outline"
          disabled={busy}
          onClick={() =>
            void run(
              "register",
              [],
              "Register the current fixed-script catalog in the database? This does not generate audio or change scripts.",
            )
          }
        >
          Register / update catalog
        </Button>
        <Button
          disabled={busy || !filtered.some((c) => c.pilot && !c.versions.length)}
          onClick={() =>
            void run(
              "enqueue",
              filtered.filter((c) => c.pilot && !c.versions.length).map((c) => c.id),
              "Queue all missing pilot clips in the current scope? Confirm you reviewed these fixed scripts. Existing WAV is reused first; missing audio may use provider credits.",
            )
          }
        >
          Prepare missing audio
        </Button>
        <Button
          disabled={busy || !selected.length}
          onClick={() =>
            void run(
              "enqueue",
              selected,
              "Queue selected pilot clips? Confirm their fixed scripts are approved for narration. Provider credits may be used only when cached audio is missing.",
            )
          }
        >
          Generate selected ({selected.length}/5)
        </Button>
        <Button
          variant="outline"
          disabled={busy || !selected.length}
          onClick={() =>
            void run(
              "regenerate",
              selected,
              "Create NEW audio versions and spend provider credits? Existing approved audio stays published until the replacement is approved.",
            )
          }
        >
          Regenerate selected
        </Button>
      </div>
      {data?.control?.blocked_until && Date.parse(data.control.blocked_until) > Date.now() && (
        <p className="rounded-lg border p-3 text-sm">
          Generation paused until {new Date(data.control.blocked_until).toLocaleString()}. Stored
          playback and downloads remain available.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Jobs are stored in the database. A scheduled server worker is required for unattended
        batches. Resume checks stored files only; Retry can spend credits. No audio is generated by
        preview, approval, download or replay.
      </p>
      <div className="flex flex-wrap gap-2" aria-label="Clip status">
        {[
          ["pending", "Review"],
          ["approved", "Approved"],
          ["queued", "Queue"],
          ["failed", "Failed"],
          ["", "All"],
        ].map(([key, label]) => (
          <Button
            key={label}
            size="sm"
            variant={status === key ? "default" : "outline"}
            onClick={() => {
              setStatus(key);
              setPage(0);
            }}
          >
            {label} ({key ? filtered.filter((c) => state(c) === key).length : filtered.length})
          </Button>
        ))}
        {status === "pending" && reviewIds.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setReview(selectedReview.length === reviewIds.length ? [] : reviewIds)}
          >
            {selectedReview.length === reviewIds.length
              ? "Clear review selection"
              : "Select all for review"}
          </Button>
        )}
      </div>
      {!visible.length && <p className="text-sm text-muted-foreground">No clips in this view.</p>}
      <div className="space-y-2">
        {visible.slice(pageIndex * 10, pageIndex * 10 + 10).map((clip) => {
          const latest = clip.versions[0],
            asset = clip.versions.find((v) => v.storage_path);
          return (
            <article key={clip.id} className="rounded-lg border bg-card px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 font-medium">
                  <input
                    type="checkbox"
                    checked={
                      latest?.status === "pending"
                        ? review.includes(latest.id)
                        : selected.includes(clip.id)
                    }
                    disabled={busy || !clip.pilot}
                    onChange={() =>
                      latest?.status === "pending"
                        ? setReview((ids) =>
                            ids.includes(latest.id)
                              ? ids.filter((id) => id !== latest.id)
                              : [...ids, latest.id],
                          )
                        : select(clip.id)
                    }
                  />
                  {clip.lesson_id} · {clip.segment_order}
                </label>
                <span className="rounded-full bg-primary/5 px-3 py-1 text-xs">
                  {clip.removed_from_lesson ? "Removed from lesson" : state(clip)}
                  {!clip.pilot ? " · inventory only" : ""}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Puck · {clip.script_version} · WAV cache index:{" "}
                {clip.legacyReady ? "ready (validated on reuse)" : "not marked ready"}
              </p>
              <details className="mt-2 text-sm">
                <summary>Script and details</summary>
                {clip.pilot && clip.source === "walkthrough" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      setEditing(clip.id);
                      setScript(clip.script_draft ?? latest?.script_text ?? clip.script);
                    }}
                  >
                    Edit script
                  </Button>
                )}
                {clip.pilot && clip.source === "walkthrough" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      void run(
                        clip.removed_from_lesson ? "restore-script" : "remove-script",
                        [clip.id],
                        clip.removed_from_lesson
                          ? "Restore this narration in the lesson?"
                          : "Skip this narration in the student lesson? The file and history are kept.",
                      )
                    }
                  >
                    {clip.removed_from_lesson ? "Restore to lesson" : "Remove from lesson"}
                  </Button>
                )}
                {editing === clip.id && (
                  <div className="space-y-2">
                    <textarea
                      aria-label="Teaching narration draft"
                      className="w-full rounded border bg-background p-2"
                      rows={6}
                      maxLength={3500}
                      value={script}
                      onChange={(e) => setScript(e.target.value)}
                    />
                    <Button
                      disabled={busy || !script.trim()}
                      onClick={() => void editAction("save-script", clip.id)}
                    >
                      Save draft
                    </Button>
                    <Button
                      disabled={busy || !clip.script_draft || script.trim() !== clip.script_draft}
                      onClick={() => void editAction("queue-script", clip.id)}
                    >
                      Queue updated audio
                    </Button>
                    <Button variant="ghost" onClick={() => setEditing(null)}>
                      Close
                    </Button>
                  </div>
                )}
                <p className="mt-2 whitespace-pre-wrap leading-relaxed">
                  {asset?.script_text ?? clip.script}
                </p>
              </details>
              {latest?.last_error && (
                <p className="mt-2 text-sm text-destructive">{latest.last_error}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {asset && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void file(`/api/audio-manager?version=${asset.id}`, true)}
                  >
                    Preview MP3
                  </Button>
                )}
                {latest?.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        void run(
                          "approve",
                          [latest.id],
                          "Approve this MP3 for student playback? Please listen to the complete clip first.",
                        )
                      }
                    >
                      Approve
                    </Button>
                  </>
                )}
                {clip.approved_version && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      void file(`/api/audio-manager?version=${clip.approved_version}&download=1`)
                    }
                  >
                    Download MP3
                  </Button>
                )}
                {latest?.status === "failed" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        void run(
                          "resume",
                          [latest.id],
                          "Resume using stored audio only? No new TTS request will be issued.",
                        )
                      }
                    >
                      Resume stored audio
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        void run(
                          "retry",
                          [latest.id],
                          "Retry failed audio? Check provider quota first. This authorizes a new paid request if no stored file can be recovered.",
                        )
                      }
                    >
                      Retry failed audio
                    </Button>
                  </>
                )}
              </div>
              {clip.versions.length > 1 && (
                <details className="mt-3 text-xs">
                  <summary>Version history / restore</summary>
                  {clip.versions.map((v) => (
                    <div key={v.id} className="mt-2 flex flex-wrap items-center gap-2">
                      <span>
                        {v.created_at} · {v.status} · {v.bytes} bytes
                      </span>
                      {v.storage_path && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void file(`/api/audio-manager?version=${v.id}`, true)}
                        >
                          Listen
                        </Button>
                      )}
                      {v.status === "approved" && v.id !== clip.approved_version && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void run(
                              "approve",
                              [v.id],
                              "Restore this previously approved audio version?",
                            )
                          }
                        >
                          Restore
                        </Button>
                      )}
                    </div>
                  ))}
                </details>
              )}
            </article>
          );
        })}
      </div>
      {preview && (
        <div className="sticky bottom-0 z-20 flex flex-wrap items-center gap-2 rounded-lg border bg-background p-2">
          <Button
            size="sm"
            variant="outline"
            disabled={busy || previewIndex < 1}
            onClick={() =>
              void file(`/api/audio-manager?version=${playable[previewIndex - 1]}`, true)
            }
          >
            Previous clip
          </Button>
          <audio
            className="min-w-48 flex-1"
            controls
            src={preview}
            aria-label="Admin audio preview"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={busy || previewIndex < 0 || previewIndex + 1 >= playable.length}
            onClick={() =>
              void file(`/api/audio-manager?version=${playable[previewIndex + 1]}`, true)
            }
          >
            Next clip
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setPreview("")}>
            Close player
          </Button>
        </div>
      )}
      {visible.length > 10 && (
        <div className="flex items-center gap-3">
          <Button variant="outline" disabled={!pageIndex} onClick={() => setPage(pageIndex - 1)}>
            Previous page
          </Button>
          <span>
            {pageIndex * 10 + 1}–{Math.min(visible.length, (pageIndex + 1) * 10)} of{" "}
            {visible.length}
          </span>
          <Button
            variant="outline"
            disabled={(pageIndex + 1) * 10 >= visible.length}
            onClick={() => setPage(pageIndex + 1)}
          >
            Next page
          </Button>
        </div>
      )}
      <div className="rounded-xl border p-4">
        <h3 className="font-semibold">Approved MP3 downloads</h3>
        <p className="mb-3 text-sm text-muted-foreground">
          Archives contain a manifest and stored MP3 files. Archives split at 32 MB. Grade archives
          also split at 20 clips. Downloads never generate audio.
        </p>
        {grade && (
          <div className="flex flex-wrap gap-2">
            {unit &&
              Array.from({ length: data?.unitArchiveParts[`${grade}-${unit}`] ?? 0 }, (_, part) => (
                <Button
                  key={`unit-${part}`}
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void file(
                      `/api/audio-manager?format=zip&grade=${grade}&unit=${unit}&part=${part}`,
                    )
                  }
                >
                  Unit {unit} ZIP · part {part + 1}
                </Button>
              ))}
            {Array.from({ length: data?.archiveParts[grade] ?? 0 }, (_, part) => (
              <Button
                key={part}
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void file(`/api/audio-manager?format=zip&grade=${grade}&part=${part}`)
                }
              >
                Grade {grade} ZIP · part {part + 1}
              </Button>
            ))}
          </div>
        )}
      </div>
      {data && (
        <section className="rounded-xl border p-4">
          <h3 className="font-semibold">Usage monitoring</h3>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {Object.entries(data.stats).map(([key, value]) => (
              <p key={key}>
                <span className="font-medium">{key}: </span>
                {value === null
                  ? "Not available — no provider billing API connected"
                  : String(value)}
              </p>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Request counts are observed locally; token pacing and costs are estimates. This is not
            your Google/Lovable remaining credit balance. Storage bytes cover MP3 metadata, not the
            retained legacy WAV cache.
          </p>
        </section>
      )}
    </section>
  );
}
