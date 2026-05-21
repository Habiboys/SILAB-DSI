import { Edit, Trash2 } from 'lucide-react';
const ActionButtons = ({ 
  item, 
  onEdit, 
  onDelete, 
  showEdit = true, 
  showDelete = true,
  editLabel = "Edit",
  deleteLabel = "Hapus",
  editIcon = null,
  deleteIcon = null
}) => {
  // Gunakan is_active dari kepengurusan_lab (bukan tahun_kepengurusan)
  const isFromActiveKepengurusan = item?.kepengurusanlab?.is_active === true;

  // Jika bukan dari kepengurusan aktif, sembunyikan semua button
  if (!isFromActiveKepengurusan) {
    return (
      <div className="text-sm text-gray-400 italic">
        Data historis - tidak dapat diedit
      </div>
    );
  }

  return (
    <div className="flex space-x-2">
      {showEdit && onEdit && (
        <button
          onClick={() => onEdit(item)}
          className="p-1.5 rounded-md bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors focus:outline-none"
          title={editLabel}
        >
          {editIcon || <Edit className="w-4 h-4" />}
        </button>
      )}
      
      {showDelete && onDelete && (
        <button
          onClick={() => onDelete(item)}
          className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors focus:outline-none"
          title={deleteLabel}
        >
          {deleteIcon || <Trash2 className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
};

export default ActionButtons;
