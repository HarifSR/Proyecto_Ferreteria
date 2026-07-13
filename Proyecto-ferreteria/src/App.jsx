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
    bajoStock: [], valorPorCategoria: [], topValorInventario: []
  });

  const [busquedaAdmin, setBusquedaAdmin] = useState('');

  // Formulario de Producto (Sirve para Crear y Editar)
  const [nuevoProd, setNuevoProd] = useState({
    id: '', nombre: '', precio: '', stock: '', categoria_id: '', unidad_base_id: '', marca: '', descripcion: ''
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
    if (subSeccionAdmin === 'reportes' && token) cargarReportesDashboard();
  }, [subSeccionAdmin, token]);

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
      descripcion: nuevoProd.descripcion || ''
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
      descripcion: producto.descripcion || ''
    });
    setSubSeccionAdmin('nuevo-producto'); // Lleva al usuario al formulario
  };

  const limpiarFormulario = () => {
    setModoEdicion(false);
    setNuevoProd({ id: '', nombre: '', precio: '', stock: '', categoria_id: '', unidad_base_id: '', marca: '', descripcion: '' });
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
                <button onClick={() => setSubSeccionAdmin('nuevo-producto')} className={`px-4 py-1.5 rounded-md font-semibold text-sm transition ${subSeccionAdmin === 'nuevo-producto' ? 'bg-orange-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>➕ Productos y Catálogos</button>
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
                    <p className="text-2xl font-black mt-2">${reportes.valorInventario.toFixed(2)}</p>
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

                {/* Tablas de Detalles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-5 rounded-xl border shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4">💎 Top 5 con Mayor Valor en Inventario</h3>
                    <div className="divide-y text-sm">
                      {reportes.topValorInventario.length === 0 ? <p className="text-gray-400 py-2">Aún no hay productos registrados.</p> : reportes.topValorInventario.map((prod) => (
                        <div key={prod.id} className="py-2.5 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-gray-800">{prod.nombre}</p>
                            <p className="text-xs text-gray-400">{prod.marca ? `${prod.marca} · ` : ''}{parseFloat(prod.cantidad_stock)} uds × ${parseFloat(prod.precio).toFixed(2)}</p>
                          </div>
                          <span className="bg-orange-100 text-orange-800 font-mono text-xs font-black px-2.5 py-1 rounded-full">${parseFloat(prod.valor_total).toFixed(2)}</span>
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
                              <span className="font-bold text-gray-800">${parseFloat(cat.valor).toFixed(2)}</span>
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
                          <td className="p-4 font-semibold">{p.nombre}</td>
                          <td className="p-4 text-gray-500">{p.marca || '—'}</td>
                          <td className="p-4 font-bold">${parseFloat(p.precio).toFixed(2)}</td>
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

            {/* GESTION DE CATALOGOS (NUEVO/EDITAR PRODUCTO) */}
            {subSeccionAdmin === 'nuevo-producto' && (
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
                        <label className="text-xs font-bold text-gray-500">Precio ($)</label>
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
          </>
        )}
      </div>
    </div>
  );
}