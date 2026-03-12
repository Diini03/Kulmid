import { Helmet } from "react-helmet-async";

const BASE_URL = "https://kulmid.lovable.app";

interface SeoProps {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
}

export const Seo = ({
  title,
  description,
  canonical = "/",
  ogImage,
  ogType = "website",
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
    </Helmet>
  );
};
