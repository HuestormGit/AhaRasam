import React from "react";
import "./ErrorBoundary.scss";

// The one render-error net for the routed pages. It deliberately catches ONLY
// React render/lifecycle exceptions — network failures, rejected promises and
// console errors stay with the screens that already handle them.
//
// Recovery is a real document load rather than a client-side <Link>, because a
// boundary keeps its error state until it is re-mounted: routing away in place
// would change the URL and still show this fallback.
class ErrorBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    // Developer-facing only; nothing from here is rendered to the customer.
    console.error("Unhandled render error:", error, info?.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="page-error">
        <div className="container">
          <h1>Something went wrong while loading this page.</h1>
          <p>
            Sorry about that. Nothing you had in your cart has been lost — please
            head back to the home page and try again.
          </p>
          <a className="page-error-home" href="/">
            Back to Home
          </a>
        </div>
      </main>
    );
  }
}

export default ErrorBoundary;
