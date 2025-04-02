
import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
}

const SEO = ({ title, description, keywords, image, url }: SEOProps) => {
  const siteUrl = "https://moodvids.netlify.app"; // Base URL
  const imageUrl = image || `${siteUrl}/og-image.png`; // Default OG image

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content="MoodVid" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {/* Open Graph (For Facebook, LinkedIn, etc.) */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={url || (typeof window !== "undefined" ? window.location.href : siteUrl)} />
      <meta property="og:type" content="website" />

      {/* Twitter Card (For better Twitter previews) */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:url" content={url || (typeof window !== "undefined" ? window.location.href : siteUrl)} />
      <meta name="twitter:site" content="@moodvids" /> {/* Use your actual Twitter handle */}
    </Helmet>
  );
};

export default SEO;
