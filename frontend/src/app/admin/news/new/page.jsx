"use client";

import { useRouter } from "next/navigation";

import { Container, Typography } from "@mui/material";
import NewsForm from "@/components/admin/news/NewsForm";

export default function AdminNewsCreatePage() {
  const router = useRouter();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b", mb: 3 }}>
        New Article
      </Typography>

      <NewsForm onDone={() => router.push("/admin/news")} />
    </Container>
  );
}
