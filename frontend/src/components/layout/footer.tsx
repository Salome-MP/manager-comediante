import Link from 'next/link';
import { Instagram, Facebook, Twitter, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-xl font-black tracking-tight">
                <span className="text-white">Comediantes</span>
                <span className="text-navy-300">.com</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-navy-300">
              La plataforma que centraliza el ecosistema del humor en Latinoamérica.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                className="rounded-lg bg-navy-800/60 p-2 text-navy-300 transition-colors duration-150 hover:bg-navy-700 hover:text-white">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                className="rounded-lg bg-navy-800/60 p-2 text-navy-300 transition-colors duration-150 hover:bg-navy-700 hover:text-white">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Twitter"
                className="rounded-lg bg-navy-800/60 p-2 text-navy-300 transition-colors duration-150 hover:bg-navy-700 hover:text-white">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                className="rounded-lg bg-navy-800/60 p-2 text-navy-300 transition-colors duration-150 hover:bg-navy-700 hover:text-white">
                <Youtube className="h-4 w-4" />
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" aria-label="TikTok"
                className="rounded-lg bg-navy-800/60 p-2 text-navy-300 transition-colors duration-150 hover:bg-navy-700 hover:text-white">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.69a8.22 8.22 0 0 0 4.76 1.52V6.79a4.83 4.83 0 0 1-1-.1z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Plataforma */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-navy-400">
              Plataforma
            </h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/" className="text-navy-200 transition-colors duration-150 hover:text-white">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/artistas" className="text-navy-200 transition-colors duration-150 hover:text-white">
                  Comediantes
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-navy-400">
              Legal
            </h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/terminos" className="text-navy-200 transition-colors duration-150 hover:text-white">
                  Términos y condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="text-navy-200 transition-colors duration-150 hover:text-white">
                  Política de privacidad
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-navy-400">
              Contacto
            </h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a href="mailto:contacto@comediantes.com" className="text-navy-200 transition-colors duration-150 hover:text-white">
                  contacto@comediantes.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 h-px bg-gradient-to-r from-transparent via-navy-500/40 to-transparent" />
        <div className="mt-8 flex flex-col items-center justify-between gap-4 text-center text-xs text-navy-400 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Comediantes.com. Todos los derechos reservados.</p>
          <p>Hecho con cariño para los fans del humor en Peru</p>
        </div>
      </div>
    </footer>
  );
}
