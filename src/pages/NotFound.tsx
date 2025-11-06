import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <Layout>
      <Seo title="Page Not Found" />
      <div className="container max-w-6xl min-h-[60vh] flex items-center justify-center py-20">
        <div className="text-center space-y-6">
          <h1 className="text-6xl font-bold">404</h1>
          <p className="text-2xl text-muted-foreground">Oops! Page not found</p>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Button asChild size="lg">
            <Link to="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
