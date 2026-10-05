// Oscurece un color hexadecimal un cierto porcentaje (para el tono "hover" a juego).
function oscurecerColor(hex, porcentaje = 18) {
  const num = parseInt(hex.replace('#', ''), 16);
  const ajuste = Math.round(255 * (porcentaje / 100));
  let r = Math.max(0, (num >> 16) - ajuste);
  let g = Math.max(0, ((num >> 8) & 0x00ff) - ajuste);
  let b = Math.max(0, (num & 0x0000ff) - ajuste);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// Cambia el color de marca del sistema EN VIVO, en el navegador.
// Es solo visual y temporal: no se guarda ni afecta a otros usuarios ni al código fuente;
// se restablece al recargar la página. Pensado para demostraciones.
function cambiarColorMarca(hex) {
  document.documentElement.style.setProperty('--amber', hex);
  document.documentElement.style.setProperty('--amber-dark', oscurecerColor(hex));
}

const COLORES_PRESET = ['#C7860A', '#2563EB', '#16A34A', '#DC2626', '#7C3AED', '#0D9488'];

export default function Sidebar({
  subSeccionAdmin, setSubSeccionAdmin,
  modoCatalogo, setModoCatalogo,
  usuarioActual, cerrarSesion,
  menuMovilAbierto, setMenuMovilAbierto,
  limpiarFormulario, limpiarFormularioUsuario
}) {
  return (
    <>
      {/* Barra superior solo en móvil */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 text-white flex items-center justify-between px-4 z-40 border-b border-slate-700">
        <span className="brand-mark text-base font-bold text-yellow-500 tracking-tight">Ferretería Valdez</span>
        <button onClick={() => setMenuMovilAbierto(true)} aria-label="Abrir menú" className="text-white text-2xl leading-none px-2">☰</button>
      </div>

      {/* Fondo oscuro al abrir el menú en móvil */}
      {menuMovilAbierto && (
        <div className="md:hidden fixed inset-0 bg-black/70 z-40" onClick={() => setMenuMovilAbierto(false)}></div>
      )}

      {/* Sidebar */}
      <div className={`w-64 bg-slate-900 text-white flex flex-col h-screen shrink-0 fixed md:static top-0 left-0 z-50 transition-transform ${menuMovilAbierto ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="px-5 py-5 border-b border-slate-700 flex justify-between items-center">
          <div>
            <span className="brand-mark text-lg font-bold text-yellow-500 tracking-tight">Ferretería Valdez</span>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Control de Inventario</p>
          </div>
          <button onClick={() => setMenuMovilAbierto(false)} aria-label="Cerrar menú" className="md:hidden text-gray-400 hover:text-white text-xl leading-none px-1">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <button onClick={() => { setSubSeccionAdmin('reportes'); limpiarFormulario(); setMenuMovilAbierto(false); }} className={`w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg font-semibold text-sm transition ${subSeccionAdmin === 'reportes' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`}>Reportes</button>
          <button onClick={() => { setSubSeccionAdmin('ver-inventario'); limpiarFormulario(); setMenuMovilAbierto(false); }} className={`w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg font-semibold text-sm transition ${subSeccionAdmin === 'ver-inventario' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`}>Inventario</button>

          <p className="px-3 pt-4 pb-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Productos y Catálogos</p>
          <button onClick={() => { setSubSeccionAdmin('nuevo-producto'); setModoCatalogo('producto'); setMenuMovilAbierto(false); }} className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition ${subSeccionAdmin === 'nuevo-producto' && modoCatalogo === 'producto' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`}>Nuevo Producto</button>
          <button onClick={() => { setSubSeccionAdmin('nuevo-producto'); setModoCatalogo('venta'); setMenuMovilAbierto(false); }} className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition ${subSeccionAdmin === 'nuevo-producto' && modoCatalogo === 'venta' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`}>Registrar Venta</button>
          {usuarioActual?.rol === 'administrador' && (
            <button onClick={() => { setSubSeccionAdmin('nuevo-producto'); setModoCatalogo('compra'); setMenuMovilAbierto(false); }} className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition ${subSeccionAdmin === 'nuevo-producto' && modoCatalogo === 'compra' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`}>Registrar Compra</button>
          )}
          <button onClick={() => { setSubSeccionAdmin('nuevo-producto'); setModoCatalogo('historial'); setMenuMovilAbierto(false); }} className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition ${subSeccionAdmin === 'nuevo-producto' && modoCatalogo === 'historial' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`}>Historial</button>
          <button onClick={() => { setSubSeccionAdmin('kardex'); setMenuMovilAbierto(false); }} className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition ${subSeccionAdmin === 'kardex' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`}>Movimientos por Producto</button>

          {usuarioActual?.rol === 'administrador' && (
            <>
              <p className="px-3 pt-4 pb-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Administración</p>
              <button onClick={() => { setSubSeccionAdmin('usuarios'); limpiarFormularioUsuario(); setMenuMovilAbierto(false); }} className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition ${subSeccionAdmin === 'usuarios' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`}>Usuarios</button>
            </>
          )}
        </div>

        <div className="px-3 pt-3 pb-2 border-t border-slate-700">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Color del sistema</p>
          <div className="flex items-center gap-2 flex-wrap">
            {COLORES_PRESET.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => cambiarColorMarca(c)}
                title={c}
                aria-label={`Usar color ${c}`}
                className="w-6 h-6 rounded-full border-2 border-slate-600 hover:border-white transition"
                style={{ backgroundColor: c }}
              />
            ))}
            <label className="w-6 h-6 rounded-full border-2 border-dashed border-slate-500 hover:border-white transition flex items-center justify-center cursor-pointer relative overflow-hidden" title="Elegir otro color">
              <input
                type="color"
                onChange={(e) => cambiarColorMarca(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
                aria-label="Elegir color personalizado"
              />
              <span className="text-[10px] text-gray-400">+</span>
            </label>
          </div>
        </div>

        <div className="p-3 border-t border-slate-700">
          <button onClick={cerrarSesion} className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold text-red-400 hover:text-red-300 hover:bg-slate-800 transition">Cerrar Sesión</button>
        </div>
      </div>
    </>
  );
}