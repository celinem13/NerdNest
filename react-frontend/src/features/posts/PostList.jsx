export default function PostList({
  posts,
  loading,
  error
}) {
  let content;

  if (loading) {
    content = <p>Loading posts…</p>;
  } else if (error) {
    content = (
      <p role="alert" style={{ color: "crimson" }}>
        {error}
      </p>
    );
  } else if (posts.length === 0) {
    content = <p>No posts yet.</p>;
  } else {
    content = (
      <ul>
        {posts.map((post) => (
          <li key={post._id}>
            <article>
              <h3>{post.title}</h3>
              <p>{post.body}</p>

              {post.tags?.length > 0 && (
                <p>
                  <strong>Tags:</strong>{" "}
                  {post.tags.join(", ")}
                </p>
              )}
            </article>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section>
      <h2>Community posts</h2>
      {content}
    </section>
  );
}