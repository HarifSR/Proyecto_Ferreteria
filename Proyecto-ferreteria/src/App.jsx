import React, { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [unidades, setUnidades] = useState([]);
  
  const [rol, setRol] = useState('cliente'); 
  const [subSeccionAdmin, setSubSeccionAdmin] = useState('reportes');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  
  // Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Reportes y Filtros
  const [reportes, setReportes] = useState({ totalHoy: 0, masVendidos: [], bajoStock: [] });
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState([]);
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
    let csvContent = "data:text/csv;charset=utf-8,\uFEFFID;Producto;Precio;Stock\n";
    
    productosFiltradosAdmin.forEach(p => {
      // Se reemplazan comillas dobles para evitar roturas y se usa punto y coma (;) como separador para Excel
      const nombreLimpio = p.nombre.replace(/"/g, '""');
      csvContent += `"${p.id}";"${nombreLimpio}";"${p.precio}";"${p.cantidad_stock}"\n`;
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
  // LÓGICA RESTANTE (Caja, Filtros, Atributos)
  // --------------------------------------------------------
  // (Lógica de crear categorías/unidades se mantiene igual)
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

  const agregarAlCarrito = (producto) => {
    const existe = carrito.find(item => item.id === producto.id);
    if (existe) setCarrito(carrito.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item));
    else setCarrito([...carrito, { ...producto, cantidad: 1 }]);
  };
  const modificarCantidadCarrito = (id, delta) => setCarrito(carrito.map(item => item.id === id ? { ...item, cantidad: Math.max(1, item.cantidad + delta) } : item));
  const removerDelCarrito = (id) => setCarrito(carrito.filter(item => item.id !== id));
  const calcularTotalCarrito = () => carrito.reduce((acc, item) => acc + (parseFloat(item.precio) * item.cantidad), 0).toFixed(2);
  
  const procesarFacturacion = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrito: carrito, total: parseFloat(calcularTotalCarrito()) })
      });
      if (res.ok) { alert(`🧾 ¡Venta Exitosa!`); setCarrito([]); cargarInventario(); }
    } catch (error) { alert("Error en conexión."); }
  };

  const productosFiltradosCliente = productos.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  const productosFiltradosAdmin = productos.filter(p => p.nombre.toLowerCase().includes(busquedaAdmin.toLowerCase()) || p.id.toLowerCase().includes(busquedaAdmin.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      {/* Navbar */}
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
        <span className="text-xl font-bold text-yellow-500">🛠️ FerreSistema Pro</span>
        <div className="flex space-x-2 bg-slate-800 p-1 rounded-lg">
          <button onClick={() => setRol('cliente')} className={`px-4 py-1.5 rounded-md text-sm font-medium ${rol === 'cliente' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>🌐 Caja</button>
          <button onClick={() => setRol('admin')} className={`px-4 py-1.5 rounded-md text-sm font-medium ${rol === 'admin' ? 'bg-orange-600 text-white' : 'text-gray-400'}`}>🏢 BackOffice</button>
        </div>
      </div>

      {/* ROL VENTA CLIENTE */}
      {rol === 'cliente' && (
        <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <input type="text" placeholder="🔍 Filtra por nombre..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full p-3 bg-white border rounded-lg shadow-sm" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {productosFiltradosCliente.map(p => (
                <div key={p.id} className="bg-white p-5 rounded-xl shadow-sm border flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{p.categoria_nombre || 'General'}</span>
                      <span className="text-xs font-mono text-gray-400">{p.id}</span>
                    </div>
                    <h3 className="font-bold text-lg mt-2">{p.nombre}</h3>
                    <p className="text-xs font-bold text-gray-500 mt-1">Disponible: {p.cantidad_stock} {p.unidad_codigo || 'uds'}</p>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-xl font-black">${parseFloat(p.precio).toFixed(2)}</span>
                    <button onClick={() => agregarAlCarrito(p)} disabled={p.cantidad_stock <= 0} className="bg-blue-600 text-white text-sm font-semibold px-3 py-2 rounded-lg">🛒 Agregar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border h-fit sticky top-6">
            <h2 className="text-lg font-bold border-b pb-3">🧾 Factura Actual</h2>
            {carrito.length === 0 ? <p className="text-center py-8 text-gray-400 text-sm">El carrito está vacío.</p> : (
              <div className="space-y-4 mt-4">
                {carrito.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                    <div className="flex-1 truncate pr-2">
                      <p className="font-bold">{item.nombre}</p>
                      <p className="text-xs text-gray-400">${parseFloat(item.precio).toFixed(2)} c/u</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button onClick={() => modificarCantidadCarrito(item.id, -1)} className="bg-gray-200 px-1.5 rounded text-xs">-</button>
                      <span className="font-bold text-xs w-6 text-center">{item.cantidad}</span>
                      <button onClick={() => modificarCantidadCarrito(item.id, 1)} className="bg-gray-200 px-1.5 rounded text-xs">+</button>
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t font-black text-xl flex justify-between">
                  <span>Total:</span><span>${calcularTotalCarrito()}</span>
                </div>
                <button onClick={procesarFacturacion} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl text-sm">Confirmar Cobro</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ROL BACKOFFICE */}
      {rol === 'admin' && (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {!token ? (
            <div className="bg-white p-8 rounded-xl shadow-md border max-w-md mx-auto mt-10">
              <h2 className="text-xl font-bold text-center mb-4">🔐 Panel Administrativo</h2>
              <form onSubmit={manejarLogin} className="space-y-4">
                <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2.5 border rounded-lg" />
                <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2.5 border rounded-lg" />
                <button type="submit" className="w-full bg-orange-600 text-white font-bold py-2.5 rounded-lg">Ingresar</button>
              </form>
            </div>
          ) : (
            <>
              {/* Menu Subsecciones */}
              <div className="flex justify-between items-center border-b pb-2">
                <div className="flex space-x-4">
                  <button onClick={() => { setSubSeccionAdmin('reportes'); limpiarFormulario(); }} className={`pb-2 font-bold text-sm ${subSeccionAdmin === 'reportes' ? 'border-b-2 border-orange-600 text-orange-600' : 'text-gray-500'}`}>📊 Reportes</button>
                  <button onClick={() => { setSubSeccionAdmin('ver-inventario'); limpiarFormulario(); }} className={`pb-2 font-bold text-sm ${subSeccionAdmin === 'ver-inventario' ? 'border-b-2 border-orange-600 text-orange-600' : 'text-gray-500'}`}>📋 Inventario</button>
                  <button onClick={() => setSubSeccionAdmin('nuevo-producto')} className={`pb-2 font-bold text-sm ${subSeccionAdmin === 'nuevo-producto' ? 'border-b-2 border-orange-600 text-orange-600' : 'text-gray-500'}`}>➕ Gestionar Catálogos</button>
                </div>
                <button onClick={cerrarSesion} className="text-xs text-red-500 font-bold">🔒 Cerrar Sesión</button>
              </div>

              {/* REPORTES DETALLADOS RESTAURADOS */}
              {subSeccionAdmin === 'reportes' && (
                <div className="space-y-6">
                  {/* Tarjetas KPI */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-2xl shadow-sm">
                      <p className="text-xs font-bold uppercase tracking-wider opacity-80">💰 Ventas de Hoy</p>
                      <p className="text-3xl font-black mt-2">${reportes.totalHoy.toFixed(2)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border shadow-sm">
                      <p className="text-xs text-gray-400 font-bold uppercase">🚨 Productos en Stock Crítico</p>
                      <p className="text-2xl font-black text-red-500 mt-1">{reportes.bajoStock.length} alertas</p>
                    </div>
                  </div>

                  {/* Tablas de Detalles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-5 rounded-xl border shadow-sm">
                      <h3 className="font-bold text-gray-900 mb-4">🔥 Top 5 Más Vendidos</h3>
                      <div className="divide-y text-sm">
                        {reportes.masVendidos.length === 0 ? <p className="text-gray-400 py-2">Sin datos.</p> : reportes.masVendidos.map((prod, idx) => (
                          <div key={idx} className="py-2.5 flex justify-between items-center">
                            <div>
                              <p className="font-bold text-gray-800">{prod.nombre}</p>
                              <p className="text-xs text-gray-400">Ingresos: ${parseFloat(prod.ingresos_totales).toFixed(2)}</p>
                            </div>
                            <span className="bg-orange-100 text-orange-800 font-mono text-xs font-black px-2.5 py-1 rounded-full">{prod.unidades_vendidas} uds</span>
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
                            <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded">Quedan: {prod.cantidad_stock}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* INVENTARIO MAESTRO RESTAURADO CON ACCIONES Y EXCEL */}
              {subSeccionAdmin === 'ver-inventario' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <input type="text" placeholder="Filtrar inventario maestro..." value={busquedaAdmin} onChange={(e) => setBusquedaAdmin(e.target.value)} className="p-2 border rounded-lg text-sm w-full max-w-sm" />
                    <button onClick={exportarAExcel} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-sm transition">
                      📥 Exportar a Excel (CSV)
                    </button>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-100 text-xs font-bold border-b text-gray-600 uppercase">
                        <tr>
                          <th className="p-4">ID</th>
                          <th className="p-4">Producto</th>
                          <th className="p-4">Precio</th>
                          <th className="p-4">Stock</th>
                          <th className="p-4 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {productosFiltradosAdmin.map(p => (
                          <tr key={p.id} className="hover:bg-gray-50">
                            <td className="p-4 font-mono text-gray-400">{p.id}</td>
                            <td className="p-4 font-semibold">{p.nombre}</td>
                            <td className="p-4 font-bold">${parseFloat(p.precio).toFixed(2)}</td>
                            <td className="p-4"><span className={`px-2 py-0.5 rounded text-xs font-bold ${p.cantidad_stock < 20 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{p.cantidad_stock} uds</span></td>
                            <td className="p-4 text-center space-x-2">
                              <button onClick={() => iniciarEdicion(p)} className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-bold px-3 py-1.5 rounded transition">✏️ Editar</button>
                              <button onClick={() => manejarEliminarProducto(p.id)} className="bg-red-100 text-red-700 hover:bg-red-200 text-xs font-bold px-3 py-1.5 rounded transition">❌ Borrar</button>
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
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                      <h3 className="font-bold text-gray-800">
                        {modoEdicion ? '✏️ Actualizar Producto Existente' : '📦 Registrar Nuevo Producto'}
                      </h3>
                      {modoEdicion && (
                        <button onClick={limpiarFormulario} className="text-xs text-blue-500 font-bold hover:underline">Cancelar Edición</button>
                      )}
                    </div>
                    
                    <form onSubmit={manejarGuardarProducto} className="space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs font-bold text-gray-500">ID Único</label>
                          <input type="text" placeholder="Ej: PL01" value={nuevoProd.id} onChange={(e) => setNuevoProd({...nuevoProd, id: e.target.value})} disabled={modoEdicion} className={`w-full p-2 border rounded ${modoEdicion ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs font-bold text-gray-500">Nombre del Artículo</label>
                          <input type="text" value={nuevoProd.nombre} onChange={(e) => setNuevoProd({...nuevoProd, nombre: e.target.value})} className="w-full p-2 border rounded" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-bold text-gray-500">Categoría Relacionada</label>
                          <select value={nuevoProd.categoria_id} onChange={(e) => setNuevoProd({...nuevoProd, categoria_id: e.target.value})} className="w-full p-2 border rounded bg-gray-50 text-sm">
                            <option value="">-- Selecciona Categoría --</option>
                            {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500">Unidad de Medida</label>
                          <select value={nuevoProd.unidad_base_id} onChange={(e) => setNuevoProd({...nuevoProd, unidad_base_id: e.target.value})} className="w-full p-2 border rounded bg-gray-50 text-sm">
                            <option value="">-- Selecciona Unidad --</option>
                            {unidades.map(uni => <option key={uni.id} value={uni.id}>{uni.nombre} ({uni.abreviacion})</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-bold text-gray-500">Marca</label>
                          <input type="text" placeholder="Ej: Progreso" value={nuevoProd.marca} onChange={(e) => setNuevoProd({...nuevoProd, marca: e.target.value})} className="w-full p-2 border rounded" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500">Precio Público ($)</label>
                          <input type="number" step="0.01" value={nuevoProd.precio} onChange={(e) => setNuevoProd({...nuevoProd, precio: e.target.value})} className="w-full p-2 border rounded" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-bold text-gray-500">Stock {modoEdicion ? 'Actual' : 'Inicial'}</label>
                          <input type="number" value={nuevoProd.stock} onChange={(e) => setNuevoProd({...nuevoProd, stock: e.target.value})} className="w-full p-2 border rounded" />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-500">Descripción</label>
                        <textarea placeholder="Ej: Cemento de 42.5 kg por saco." value={nuevoProd.descripcion} onChange={(e) => setNuevoProd({...nuevoProd, descripcion: e.target.value})} rows={3} className="w-full p-2 border rounded resize-none" />
                      </div>

                      <button type="submit" className={`w-full text-white font-bold py-2 rounded-lg text-sm mt-2 transition ${modoEdicion ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'}`}>
                        {modoEdicion ? '💾 Guardar Cambios' : '💾 Añadir a Inventario'}
                      </button>
                    </form>
                  </div>

                  {/* Formularios Rápidos Laterales */}
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl border shadow-sm">
                      <h4 className="font-bold text-xs text-gray-700 uppercase tracking-wider mb-2">📁 Nueva Categoría</h4>
                      <form onSubmit={manejarCrearCategoria} className="flex space-x-2">
                        <input type="text" placeholder="Ej: Electricidad" value={nuevaCatNombre} onChange={(e) => setNuevaCatNombre(e.target.value)} className="border p-1.5 rounded text-sm flex-1" />
                        <button type="submit" className="bg-slate-800 text-white text-xs px-3 rounded font-bold">+</button>
                      </form>
                    </div>

                    <div className="bg-white p-4 rounded-xl border shadow-sm">
                      <h4 className="font-bold text-xs text-gray-700 uppercase tracking-wider mb-2">📏 Nueva Unidad</h4>
                      <form onSubmit={manejarCrearUnidad} className="space-y-2">
                        <input type="text" placeholder="Nombre (Ej: Metro)" value={nuevaUniNombre} onChange={(e) => setNuevaUniNombre(e.target.value)} className="w-full border p-1.5 rounded text-sm" />
                        <div className="flex space-x-2">
                          <input type="text" placeholder="Cód (Ej: M)" value={nuevaUniCodigo} onChange={(e) => setNuevaUniCodigo(e.target.value)} className="border p-1.5 rounded text-sm flex-1 font-mono uppercase" />
                          <button type="submit" className="bg-slate-800 text-white text-xs px-4 rounded font-bold">Añadir</button>
                        </div>
                      </form>
                    </div>
                  </div>

                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
} 