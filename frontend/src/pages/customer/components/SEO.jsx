import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Jaya Rubber Seal';
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://jayarubberseal.id';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

const DEFAULT_KEYWORDS = [
  'rubber seal', 'rubber seal jakarta', 'jual rubber seal', 'mounting karet',
  'seal industri', 'rubber custom', 'karet seal berkualitas', 'jaya rubber seal',
  'toko rubber glodok', 'produsen rubber seal', 'o-ring', 'gasket',
].join(', ');

const SEO = ({
  title,
  description = 'Jaya Rubber Seal - Spesialis Rubber Seal, Mounting, dan Seal Industri Berkualitas. Produk buatan sendiri dengan harga pabrik, pengiriman seluruh Indonesia.',
  keywords = DEFAULT_KEYWORDS,
  image = DEFAULT_IMAGE,
  url = SITE_URL,
  type = 'website',
  noindex = false,
  schema = null,
  children,
}) => {
  const fullTitle = title 
    ? `${title} | ${SITE_NAME}` 
    : `${SITE_NAME} - Rubber Seal & Mounting Berkualitas`;
  
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/Logo/logo.png`,
    description: description,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Jakarta Barat',
      addressRegion: 'DKI Jakarta',
      addressCountry: 'ID',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+62-21-62305916',
      contactType: 'customer service',
      areaServed: 'ID',
      availableLanguage: ['Indonesian', 'English'],
    },
    sameAs: [
      'https://www.instagram.com/jayarubberseal.id/',
      'https://www.tiktok.com/@jayarubberseal',
      'https://www.tokopedia.com/jayarubberseal',
    ],
  };

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: SITE_NAME,
    image: image,
    '@id': SITE_URL,
    url: SITE_URL,
    telephone: '+62-21-62305916',
    email: 'sales.jayarubberseal@gmail.com',
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Pertokoan Glodok Jaya Lt.2 Blok A 35, Jl. Hayam Wuruk',
      addressLocality: 'Jakarta Barat',
      addressRegion: 'DKI Jakarta',
      postalCode: '11180',
      addressCountry: 'ID',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -6.1446,
      longitude: 106.8166,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '08:00',
      closes: '17:00',
    },
  };

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={SITE_NAME} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'} />
      <meta name="googlebot" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      <link rel="canonical" href={url} />
      
      <meta name="theme-color" content="#06b6d4" />
      <meta name="color-scheme" content="light" />
      
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="id_ID" />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={fullTitle} />
      
      <link rel="alternate" hrefLang="id" href={url} />
      <link rel="alternate" hrefLang="x-default" href={url} />
      
      <meta name="geo.region" content="ID-JK" />
      <meta name="geo.placename" content="Jakarta Barat" />
      <meta name="geo.position" content="-6.1446;106.8166" />
      <meta name="ICBM" content="-6.1446, 106.8166" />
      
      <html lang="id" />
      
      {import.meta.env.VITE_API_URL && (
        <link rel="preconnect" href={import.meta.env.VITE_API_URL} />
      )}
      
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(localBusinessSchema)}
      </script>
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
      
      {children}
    </Helmet>
  );
};

export default SEO;