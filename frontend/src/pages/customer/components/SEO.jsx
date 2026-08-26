import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Jaya Rubber Seal';
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://jayarubberseal.id';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

const DEFAULT_KEYWORDS = [
  'rubber seal',
  'rubber seal jakarta',
  'jual rubber seal',
  'mounting karet',
  'seal industri',
  'rubber custom',
  'karet seal berkualitas',
  'jaya rubber seal',
  'toko rubber glodok',
  'produsen rubber seal',
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
  
  return (
    <Helmet prioritizeSeoTags>
      {/* Basic Meta */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={SITE_NAME} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      <link rel="canonical" href={url} />
      
      {/* Theme */}
      <meta name="theme-color" content="#06b6d4" />
      <meta name="color-scheme" content="light" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="id_ID" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Geo Tags (Local SEO) */}
      <meta name="geo.region" content="ID-JK" />
      <meta name="geo.placename" content="Jakarta Barat" />
      <meta name="geo.position" content="-6.1446;106.8166" />
      <meta name="ICBM" content="-6.1446, 106.8166" />
      
      {/* HTML lang */}
      <html lang="id" />
      
      {/* Preconnect untuk performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {import.meta.env.VITE_API_URL && (
        <link rel="preconnect" href={import.meta.env.VITE_API_URL} />
      )}
      <link rel="dns-prefetch" href="https://wa.me" />
      
      {/* Favicon */}
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      
      {/* Structured Data - LocalBusiness */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
      
      {!schema && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            '@id': `${SITE_URL}/#business`,
            name: SITE_NAME,
            image: image,
            description: description,
            url: SITE_URL,
            telephone: '+622162305916',
            email: 'sales.jayarubberseal@gmail.com',
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
            sameAs: [
              'https://www.tokopedia.com/jayarubberseal',
              'https://www.tiktok.com/@jayarubberseal',
              'https://www.instagram.com/jayarubberseal.id/',
            ],
            priceRange: '$$',
          })}
        </script>
      )}
      
      {children}
    </Helmet>
  );
};

export default SEO;