import React, { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [unidades, setUnidades] = useState([]);

  const [subSeccionAdmin, setSubSeccionAdmin] = useState('reportes');
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  // Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Reportes de Inventario
  const [reportes, setReportes] = useState({
    totalProductos: 0, valorInventario: 0, agotados: 0, stockBajoCantidad: 0,
    bajoStock: [], valorPorCategoria: [], topValorInventario: [],
    gananciaHoy: 0, gananciaMes: 0, gananciaHistorica: 0,
    pendienteTotal: 0, pendienteCantidad: 0,
    comprasHoy: 0, comprasMes: 0, comprasHistorico: 0,
    historialVentas: [], historialCompras: []
  });

  const [busquedaAdmin, setBusquedaAdmin] = useState('');
  const [modoCatalogo, setModoCatalogo] = useState('producto'); // 'producto' | 'venta' | 'compra'

  // Registro de Ventas
  const [productoVentaSel, setProductoVentaSel] = useState('');
  const [cantidadVentaSel, setCantidadVentaSel] = useState('1');
  const [lineasVenta, setLineasVenta] = useState([]);
  const [tipoVentaNueva, setTipoVentaNueva] = useState('Contado');
  const [ventaExpandida, setVentaExpandida] = useState(null);
  const [detalleVenta, setDetalleVenta] = useState({});

  // Registro de Compras
  const [productoCompraSel, setProductoCompraSel] = useState('');
  const [cantidadCompraSel, setCantidadCompraSel] = useState('1');
  const [costoCompraSel, setCostoCompraSel] = useState('');
  const [proveedorCompra, setProveedorCompra] = useState('');
  const [lineasCompra, setLineasCompra] = useState([]);
  const [compraExpandida, setCompraExpandida] = useState(null);
  const [detalleCompra, setDetalleCompra] = useState({});

  // Formulario de Producto (Sirve para Crear y Editar)
  const [nuevoProd, setNuevoProd] = useState({
    id: '', nombre: '', precio: '', stock: '', categoria_id: '', unidad_base_id: '', marca: '', descripcion: '', imagen: ''
  });
  const [modoEdicion, setModoEdicion] = useState(false);

  // Formularios rápidos
  const [nuevaCatNombre, setNuevaCatNombre] = useState('');
  const [nuevaUniNombre, setNuevaUniNombre] = useState('');
  const [nuevaUniCodigo, setNuevaUniCodigo] = useState('');

  // --------------------------------------------------------
  // CONEXIONES A BASE DE DATOS
  // --------------------------------------------------------
  const cargarInventario = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/productos');
      if (res.ok) setProductos(await res.json());
    } catch (error) { console.error("Error productos:", error); }
  };

  const cargarCategorias = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/categorias');
      if (res.ok) setCategorias(await res.json());
    } catch (error) { console.error("Error categorias:", error); }
  };

  const cargarUnidades = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/unidades');
      if (res.ok) setUnidades(await res.json());
    } catch (error) { console.error("Error unidades:", error); }
  };

  const cargarReportesDashboard = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/reportes/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setReportes(await res.json());
    } catch (error) { console.error("Error reportes:", error); }
  };

  useEffect(() => {
    cargarInventario();
    cargarCategorias();
    cargarUnidades();
  }, []);

  useEffect(() => {
    if ((subSeccionAdmin === 'reportes' || (subSeccionAdmin === 'nuevo-producto' && modoCatalogo !== 'producto')) && token) cargarReportesDashboard();
  }, [subSeccionAdmin, modoCatalogo, token]);

  // --------------------------------------------------------
  // REGISTRO DE VENTAS (Contado suma a la ganancia, Crédito queda pendiente)
  // --------------------------------------------------------
  const agregarLineaVenta = () => {
    if (!productoVentaSel) { alert("Selecciona un producto."); return; }
    const producto = productos.find(p => p.id === productoVentaSel);
    const cantidad = parseFloat(cantidadVentaSel);
    if (!cantidad || cantidad <= 0) { alert("Ingresa una cantidad válida."); return; }

    const existente = lineasVenta.find(l => l.producto_id === producto.id);
    if (existente) {
      setLineasVenta(lineasVenta.map(l => l.producto_id === producto.id ? { ...l, cantidad: l.cantidad + cantidad } : l));
    } else {
      setLineasVenta([...lineasVenta, {
        producto_id: producto.id,
        nombre: producto.nombre,
        precio_unitario: parseFloat(producto.precio),
        cantidad
      }]);
    }
    setProductoVentaSel('');
    setCantidadVentaSel('1');
  };

  const quitarLineaVenta = (producto_id) => setLineasVenta(lineasVenta.filter(l => l.producto_id !== producto_id));
  const calcularTotalVenta = () => lineasVenta.reduce((acc, l) => acc + (l.precio_unitario * l.cantidad), 0).toFixed(2);

  const registrarVenta = async () => {
    if (lineasVenta.length === 0) { alert("Agrega al menos un producto a la venta."); return; }
    try {
      const res = await fetch('http://localhost:5000/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ items: lineasVenta, tipoVenta: tipoVentaNueva })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.mensaje);
        setLineasVenta([]);
        setTipoVentaNueva('Contado');
        cargarInventario();
        cargarReportesDashboard();
      } else {
        alert("❌ " + data.error);
      }
    } catch (error) { alert("Error al registrar la venta."); }
  };

  const marcarVentaPagada = async (id) => {
    if (!window.confirm("¿Confirmas que esta venta a crédito ya fue cobrada?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/ventas/${id}/pagar`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { cargarReportesDashboard(); }
    } catch (error) { alert("Error al actualizar la venta."); }
  };

  const alternarDetalleVenta = async (id) => {
    if (ventaExpandida === id) { setVentaExpandida(null); return; }
    setVentaExpandida(id);
    if (!detalleVenta[id]) {
      try {
        const res = await fetch(`http://localhost:5000/api/ventas/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) { const data = await res.json(); setDetalleVenta(prev => ({ ...prev, [id]: data.items })); }
      } catch (error) {}
    }
  };

  // --------------------------------------------------------
  // REGISTRO DE COMPRAS (reabastecimiento: aumenta el stock)
  // --------------------------------------------------------
  const agregarLineaCompra = () => {
    if (!productoCompraSel) { alert("Selecciona un producto."); return; }
    const producto = productos.find(p => p.id === productoCompraSel);
    const cantidad = parseFloat(cantidadCompraSel);
    const costo = parseFloat(costoCompraSel);
    if (!cantidad || cantidad <= 0) { alert("Ingresa una cantidad válida."); return; }
    if (!costo || costo < 0) { alert("Ingresa el costo unitario de compra."); return; }

    const existente = lineasCompra.find(l => l.producto_id === producto.id);
    if (existente) {
      setLineasCompra(lineasCompra.map(l => l.producto_id === producto.id ? { ...l, cantidad: l.cantidad + cantidad, costo_unitario: costo } : l));
    } else {
      setLineasCompra([...lineasCompra, { producto_id: producto.id, nombre: producto.nombre, costo_unitario: costo, cantidad }]);
    }
    setProductoCompraSel('');
    setCantidadCompraSel('1');
    setCostoCompraSel('');
  };

  const quitarLineaCompra = (producto_id) => setLineasCompra(lineasCompra.filter(l => l.producto_id !== producto_id));
  const calcularTotalCompra = () => lineasCompra.reduce((acc, l) => acc + (l.costo_unitario * l.cantidad), 0).toFixed(2);

  const registrarCompra = async () => {
    if (lineasCompra.length === 0) { alert("Agrega al menos un producto a la compra."); return; }
    try {
      const res = await fetch('http://localhost:5000/api/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ items: lineasCompra, proveedor: proveedorCompra })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.mensaje);
        setLineasCompra([]);
        setProveedorCompra('');
        cargarInventario();
        cargarReportesDashboard();
      } else {
        alert("❌ " + data.error);
      }
    } catch (error) { alert("Error al registrar la compra."); }
  };

  const alternarDetalleCompra = async (id) => {
    if (compraExpandida === id) { setCompraExpandida(null); return; }
    setCompraExpandida(id);
    if (!detalleCompra[id]) {
      try {
        const res = await fetch(`http://localhost:5000/api/compras/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) { const data = await res.json(); setDetalleCompra(prev => ({ ...prev, [id]: data.items })); }
      } catch (error) {}
    }
  };

  // --------------------------------------------------------
  // LÓGICA DE CRUD DE PRODUCTOS
  // --------------------------------------------------------
  const manejarGuardarProducto = async (e) => {
    e.preventDefault();
    if (!nuevoProd.nombre || !nuevoProd.precio || !nuevoProd.id) {
      alert("Por favor, rellena los campos principales.");
      return;
    }

    const productoAEnviar = {
      id: nuevoProd.id,
      nombre: nuevoProd.nombre,
      precio: parseFloat(nuevoProd.precio),
      cantidad_stock: parseFloat(nuevoProd.stock) || 0,
      categoria_id: parseInt(nuevoProd.categoria_id) || 1,
      unidad_base_id: parseInt(nuevoProd.unidad_base_id) || 1,
      marca: nuevoProd.marca || 'Genérica',
      descripcion: nuevoProd.descripcion || '',
      url_imagen: nuevoProd.imagen || null
    };

    const url = modoEdicion
      ? `http://localhost:5000/api/productos/${nuevoProd.id}`
      : 'http://localhost:5000/api/productos';

    const metodo = modoEdicion ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(productoAEnviar)
      });

      if (res.ok) {
        alert(`✅ Producto ${modoEdicion ? 'actualizado' : 'registrado'} con éxito.`);
        limpiarFormulario();
        cargarInventario();
        setSubSeccionAdmin('ver-inventario');
      } else {
        const data = await res.json();
        alert("❌ Error: " + data.error);
      }
    } catch (error) { alert("Error crítico al guardar el producto."); }
  };

  const iniciarEdicion = (producto) => {
    setModoEdicion(true);
    setNuevoProd({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      stock: producto.cantidad_stock,
      categoria_id: producto.categoria_id || '',
      unidad_base_id: producto.unidad_base_id || '',
      marca: producto.marca || '',
      descripcion: producto.descripcion || '',
      imagen: producto.url_imagen || ''
    });
    setSubSeccionAdmin('nuevo-producto'); // Lleva al usuario al formulario
    setModoCatalogo('producto');
  };

  const limpiarFormulario = () => {
    setModoEdicion(false);
    setNuevoProd({ id: '', nombre: '', precio: '', stock: '', categoria_id: '', unidad_base_id: '', marca: '', descripcion: '', imagen: '' });
  };

  const manejarEliminarProducto = async (id_producto) => {
    if (!window.confirm(`¿Seguro de eliminar el producto ${id_producto}?`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/productos/${id_producto}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert("🗑️ Producto eliminado.");
        cargarInventario();
      }
    } catch (error) { alert("Error al eliminar."); }
  };

  // --------------------------------------------------------
  // EXPORTAR A EXCEL (CSV)
  // --------------------------------------------------------
  const exportarAExcel = () => {
    // Se añade BOM (\uFEFF) para que Excel reconozca los caracteres especiales (tildes, ñ)
    let csvContent = "data:text/csv;charset=utf-8,\uFEFFID;Producto;Marca;Precio;Stock\n";

    productosFiltradosAdmin.forEach(p => {
      // Se reemplazan comillas dobles para evitar roturas y se usa punto y coma (;) como separador para Excel
      const nombreLimpio = p.nombre.replace(/"/g, '""');
      csvContent += `"${p.id}";"${nombreLimpio}";"${p.marca || ''}";"${p.precio}";"${p.cantidad_stock}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Inventario_FerreSistema_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --------------------------------------------------------
  // CATÁLOGOS (CATEGORÍAS / UNIDADES) Y AUTENTICACIÓN
  // --------------------------------------------------------
  const manejarCrearCategoria = async (e) => {
    e.preventDefault();
    if (!nuevaCatNombre) return;
    try {
      const res = await fetch('http://localhost:5000/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nombre: nuevaCatNombre })
      });
      if (res.ok) { setNuevaCatNombre(''); cargarCategorias(); }
    } catch (error) {}
  };

  const manejarCrearUnidad = async (e) => {
    e.preventDefault();
    if (!nuevaUniNombre || !nuevaUniCodigo) return;
    try {
      const res = await fetch('http://localhost:5000/api/unidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nombre: nuevaUniNombre, codigo: nuevaUniCodigo })
      });
      if (res.ok) { setNuevaUniNombre(''); setNuevaUniCodigo(''); cargarUnidades(); }
    } catch (error) {}
  };

  const manejarLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token); localStorage.setItem('token', data.token);
        setEmail(''); setPassword(''); setSubSeccionAdmin('reportes');
      } else { alert("❌ Credenciales incorrectas"); }
    } catch (error) { alert("Error de servidor"); }
  };

  const cerrarSesion = () => { setToken(''); localStorage.removeItem('token'); setSubSeccionAdmin('ver-inventario'); };

  const productosFiltradosAdmin = productos.filter(p => p.nombre.toLowerCase().includes(busquedaAdmin.toLowerCase()) || p.id.toLowerCase().includes(busquedaAdmin.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      {/* Navbar */}
      <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
        <span className="brand-mark text-xl font-bold text-yellow-500 tracking-tight">🛠️ FerreSistema Pro</span>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Control de Inventario</span>
      </div>

      <div className="w-full px-8 py-6 space-y-6">
        {!token ? (
          <div className="bg-white p-8 rounded-xl shadow-md border max-w-md mx-auto mt-10">
            <div className="text-center mb-6">
              <span className="text-3xl">🔐</span>
              <h2 className="text-xl font-bold mt-2">Acceso Administrativo</h2>
              <p className="text-xs text-gray-400 mt-1">Ingresa tus credenciales para gestionar tu inventario.</p>
            </div>
            <form onSubmit={manejarLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500">Correo electrónico</label>
                <input type="email" placeholder="tucorreo@ferreteria.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2.5 border rounded-lg mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Contraseña</label>
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2.5 border rounded-lg mt-1" />
              </div>
              <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-lg transition">Ingresar</button>
            </form>
          </div>
        ) : (
          <>
            {/* Menu Subsecciones */}
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex space-x-1 bg-white border rounded-lg p-1">
                <button onClick={() => { setSubSeccionAdmin('reportes'); limpiarFormulario(); }} className={`px-4 py-1.5 rounded-md font-semibold text-sm transition ${subSeccionAdmin === 'reportes' ? 'bg-orange-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>📊 Reportes</button>
                <button onClick={() => { setSubSeccionAdmin('ver-inventario'); limpiarFormulario(); }} className={`px-4 py-1.5 rounded-md font-semibold text-sm transition ${subSeccionAdmin === 'ver-inventario' ? 'bg-orange-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>📋 Inventario</button>
                <button onClick={() => { setSubSeccionAdmin('nuevo-producto'); setModoCatalogo('producto'); }} className={`px-4 py-1.5 rounded-md font-semibold text-sm transition ${subSeccionAdmin === 'nuevo-producto' ? 'bg-orange-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>➕ Productos y Catálogos</button>
              </div>
              <button onClick={cerrarSesion} className="text-xs text-red-500 hover:text-red-700 font-bold transition">🔒 Cerrar Sesión</button>
            </div>

            {/* REPORTES DE INVENTARIO */}
            {subSeccionAdmin === 'reportes' && (
              <div className="space-y-6">
                {/* Tarjetas KPI principales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-5 rounded-2xl shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider opacity-80">📦 Valor del Inventario</p>
                    <p className="text-2xl font-black mt-2">Q{reportes.valorInventario.toFixed(2)}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border shadow-sm">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">🗃️ Productos Registrados</p>
                    <p className="text-2xl font-black mt-2">{reportes.totalProductos}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border shadow-sm">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">⚠️ Stock Bajo</p>
                    <p className="text-2xl font-black text-orange-600 mt-2">{reportes.stockBajoCantidad}</p>
                    <p className="text-xs text-gray-400 mt-1">Menos de 20 unidades</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border shadow-sm">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">🚨 Agotados</p>
                    <p className="text-2xl font-black text-red-500 mt-2">{reportes.agotados}</p>
                    <p className="text-xs text-gray-400 mt-1">Sin unidades disponibles</p>
                  </div>
                </div>

                {/* Ganancia y pendientes de cobro */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border shadow-sm">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">💵 Ganancia Hoy</p>
                    <p className="text-2xl font-black text-green-600 mt-2">Q{reportes.gananciaHoy.toFixed(2)}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border shadow-sm">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">📅 Ganancia del Mes</p>
                    <p className="text-2xl font-black text-green-600 mt-2">Q{reportes.gananciaMes.toFixed(2)}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border shadow-sm">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">⏳ Pendiente de Cobro</p>
                    <p className="text-2xl font-black text-orange-600 mt-2">Q{reportes.pendienteTotal.toFixed(2)}</p>
                    <p className="text-xs text-gray-400 mt-1">{reportes.pendienteCantidad} venta{reportes.pendienteCantidad != 1 ? 's' : ''} a crédito sin cobrar</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border shadow-sm">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">🚚 Compras del Mes</p>
                    <p className="text-2xl font-black text-blue-600 mt-2">Q{reportes.comprasMes.toFixed(2)}</p>
                    <p className="text-xs text-gray-400 mt-1">Invertido en reabastecimiento</p>
                  </div>
                </div>

                {/* Tablas de Detalles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-5 rounded-xl border shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4">💎 Top 5 con Mayor Valor en Inventario</h3>
                    <div className="divide-y text-sm">
                      {reportes.topValorInventario.length === 0 ? <p className="text-gray-400 py-2">Aún no hay productos registrados.</p> : reportes.topValorInventario.map((prod) => (
                        <div key={prod.id} className="py-2.5 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-gray-800">{prod.nombre}</p>
                            <p className="text-xs text-gray-400">{prod.marca ? `${prod.marca} · ` : ''}{parseFloat(prod.cantidad_stock)} uds × Q{parseFloat(prod.precio).toFixed(2)}</p>
                          </div>
                          <span className="bg-orange-100 text-orange-800 font-mono text-xs font-black px-2.5 py-1 rounded-full">Q{parseFloat(prod.valor_total).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border shadow-sm">
                    <h3 className="font-bold text-red-500 mb-4">⚠️ Requiere Reabastecimiento</h3>
                    <div className="divide-y text-sm max-h-60 overflow-y-auto">
                      {reportes.bajoStock.length === 0 ? <p className="text-green-600 py-2">✅ Buen stock general.</p> : reportes.bajoStock.map((prod) => (
                        <div key={prod.id} className="py-2.5 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-gray-800">{prod.nombre}</p>
                            <p className="text-xs text-gray-400">ID: {prod.id}</p>
                          </div>
                          <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded">Quedan: {parseFloat(prod.cantidad_stock)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Valor de inventario por categoría */}
                {reportes.valorPorCategoria.length > 0 && (
                  <div className="bg-white p-5 rounded-xl border shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-1">🗂️ Valor de Inventario por Categoría</h3>
                    <p className="text-xs text-gray-400 mb-4">En qué categorías tienes más capital invertido en mercadería.</p>
                    <div className="space-y-3">
                      {(() => {
                        const maxValor = Math.max(...reportes.valorPorCategoria.map(c => parseFloat(c.valor)));
                        return reportes.valorPorCategoria.map((cat, idx) => (
                          <div key={idx}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-semibold text-gray-700">{cat.categoria} <span className="text-gray-400 font-normal">({cat.cantidad_productos} productos)</span></span>
                              <span className="font-bold text-gray-800">Q{parseFloat(cat.valor).toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${maxValor > 0 ? (parseFloat(cat.valor) / maxValor) * 100 : 0}%` }}></div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* GESTION DE CATALOGOS: selector Nuevo Producto / Venta / Compra */}
            {subSeccionAdmin === 'nuevo-producto' && (
              <div className="space-y-6">
                <div className="flex space-x-1 bg-white border rounded-lg p-1 w-fit">
                  <button onClick={() => setModoCatalogo('producto')} className={`px-4 py-1.5 rounded-md font-semibold text-sm transition ${modoCatalogo === 'producto' ? 'bg-orange-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>📦 Nuevo Producto</button>
                  <button onClick={() => setModoCatalogo('venta')} className={`px-4 py-1.5 rounded-md font-semibold text-sm transition ${modoCatalogo === 'venta' ? 'bg-orange-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>💵 Registrar Venta</button>
                  <button onClick={() => setModoCatalogo('compra')} className={`px-4 py-1.5 rounded-md font-semibold text-sm transition ${modoCatalogo === 'compra' ? 'bg-orange-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>📥 Registrar Compra</button>
                </div>

                {modoCatalogo === 'venta' && (
                <div className="space-y-6">

                {/* Panel de Registrar Venta */}
                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-gray-800">💵 Registrar Venta</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Añade los productos vendidos y elige si fue al contado o al crédito.</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500">Producto</label>
                    <select value={productoVentaSel} onChange={(e) => setProductoVentaSel(e.target.value)} className="w-full p-2 border rounded bg-gray-50 text-sm mt-1">
                      <option value="">Seleccionar producto</option>
                      {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} (Q{parseFloat(p.precio).toFixed(2)} · {parseFloat(p.cantidad_stock)} uds)</option>)}
                    </select>
                  </div>

                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-gray-500">Cantidad</label>
                      <input type="number" min="1" value={cantidadVentaSel} onChange={(e) => setCantidadVentaSel(e.target.value)} className="w-full p-2 border rounded text-sm mt-1" />
                    </div>
                    <button type="button" onClick={agregarLineaVenta} className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-4 py-2 rounded font-bold transition shrink-0">Agregar</button>
                  </div>

                  {productoVentaSel && (() => {
                    const p = productos.find(pr => pr.id === productoVentaSel);
                    if (!p) return null;
                    return (
                      <div className="flex justify-between items-center bg-blue-50 border border-blue-100 rounded-lg p-2.5 text-sm">
                        <span className="font-semibold text-gray-800">{p.nombre}</span>
                        <span className="text-blue-700 font-bold">Q{parseFloat(p.precio).toFixed(2)} <span className="text-gray-400 font-normal">· {parseFloat(p.cantidad_stock)} disponibles</span></span>
                      </div>
                    );
                  })()}

                  {lineasVenta.length > 0 && (
                    <div className="divide-y border rounded-lg">
                      {lineasVenta.map(l => (
                        <div key={l.producto_id} className="p-2.5 flex justify-between items-center text-sm">
                          <div>
                            <p className="font-semibold">{l.nombre}</p>
                            <p className="text-xs text-gray-400">{l.cantidad} × Q{l.precio_unitario.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold">Q{(l.cantidad * l.precio_unitario).toFixed(2)}</span>
                            <button onClick={() => quitarLineaVenta(l.producto_id)} className="text-red-500 hover:text-red-700 text-xs font-bold">✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-2">Tipo de Venta</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setTipoVentaNueva('Contado')} className={`py-2 rounded-lg text-sm font-semibold border transition ${tipoVentaNueva === 'Contado' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>💵 Contado</button>
                      <button type="button" onClick={() => setTipoVentaNueva('Crédito')} className={`py-2 rounded-lg text-sm font-semibold border transition ${tipoVentaNueva === 'Crédito' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>🧾 Crédito</button>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {tipoVentaNueva === 'Crédito' ? 'Quedará pendiente de cobro hasta que la marques como pagada.' : 'Se suma de inmediato a la ganancia del día.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t font-black text-lg flex justify-between">
                    <span>Total:</span><span>Q{calcularTotalVenta()}</span>
                  </div>
                  <button onClick={registrarVenta} className={`w-full text-white font-bold py-2.5 rounded-lg text-sm transition ${tipoVentaNueva === 'Crédito' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}>
                    {tipoVentaNueva === 'Crédito' ? '🧾 Registrar Venta a Crédito' : '✅ Registrar Venta al Contado'}
                  </button>
                </div>

                {/* Historial reciente de Ventas */}
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden lg:col-span-2">
                  <div className="p-5 border-b">
                    <h3 className="font-bold text-gray-900">🧾 Ventas Recientes</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Toca una fila para ver los productos. Las ventas a crédito se pueden marcar como cobradas.</p>
                  </div>
                  {reportes.historialVentas.length === 0 ? (
                    <p className="text-gray-400 text-sm p-5">Aún no se ha registrado ninguna venta.</p>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-100 text-xs font-bold border-b text-gray-600 uppercase tracking-wider">
                        <tr>
                          <th className="p-4">Venta</th>
                          <th className="p-4">Fecha</th>
                          <th className="p-4">Tipo</th>
                          <th className="p-4">Estado</th>
                          <th className="p-4">Artículos</th>
                          <th className="p-4">Total</th>
                          <th className="p-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {reportes.historialVentas.map(venta => (
                          <React.Fragment key={venta.id}>
                            <tr onClick={() => alternarDetalleVenta(venta.id)} className="hover:bg-gray-50 transition cursor-pointer">
                              <td className="p-4 sku text-gray-400">#{venta.id}</td>
                              <td className="p-4 text-gray-700">{new Date(venta.fecha).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                              <td className="p-4">
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${venta.tipo_venta === 'Crédito' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-700'}`}>
                                  {venta.tipo_venta === 'Crédito' ? '🧾 Crédito' : '💵 Contado'}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${venta.estado === 'Pendiente' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                  {venta.estado === 'Pendiente' ? '⏳ Pendiente' : '✅ Pagado'}
                                </span>
                              </td>
                              <td className="p-4 text-gray-500">{venta.items} artículo{venta.items != 1 ? 's' : ''}</td>
                              <td className="p-4 font-bold">Q{parseFloat(venta.total).toFixed(2)}</td>
                              <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                {venta.estado === 'Pendiente' && (
                                  <button onClick={() => marcarVentaPagada(venta.id)} className="bg-green-100 text-green-700 hover:bg-green-200 text-xs font-bold px-2.5 py-1 rounded transition">Marcar Cobrada</button>
                                )}
                              </td>
                            </tr>
                            {ventaExpandida === venta.id && (
                              <tr>
                                <td colSpan={7} className="p-4 bg-gray-50">
                                  {!detalleVenta[venta.id] ? <p className="text-xs text-gray-400">Cargando detalle...</p> : (
                                    <div className="divide-y">
                                      {detalleVenta[venta.id].map((item, i) => (
                                        <div key={i} className="py-2 flex justify-between text-sm">
                                          <div>
                                            <p className="font-semibold text-gray-700">{item.nombre || item.producto_id}</p>
                                            <p className="text-xs text-gray-400">{item.cantidad} × Q{parseFloat(item.precio_unitario).toFixed(2)}</p>
                                          </div>
                                          <span className="font-bold text-gray-800">Q{parseFloat(item.subtotal).toFixed(2)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                </div>
                )}

                {modoCatalogo === 'compra' && (
                <div className="space-y-6">

                {/* Panel de Registrar Compra */}
                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-gray-800">📥 Registrar Compra</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Registra la mercadería comprada a tus proveedores; el stock se actualiza solo.</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500">Producto</label>
                    <select value={productoCompraSel} onChange={(e) => {
                      const idSeleccionado = e.target.value;
                      setProductoCompraSel(idSeleccionado);
                      if (!costoCompraSel) {
                        const p = productos.find(pr => pr.id === idSeleccionado);
                        if (p && p.precio) setCostoCompraSel(parseFloat(p.precio).toFixed(2));
                      }
                    }} className="w-full p-2 border rounded bg-gray-50 text-sm mt-1">
                      <option value="">Seleccionar producto</option>
                      {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} ({parseFloat(p.cantidad_stock)} uds)</option>)}
                    </select>
                  </div>

                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-gray-500">Cantidad</label>
                      <input type="number" min="1" value={cantidadCompraSel} onChange={(e) => setCantidadCompraSel(e.target.value)} className="w-full p-2 border rounded text-sm mt-1" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-bold text-gray-500">Costo unitario (Q)</label>
                      <input type="number" step="0.01" placeholder="0.00" value={costoCompraSel} onChange={(e) => setCostoCompraSel(e.target.value)} className="w-full p-2 border rounded text-sm mt-1" />
                    </div>
                    <button type="button" onClick={agregarLineaCompra} className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-4 py-2 rounded font-bold transition shrink-0">Agregar</button>
                  </div>

                  {productoCompraSel && (() => {
                    const p = productos.find(pr => pr.id === productoCompraSel);
                    if (!p) return null;
                    return (
                      <div className="flex justify-between items-center bg-blue-50 border border-blue-100 rounded-lg p-2.5 text-sm">
                        <span className="font-semibold text-gray-800">{p.nombre}</span>
                        <span className="text-gray-400">Stock actual: <span className="text-blue-700 font-bold">{parseFloat(p.cantidad_stock)}</span> uds · Precio de venta: Q{parseFloat(p.precio).toFixed(2)}</span>
                      </div>
                    );
                  })()}
                  <p className="text-[11px] text-gray-400">💡 El costo se sugiere igual al precio de venta actual; ajústalo al monto real que pagaste al proveedor.</p>

                  {lineasCompra.length > 0 && (
                    <div className="divide-y border rounded-lg">
                      {lineasCompra.map(l => (
                        <div key={l.producto_id} className="p-2.5 flex justify-between items-center text-sm">
                          <div>
                            <p className="font-semibold">{l.nombre}</p>
                            <p className="text-xs text-gray-400">{l.cantidad} × Q{l.costo_unitario.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold">Q{(l.cantidad * l.costo_unitario).toFixed(2)}</span>
                            <button onClick={() => quitarLineaCompra(l.producto_id)} className="text-red-500 hover:text-red-700 text-xs font-bold">✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-gray-500">Proveedor (opcional)</label>
                    <input type="text" placeholder="Ej: Cementos Progreso" value={proveedorCompra} onChange={(e) => setProveedorCompra(e.target.value)} className="w-full p-2 border rounded mt-1 text-sm" />
                  </div>

                  <div className="pt-3 border-t font-black text-lg flex justify-between">
                    <span>Total:</span><span>Q{calcularTotalCompra()}</span>
                  </div>
                  <button onClick={registrarCompra} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-sm transition">📥 Registrar Compra</button>
                </div>

                {/* Historial reciente de Compras */}
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden lg:col-span-2">
                  <div className="p-5 border-b">
                    <h3 className="font-bold text-gray-900">📦 Compras Recientes</h3>
                  </div>
                  {reportes.historialCompras.length === 0 ? (
                    <p className="text-gray-400 text-sm p-5">Aún no se ha registrado ninguna compra.</p>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-100 text-xs font-bold border-b text-gray-600 uppercase tracking-wider">
                        <tr>
                          <th className="p-4">Compra</th>
                          <th className="p-4">Fecha</th>
                          <th className="p-4">Proveedor</th>
                          <th className="p-4">Artículos</th>
                          <th className="p-4">Total</th>
                          <th className="p-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {reportes.historialCompras.map(compra => (
                          <React.Fragment key={compra.id}>
                            <tr onClick={() => alternarDetalleCompra(compra.id)} className="hover:bg-gray-50 transition cursor-pointer">
                              <td className="p-4 sku text-gray-400">#{compra.id}</td>
                              <td className="p-4 text-gray-700">{new Date(compra.fecha).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                              <td className="p-4 text-gray-500">{compra.proveedor || '—'}</td>
                              <td className="p-4 text-gray-500">{compra.items} artículo{compra.items != 1 ? 's' : ''}</td>
                              <td className="p-4 font-bold">Q{parseFloat(compra.total).toFixed(2)}</td>
                              <td className="p-4 text-right text-gray-400">{compraExpandida === compra.id ? '▲' : '▼'}</td>
                            </tr>
                            {compraExpandida === compra.id && (
                              <tr>
                                <td colSpan={6} className="p-4 bg-gray-50">
                                  {!detalleCompra[compra.id] ? <p className="text-xs text-gray-400">Cargando detalle...</p> : (
                                    <div className="divide-y">
                                      {detalleCompra[compra.id].map((item, i) => (
                                        <div key={i} className="py-2 flex justify-between text-sm">
                                          <div>
                                            <p className="font-semibold text-gray-700">{item.nombre || item.producto_id}</p>
                                            <p className="text-xs text-gray-400">{item.cantidad} × Q{parseFloat(item.costo_unitario).toFixed(2)}</p>
                                          </div>
                                          <span className="font-bold text-gray-800">Q{parseFloat(item.subtotal).toFixed(2)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                </div>
                )}

                {modoCatalogo === 'producto' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


                {/* Formulario Maestro de Producto */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border shadow-sm">
                  <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <div>
                      <h3 className="font-bold text-gray-800">
                        {modoEdicion ? '✏️ Actualizar Producto' : '📦 Registrar Nuevo Producto'}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">Completa los datos del artículo tal como aparecerán en el inventario.</p>
                    </div>
                    {modoEdicion && (
                      <button onClick={limpiarFormulario} className="text-xs text-blue-600 font-bold hover:underline shrink-0 ml-4">Cancelar Edición</button>
                    )}
                  </div>

                  <form onSubmit={manejarGuardarProducto} className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs font-bold text-gray-500">Código del Producto</label>
                        <input type="text" placeholder="Ej: FV117" value={nuevoProd.id} onChange={(e) => setNuevoProd({...nuevoProd, id: e.target.value.toUpperCase()})} disabled={modoEdicion} className={`w-full p-2 border rounded ${modoEdicion ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
                        {!modoEdicion && <p className="text-[10px] text-gray-400 mt-0.5">Formato: FV + 3 dígitos</p>}
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-bold text-gray-500">Nombre del Artículo</label>
                        <input type="text" placeholder="Ej: Cemento Progreso 4060 PSI" value={nuevoProd.nombre} onChange={(e) => setNuevoProd({...nuevoProd, nombre: e.target.value})} className="w-full p-2 border rounded" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-bold text-gray-500">Categoría</label>
                        <select value={nuevoProd.categoria_id} onChange={(e) => setNuevoProd({...nuevoProd, categoria_id: e.target.value})} className="w-full p-2 border rounded bg-gray-50 text-sm">
                          <option value="">-- Selecciona una categoría --</option>
                          {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500">Unidad de Medida</label>
                        <select value={nuevoProd.unidad_base_id} onChange={(e) => setNuevoProd({...nuevoProd, unidad_base_id: e.target.value})} className="w-full p-2 border rounded bg-gray-50 text-sm">
                          <option value="">-- Selecciona una unidad --</option>
                          {unidades.map(uni => <option key={uni.id} value={uni.id}>{uni.nombre} ({uni.abreviacion})</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-bold text-gray-500">Marca (opcional)</label>
                        <input type="text" placeholder="Ej: Progreso" value={nuevoProd.marca} onChange={(e) => setNuevoProd({...nuevoProd, marca: e.target.value})} className="w-full p-2 border rounded" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500">Precio (Q)</label>
                        <input type="number" step="0.01" placeholder="0.00" value={nuevoProd.precio} onChange={(e) => setNuevoProd({...nuevoProd, precio: e.target.value})} className="w-full p-2 border rounded" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-bold text-gray-500">Stock {modoEdicion ? 'Actual' : 'Inicial'}</label>
                        <input type="number" placeholder="0" value={nuevoProd.stock} onChange={(e) => setNuevoProd({...nuevoProd, stock: e.target.value})} className="w-full p-2 border rounded" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500">Descripción (opcional)</label>
                      <textarea placeholder="Ej: Cemento de 42.5 kg por saco." value={nuevoProd.descripcion} onChange={(e) => setNuevoProd({...nuevoProd, descripcion: e.target.value})} rows={3} className="w-full p-2 border rounded resize-none" />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500">URL de la Imagen (opcional)</label>
                      <div className="flex gap-3 items-start mt-1">
                        <input type="text" placeholder="https://ejemplo.com/imagen.jpg" value={nuevoProd.imagen} onChange={(e) => setNuevoProd({...nuevoProd, imagen: e.target.value})} className="w-full p-2 border rounded text-sm" />
                        <div className="w-14 h-14 rounded-lg border bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center">
                          {nuevoProd.imagen ? (
                            <img src={nuevoProd.imagen} alt="Vista previa" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                          ) : null}
                          <span className="text-gray-300 text-xl" style={{ display: nuevoProd.imagen ? 'none' : 'flex' }}>📦</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">Pega el enlace de una imagen ya subida a internet (por ejemplo, de Google Imágenes).</p>
                    </div>

                    <button type="submit" className={`w-full text-white font-bold py-2.5 rounded-lg text-sm mt-2 transition ${modoEdicion ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'}`}>
                      {modoEdicion ? '💾 Guardar Cambios' : '💾 Añadir a Inventario'}
                    </button>
                  </form>
                </div>

                {/* Formularios Rápidos Laterales */}
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <h4 className="font-bold text-xs text-gray-700 uppercase tracking-wider mb-2">📁 Nueva Categoría</h4>
                    <p className="text-[11px] text-gray-400 mb-2">Crea un grupo para organizar tus productos.</p>
                    <form onSubmit={manejarCrearCategoria} className="flex space-x-2">
                      <input type="text" placeholder="Ej: Electricidad" value={nuevaCatNombre} onChange={(e) => setNuevaCatNombre(e.target.value)} className="border p-1.5 rounded text-sm flex-1" />
                      <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-3 rounded font-bold transition">+</button>
                    </form>
                  </div>

                  <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <h4 className="font-bold text-xs text-gray-700 uppercase tracking-wider mb-2">📏 Nueva Unidad de Medida</h4>
                    <p className="text-[11px] text-gray-400 mb-2">Ej: si manejas por metro, saco o galón.</p>
                    <form onSubmit={manejarCrearUnidad} className="space-y-2">
                      <input type="text" placeholder="Nombre (Ej: Metro)" value={nuevaUniNombre} onChange={(e) => setNuevaUniNombre(e.target.value)} className="w-full border p-1.5 rounded text-sm" />
                      <div className="flex space-x-2">
                        <input type="text" placeholder="Abreviación (Ej: m)" value={nuevaUniCodigo} onChange={(e) => setNuevaUniCodigo(e.target.value)} className="border p-1.5 rounded text-sm flex-1 font-mono uppercase" />
                        <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-4 rounded font-bold transition">Añadir</button>
                      </div>
                    </form>
                  </div>
                </div>


              </div>
                )}

              </div>
            )}

            {/* INVENTARIO MAESTRO CON ACCIONES Y EXCEL */}
            {subSeccionAdmin === 'ver-inventario' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center gap-3">
                  <input type="text" placeholder="Buscar por nombre o código de producto..." value={busquedaAdmin} onChange={(e) => setBusquedaAdmin(e.target.value)} className="p-2.5 border rounded-lg text-sm w-full max-w-sm" />
                  <button onClick={exportarAExcel} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-sm transition shrink-0">
                    📥 Exportar a Excel
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 text-xs font-bold border-b text-gray-600 uppercase tracking-wider">
                      <tr>
                        <th className="p-4">Código</th>
                        <th className="p-4">Producto</th>
                        <th className="p-4">Marca</th>
                        <th className="p-4">Precio</th>
                        <th className="p-4">Stock</th>
                        <th className="p-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {productosFiltradosAdmin.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-gray-400">No hay productos que coincidan con tu búsqueda.</td></tr>
                      ) : productosFiltradosAdmin.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50 transition">
                          <td className="p-4 sku text-gray-400">{p.id}</td>
                          <td className="p-4 font-semibold">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg border bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center">
                                {p.url_imagen ? (
                                  <img src={p.url_imagen} alt={p.nombre} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                ) : null}
                                <span className="text-gray-300 text-base" style={{ display: p.url_imagen ? 'none' : 'flex' }}>📦</span>
                              </div>
                              <span>{p.nombre}</span>
                            </div>
                          </td>
                          <td className="p-4 text-gray-500">{p.marca || '—'}</td>
                          <td className="p-4 font-bold">Q{parseFloat(p.precio).toFixed(2)}</td>
                          <td className="p-4"><span className={`px-2 py-0.5 rounded text-xs font-bold ${p.cantidad_stock < 20 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{parseFloat(p.cantidad_stock)} uds</span></td>
                          <td className="p-4 text-center space-x-2">
                            <button onClick={() => iniciarEdicion(p)} className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-bold px-3 py-1.5 rounded transition">✏️ Editar</button>
                            <button onClick={() => manejarEliminarProducto(p.id)} className="bg-red-100 text-red-700 hover:bg-red-200 text-xs font-bold px-3 py-1.5 rounded transition">🗑️ Eliminar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </>
        )}
      </div>
    </div>
  );
}