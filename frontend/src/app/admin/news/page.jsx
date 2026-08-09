"use client";

import { useRouter } from "next/navigation";

import { Container } from "@mui/material";
import NewsAdminList from "@/components/admin/news/NewsAdminList";

export default function AdminNewsListPage() {
  const router = useRouter();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <NewsAdminList
        onCreateNew={() => router.push("/admin/news/new")}
        onEdit={(item) => router.push(`/admin/news/${item._id}/edit`)}
      />
    </Container>
  );
}
