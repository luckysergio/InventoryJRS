import { Helmet } from 'react-helmet-async';

const SEO = () => {
  const baseUrl = 'https://jayarubberseal.com';
  const companyName = 'Jaya Rubber Seal';
  const description = 'Distributor & Produsen Seal Karet, Mounting, dan Komponen Rubber untuk Otomotif & Industri. Sertifikasi ISO 9001:2015, Toleransi Presisi 0.01mm, Harga Kompetitif.';
  
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>Jaya Rubber Seal | Distributor Product Mounting, Rubber, Seal</title>
      <meta name="title" content={`${companyName} | Distributor Product Mounting, Rubber, Seal`} />
      <meta name="description" content={description} />
      <meta name="keywords" content="seal karet, rubber seal, o ring, mounting karet, seal industri, seal otomotif, jual seal karet jakarta, glodok, distributor seal karet, rubber mounting" />
      <meta name="author" content={companyName} />
      <meta name="robots" content="index, follow" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={baseUrl} />
      <meta property="og:title" content={`${companyName} - Solusi Seal Karet Industri Terpercaya`} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${baseUrl}/og-image.jpg`} />
      <meta property="og:image:alt" content={`${companyName} - Produsen Seal Karet Presisi`} />
      <meta property="og:site_name" content={companyName} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={baseUrl} />
      <meta property="twitter:title" content={`${companyName} | Distributor Seal Karet Jakarta`} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={`${baseUrl}/og-image.jpg`} />
      
      {/* Canonical URL */}
      <link rel="canonical" content={baseUrl} />
      
      {/* Alternate Bahasa Indonesia */}
      <link rel="alternate" href={baseUrl} hrefLang="id" />
      
      {/* Favicon - Perbaiki path ini */}
      <link rel="icon" type="image/webp" href="/favicon/favJRS.webp" />
      <link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png" />
      
      {/* Preconnect untuk performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* Structured Data - JSON-LD */}
      <script type="application/ld+json">
        {`
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Jaya Rubber Seal",
          "url": "https://jayarubberseal.com",
          "logo": "https://jayarubberseal.com/favicon/favJRS.webp",
          "image": "https://jayarubberseal.com/og-image.jpg",
          "description": "Distributor & Produsen Seal Karet, Mounting, dan Komponen Rubber untuk Otomotif & Industri sejak 2005",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Pertokoan Glodok Jaya Lt.2 Blok A 35",
            "addressLocality": "Jakarta Barat",
            "postalCode": "11180",
            "addressCountry": "ID"
          },
          "telephone": "+622112345678",
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+6281287951140",
            "contactType": "customer service",
            "areaServed": "ID",
            "availableLanguage": "Indonesian"
          },
          "sameAs": [
            "https://wa.me/6281287951140",
            "mailto:sales.jayarubberseal@gmail.com"
          ]
        }
        `}
      </script>
    </Helmet>
  );
};

export default SEO;