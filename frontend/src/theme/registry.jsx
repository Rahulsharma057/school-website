"use client";

import { useState } from "react";

import { useServerInsertedHTML } from "next/navigation";

import { CacheProvider } from "@emotion/react";

import createCache from "@emotion/cache";

export default function ThemeRegistry({ children }) {
  const [cache] = useState(() => {
    const emotionCache = createCache({
      key: "mui",
      prepend: true,
    });

    emotionCache.compat = true;

    return emotionCache;
  });

  useServerInsertedHTML(() => {
    const names = cache.inserted;

    let styles = "";

    for (const name in names) {
      if (names[name]) {
        styles += names[name];
      }
    }

    if (styles.length === 0) {
      return null;
    }

    return (
      <style
        data-emotion={`${cache.key} ${Object.keys(cache.inserted).join(" ")}`}
        dangerouslySetInnerHTML={{
          __html: styles,
        }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
