import React, { useState } from 'react';
import './App.css';

// 1. DATOS SIMULADOS (MOCK DATA)
const PRODUCTOS_INICIALES = [
  { id: 1, nombre: "Martillo de Uña 16oz", precio: 12.50, stock: 15, categoria: "Herramientas", tags: "clavar, golpear, madera, construir, herramienta de mano" },
  { id: 2, nombre: "Pegamento para PVC 4oz", precio: 5.00, stock: 42, categoria: "Gasfitería", tags: "pegar, tubos, agua, union, fontaneria, gotera" },
  { id: 3, nombre: "Cinta Métrica 5 metros", precio: 6.20, stock: 20, categoria: "Medición", tags: "medir, metro, distancia, regla, calcular" },
  { id: 4, nombre: "Foco LED 12W Luz Blanca", precio: 3.50, stock: 50, categoria: "Electricidad", tags: "iluminar, luz, lampara, bombillo, corriente" },
  { id: 5, nombre: "Codo PVC 1/2 pulgada", precio: 0.80, stock: 100, categoria: "Gasfitería", tags: "tubo, agua, esquina, conexion, fontaneria" }
];

export default function App() {
  // Estados globales
  const [productos, setProductos] = useState(PRODUCTOS_INICIALES);
  const [rol, setRol] = useState('cliente'); // 'cliente' o 'admin'
  const [subSeccionAdmin, setSubSeccionAdmin] = useState('ver-inventario'); // 'ver-inventario' o 'nuevo-producto'
  
  // Filtros Cliente
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState([]);
  
  // Filtros Admin (Búsqueda Detallada)
  const [busquedaAdmin, setBusquedaAdmin] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroStock, setFiltroStock] = useState('todos');

  // ESTADO DEL FORMULARIO COMPLETO (Estructurado según la tabla maestra)
  const [nuevoProd, setNuevoProd] = useState({ 
    id: '', 
    nombre: '', 
    categoria: '', 
    precio: '', 
    stock: '' 
  });

  // --- LÓGICA FILTRADO CLIENTE ---
  const productosFiltradosCliente = productos.filter(p => {
    const termino = busqueda.toLowerCase();
    return p.nombre.toLowerCase().includes(termino) || p.tags.toLowerCase().includes(termino);
  });

  // --- LÓGICA FILTRADO DETALLADO ADMINISTRADOR ---
  const productosFiltradosAdmin = productos.filter(p => {
    const termino = busquedaAdmin.toLowerCase();
    
    const coincideTexto = p.nombre.toLowerCase().includes(termino) || 
                          p.tags.toLowerCase().includes(termino) ||
                          p.id.toString() === termino;
    
    const coincideCategoria = filtroCategoria === '' || p.categoria === filtroCategoria;
    
    let coincideStock = true;
    if (filtroStock === 'bajo-stock') coincideStock = p.stock < 20;
    if (filtroStock === 'ok') coincideStock = p.stock >= 20;

    return coincideTexto && coincideCategoria && coincideStock;
  });

  // Obtener categorías dinámicas
  const categoriasUnicas = [...new Set(productos.map(p => p.categoria))];

  // Acciones Carrito
  const agregarAlCarrito = (producto) => {
    const existe = carrito.find(item => item.id === producto.id);
    if (existe) {
      setCarrito(carrito.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };

  // Guardar nuevo producto / Actualizar (CRUD Estructurado)
  const manejarCrearProducto = (e) => {
    e.preventDefault();
    if (!nuevoProd.nombre || !nuevoProd.precio || !nuevoProd.id) {
      alert("Por favor, rellena los campos mandatorios (ID, Producto y Precio)");
      return;
    }
    
    const idNumero = parseInt(nuevoProd.id);

    // Revisar si el ID ya existe para actualizar el stock/precio, o si es una inserción nueva
    const existeProducto = productos.some(p => p.id === idNumero);

    if (existeProducto) {
      // MODO ACTUALIZACIÓN
      setProductos(productos.map(p => p.id === idNumero ? {
        ...p,
        nombre: nuevoProd.nombre,
        categoria: nuevoProd.categoria || p.categoria,
        precio: parseFloat(nuevoProd.precio),
        stock: parseInt(nuevoProd.stock) || 0
      } : p));
      alert(`¡Producto #${idNumero} actualizado con éxito!`);
    } else {
      // MODO REGISTRO NUEVO
      const prodFormateado = {
        id: idNumero,
        nombre: nuevoProd.nombre,
        precio: parseFloat(nuevoProd.precio),
        stock: parseInt(nuevoProd.stock) || 0,
        categoria: nuevoProd.categoria || "General",
        tags: "" // Los tags vectoriales quedan vacíos para que los resuelva el backend
      };
      setProductos([...productos, prodFormateado]);
      alert("¡Nuevo artículo registrado en el inventario!");
    }

    // Limpiar formulario y regresar
    setNuevoProd({ id: '', nombre: '', categoria: '', precio: '', stock: '' });
    setSubSeccionAdmin('ver-inventario');
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      
      {/* BARRA SUPERIOR */}
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold text-yellow-500">🛠️ FerreSistema Pro</span>
          <span className="text-xs bg-slate-700 px-2 py-1 rounded">Prototipo V2</span>
        </div>
        <div className="flex space-x-2 bg-slate-800 p-1 rounded-lg">
          <button onClick={() => setRol('cliente')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${rol === 'cliente' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            🌐 Vista Cliente (Web Pública)
          </button>
          <button onClick={() => setRol('admin')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${rol === 'admin' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            🏢 BackOffice / Administrador
          </button>
        </div>
      </div>

      {/* VISTA CLIENTE */}
      {rol === 'cliente' && (
        <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold mb-2 flex items-center gap-2">🔍 Buscador Inteligente</h2>
              <input type="text" placeholder="¿Qué estás buscando para tu proyecto?..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {productosFiltradosCliente.map(p => (
                <div key={p.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between hover:shadow-md transition">
                  <div>
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">{p.categoria}</span>
                    <h3 className="font-bold text-lg mt-2 text-gray-900">{p.nombre}</h3>
                    <p className="text-xs text-gray-400 mt-1">Disponibles: {p.stock} unidades</p>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-xl font-black text-gray-900">${p.precio.toFixed(2)}</span>
                    <button onClick={() => agregarAlCarrito(p)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-2 rounded-lg">🛒 Agregar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
            <h2 className="text-lg font-bold border-b pb-3">🛒 Tu Pedido</h2>
            {/* ... Carrito simple ... */}
            {carrito.length === 0 ? <p className="text-gray-400 text-sm py-4 text-center">Vacío</p> : <p className="text-sm font-bold">Items añadidos: {carrito.length}</p>}
          </div>
        </div>
      )}

      {/* VISTA ADMINISTRACIÓN */}
      {rol === 'admin' && (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          
          {/* SubMenú */}
          <div className="flex space-x-4 border-b border-gray-300 pb-2">
            <button onClick={() => setSubSeccionAdmin('ver-inventario')} className={`pb-2 font-bold text-sm transition ${subSeccionAdmin === 'ver-inventario' ? 'border-b-2 border-orange-600 text-orange-600' : 'text-gray-500'}`}>
              📋 Listado Maestro de Inventario
            </button>
            <button onClick={() => setSubSeccionAdmin('nuevo-producto')} className={`pb-2 font-bold text-sm transition ${subSeccionAdmin === 'nuevo-producto' ? 'border-b-2 border-orange-600 text-orange-600' : 'text-gray-500'}`}>
              ➕ Registrar / Añadir Producto
            </button>
          </div>

          {/* LISTADO MAESTRO CON FILTROS */}
          {subSeccionAdmin === 'ver-inventario' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">🎛️ Panel de Filtros y Auditoría de Almacén</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Buscar por Nombre o ID</label>
                    <input type="text" placeholder="Ej: Martillo, 3..." value={busquedaAdmin} onChange={(e) => setBusquedaAdmin(e.target.value)} className="w-full p-2 text-sm border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Filtrar por Categoría</label>
                    <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="w-full p-2 text-sm border rounded bg-white h-[38px] text-slate-900">
                      <option value="">Todas las categorías</option>
                      {categoriasUnicas.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Estado de Almacenamiento</label>
                    <select value={filtroStock} onChange={(e) => setFiltroStock(e.target.value)} className="w-full p-2 text-sm border rounded bg-white h-[38px] text-slate-900">
                      <option value="todos">Mostrar todo el inventario</option>
                      <option value="bajo-stock">⚠️ Stock Crítico (&lt; 20 u.)</option>
                      <option value="ok">✅ Stock Estable (20+ u.)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold border-b">
                    <tr>
                      <th className="p-4">ID</th>
                      <th className="p-4">Producto</th>
                      <th className="p-4">Categoría</th>
                      <th className="p-4">Precio Unitario</th>
                      <th className="p-4">Existencias</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {productosFiltradosAdmin.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="p-4 font-mono text-gray-400">#{p.id}</td>
                        <td className="p-4 font-semibold text-gray-900">{p.nombre}</td>
                        <td className="p-4 text-gray-500">{p.categoria}</td>
                        <td className="p-4 font-bold text-slate-900">${p.precio.toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.stock < 20 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{p.stock} pzas</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* FORMULARIO DE ALTA / EDICIÓN COMPLETO CON LOS CAMPOS MAESTROS */}
          {subSeccionAdmin === 'nuevo-producto' && (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md border border-gray-200">
              <div className="mb-6 border-b pb-4">
                <h3 className="font-bold text-lg text-gray-800">Formulario de Control de Inventario</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Ingresa los campos correspondientes. Si digitas un <b>ID existente</b>, el sistema actualizará sus valores actuales en lugar de crear uno nuevo.
                </p>
              </div>
              
              <form onSubmit={manejarCrearProducto} className="space-y-5">
                <div className="grid grid-cols-3 gap-4">
                  {/* CAMPO 1: ID */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">ID Código</label>
                    <input 
                      type="number" 
                      placeholder="Ej: 6" 
                      value={nuevoProd.id} 
                      onChange={(e) => setNuevoProd({...nuevoProd, id: e.target.value})} 
                      className="w-full p-2.5 border rounded focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono" 
                    />
                  </div>
                  {/* CAMPO 3: CATEGORÍA */}
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-600 mb-1">Categoría</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Herramientas, Gasfitería, Electricidad" 
                      value={nuevoProd.categoria} 
                      onChange={(e) => setNuevoProd({...nuevoProd, categoria: e.target.value})} 
                      className="w-full p-2.5 border rounded focus:ring-2 focus:ring-orange-500 focus:outline-none" 
                    />
                  </div>
                </div>

                {/* CAMPO 2: PRODUCTO (NOMBRE) */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Producto (Nombre descriptivo)</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Disco de Corte Diamantado 4-1/2" 
                    value={nuevoProd.nombre} 
                    onChange={(e) => setNuevoProd({...nuevoProd, nombre: e.target.value})} 
                    className="w-full p-2.5 border rounded focus:ring-2 focus:ring-orange-500 focus:outline-none" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* CAMPO 4: PRECIO UNITARIO */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Precio Unitario ($)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      value={nuevoProd.precio} 
                      onChange={(e) => setNuevoProd({...nuevoProd, precio: e.target.value})} 
                      className="w-full p-2.5 border rounded focus:ring-2 focus:ring-orange-500 focus:outline-none" 
                    />
                  </div>
                  {/* CAMPO 5: EXISTENCIAS */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Existencias (Stock Inicial/Actual)</label>
                    <input 
                      type="number" 
                      placeholder="Cantidad en depósito" 
                      value={nuevoProd.stock} 
                      onChange={(e) => setNuevoProd({...nuevoProd, stock: e.target.value})} 
                      className="w-full p-2.5 border rounded focus:ring-2 focus:ring-orange-500 focus:outline-none" 
                    />
                  </div>
                </div>

                <div className="pt-4 flex space-x-3">
                  <button type="button" onClick={() => setSubSeccionAdmin('ver-inventario')} className="w-1/3 bg-gray-200 text-gray-700 font-bold py-2.5 rounded-lg text-sm hover:bg-gray-300 transition">
                    Volver al Listado
                  </button>
                  <button type="submit" className="w-2/3 bg-orange-600 text-white font-bold py-2.5 rounded-lg text-sm hover:bg-orange-700 transition shadow">
                    💾 Guardar Cambios (Registrar/Actualizar)
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      )}
    </div>
  );
}