import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

export const confirmDelete = async (
  title: string,
  text: string,
  onConfirm: () => void,
  confirmButtonText = 'Xóa',
  cancelButtonText = 'Hủy'
) => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: 'var(--error, #ef4444)',
    cancelButtonColor: 'var(--slate-500, #64748b)',
    confirmButtonText,
    cancelButtonText,
    background: '#ffffff',
    customClass: {
      popup: 'swal2-premium-popup',
    }
  });

  if (result.isConfirmed) {
    onConfirm();
  }
};
