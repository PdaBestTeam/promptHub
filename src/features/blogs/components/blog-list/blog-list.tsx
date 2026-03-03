// src/features/blogs/components/blog-list/blog-list.tsx
import BlogListClient from "./blog-list.client";

const url = "https://shinhan-pda-react-router-full-examp.vercel.app/api/posts";
export default async function BlogList() {
  const resp = await fetch(url);
  const data = await resp.json();
  const blogs = data.data.items as { id: number; title: string }[];

  return <BlogListClient blogs={blogs} />;
}
