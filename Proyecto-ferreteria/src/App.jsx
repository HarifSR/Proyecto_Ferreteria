import React, { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import './App.css';

// ---- SweetAlert2 con la misma estética oscura del sistema ----
const swalBase = {
  background: '#1A1E24',
  color: '#F1F3F6',
  buttonsStyling: true,
  customClass: { popup: 'swal-ferre' }
};

const alertaExito = (mensaje) => Swal.fire({
  ...swalBase, icon: 'success', title: mensaje,
  confirmButtonColor: '#3FBE6B'
});

const alertaError = (mensaje, titulo = 'Ocurrió un error') => Swal.fire({
  ...swalBase, icon: 'error', title: titulo, text: mensaje,
  confirmButtonColor: '#D6483E'
});

const alertaAdvertencia = (mensaje) => Swal.fire({
  ...swalBase, icon: 'warning', title: mensaje,
  confirmButtonColor: '#F0AE3C'
});

const confirmarAccion = async (titulo, texto, textoConfirmar = 'Sí, continuar') => {
  const resultado = await Swal.fire({
    ...swalBase, icon: 'warning', title: titulo, text: texto,
    showCancelButton: true,
    confirmButtonText: textoConfirmar,
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#D6483E',
    cancelButtonColor: '#2A3038'
  });
  return resultado.isConfirmed;
};

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
    historialVentas: [], historialCompras: [],
    comparativas: {
      semana: { ventas: { actual: 0, anterior: 0 }, compras: { actual: 0, anterior: 0 }, ganancia: { actual: 0, anterior: 0 } },
      mes: { ventas: { actual: 0, anterior: 0 }, compras: { actual: 0, anterior: 0 }, ganancia: { actual: 0, anterior: 0 } },
      anio: { ventas: { actual: 0, anterior: 0 }, compras: { actual: 0, anterior: 0 }, ganancia: { actual: 0, anterior: 0 } }
    },
    serieMensual: [],
    masVendidos: [], menosVendidos: [], ventasPorProducto: []
  });

  const [busquedaAdmin, setBusquedaAdmin] = useState('');
  const [modoCatalogo, setModoCatalogo] = useState('producto'); // 'producto' | 'venta' | 'compra'

  // Registro de Ventas
  const [productoVentaSel, setProductoVentaSel] = useState('');
  const [cantidadVentaSel, setCantidadVentaSel] = useState('1');
  const [lineasVenta, setLineasVenta] = useState([]);
  const [tipoVentaNueva, setTipoVentaNueva] = useState('Contado');
  const [ventaExpandida, setVentaExpandida] = useState(null);
  const [periodoComparativa, setPeriodoComparativa] = useState('mes'); // 'semana' | 'mes' | 'anio'
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
      if (res.ok) {
        setReportes(await res.json());
      } else {
        const data = await res.json().catch(() => ({}));
        console.error("Error al cargar reportes:", res.status, data.error);
        alertaAdvertencia(`No se pudieron cargar los reportes (${res.status}). ${data.error || 'Revisa la consola del servidor.'}`);
      }
    } catch (error) {
      console.error("Error reportes:", error);
      alertaError("No se pudo conectar con el servidor para cargar los reportes.");
    }
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
    if (!productoVentaSel) { alertaAdvertencia("Selecciona un producto."); return; }
    const producto = productos.find(p => p.id === productoVentaSel);
    const cantidad = parseFloat(cantidadVentaSel);
    if (!cantidad || cantidad <= 0) { alertaAdvertencia("Ingresa una cantidad válida."); return; }

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
    if (lineasVenta.length === 0) { alertaAdvertencia("Agrega al menos un producto a la venta."); return; }
    try {
      const res = await fetch('http://localhost:5000/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ items: lineasVenta, tipoVenta: tipoVentaNueva })
      });
      const data = await res.json();
      if (res.ok) {
        alertaExito(data.mensaje);
        setLineasVenta([]);
        setTipoVentaNueva('Contado');
        cargarInventario();
        cargarReportesDashboard();
      } else {
        alertaError(data.error);
      }
    } catch (error) { alertaError("Error al registrar la venta."); }
  };

  const marcarVentaPagada = async (id) => {
    if (!(await confirmarAccion("¿Marcar como cobrada?", "Confirmas que esta venta a crédito ya fue cobrada.", "Sí, marcar cobrada"))) return;
    try {
      const res = await fetch(`http://localhost:5000/api/ventas/${id}/pagar`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { cargarReportesDashboard(); }
    } catch (error) { alertaError("Error al actualizar la venta."); }
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
    if (!productoCompraSel) { alertaAdvertencia("Selecciona un producto."); return; }
    const producto = productos.find(p => p.id === productoCompraSel);
    const cantidad = parseFloat(cantidadCompraSel);
    const costo = parseFloat(costoCompraSel);
    if (!cantidad || cantidad <= 0) { alertaAdvertencia("Ingresa una cantidad válida."); return; }
    if (!costo || costo < 0) { alertaAdvertencia("Ingresa el costo unitario de compra."); return; }

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
    if (lineasCompra.length === 0) { alertaAdvertencia("Agrega al menos un producto a la compra."); return; }
    try {
      const res = await fetch('http://localhost:5000/api/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ items: lineasCompra, proveedor: proveedorCompra })
      });
      const data = await res.json();
      if (res.ok) {
        alertaExito(data.mensaje);
        setLineasCompra([]);
        setProveedorCompra('');
        cargarInventario();
        cargarReportesDashboard();
      } else {
        alertaError(data.error);
      }
    } catch (error) { alertaError("Error al registrar la compra."); }
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
      alertaAdvertencia("Por favor, rellena los campos principales.");
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
        alertaExito(`Producto ${modoEdicion ? 'actualizado' : 'registrado'} con éxito.`);
        limpiarFormulario();
        cargarInventario();
        setSubSeccionAdmin('ver-inventario');
      } else {
        const data = await res.json();
        alertaError(data.error);
      }
    } catch (error) { alertaError("Error crítico al guardar el producto."); }
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
    if (!(await confirmarAccion("¿Eliminar producto?", `Se eliminará permanentemente el producto ${id_producto}.`, "Sí, eliminar"))) return;
    try {
      const res = await fetch(`http://localhost:5000/api/productos/${id_producto}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alertaExito("Producto eliminado.");
        cargarInventario();
      }
    } catch (error) { alertaError("Error al eliminar."); }
  };

  // --------------------------------------------------------
  // EXPORTAR A EXCEL (CSV)
  // --------------------------------------------------------
  const exportarReportesExcel = async () => {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'FerreSistema Pro';
    wb.created = new Date();

    // Paleta de marca (mismos colores del sistema)
    const NAVY = 'FF171B1F';
    const AMBER = 'FFF0AE3C';
    const STEEL = 'FF5B92E5';
    const GREEN = 'FF2FA85A';
    const RED = 'FFD6483E';
    const GRAY_LIGHT = 'FFF3F4F6';
    const WHITE = 'FFFFFFFF';
    const MONEDA = '"Q"#,##0.00';

    const bordeFino = { style: 'thin', color: { argb: 'FFD9D9D9' } };
    const bordeCelda = { top: bordeFino, left: bordeFino, bottom: bordeFino, right: bordeFino };

    // Aplica el estilo de encabezado (fondo oscuro, texto blanco) a una fila
    const estiloEncabezado = (fila, color = NAVY) => {
      fila.eachCell(celda => {
        celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
        celda.font = { bold: true, color: { argb: WHITE }, size: 11 };
        celda.alignment = { vertical: 'middle', horizontal: 'left' };
        celda.border = bordeCelda;
      });
      fila.height = 22;
    };

    // Sombrea filas alternas y les pone borde, para que sea fácil de leer
    const estiloFilas = (hoja, desde) => {
      for (let i = desde; i <= hoja.rowCount; i++) {
        const fila = hoja.getRow(i);
        fila.eachCell({ includeEmpty: true }, celda => {
          celda.border = bordeCelda;
          if (i % 2 === 0) celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRAY_LIGHT } };
        });
      }
    };

    const tituloHoja = (hoja, texto) => {
      hoja.mergeCells(1, 1, 1, Math.max(hoja.columns.length, 2));
      const celda = hoja.getCell('A1');
      celda.value = texto;
      celda.font = { bold: true, size: 14, color: { argb: NAVY } };
      hoja.getRow(1).height = 26;
      const sub = hoja.getCell('A2');
      sub.value = `FerreSistema Pro · Generado el ${new Date().toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' })}`;
      sub.font = { italic: true, size: 9, color: { argb: 'FF8A94A0' } };
      hoja.addRow([]);
    };

    // ============ HOJA 1: RESUMEN GENERAL ============
    const hResumen = wb.addWorksheet('Resumen');
    hResumen.columns = [{ width: 42 }, { width: 22 }];
    tituloHoja(hResumen, 'Resumen General del Negocio');
    const filaEncResumen = hResumen.addRow(['Indicador', 'Valor']);
    estiloEncabezado(filaEncResumen, NAVY);
    const filasResumen = [
      ['Valor Total del Inventario', reportes.valorInventario, true],
      ['Productos Registrados', reportes.totalProductos, false],
      ['Productos con Stock Bajo (< 20 uds)', reportes.stockBajoCantidad, false],
      ['Productos Agotados', reportes.agotados, false],
      ['Ganancia de Hoy', reportes.gananciaHoy, true],
      ['Ganancia del Mes', reportes.gananciaMes, true],
      ['Pendiente de Cobro (Ventas a Crédito)', reportes.pendienteTotal, true],
      ['Ventas a Crédito sin Cobrar', reportes.pendienteCantidad, false],
      ['Compras del Mes (Reabastecimiento)', reportes.comprasMes, true]
    ];
    filasResumen.forEach(([etiqueta, valor, esMoneda]) => {
      const fila = hResumen.addRow([etiqueta, valor]);
      if (esMoneda) fila.getCell(2).numFmt = MONEDA;
      fila.getCell(2).font = { bold: true };
    });
    estiloFilas(hResumen, 4);

    // ============ HOJA 2: COMPARATIVA POR PERIODO ============
    const hComp = wb.addWorksheet('Comparativas');
    hComp.columns = [{ width: 26 }, { width: 14 }, { width: 16 }, { width: 16 }, { width: 14 }];
    tituloHoja(hComp, 'Comparativa por Periodo (Actual vs. Anterior)');
    const filaEncComp = hComp.addRow(['Periodo', 'Métrica', 'Actual', 'Anterior', 'Variación']);
    estiloEncabezado(filaEncComp, NAVY);
    const nombrePeriodo = { semana: 'Semana', mes: 'Mes', anio: 'Año' };
    ['semana', 'mes', 'anio'].forEach(periodo => {
      const datos = reportes.comparativas[periodo];
      [['Ventas', datos.ventas], ['Compras', datos.compras], ['Ganancia', datos.ganancia]].forEach(([etiqueta, val]) => {
        const cambio = val.anterior > 0 ? ((val.actual - val.anterior) / val.anterior) : (val.actual > 0 ? 1 : 0);
        const fila = hComp.addRow([nombrePeriodo[periodo], etiqueta, val.actual, val.anterior, cambio]);
        fila.getCell(3).numFmt = MONEDA;
        fila.getCell(4).numFmt = MONEDA;
        fila.getCell(5).numFmt = '+0.0%;-0.0%';
        fila.getCell(5).font = { bold: true, color: { argb: cambio >= 0 ? GREEN : RED } };
      });
    });
    estiloFilas(hComp, 4);

    // ============ HOJA 3: TOP VALOR EN INVENTARIO ============
    const hTop = wb.addWorksheet('Top Valor Inventario');
    hTop.columns = [{ width: 34 }, { width: 18 }, { width: 12 }, { width: 16 }, { width: 16 }];
    tituloHoja(hTop, 'Top 5 — Mayor Valor en Inventario');
    const filaEncTop = hTop.addRow(['Producto', 'Marca', 'Stock', 'Precio Unitario', 'Valor Total']);
    estiloEncabezado(filaEncTop, AMBER);
    reportes.topValorInventario.forEach(p => {
      const fila = hTop.addRow([p.nombre, p.marca || '—', parseFloat(p.cantidad_stock), parseFloat(p.precio), parseFloat(p.valor_total)]);
      fila.getCell(4).numFmt = MONEDA;
      fila.getCell(5).numFmt = MONEDA;
      fila.getCell(5).font = { bold: true };
    });
    if (reportes.topValorInventario.length === 0) hTop.addRow(['Aún no hay productos registrados.']);
    estiloFilas(hTop, 4);

    // ============ HOJA 4: REABASTECIMIENTO ============
    const hReab = wb.addWorksheet('Reabastecimiento');
    hReab.columns = [{ width: 14 }, { width: 40 }, { width: 16 }];
    tituloHoja(hReab, 'Requiere Reabastecimiento');
    const filaEncReab = hReab.addRow(['Código', 'Producto', 'Stock Actual']);
    estiloEncabezado(filaEncReab, RED);
    if (reportes.bajoStock.length === 0) {
      hReab.addRow(['—', 'Buen stock general, sin alertas.', '—']);
    } else {
      reportes.bajoStock.forEach(p => {
        const fila = hReab.addRow([p.id, p.nombre, parseFloat(p.cantidad_stock)]);
        fila.getCell(3).font = { bold: true, color: { argb: RED } };
      });
    }
    estiloFilas(hReab, 4);

    // ============ HOJA 5: VALOR POR CATEGORÍA ============
    const hCat = wb.addWorksheet('Categorías');
    hCat.columns = [{ width: 28 }, { width: 20 }, { width: 18 }];
    tituloHoja(hCat, 'Valor de Inventario por Categoría');
    const filaEncCat = hCat.addRow(['Categoría', 'Cantidad de Productos', 'Valor Total']);
    estiloEncabezado(filaEncCat, STEEL);
    reportes.valorPorCategoria.forEach(c => {
      const fila = hCat.addRow([c.categoria, c.cantidad_productos, parseFloat(c.valor)]);
      fila.getCell(3).numFmt = MONEDA;
    });
    estiloFilas(hCat, 4);

    // ============ HOJA 6: VENTAS VS COMPRAS (12 MESES) ============
    const hSerie = wb.addWorksheet('Ventas vs Compras');
    hSerie.columns = [{ width: 16 }, { width: 16 }, { width: 16 }];
    tituloHoja(hSerie, 'Ventas vs Compras — Últimos 12 Meses');
    const filaEncSerie = hSerie.addRow(['Mes', 'Ventas', 'Compras']);
    estiloEncabezado(filaEncSerie, NAVY);
    reportes.serieMensual.forEach(m => {
      // Se guarda el mes como TEXTO explícito para que Excel no intente adivinar una fecha y lo corrompa
      const fila = hSerie.addRow([m.etiqueta, m.ventas, m.compras]);
      fila.getCell(1).numFmt = '@';
      fila.getCell(2).numFmt = MONEDA;
      fila.getCell(3).numFmt = MONEDA;
    });
    estiloFilas(hSerie, 4);

    // ============ HOJA 6.1: TOP 10 MÁS VENDIDOS ============
    const hMasVendidos = wb.addWorksheet('Más Vendidos');
    hMasVendidos.columns = [{ width: 6 }, { width: 34 }, { width: 18 }, { width: 14 }, { width: 16 }];
    tituloHoja(hMasVendidos, 'Top 10 Productos Más Vendidos');
    const filaEncMasVendidos = hMasVendidos.addRow(['#', 'Producto', 'Marca', 'Cantidad Vendida', 'Ingresos']);
    estiloEncabezado(filaEncMasVendidos, GREEN);
    reportes.masVendidos.forEach((p, idx) => {
      const fila = hMasVendidos.addRow([idx + 1, p.nombre, p.marca || '—', p.cantidadVendida, p.ingresos]);
      fila.getCell(5).numFmt = MONEDA;
    });
    if (reportes.masVendidos.length === 0) hMasVendidos.addRow(['—', 'Aún no hay ventas registradas.', '', '', '']);
    estiloFilas(hMasVendidos, 4);

    // ============ HOJA 6.2: TOP 10 MENOS VENDIDOS ============
    const hMenosVendidos = wb.addWorksheet('Menos Vendidos');
    hMenosVendidos.columns = [{ width: 6 }, { width: 34 }, { width: 18 }, { width: 14 }, { width: 16 }];
    tituloHoja(hMenosVendidos, 'Top 10 Productos Menos Vendidos');
    const filaEncMenosVendidos = hMenosVendidos.addRow(['#', 'Producto', 'Marca', 'Cantidad Vendida', 'Ingresos']);
    estiloEncabezado(filaEncMenosVendidos, RED);
    reportes.menosVendidos.forEach((p, idx) => {
      const fila = hMenosVendidos.addRow([idx + 1, p.nombre, p.marca || '—', p.cantidadVendida, p.ingresos]);
      fila.getCell(5).numFmt = MONEDA;
    });
    if (reportes.menosVendidos.length === 0) hMenosVendidos.addRow(['—', 'Aún no hay productos registrados.', '', '', '']);
    estiloFilas(hMenosVendidos, 4);

    // ============ HOJA 6.3: VENTAS POR PRODUCTO (TODOS, DETALLADO) ============
    const hVentasProducto = wb.addWorksheet('Ventas por Producto');
    hVentasProducto.columns = [{ width: 34 }, { width: 18 }, { width: 16 }, { width: 16 }];
    tituloHoja(hVentasProducto, 'Cantidad Vendida por Producto (Histórico Completo)');
    const filaEncVentasProducto = hVentasProducto.addRow(['Producto', 'Marca', 'Cantidad Vendida', 'Ingresos']);
    estiloEncabezado(filaEncVentasProducto, STEEL);
    reportes.ventasPorProducto.forEach(p => {
      const fila = hVentasProducto.addRow([p.nombre, p.marca || '—', p.cantidadVendida, p.ingresos]);
      fila.getCell(4).numFmt = MONEDA;
    });
    if (reportes.ventasPorProducto.length === 0) hVentasProducto.addRow(['Aún no hay productos registrados.', '', '', '']);
    estiloFilas(hVentasProducto, 4);

    // ============ HOJA 7: HISTORIAL DE VENTAS ============
    const hVentas = wb.addWorksheet('Historial Ventas');
    hVentas.columns = [{ width: 10 }, { width: 20 }, { width: 12 }, { width: 14 }, { width: 12 }, { width: 14 }];
    tituloHoja(hVentas, 'Historial de Ventas Recientes');
    const filaEncVentas = hVentas.addRow(['Venta #', 'Fecha', 'Tipo', 'Estado', 'Artículos', 'Total']);
    estiloEncabezado(filaEncVentas, NAVY);
    if (!reportes.historialVentas || reportes.historialVentas.length === 0) {
      hVentas.addRow(['—', 'Aún no se ha registrado ninguna venta.', '', '', '', '']);
    } else {
      reportes.historialVentas.forEach(v => {
        const fila = hVentas.addRow([
          v.id,
          new Date(v.fecha).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' }),
          v.tipo_venta,
          v.estado,
          v.items,
          parseFloat(v.total)
        ]);
        fila.getCell(6).numFmt = MONEDA;
        fila.getCell(6).font = { bold: true };
        fila.getCell(4).font = { bold: true, color: { argb: v.estado === 'Pendiente' ? RED : GREEN } };
        fila.getCell(3).font = { bold: true, color: { argb: v.tipo_venta === 'Crédito' ? AMBER : STEEL } };
      });
    }
    estiloFilas(hVentas, 4);

    // ============ HOJA 8: HISTORIAL DE COMPRAS ============
    const hCompras = wb.addWorksheet('Historial Compras');
    hCompras.columns = [{ width: 10 }, { width: 20 }, { width: 22 }, { width: 12 }, { width: 14 }];
    tituloHoja(hCompras, 'Historial de Compras Recientes');
    const filaEncCompras = hCompras.addRow(['Compra #', 'Fecha', 'Proveedor', 'Artículos', 'Total']);
    estiloEncabezado(filaEncCompras, STEEL);
    if (!reportes.historialCompras || reportes.historialCompras.length === 0) {
      hCompras.addRow(['—', 'Aún no se ha registrado ninguna compra.', '', '', '']);
    } else {
      reportes.historialCompras.forEach(c => {
        const fila = hCompras.addRow([
          c.id,
          new Date(c.fecha).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' }),
          c.proveedor || '—',
          c.items,
          parseFloat(c.total)
        ]);
        fila.getCell(5).numFmt = MONEDA;
        fila.getCell(5).font = { bold: true };
      });
    }
    estiloFilas(hCompras, 4);

    // Generar el archivo y descargarlo
    try {
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Reporte_FerreSistema_${new Date().toLocaleDateString('es-GT').replace(/\//g, '-')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al generar el Excel:', error);
      alertaError('No se pudo generar el archivo de Excel. Revisa la consola.');
    }
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
      } else { alertaError("Credenciales incorrectas"); }
    } catch (error) { alertaError("Error de servidor"); }
  };

  const cerrarSesion = () => { setToken(''); localStorage.removeItem('token'); setSubSeccionAdmin('ver-inventario'); };

  const productosFiltradosAdmin = productos.filter(p => p.nombre.toLowerCase().includes(busquedaAdmin.toLowerCase()) || p.id.toLowerCase().includes(busquedaAdmin.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      {!token ? (
        <div className="h-screen flex items-center justify-center">
          <div className="bg-white p-8 rounded-xl shadow-md border max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <span className="brand-mark text-lg font-bold text-orange-600 tracking-tight">FerreSistema Pro</span>
              <h2 className="text-xl font-bold mt-3">Acceso Administrativo</h2>
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
        </div>
      ) : (
        <div className="flex h-screen">
          {/* Sidebar */}
          <div className="w-64 bg-slate-900 text-white flex flex-col h-screen shrink-0">
            <div className="px-5 py-5 border-b border-slate-700">
              <span className="brand-mark text-lg font-bold text-yellow-500 tracking-tight">FerreSistema Pro</span>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Control de Inventario</p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <button onClick={() => { setSubSeccionAdmin('reportes'); limpiarFormulario(); }} className={`w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg font-semibold text-sm transition ${subSeccionAdmin === 'reportes' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`}>Reportes</button>
              <button onClick={() => { setSubSeccionAdmin('ver-inventario'); limpiarFormulario(); }} className={`w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg font-semibold text-sm transition ${subSeccionAdmin === 'ver-inventario' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`}>Inventario</button>

              <p className="px-3 pt-4 pb-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Productos y Catálogos</p>
              <button onClick={() => { setSubSeccionAdmin('nuevo-producto'); setModoCatalogo('producto'); }} className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition ${subSeccionAdmin === 'nuevo-producto' && modoCatalogo === 'producto' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`}>Nuevo Producto</button>
              <button onClick={() => { setSubSeccionAdmin('nuevo-producto'); setModoCatalogo('venta'); }} className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition ${subSeccionAdmin === 'nuevo-producto' && modoCatalogo === 'venta' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`}>Registrar Venta</button>
              <button onClick={() => { setSubSeccionAdmin('nuevo-producto'); setModoCatalogo('compra'); }} className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition ${subSeccionAdmin === 'nuevo-producto' && modoCatalogo === 'compra' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`}>Registrar Compra</button>
            </div>

            <div className="p-3 border-t border-slate-700">
              <button onClick={cerrarSesion} className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold text-red-400 hover:text-red-300 hover:bg-slate-800 transition">Cerrar Sesión</button>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 overflow-y-auto">
            <div className="w-full px-8 py-6 space-y-6">

            {/* REPORTES DE INVENTARIO */}
            {subSeccionAdmin === 'reportes' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Panel de Reportes</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Resumen general del negocio, actualizado en tiempo real.</p>
                  </div>
                  <button onClick={exportarReportesExcel} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-sm transition shrink-0">
                    Exportar Reporte Completo
                  </button>
                </div>

                {/* Tarjetas KPI principales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-5 rounded-2xl shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider opacity-80">Valor del Inventario</p>
                    <p className="text-2xl font-black mt-2">Q{reportes.valorInventario.toFixed(2)}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border shadow-sm">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Productos Registrados</p>
                    <p className="text-2xl font-black mt-2">{reportes.totalProductos}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border shadow-sm">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Stock Bajo</p>
                    <p className="text-2xl font-black text-orange-600 mt-2">{reportes.stockBajoCantidad}</p>
                    <p className="text-xs text-gray-400 mt-1">Menos de 20 unidades</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border shadow-sm">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Agotados</p>
                    <p className="text-2xl font-black text-red-500 mt-2">{reportes.agotados}</p>
                    <p className="text-xs text-gray-400 mt-1">Sin unidades disponibles</p>
                  </div>
                </div>

                {/* Ganancia y pendientes de cobro */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border shadow-sm">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Ganancia Hoy</p>
                    <p className="text-2xl font-black text-green-600 mt-2">Q{reportes.gananciaHoy.toFixed(2)}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border shadow-sm">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Ganancia del Mes</p>
                    <p className="text-2xl font-black text-green-600 mt-2">Q{reportes.gananciaMes.toFixed(2)}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border shadow-sm">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Pendiente de Cobro</p>
                    <p className="text-2xl font-black text-orange-600 mt-2">Q{reportes.pendienteTotal.toFixed(2)}</p>
                    <p className="text-xs text-gray-400 mt-1">{reportes.pendienteCantidad} venta{reportes.pendienteCantidad != 1 ? 's' : ''} a crédito sin cobrar</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border shadow-sm">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Compras del Mes</p>
                    <p className="text-2xl font-black text-blue-600 mt-2">Q{reportes.comprasMes.toFixed(2)}</p>
                    <p className="text-xs text-gray-400 mt-1">Invertido en reabastecimiento</p>
                  </div>
                </div>

                {/* Tablas de Detalles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-5 rounded-xl border shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4">Top 5 con Mayor Valor en Inventario</h3>
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
                    <h3 className="font-bold text-red-500 mb-4">Requiere Reabastecimiento</h3>
                    <div className="divide-y text-sm max-h-60 overflow-y-auto">
                      {reportes.bajoStock.length === 0 ? <p className="text-green-600 py-2">Buen stock general.</p> : reportes.bajoStock.map((prod) => (
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

                {/* Top 10 más vendidos / menos vendidos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-5 rounded-xl border shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-1">Top 10 Más Vendidos</h3>
                    <p className="text-xs text-gray-400 mb-4">Cantidad total vendida hasta el momento.</p>
                    <div className="divide-y text-sm">
                      {reportes.masVendidos.length === 0 ? <p className="text-gray-400 py-2">Aún no hay ventas registradas.</p> : reportes.masVendidos.map((prod, idx) => (
                        <div key={prod.id} className="py-2.5 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-gray-800">{idx + 1}. {prod.nombre}</p>
                            <p className="text-xs text-gray-400">{prod.marca ? `${prod.marca} · ` : ''}Ingresos: Q{prod.ingresos.toFixed(2)}</p>
                          </div>
                          <span className="bg-green-100 text-green-800 font-mono text-xs font-black px-2.5 py-1 rounded-full">{prod.cantidadVendida} uds</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-1">Top 10 Menos Vendidos</h3>
                    <p className="text-xs text-gray-400 mb-4">Productos que casi no se mueven (incluye los que nunca se han vendido).</p>
                    <div className="divide-y text-sm">
                      {reportes.menosVendidos.length === 0 ? <p className="text-gray-400 py-2">Aún no hay productos registrados.</p> : reportes.menosVendidos.map((prod, idx) => (
                        <div key={prod.id} className="py-2.5 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-gray-800">{idx + 1}. {prod.nombre}</p>
                            <p className="text-xs text-gray-400">{prod.marca ? `${prod.marca} · ` : ''}Ingresos: Q{prod.ingresos.toFixed(2)}</p>
                          </div>
                          <span className="bg-red-100 text-red-800 font-mono text-xs font-black px-2.5 py-1 rounded-full">{prod.cantidadVendida} uds</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Valor de inventario por categoría */}
                {reportes.valorPorCategoria.length > 0 && (
                  <div className="bg-white p-5 rounded-xl border shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-1">Valor de Inventario por Categoría</h3>
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

              {/* Comparativa por periodo: semana / mes / año */}
              <div className="bg-white p-5 rounded-xl border shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">Comparativa de Periodo</h3>
                    <p className="text-xs text-gray-400 mt-0.5">El periodo actual contra el inmediato anterior.</p>
                  </div>
                  <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-fit">
                    <button onClick={() => setPeriodoComparativa('semana')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${periodoComparativa === 'semana' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>Semana</button>
                    <button onClick={() => setPeriodoComparativa('mes')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${periodoComparativa === 'mes' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>Mes</button>
                    <button onClick={() => setPeriodoComparativa('anio')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${periodoComparativa === 'anio' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>Año</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(() => {
                    const datos = reportes.comparativas[periodoComparativa];
                    const metricas = [
                      { key: 'ventas', label: 'Ventas', color: 'text-blue-600' },
                      { key: 'compras', label: 'Compras', color: 'text-orange-600' },
                      { key: 'ganancia', label: 'Ganancia', color: 'text-green-600' }
                    ];
                    return metricas.map(m => {
                      const actual = datos[m.key].actual;
                      const anterior = datos[m.key].anterior;
                      const cambio = anterior > 0 ? ((actual - anterior) / anterior) * 100 : (actual > 0 ? 100 : 0);
                      const subio = cambio >= 0;
                      return (
                        <div key={m.key} className="p-4 rounded-xl bg-gray-50 border">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{m.label}</p>
                          <p className={`text-xl font-black mt-1 ${m.color}`}>Q{actual.toFixed(2)}</p>
                          <p className={`text-xs font-bold mt-1 ${subio ? 'text-green-600' : 'text-red-500'}`}>
                            {subio ? '▲' : '▼'} {Math.abs(cambio).toFixed(0)}% <span className="text-gray-400 font-normal">vs anterior (Q{anterior.toFixed(2)})</span>
                          </p>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Gráfica: Ventas vs Compras por mes */}
              <div className="bg-white p-5 rounded-xl border shadow-sm">
                <h3 className="font-bold text-gray-900 mb-1">Ventas vs Compras — Últimos 12 Meses</h3>
                <p className="text-xs text-gray-400 mb-4">Compara cuánto vendiste contra cuánto invertiste en reabastecimiento cada mes.</p>
                {reportes.serieMensual.length === 0 ? (
                  <p className="text-gray-400 text-sm">Aún no hay suficientes datos para graficar.</p>
                ) : (() => {
                  const datos = reportes.serieMensual;
                  const maxValor = Math.max(1, ...datos.map(d => Math.max(d.ventas, d.compras)));
                  const alto = 180;
                  const anchoGrupo = 60;
                  return (
                    <div className="overflow-x-auto">
                      <svg viewBox={`0 0 ${datos.length * anchoGrupo} ${alto + 30}`} className="w-full" style={{ minWidth: `${datos.length * 50}px`, height: '220px' }}>
                        {datos.map((d, i) => {
                          const x = i * anchoGrupo;
                          const alturaVentas = (d.ventas / maxValor) * alto;
                          const alturaCompras = (d.compras / maxValor) * alto;
                          return (
                            <g key={i}>
                              <rect x={x + 8} y={alto - alturaVentas} width="18" height={Math.max(alturaVentas, 1)} fill="#5B92E5" rx="2" />
                              <rect x={x + 30} y={alto - alturaCompras} width="18" height={Math.max(alturaCompras, 1)} fill="#F0AE3C" rx="2" />
                              <text x={x + 28} y={alto + 18} fontSize="9" fill="#8A94A0" textAnchor="middle">{d.etiqueta}</text>
                            </g>
                          );
                        })}
                      </svg>
                      <div className="flex gap-4 mt-2 text-xs">
                        <span className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-sm inline-block bg-blue-600"></span><span>Ventas</span></span>
                        <span className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-sm inline-block bg-orange-600"></span><span>Compras</span></span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Historial de Ventas */}
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="p-5 border-b">
                  <h3 className="font-bold text-gray-900">Historial de Ventas</h3>
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
                                {venta.tipo_venta === 'Crédito' ? 'Crédito' : 'Contado'}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${venta.estado === 'Pendiente' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                {venta.estado === 'Pendiente' ? '⏳ Pendiente' : 'Pagado'}
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

              {/* Historial de Compras */}
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="p-5 border-b">
                  <h3 className="font-bold text-gray-900">Historial de Compras</h3>
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

            {/* GESTION DE CATALOGOS: Nuevo Producto / Venta / Compra (modo elegido desde el sidebar) */}
            {subSeccionAdmin === 'nuevo-producto' && (
              <div className="space-y-6">

                {modoCatalogo === 'venta' && (
                <div className="space-y-6">

                {/* Panel de Registrar Venta */}
                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-gray-800">Registrar Venta</h3>
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
                            <button onClick={() => quitarLineaVenta(l.producto_id)} className="text-red-500 hover:text-red-700 text-xs font-bold">Quitar</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-2">Tipo de Venta</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setTipoVentaNueva('Contado')} className={`py-2 rounded-lg text-sm font-semibold border transition ${tipoVentaNueva === 'Contado' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>Contado</button>
                      <button type="button" onClick={() => setTipoVentaNueva('Crédito')} className={`py-2 rounded-lg text-sm font-semibold border transition ${tipoVentaNueva === 'Crédito' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>Crédito</button>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {tipoVentaNueva === 'Crédito' ? 'Quedará pendiente de cobro hasta que la marques como pagada.' : 'Se suma de inmediato a la ganancia del día.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t font-black text-lg flex justify-between">
                    <span>Total:</span><span>Q{calcularTotalVenta()}</span>
                  </div>
                  <button onClick={registrarVenta} className={`w-full text-white font-bold py-2.5 rounded-lg text-sm transition ${tipoVentaNueva === 'Crédito' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}>
                    {tipoVentaNueva === 'Crédito' ? 'Registrar Venta a Crédito' : 'Registrar Venta al Contado'}
                  </button>
                  <p className="text-[11px] text-gray-400 text-center">El historial de ventas ahora vive en la sección Reportes.</p>
                </div>

                </div>
                )}

                {modoCatalogo === 'compra' && (
                <div className="space-y-6">

                {/* Panel de Registrar Compra */}
                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-gray-800">Registrar Compra</h3>
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
                  <p className="text-[11px] text-gray-400">El costo se sugiere igual al precio de venta actual; ajústalo al monto real que pagaste al proveedor.</p>

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
                            <button onClick={() => quitarLineaCompra(l.producto_id)} className="text-red-500 hover:text-red-700 text-xs font-bold">Quitar</button>
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
                  <button onClick={registrarCompra} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-sm transition">Registrar Compra</button>
                  <p className="text-[11px] text-gray-400 text-center">El historial de compras ahora vive en la sección Reportes.</p>
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
                        {modoEdicion ? 'Actualizar Producto' : 'Registrar Nuevo Producto'}
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
                          <span className="text-gray-300 text-xl" style={{ display: nuevoProd.imagen ? 'none' : 'flex' }}></span>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">Pega el enlace de una imagen ya subida a internet (por ejemplo, de Google Imágenes).</p>
                    </div>

                    <button type="submit" className={`w-full text-white font-bold py-2.5 rounded-lg text-sm mt-2 transition ${modoEdicion ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'}`}>
                      {modoEdicion ? 'Guardar Cambios' : 'Añadir a Inventario'}
                    </button>
                  </form>
                </div>

                {/* Formularios Rápidos Laterales */}
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <h4 className="font-bold text-xs text-gray-700 uppercase tracking-wider mb-2">Nueva Categoría</h4>
                    <p className="text-[11px] text-gray-400 mb-2">Crea un grupo para organizar tus productos.</p>
                    <form onSubmit={manejarCrearCategoria} className="flex space-x-2">
                      <input type="text" placeholder="Ej: Electricidad" value={nuevaCatNombre} onChange={(e) => setNuevaCatNombre(e.target.value)} className="border p-1.5 rounded text-sm flex-1" />
                      <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-3 rounded font-bold transition">+</button>
                    </form>
                  </div>

                  <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <h4 className="font-bold text-xs text-gray-700 uppercase tracking-wider mb-2">Nueva Unidad de Medida</h4>
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

            {/* INVENTARIO MAESTRO CON ACCIONES */}
            {subSeccionAdmin === 'ver-inventario' && (
              <div className="space-y-4">
                <input type="text" placeholder="Buscar por nombre o código de producto..." value={busquedaAdmin} onChange={(e) => setBusquedaAdmin(e.target.value)} className="p-2.5 border rounded-lg text-sm w-full max-w-sm" />

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
                                <span className="text-gray-300 text-base" style={{ display: p.url_imagen ? 'none' : 'flex' }}></span>
                              </div>
                              <span>{p.nombre}</span>
                            </div>
                          </td>
                          <td className="p-4 text-gray-500">{p.marca || '—'}</td>
                          <td className="p-4 font-bold">Q{parseFloat(p.precio).toFixed(2)}</td>
                          <td className="p-4"><span className={`px-2 py-0.5 rounded text-xs font-bold ${p.cantidad_stock < 20 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{parseFloat(p.cantidad_stock)} uds</span></td>
                          <td className="p-4 text-center space-x-2">
                            <button onClick={() => iniciarEdicion(p)} className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-bold px-3 py-1.5 rounded transition">Editar</button>
                            <button onClick={() => manejarEliminarProducto(p.id)} className="bg-red-100 text-red-700 hover:bg-red-200 text-xs font-bold px-3 py-1.5 rounded transition">Eliminar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}