export const loadItems = async (): Promise<string[]> => {
  const url = "/items.json";
  const CACHE_NAME = "items-cache";
  const ONE_DAY = 24 * 60 * 60 * 1000;

  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(url);

    if (cachedResponse) {
      const cachedDate = cachedResponse.headers.get("X-Cache-Date");
      if (cachedDate) {
        const isExpired = Date.now() - new Date(cachedDate).getTime() > ONE_DAY;
        if (!isExpired) {
          const data = await cachedResponse.json<string[]>();
          return data;
        }
      }
      await cache.delete(url);
    }

    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json<string[]>();

      // 캐시 날짜 헤더를 추가한 새로운 응답 생성
      const headers = new Headers(response.headers);
      headers.append("X-Cache-Date", new Date().toISOString());

      const responseToCache = new Response(JSON.stringify(data), {
        status: response.status,
        statusText: response.statusText,
        headers: headers,
      });

      await cache.put(url, responseToCache);
      return data;
    }
    throw new Error(`Failed to fetch items: ${response.statusText}`);
  } catch (err) {
    console.error("Failed to load items:", err);
    // 캐시 실패 시 일반 fetch 시도
    const response = await fetch(url);
    if (response.ok) {
      return await response.json<string[]>();
    }
    throw err;
  }
};
