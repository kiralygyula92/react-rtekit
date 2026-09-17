import { Link } from 'react-router';

export function NotFound() {
  return (
    <div className="page page--narrow">
      <h1>Page not found</h1>
      <p>
        That route does not exist. <Link to="/">Back to the landing page</Link>.
      </p>
    </div>
  );
}
