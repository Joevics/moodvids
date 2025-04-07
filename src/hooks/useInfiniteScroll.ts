
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  initialPage?: number;
  enabled?: boolean;
}

export function useInfiniteScroll({
  threshold = 0.8,
  initialPage = 1,
  enabled = true
}: UseInfiniteScrollOptions = {}) {
  const [page, setPage] = useState(initialPage);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(() => {
    setPage(prevPage => prevPage + 1);
  }, []);

  const setTarget = useCallback((element: HTMLDivElement | null) => {
    targetRef.current = element;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const options = {
      root: null,
      rootMargin: '20px',
      threshold
    };

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting) {
        loadMore();
      }
    }, options);

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, loadMore, enabled]);

  useEffect(() => {
    const currentTarget = targetRef.current;
    const currentObserver = observerRef.current;

    if (currentTarget && currentObserver) {
      currentObserver.observe(currentTarget);
      return () => {
        if (currentTarget) {
          currentObserver.unobserve(currentTarget);
        }
      };
    }
  }, [targetRef.current, observerRef.current]);

  return { page, isIntersecting, loadMore, setTarget };
}
