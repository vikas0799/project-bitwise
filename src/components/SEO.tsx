
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  type?: string;
  name?: string;
  imageUrl?: string;
}

const SEO: React.FC<SEOProps> = ({
  title = 'Bitwise School',
  description = 'Bitwise School: coding institute in Delhi offering live programming courses, data structures, algorithms, placement support and a free opportunities portal.',
  type = 'website',
  name = 'Bitwise School',
  imageUrl = '/og-image.png'
}) => {
  const location = useLocation();
  const currentUrl = `https://www.bitwiseschool.com${location.pathname}`;
  const absoluteImageUrl = imageUrl.startsWith('http') ? imageUrl : `https://www.bitwiseschool.com${imageUrl}`;

  // Create JSON-LD structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Bitwise School',
    url: 'https://www.bitwiseschool.com',
    logo: 'https://www.bitwiseschool.com/logo-512.png',
    description: 'Coding institute offering live programming courses and a free opportunities portal',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'bitwiseschool@gmail.com'
    },
    sameAs: [
      'https://www.facebook.com/profile.php?id=61578938786384',
      'https://x.com/bitwiseschool',
      'https://www.instagram.com/bitwiseschooloftechnology/',
      'https://www.linkedin.com/in/bitwise-school-of-technology-5a5296377/',
      'https://www.youtube.com/@bitwiseschool'
    ]
  };

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImageUrl} />

      {/* LinkedIn specific */}
      <meta property="og:image:secure_url" content={absoluteImageUrl} />
      <meta name="author" content={name} />

      {/* JSON-LD structured data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default SEO;
