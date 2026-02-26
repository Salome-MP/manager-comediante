export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-surface-base">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-navy-400 mb-3">Legal</p>
          <h1 className="text-3xl font-bold text-text-primary md:text-4xl">Politica de Privacidad</h1>
          <p className="mt-2 text-text-muted text-sm">Ultima actualizacion: enero 2025</p>
        </div>

        <div className="space-y-8">
          <section className="rounded-xl border border-border-medium bg-surface-card p-6">
            <h2 className="mb-3 text-lg font-semibold text-text-primary">1. Informacion que recopilamos</h2>
            <p className="text-text-tertiary leading-relaxed text-sm">
              Recopilamos la informacion que nos proporcionas directamente al crear una cuenta,
              realizar una compra o contactarnos. Esto incluye: nombre, correo electronico,
              direccion de envio, telefono y datos de facturacion.
            </p>
          </section>

          <section className="rounded-xl border border-border-medium bg-surface-card p-6">
            <h2 className="mb-3 text-lg font-semibold text-text-primary">2. Uso de la informacion</h2>
            <p className="text-text-tertiary leading-relaxed text-sm">
              Utilizamos tu informacion para: procesar pedidos y pagos, enviar confirmaciones
              y actualizaciones de pedidos, mejorar nuestros servicios, y enviarte notificaciones
              sobre nuevos productos y shows de los artistas que sigues.
            </p>
          </section>

          <section className="rounded-xl border border-border-medium bg-surface-card p-6">
            <h2 className="mb-3 text-lg font-semibold text-text-primary">3. Proteccion de datos</h2>
            <p className="text-text-tertiary leading-relaxed text-sm">
              Implementamos medidas de seguridad tecnicas y organizativas para proteger tu informacion
              personal. Los datos de pago son procesados directamente por Mercado Pago y nunca
              pasan por nuestros servidores.
            </p>
          </section>

          <section className="rounded-xl border border-border-medium bg-surface-card p-6">
            <h2 className="mb-3 text-lg font-semibold text-text-primary">4. Compartir informacion</h2>
            <p className="text-text-tertiary leading-relaxed text-sm">
              No vendemos ni compartimos tu informacion personal con terceros, excepto cuando es
              necesario para procesar tu pedido (servicio de envio, pasarela de pago) o cuando
              la ley lo requiere.
            </p>
          </section>

          <section className="rounded-xl border border-border-medium bg-surface-card p-6">
            <h2 className="mb-3 text-lg font-semibold text-text-primary">5. Cookies</h2>
            <p className="text-text-tertiary leading-relaxed text-sm">
              Utilizamos cookies esenciales para el funcionamiento de la plataforma, como mantener
              tu sesion activa y tu carrito de compras. No utilizamos cookies de rastreo de terceros.
            </p>
          </section>

          <section className="rounded-xl border border-border-medium bg-surface-card p-6">
            <h2 className="mb-3 text-lg font-semibold text-text-primary">6. Tus derechos</h2>
            <p className="text-text-tertiary leading-relaxed text-sm">
              Tienes derecho a acceder, rectificar y eliminar tus datos personales. Puedes
              actualizar tu informacion desde tu perfil o contactarnos para solicitar la
              eliminacion de tu cuenta.
            </p>
          </section>

          <section className="rounded-xl border border-border-medium bg-surface-card p-6">
            <h2 className="mb-3 text-lg font-semibold text-text-primary">7. Contacto</h2>
            <p className="text-text-tertiary leading-relaxed text-sm">
              Para cualquier consulta sobre esta politica de privacidad, puedes contactarnos
              a traves de nuestro correo electronico.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
