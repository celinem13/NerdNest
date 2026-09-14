import { useEffect, useState } from "react";
import { getPosts } from "../../api";

export default function usePosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      try {
        setLoading(true);
        setError("");

        const data = await getPosts();

        if (!cancelled) {
          setPosts(data);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.message ||
              "Failed to load posts"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPosts();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    posts,
    loading,
    error
  };
}