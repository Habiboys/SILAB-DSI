import { Edit, Trash2 } from 'lucide-react';
const ActionButtons = ({ 
  item, 
  onEdit, 
  onDelete, 
  showEdit = true, 
  showDelete = true,
  editLabel = "Sunting",
  deleteLabel = "Hapus",
  editIcon = null,
  deleteIcon = null
}) => {
  // Gunakan is_active dari kepengurusan_lab (bukan tahun_kepengurusan)
  const isFromActiveKepengurusan = item?.kepengurusanlab?.is_active === true;

  // Jika bukan dari kepengurusan aktif, sembunyikan semua button
  if (!isFromActiveKepengurusan) {
    return (
      <span className="badge badge-ghost whitespace-nowrap">Data historis</span>
    );
  }

  return (
    <div className="join">
      {showEdit && onEdit && (
        <button
          onClick={() => onEdit(item)}
          type="button"
          className="btn btn-warning btn-sm join-item min-h-11 min-w-11"
          title={editLabel}
          aria-label={editLabel}
        >
          {editIcon || <Edit className="w-4 h-4" />}
        </button>
      )}
      
      {showDelete && onDelete && (
        <button
          onClick={() => onDelete(item)}
          type="button"
          className="btn btn-error btn-sm join-item min-h-11 min-w-11"
          title={deleteLabel}
          aria-label={deleteLabel}
        >
          {deleteIcon || <Trash2 className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
};

export default ActionButtons;
