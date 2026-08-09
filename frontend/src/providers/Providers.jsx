"use client";

import AppProvider from "./AppProvider";
import QueryProvider from "./QueryProvider";

export default function Providers({ children }) {
  return (
    <QueryProvider>
      <AppProvider>{children}</AppProvider>
    </QueryProvider>
  );
}