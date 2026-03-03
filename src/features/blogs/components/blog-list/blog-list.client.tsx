"use client";
// src/features/blogs/components/blog-list/blog-list.client.tsx
import Link from "next/link";
import { useEffect, useState } from "react";

export interface BlogListClientProps {
  blogs: { id: number; title: string }[];
}
const url = "https://shinhan-pda-react-router-full-examp.vercel.app/api/posts";
export default function BlogListClient({ blogs }: BlogListClientProps) {
  const [blogList, setBlogList] =
    useState<{ id: number; title: string }[]>(blogs);

  useEffect(() => {
    fetch(url)
      .then((resp) => resp.json())
      .then((data) => {
        setBlogList(data.data.items);
      });
  }, []);

  return (
    <div>
      <h1>Blog List Hybrid</h1>
      <ul>
        {blogList.map((blog) => (
          <Link key={blog.id} href={`/blog-hybrid/${blog.id}`}>
            <li>{blog.title}</li>
          </Link>
        ))}
      </ul>
    </div>
  );
}
