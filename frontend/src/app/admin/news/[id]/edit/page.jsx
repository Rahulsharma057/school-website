"use client";

import { useParams, useRouter } from "next/navigation";

import { Container, Typography } from "@mui/material";
import NewsForm from "@/components/admin/news/NewsForm";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";

import { useAdminNewsDetail } from "@/hooks/useNewsAdmin";

export default function AdminNewsEditPage() {
  const { id } = useParams();
  const router = useRouter();

  const { data, isLoading, isError } = useAdminNewsDetail(id);
  const news = data?.data;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b", mb: 3 }}>
        Edit Article
      </Typography>

      {isLoading ? (
        <LoadingSkeleton />
      ) : isError || !news ? (
        <EmptyState title="Article not found" description="It may have been deleted." />
      ) : (
        <NewsForm news={news} onDone={() => router.push("/admin/news")} />
      )}
    </Container>
  );
}
