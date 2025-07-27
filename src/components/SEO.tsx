
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
  title = 'Bitwise School of Technology',
  description = 'Bitwise School of Technology: Premier coding institute in Delhi offering comprehensive programming courses, data structures, algorithms, and job placement assistance.',
  type = 'website',
  name = 'Bitwise School of Technology',
  imageUrl = '/lovable-uploads/812fe1e7-4326-47ef-868e-21cfd3b5fc46.png'
}) => {
  const location = useLocation();
  const currentUrl = `https://bitwiseschool.com${location.pathname}`;
  const absoluteImageUrl = imageUrl.startsWith('http') ? imageUrl : `https://bitwiseschool.com${imageUrl}`;

  // Create JSON-LD structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Bitwise School of Technology',
    url: 'https://bitwiseschool.com',
    logo: 'https://bitwiseschool.com/lovable-uploads/add7e0a1-0cf3-4da0-abed-55deb8d78c9f.png',
    description: 'Premier coding institute offering comprehensive programming courses',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'info@bitwiseschool.com'
    },
    sameAs: [
      'https://www.linkedin.com/company/bitwise-school-of-technology',
      'https://twitter.com/bitwiseschool'
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
