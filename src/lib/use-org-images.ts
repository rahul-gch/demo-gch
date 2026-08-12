import { useEffect, useState } from "react";
import { resolveImage, resolveImages } from "./org-images";

export function useResolvedImage(value?: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!value) {
      setUrl(null);
      return;
    }
    void resolveImage(value).then((u) => {
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, [value]);
  return url;
}

export function useResolvedImages(values?: string[] | null) {
  const key = (values ?? []).join("|");
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    let alive = true;
    const list = key ? key.split("|") : [];
    if (list.length === 0) {
      setUrls([]);
      return;
    }
    void resolveImages(list).then((u) => {
      if (alive) setUrls(u);
    });
    return () => {
      alive = false;
    };
  }, [key]);
  return urls;
}
