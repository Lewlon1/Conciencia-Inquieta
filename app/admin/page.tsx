import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { BlogPost } from "@/types";

const quickActions = [{ label: "Write a blog post", href: "/admin/blog/new" }];

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [{ count: totalPosts }, { count: publishedPosts }, { data: recentPosts }] =
    await Promise.all([
      supabase.from("blog_posts").select("*", { count: "exact", head: true }),
      supabase
        .from("blog_posts")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true),
      supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5)
        .returns<BlogPost[]>(),
    ]);

  const metrics = [
    { label: "Total posts", value: totalPosts ?? 0 },
    { label: "Published", value: publishedPosts ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl text-[#1a1a18]">
          Bienvenido a Conciencia Inquieta
        </h1>
        <p className="text-[#6b6560] mt-1">Session 1 admin — blog only for now</p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-white border border-[#e8e5df] rounded-xl p-5"
          >
            <p className="text-sm text-[#6b6560]">{metric.label}</p>
            <p className="text-2xl font-medium mt-1 text-[#1a1a18]">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#e8e5df] rounded-xl p-6">
          <h2 className="font-heading text-lg text-[#1a1a18] mb-4">
            Recent posts
          </h2>
          {recentPosts && recentPosts.length > 0 ? (
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/admin/blog/${post.id}`}
                  className="flex items-center justify-between py-2 border-b border-[#f0ede8] last:border-0 group"
                >
                  <span className="text-sm font-medium text-[#1a1a18] truncate group-hover:underline">
                    {post.title}
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ${
                      post.is_published
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {post.is_published ? "Published" : "Draft"}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#b8b0a4]">No posts yet</p>
          )}
        </div>

        <div className="bg-white border border-[#e8e5df] rounded-xl p-6">
          <h2 className="font-heading text-lg text-[#1a1a18] mb-4">
            Quick actions
          </h2>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg text-sm text-[#1a1a18] hover:bg-[#f5f3ef] transition-colors group"
              >
                <span>{action.label}</span>
                <span className="text-[#b8b0a4] group-hover:text-[#6b6560] transition-colors">
                  &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
