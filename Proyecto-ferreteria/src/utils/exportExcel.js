import ExcelJS from 'exceljs';
import { alertaError } from './alerts';
import { formatQ } from './format';

export const exportarReportesExcel = async (reportes) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Ferretería Valdez';
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
  const HEADER_ROW = 4;
  const DATA_START = HEADER_ROW + 1;

  const bordeFino = { style: 'thin', color: { argb: 'FFD9D9D9' } };
  const bordeCelda = { top: bordeFino, left: bordeFino, bottom: bordeFino, right: bordeFino };

  // Aplica el estilo de encabezado (fondo de color, texto blanco) a una fila
  const estiloEncabezado = (fila, color = NAVY) => {
    fila.eachCell(celda => {
      celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
      celda.font = { bold: true, color: { argb: WHITE }, size: 11 };
      celda.alignment = { vertical: 'middle', horizontal: 'left' };
      celda.border = bordeCelda;
    });
    fila.height = 22;
  };

  // Sombrea filas alternas y bordea SOLO las filas de datos (nunca el encabezado)
  const estiloFilas = (hoja) => {
    for (let i = DATA_START; i <= hoja.rowCount; i++) {
      const fila = hoja.getRow(i);
      fila.height = 19;
      fila.eachCell({ includeEmpty: true }, celda => {
        celda.border = bordeCelda;
        celda.alignment = { ...celda.alignment, vertical: 'middle' };
        if ((i - DATA_START) % 2 === 1) celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRAY_LIGHT } };
      });
    }
  };

  // Barra de datos nativa de Excel dentro de la celda (gráfica en miniatura)
  const barraDatos = (hoja, columnaLetra, color) => {
    if (hoja.rowCount < DATA_START) return;
    hoja.addConditionalFormatting({
      ref: `${columnaLetra}${DATA_START}:${columnaLetra}${hoja.rowCount}`,
      rules: [{ type: 'dataBar', gradient: false, showValue: true, color: { argb: color }, cfvo: [{ type: 'min' }, { type: 'max' }] }]
    });
  };

  // Congela el encabezado, activa el autofiltro y aplica el sombreado de filas
  const finalizarHoja = (hoja, numCols) => {
    estiloFilas(hoja);
    hoja.views = [{ state: 'frozen', ySplit: HEADER_ROW }];
    if (hoja.rowCount > HEADER_ROW) {
      hoja.autoFilter = { from: { row: HEADER_ROW, column: 1 }, to: { row: hoja.rowCount, column: numCols } };
    }
  };

  const tituloHoja = (hoja, texto) => {
    hoja.mergeCells(1, 1, 1, Math.max(hoja.columns.length, 2));
    const celda = hoja.getCell('A1');
    celda.value = texto;
    celda.font = { bold: true, size: 15, color: { argb: NAVY } };
    hoja.getRow(1).height = 28;
    const sub = hoja.getCell('A2');
    sub.value = `Ferretería Valdez · Generado el ${new Date().toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' })}`;
    sub.font = { italic: true, size: 9, color: { argb: 'FF8A94A0' } };
    hoja.addRow([]);
    const linkVolver = hoja.getCell('A3');
    linkVolver.value = { text: '← Volver a Portada', hyperlink: "#'Portada'!A1" };
    linkVolver.font = { size: 9, color: { argb: 'FF5B92E5' }, underline: true };
  };

  // Dibuja una gráfica de barras agrupadas en un canvas y la devuelve como PNG base64
  const norm = (c) => (c.startsWith('#') ? c : `#${c}`);
  const generarGraficaBarras = (etiquetas, serieA, serieB, nombreA, nombreB, colorA, colorB) => {
    colorA = norm(colorA); colorB = norm(colorB);
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const padding = 55;
    const chartW = canvas.width - padding * 2;
    const chartH = canvas.height - padding * 2 - 20;
    const max = Math.max(1, ...serieA, ...serieB);
    const n = Math.max(1, etiquetas.length);
    const groupW = chartW / n;
    const barW = Math.min(26, groupW * 0.32);

    // líneas guía horizontales
    ctx.strokeStyle = '#EEEEEE';
    ctx.font = '10px Arial';
    ctx.fillStyle = '#8A94A0';
    ctx.textAlign = 'right';
    for (let g = 0; g <= 4; g++) {
      const y = padding + 20 + chartH - (g / 4) * chartH;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding + 10, y);
      ctx.stroke();
      ctx.fillText(`Q${Math.round((g / 4) * max).toLocaleString()}`, padding - 8, y + 3);
    }

    etiquetas.forEach((etq, i) => {
      const x = padding + i * groupW + groupW * 0.12;
      const hA = (serieA[i] / max) * chartH;
      const hB = (serieB[i] / max) * chartH;
      const base = padding + 20 + chartH;
      ctx.fillStyle = colorA;
      ctx.fillRect(x, base - hA, barW, hA);
      ctx.fillStyle = colorB;
      ctx.fillRect(x + barW + 3, base - hB, barW, hB);
      ctx.fillStyle = '#5B6570';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(etq, x + barW, base + 16);
    });

    // Leyenda
    ctx.fillStyle = colorA;
    ctx.fillRect(padding, 8, 12, 12);
    ctx.fillStyle = '#171B1F';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(nombreA, padding + 18, 18);
    ctx.fillStyle = colorB;
    ctx.fillRect(padding + 130, 8, 12, 12);
    ctx.fillStyle = '#171B1F';
    ctx.fillText(nombreB, padding + 148, 18);

    return canvas.toDataURL('image/png').split(',')[1];
  };

  // Dibuja una gráfica de barras horizontales de un solo color (para Top 10)
  const generarGraficaBarrasHorizontal = (etiquetas, valores, color) => {
    color = norm(color);
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = Math.max(220, etiquetas.length * 32 + 40);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const padding = 200;
    const max = Math.max(1, ...valores);
    const filaAlto = 26;
    const separacion = 6;

    etiquetas.forEach((etq, i) => {
      const y = 20 + i * (filaAlto + separacion);
      const ancho = ((canvas.width - padding - 40) * valores[i]) / max;
      ctx.fillStyle = '#1C2128';
      ctx.font = '11px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(etq.length > 28 ? etq.slice(0, 26) + '…' : etq, padding - 10, y + filaAlto / 2 + 4);
      ctx.fillStyle = color;
      ctx.fillRect(padding, y, Math.max(ancho, 2), filaAlto);
      ctx.fillStyle = '#171B1F';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`${valores[i]} uds`, padding + ancho + 8, y + filaAlto / 2 + 4);
    });

    return canvas.toDataURL('image/png').split(',')[1];
  };

  // ============ HOJA 0: PORTADA ============
  const hPortada = wb.addWorksheet('Portada');
  hPortada.properties.tabColor = { argb: NAVY };
  hPortada.columns = [{ width: 4 }, { width: 30 }, { width: 30 }, { width: 30 }, { width: 4 }];
  hPortada.mergeCells('B2:D2');
  hPortada.getCell('B2').value = 'Ferretería Valdez';
  hPortada.getCell('B2').font = { bold: true, size: 22, color: { argb: NAVY } };
  hPortada.mergeCells('B3:D3');
  hPortada.getCell('B3').value = 'Reporte General del Negocio';
  hPortada.getCell('B3').font = { size: 13, color: { argb: 'FF5B6570' } };
  hPortada.mergeCells('B4:D4');
  hPortada.getCell('B4').value = `Generado el ${new Date().toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' })}`;
  hPortada.getCell('B4').font = { italic: true, size: 10, color: { argb: 'FF8A94A0' } };

  const tarjetaKPI = (celdaIni, titulo, valor, color) => {
    hPortada.mergeCells(`${celdaIni}6:${celdaIni}8`);
    const c = hPortada.getCell(`${celdaIni}6`);
    c.value = { richText: [{ font: { bold: true, size: 10, color: { argb: 'FFFFFFFF' } }, text: `${titulo}\n` }, { font: { bold: true, size: 20, color: { argb: 'FFFFFFFF' } }, text: valor }] };
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    for (let r = 6; r <= 8; r++) {
      hPortada.getCell(`${celdaIni}${r}`).border = bordeCelda;
    }
  };
  tarjetaKPI('B', 'VALOR DEL INVENTARIO', `Q${formatQ(reportes.valorInventario)}`, GREEN);
  tarjetaKPI('C', 'GANANCIA DEL MES', `Q${formatQ(reportes.gananciaMes)}`, STEEL);
  tarjetaKPI('D', 'PENDIENTE DE COBRO', `Q${formatQ(reportes.pendienteTotal)}`, AMBER);

  hPortada.mergeCells('B10:D10');
  hPortada.getCell('B10').value = 'Este archivo contiene una hoja por cada sección: Comparativas, Inventario, Ventas, Compras y más productos vendidos/menos vendidos. Usa las pestañas de abajo para navegar.';
  hPortada.getCell('B10').font = { italic: true, size: 10, color: { argb: 'FF5B6570' } };
  hPortada.getCell('B10').alignment = { wrapText: true, vertical: 'top' };
  hPortada.getRow(10).height = 40;

  if (reportes.serieMensual.length > 0) {
    const imgPortadaBase64 = generarGraficaBarras(
      reportes.serieMensual.map(m => m.etiqueta), reportes.serieMensual.map(m => m.ventas), reportes.serieMensual.map(m => m.compras),
      'Ventas', 'Compras', '5B92E5', 'F0AE3C'
    );
    const imgId0 = wb.addImage({ base64: imgPortadaBase64, extension: 'png' });
    hPortada.addImage(imgId0, { tl: { col: 1, row: 11 }, ext: { width: 720, height: 315 } });
  }

  // Índice con enlaces directos a cada hoja del documento
  const filaIndiceTitulo = 30;
  hPortada.getCell(`B${filaIndiceTitulo}`).value = 'Índice de Hojas';
  hPortada.getCell(`B${filaIndiceTitulo}`).font = { bold: true, size: 12, color: { argb: NAVY } };
  hPortada.getRow(filaIndiceTitulo).height = 20;

  const hojasIndice = [
    ['Resumen', 'Resumen general de indicadores'],
    ['Comparativas', 'Semana / mes / año vs. periodo anterior'],
    ['Top Valor Inventario', 'Productos con mayor valor inmovilizado'],
    ['Reabastecimiento', 'Productos con stock bajo'],
    ['Categorías', 'Valor de inventario por categoría'],
    ['Ventas vs Compras', 'Tendencia mensual (últimos 12 meses)'],
    ['Más Vendidos', 'Top 10 productos más vendidos'],
    ['Menos Vendidos', 'Top 10 productos menos vendidos'],
    ['Ventas por Producto', 'Cantidad vendida, histórico completo'],
    ['Historial Ventas', 'Detalle de ventas recientes'],
    ['Historial Compras', 'Detalle de compras recientes']
  ];

  hojasIndice.forEach(([nombreHoja, descripcion], i) => {
    const fila = filaIndiceTitulo + 1 + i;
    const celdaLink = hPortada.getCell(`B${fila}`);
    celdaLink.value = { text: `→ ${nombreHoja}`, hyperlink: `#'${nombreHoja}'!A1` };
    celdaLink.font = { color: { argb: 'FF5B92E5' }, underline: true, bold: true, size: 10 };
    hPortada.mergeCells(`C${fila}:D${fila}`);
    const celdaDesc = hPortada.getCell(`C${fila}`);
    celdaDesc.value = descripcion;
    celdaDesc.font = { size: 9, italic: true, color: { argb: 'FF5B6570' } };
    hPortada.getRow(fila).height = 18;
  });

  // ============ HOJA 1: RESUMEN GENERAL ============
  const hResumen = wb.addWorksheet('Resumen');
  hResumen.properties.tabColor = { argb: NAVY };
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
  finalizarHoja(hResumen, 2);

  // ============ HOJA 2: COMPARATIVA POR PERIODO ============
  const hComp = wb.addWorksheet('Comparativas');
  hComp.properties.tabColor = { argb: NAVY };
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
  barraDatos(hComp, 'C', '5B92E5');
  barraDatos(hComp, 'D', 'B0B7C0');
  finalizarHoja(hComp, 5);

  // ============ HOJA 3: TOP VALOR EN INVENTARIO ============
  const hTop = wb.addWorksheet('Top Valor Inventario');
  hTop.properties.tabColor = { argb: AMBER };
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
  barraDatos(hTop, 'E', 'F0AE3C');
  finalizarHoja(hTop, 5);

  // ============ HOJA 4: REABASTECIMIENTO ============
  const hReab = wb.addWorksheet('Reabastecimiento');
  hReab.properties.tabColor = { argb: RED };
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
  finalizarHoja(hReab, 3);

  // ============ HOJA 5: VALOR POR CATEGORÍA ============
  const hCat = wb.addWorksheet('Categorías');
  hCat.properties.tabColor = { argb: STEEL };
  hCat.columns = [{ width: 28 }, { width: 20 }, { width: 18 }];
  tituloHoja(hCat, 'Valor de Inventario por Categoría');
  const filaEncCat = hCat.addRow(['Categoría', 'Cantidad de Productos', 'Valor Total']);
  estiloEncabezado(filaEncCat, STEEL);
  reportes.valorPorCategoria.forEach(c => {
    const fila = hCat.addRow([c.categoria, c.cantidad_productos, parseFloat(c.valor)]);
    fila.getCell(3).numFmt = MONEDA;
  });
  barraDatos(hCat, 'C', '5B92E5');
  finalizarHoja(hCat, 3);

  // ============ HOJA 6: VENTAS VS COMPRAS (12 MESES) ============
  const hSerie = wb.addWorksheet('Ventas vs Compras');
  hSerie.properties.tabColor = { argb: NAVY };
  hSerie.columns = [{ width: 16 }, { width: 16 }, { width: 16 }, { width: 4 }];
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
  barraDatos(hSerie, 'B', '5B92E5');
  barraDatos(hSerie, 'C', 'F0AE3C');
  finalizarHoja(hSerie, 3);
  if (reportes.serieMensual.length > 0) {
    const imgSerieBase64 = generarGraficaBarras(
      reportes.serieMensual.map(m => m.etiqueta), reportes.serieMensual.map(m => m.ventas), reportes.serieMensual.map(m => m.compras),
      'Ventas', 'Compras', '5B92E5', 'F0AE3C'
    );
    const imgId1 = wb.addImage({ base64: imgSerieBase64, extension: 'png' });
    hSerie.addImage(imgId1, { tl: { col: 5, row: 3 }, ext: { width: 620, height: 270 } });
  }

  // ============ HOJA 6.1: TOP 10 MÁS VENDIDOS ============
  const hMasVendidos = wb.addWorksheet('Más Vendidos');
  hMasVendidos.properties.tabColor = { argb: GREEN };
  hMasVendidos.columns = [{ width: 6 }, { width: 34 }, { width: 18 }, { width: 14 }, { width: 16 }];
  tituloHoja(hMasVendidos, 'Top 10 Productos Más Vendidos');
  const filaEncMasVendidos = hMasVendidos.addRow(['#', 'Producto', 'Marca', 'Cantidad Vendida', 'Ingresos']);
  estiloEncabezado(filaEncMasVendidos, GREEN);
  reportes.masVendidos.forEach((p, idx) => {
    const fila = hMasVendidos.addRow([idx + 1, p.nombre, p.marca || '—', p.cantidadVendida, p.ingresos]);
    fila.getCell(5).numFmt = MONEDA;
  });
  if (reportes.masVendidos.length === 0) hMasVendidos.addRow(['—', 'Aún no hay ventas registradas.', '', '', '']);
  barraDatos(hMasVendidos, 'D', '2FA85A');
  finalizarHoja(hMasVendidos, 5);
  if (reportes.masVendidos.length > 0) {
    const imgMasBase64 = generarGraficaBarrasHorizontal(reportes.masVendidos.map(p => p.nombre), reportes.masVendidos.map(p => p.cantidadVendida), '#2FA85A');
    const imgId2 = wb.addImage({ base64: imgMasBase64, extension: 'png' });
    hMasVendidos.addImage(imgId2, { tl: { col: 6, row: 3 }, ext: { width: 470, height: Math.max(220, reportes.masVendidos.length * 32 + 40) } });
  }

  // ============ HOJA 6.2: TOP 10 MENOS VENDIDOS ============
  const hMenosVendidos = wb.addWorksheet('Menos Vendidos');
  hMenosVendidos.properties.tabColor = { argb: RED };
  hMenosVendidos.columns = [{ width: 6 }, { width: 34 }, { width: 18 }, { width: 14 }, { width: 16 }];
  tituloHoja(hMenosVendidos, 'Top 10 Productos Menos Vendidos');
  const filaEncMenosVendidos = hMenosVendidos.addRow(['#', 'Producto', 'Marca', 'Cantidad Vendida', 'Ingresos']);
  estiloEncabezado(filaEncMenosVendidos, RED);
  reportes.menosVendidos.forEach((p, idx) => {
    const fila = hMenosVendidos.addRow([idx + 1, p.nombre, p.marca || '—', p.cantidadVendida, p.ingresos]);
    fila.getCell(5).numFmt = MONEDA;
  });
  if (reportes.menosVendidos.length === 0) hMenosVendidos.addRow(['—', 'Aún no hay productos registrados.', '', '', '']);
  barraDatos(hMenosVendidos, 'D', 'D6483E');
  finalizarHoja(hMenosVendidos, 5);

  // ============ HOJA 6.3: VENTAS POR PRODUCTO (TODOS, DETALLADO) ============
  const hVentasProducto = wb.addWorksheet('Ventas por Producto');
  hVentasProducto.properties.tabColor = { argb: STEEL };
  hVentasProducto.columns = [{ width: 34 }, { width: 18 }, { width: 16 }, { width: 16 }];
  tituloHoja(hVentasProducto, 'Cantidad Vendida por Producto (Histórico Completo)');
  const filaEncVentasProducto = hVentasProducto.addRow(['Producto', 'Marca', 'Cantidad Vendida', 'Ingresos']);
  estiloEncabezado(filaEncVentasProducto, STEEL);
  reportes.ventasPorProducto.forEach(p => {
    const fila = hVentasProducto.addRow([p.nombre, p.marca || '—', p.cantidadVendida, p.ingresos]);
    fila.getCell(4).numFmt = MONEDA;
  });
  if (reportes.ventasPorProducto.length === 0) hVentasProducto.addRow(['Aún no hay productos registrados.', '', '', '']);
  barraDatos(hVentasProducto, 'C', '5B92E5');
  finalizarHoja(hVentasProducto, 4);

  // ============ HOJA 7: HISTORIAL DE VENTAS ============
  const hVentas = wb.addWorksheet('Historial Ventas');
  hVentas.properties.tabColor = { argb: NAVY };
  hVentas.columns = [{ width: 10 }, { width: 20 }, { width: 12 }, { width: 14 }, { width: 22 }, { width: 14 }, { width: 12 }, { width: 14 }];
  tituloHoja(hVentas, 'Historial de Ventas Recientes');
  const filaEncVentas = hVentas.addRow(['Venta #', 'Fecha', 'Tipo', 'Estado', 'Cliente', 'NIT', 'Artículos', 'Total']);
  estiloEncabezado(filaEncVentas, NAVY);
  if (!reportes.historialVentas || reportes.historialVentas.length === 0) {
    hVentas.addRow(['—', 'Aún no se ha registrado ninguna venta.', '', '', '', '', '', '']);
  } else {
    reportes.historialVentas.forEach(v => {
      const fila = hVentas.addRow([
        v.id,
        new Date(v.fecha).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' }),
        v.tipo_venta,
        v.estado,
        v.cliente || '—',
        v.cliente_nit || '—',
        v.items,
        parseFloat(v.total)
      ]);
      fila.getCell(8).numFmt = MONEDA;
      fila.getCell(8).font = { bold: true };
      fila.getCell(4).font = { bold: true, color: { argb: v.estado === 'Pendiente' ? RED : GREEN } };
      fila.getCell(3).font = { bold: true, color: { argb: v.tipo_venta === 'Crédito' ? AMBER : STEEL } };
    });
  }
  finalizarHoja(hVentas, 8);

  // ============ HOJA 8: HISTORIAL DE COMPRAS ============
  const hCompras = wb.addWorksheet('Historial Compras');
  hCompras.properties.tabColor = { argb: STEEL };
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
  finalizarHoja(hCompras, 5);

  // Generar el archivo y descargarlo
  try {
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_FerreteriaValdez_${new Date().toLocaleDateString('es-GT').replace(/\//g, '-')}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error al generar el Excel:', error);
    alertaError('No se pudo generar el archivo de Excel. Revisa la consola.');
  }
};