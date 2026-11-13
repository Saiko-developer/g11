import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { ClassroomPlayer } from "@/components/classroom/ClassroomPlayer";
import { getReadingLesson } from "@/lib/classroom/lessons";
export const Route = createFileRoute("/classroom/$grade")({
  loader: ({ params }) => {
    const lesson = getReadingLesson(params.grade);
    if (!lesson) throw notFound();
    return { lesson };
  },
  head: ({ loaderData }) => {
    const title = `Grade ${loaderData?.lesson.grade ?? "10 & 11"} Reading Classroom | Saya Owl Academy`;
    const description = "Read Unit 1 with Saya Owl's Burmese explanations and saved classroom progress.";
    return { meta: [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ] };
  },
  component: ClassroomPage,
});
function ClassroomPage() {
  const { lesson } = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/" className="text-sm text-primary">
            ← သင်ခန်းစာများ
          </Link>
          <Link
            to="/classroom/$grade"
            params={{ grade: "10" }}
            className="text-sm underline"
            aria-current={lesson.grade === 10 ? "page" : undefined}
          >
            Grade 10
          </Link>
          <Link
            to="/classroom/$grade"
            params={{ grade: "11" }}
            className="text-sm underline"
            aria-current={lesson.grade === 11 ? "page" : undefined}
          >
            Grade 11
          </Link>
        </div>
        <ClassroomPlayer lesson={lesson} />
      </main>
    </div>
  );
}
