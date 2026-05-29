import { useState, useEffect, useCallback, useRef } from 'react';
import { Sign } from '../types/data.types';
import {
  getSignsByCategory,
  searchSigns,
  getDailySigns,
  getCategories,
} from '../services/dictionary.service';

// ─── Load all signs by category ──────────────────────────────────
export function useSignsList(category?: string) {
  const [signs, setSigns] = useState<Sign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSignsByCategory(category);
      setSigns(data);
    } catch {
      setError('Could not load dictionary data. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  return { signs, loading, error, reload: load };
}

// ─── Debounced search ─────────────────────────────────────────────
export function useSignSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Sign[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<any>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const data = await searchSigns(query);
      setResults(data);
      setLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return { query, setQuery, results, loading };
}

// ─── Daily signs (3 per day) ──────────────────────────────────────
export function useDailySigns() {
  const [signs, setSigns] = useState<Sign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDailySigns().then(setSigns).finally(() => setLoading(false));
  }, []);

  return { signs, loading };
}

// ─── Category list ────────────────────────────────────────────────
export function useCategories() {
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  return categories;
}
