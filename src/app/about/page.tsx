import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";

export const metadata = {
  title: "About | Pokedex Kids",
  description: "About this project — a kid-friendly Pokemon encyclopedia.",
};

export default function AboutPage() {
  const readmePath = path.join(process.cwd(), "README.md");
  const content = fs.readFileSync(readmePath, "utf-8");

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <article className="prose prose-gray max-w-none prose-headings:text-gray-800 prose-a:text-red-500 prose-a:no-underline hover:prose-a:underline prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-table:text-sm prose-th:bg-gray-50 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-img:rounded-lg">
        <ReactMarkdown>{content}</ReactMarkdown>
      </article>
    </div>
  );
}
