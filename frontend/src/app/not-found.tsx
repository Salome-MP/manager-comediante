import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
      <h1 className="text-8xl font-bold text-text-ghost">404</h1>
      <h2 className="mt-4 text-2xl font-bold text-text-primary">Pagina no encontrada</h2>
      <p className="mt-2 text-text-tertiary">La pagina que buscas no existe o fue movida.</p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center rounded-md bg-navy-600 px-6 py-3 text-sm font-medium text-white hover:bg-navy-500"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
