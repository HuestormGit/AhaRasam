import { Link } from "react-router-dom";
import "./NotFound.scss";

// The routing fallback for an address this app does not serve. Deliberately a
// separate concept from ErrorBoundary: that one catches render crashes, this is
// an ordinary, working page that happens to say "not found".
//
// A real <Link> is right here (unlike the boundary's <a>), because nothing is
// broken — there is no error state that needs a fresh document to clear.
const NotFound = () => (
  <main className="not-found">
    <div className="container">
      <h1>Page not found</h1>
      <p>We couldn't find the page you're looking for.</p>
      <Link className="not-found-home" to="/">
        Back to Home
      </Link>
    </div>
  </main>
);

export default NotFound;
