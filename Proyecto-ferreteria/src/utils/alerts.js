import Swal from 'sweetalert2';

// ---- SweetAlert2 con la misma estética oscura del sistema ----
const swalBase = {
  background: '#1A1E24',
  color: '#F1F3F6',
  buttonsStyling: true,
  customClass: { popup: 'swal-ferre' }
};

export const alertaExito = (mensaje) => Swal.fire({
  ...swalBase, icon: 'success', title: mensaje,
  confirmButtonColor: '#3FBE6B'
});

export const alertaError = (mensaje, titulo = 'Ocurrió un error') => Swal.fire({
  ...swalBase, icon: 'error', title: titulo, text: mensaje,
  confirmButtonColor: '#D6483E'
});

export const alertaAdvertencia = (mensaje) => Swal.fire({
  ...swalBase, icon: 'warning', title: mensaje,
  confirmButtonColor: '#F0AE3C'
});

export const confirmarAccion = async (titulo, texto, textoConfirmar = 'Sí, continuar') => {
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