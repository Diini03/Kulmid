import { Helmet } from "react-helmet-async";

const BASE_URL = "https://www.kulmid.com";

interface SeoProps {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  /** Optional schema.org structured data rendered as JSON-LD. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export const Seo = ({
  title,
  description,
  canonical = "/",
  ogImage,
  ogType = "website",
  jsonLd,
}: SeoProps) => {
  const fullTitle = `${title} | Kulmid`;
  const absoluteCanonical = `${BASE_URL}${canonical}`;
  const absoluteOgImage = ogImage
    ? ogImage.startsWith("http")
      ? ogImage
      : `${BASE_URL}${ogImage}`
    : `${BASE_URL}/favicon.png`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={absoluteCanonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={absoluteCanonical} />
      <meta property="og:image" content={absoluteOgImage} />
      {description && (
        <meta property="og:description" content={description} />
      )}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

