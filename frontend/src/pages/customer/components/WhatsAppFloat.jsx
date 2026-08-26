import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { cn } from '../../../lib/utils';

const WHATSAPP_NUMBER = '6281287951140';
const DEFAULT_MESSAGE =
  'Halo Jaya Rubber Seal, saya tertarik dengan produk Anda. Mohon info lebih lanjut.';

const WhatsAppFloat = () => {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const handleClick = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      DEFAULT_MESSAGE
    )}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Tooltip */}
      {isTooltipOpen && (
        <div className="absolute bottom-full right-0 mb-3 w-64 p-4 rounded-xl bg-white shadow-2xl border border-slate-200 animate-slide-up">
          <button
            onClick={() => setIsTooltipOpen(false)}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X size={12} />
          </button>
          <p className="text-sm font-semibold text-slate-900 mb-1">
            Butuh Bantuan?
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            Chat langsung dengan tim kami untuk konsultasi produk rubber seal
          </p>
        </div>
      )}

      {/* Button */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsTooltipOpen(true)}
        onMouseLeave={() => setIsTooltipOpen(false)}
        aria-label="Chat on WhatsApp"
        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white shadow-2xl hover:shadow-green-500/50 hover:scale-110 transition-all duration-300"
      >
        {/* Ping animation */}
        <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-30" />
        
        {/* Icon */}
        <MessageCircle
          size={24}
          strokeWidth={2.5}
          className="relative z-10 group-hover:rotate-12 transition-transform"
        />
      </button>
    </div>
  );
};

export default WhatsAppFloat;