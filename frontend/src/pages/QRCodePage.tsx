import { useState } from 'react';
import { QrCode, Download, Copy, Check, Link2, Sparkles, Scan } from 'lucide-react';

export function QRCodePage() {
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.origin;
  const menuSlug = 'apna-restaurant';
  const menuUrl = `${baseUrl}/order/${menuSlug}`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(menuUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `apna-restaurant-menu-qr.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/30">
          <QrCode className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold vg-text-fuchsia">QR Code Menu</h1>
          <p className="text-white/50">Generate QR codes for customers to scan and order</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code Card */}
        <div className="glass-card-vibrant p-8">
          <div className="flex items-center gap-3 mb-6">
            <Scan className="w-6 h-6 text-fuchsia-400" />
            <h2 className="text-xl font-bold text-white">Customer Menu QR Code</h2>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="p-6 bg-white rounded-3xl shadow-2xl mb-6">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-64 h-64"
              />
            </div>
            
            <div className="w-full space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleDownload}
                  className="py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download PNG
                </button>
                <button
                  onClick={handleCopy}
                  className={`py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                    copied
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                      : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10'
                  }`}
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
              
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 text-white/50 mb-2">
                  <Link2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Menu URL</span>
                </div>
                <p className="text-white font-mono text-sm break-all">{menuUrl}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions Card */}
        <div className="glass-card-vibrant p-8">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white">How to Use</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-white font-bold text-lg">1</span>
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Download the QR Code</h3>
                <p className="text-white/50 mt-1">
                  Click the download button to save the QR code as a PNG image.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-white font-bold text-lg">2</span>
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Print or Display</h3>
                <p className="text-white/50 mt-1">
                  Print the QR code on table tents, place it at the entrance, or display it on digital screens.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-white font-bold text-lg">3</span>
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Customers Scan</h3>
                <p className="text-white/50 mt-1">
                  Customers scan the QR code with their phone camera to instantly view your menu and place orders.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20 border border-fuchsia-500/20">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-fuchsia-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-white">Pro Tip</h3>
                <p className="text-white/60 mt-1 text-sm">
                  Place QR codes at each table for a seamless ordering experience. Consider laminating printed codes for durability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom QR Tools */}
      <div className="glass-card-vibrant p-8 mt-6">
        <h2 className="text-xl font-bold text-white mb-4">Custom QR Code Generators</h2>
        <p className="text-white/50 mb-6">Need a custom QR code with your logo or branding? Try these services:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href={`https://www.qrcode-monkey.com/?data=${encodeURIComponent(menuUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
          >
            <p className="font-bold text-white group-hover:text-fuchsia-400 transition-colors">QR Code Monkey</p>
            <p className="text-white/40 text-sm mt-1">Free with logo support</p>
          </a>
          <a
            href={`https://www.canva.com/create/qr-codes/`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
          >
            <p className="font-bold text-white group-hover:text-fuchsia-400 transition-colors">Canva</p>
            <p className="text-white/40 text-sm mt-1">Design with templates</p>
          </a>
          <a
            href={`https://www.beaconstac.com/qr-code-generator`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
          >
            <p className="font-bold text-white group-hover:text-fuchsia-400 transition-colors">Beaconstac</p>
            <p className="text-white/40 text-sm mt-1">Advanced features</p>
          </a>
        </div>
      </div>
    </div>
  );
}
