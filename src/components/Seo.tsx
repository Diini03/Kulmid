import { Helmet } from "react-helmet-async";

interface SeoProps {
  title: string;
  description?: string;
  canonical?: string;
}

export const Seo = ({ title, description, canonical = "/" }: SeoProps) => {
  const fullTitle = `${title} | Kulmid`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={fullTitle} />
      {description && (
        <meta property="og:description" content={description} />
      )}
    </Helmet>
  );
};
