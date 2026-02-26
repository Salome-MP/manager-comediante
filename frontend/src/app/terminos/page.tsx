export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-surface-base">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-navy-400 mb-3">Legal</p>
          <h1 className="text-3xl font-bold text-text-primary md:text-4xl">Terminos y Condiciones</h1>
          <p className="mt-2 text-text-muted text-sm">Ultima actualizacion: enero 2025</p>
        </div>

        <div className="space-y-8">
          <section className="rounded-xl border border-border-medium bg-surface-card p-6">
            <h2 className="mb-3 text-lg font-semibold text-text-primary">1. Aceptacion de los terminos</h2>
            <p className="text-text-tertiary leading-relaxed text-sm">
              Al acceder y utilizar Comediantes.com, aceptas estar sujeto a estos terminos y condiciones de uso.
              Si no estas de acuerdo con alguno de estos terminos, no utilices la plataforma.
            </p>
          </section>

          <section className="rounded-xl border border-border-medium bg-surface-card p-6">
            <h2 className="mb-3 text-lg font-semibold text-text-primary">2. Descripcion del servicio</h2>
            <p className="text-text-tertiary leading-relaxed text-sm">
              Comediantes.com es una plataforma web que conecta comediantes con sus fans, permitiendo la venta
              de mercancia oficial, gestion de shows y servicios personalizados. La plataforma actua como
              intermediario entre los artistas y los compradores.
            </p>
          </section>

          <section className="rounded-xl border border-border-medium bg-surface-card p-6">
            <h2 className="mb-3 text-lg font-semibold text-text-primary">3. Cuentas de usuario</h2>
            <p className="text-text-tertiary leading-relaxed text-sm">
              Para realizar compras debes crear una cuenta proporcionando informacion veraz y actualizada.
              Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades
              que ocurran bajo tu cuenta.
            </p>
          </section>

          <section className="rounded-xl border border-border-medium bg-surface-card p-6">
            <h2 className="mb-3 text-lg font-semibold text-text-primary">4. Compras y pagos</h2>
            <p className="text-text-tertiary leading-relaxed text-sm">
              Todos los precios estan expresados en Soles Peruanos (S/.) e incluyen los impuestos aplicables.
              Los pagos se procesan a traves de Mercado Pago, una pasarela de pago certificada.
              No almacenamos datos de tarjetas de credito en nuestros servidores.
            </p>
          </section>

          <section className="rounded-xl border border-border-medium bg-surface-card p-6">
            <h2 className="mb-3 text-lg font-semibold text-text-primary">5. Envios y entregas</h2>
            <p className="text-text-tertiary leading-relaxed text-sm">
              Los envios se realizan a nivel nacional en Peru. Los tiempos de entrega pueden variar segun
              la ubicacion. El costo de envio se calcula al momento del checkout.
            </p>
          </section>

          <section className="rounded-xl border border-border-medium bg-surface-card p-6">
            <h2 className="mb-3 text-lg font-semibold text-text-primary">6. Politica de devoluciones</h2>
            <p className="text-text-tertiary leading-relaxed text-sm">
              Los productos personalizados (con autografo, carta manuscrita, etc.) no son elegibles para devolucion.
              Para productos estandar, se aceptan devoluciones dentro de los 7 dias habiles posteriores a la recepcion,
              siempre que el producto este en su estado original.
            </p>
          </section>

          <section className="rounded-xl border border-border-medium bg-surface-card p-6">
            <h2 className="mb-3 text-lg font-semibold text-text-primary">7. Propiedad intelectual</h2>
            <p className="text-text-tertiary leading-relaxed text-sm">
              Todo el contenido de la plataforma, incluyendo imagenes, textos, logos y diseños, esta protegido
              por derechos de autor. Los productos vendidos son mercancia oficial autorizada por cada artista.
            </p>
          </section>

          <section className="rounded-xl border border-border-medium bg-surface-card p-6">
            <h2 className="mb-3 text-lg font-semibold text-text-primary">8. Contacto</h2>
            <p className="text-text-tertiary leading-relaxed text-sm">
              Para consultas sobre estos terminos, contactanos a traves de nuestro correo electronico
              o redes sociales.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
