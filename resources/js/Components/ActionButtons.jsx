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
  // Debug: lihat struktur data item
  console.log('ActionButtons - item:', item);
  console.log('ActionButtons - item.kepengurusanlab:', item?.kepengurusanlab);
  console.log('ActionButtons - item.kepengurusanlab?.tahun_kepengurusan:', item?.kepengurusanlab?.tahun_kepengurusan);
  console.log('ActionButtons - item.kepengurusanlab?.tahun_kepengurusan?.isactive:', item?.kepengurusanlab?.tahun_kepengurusan?.isactive);
  
  // Gunakan data kepengurusanlab yang dikirim dari parent
  const isFromActiveKepengurusan = item?.kepengurusanlab?.tahun_kepengurusan?.isactive == 1;

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
          className="text-indigo-600 hover:text-indigo-900 transition-colors focus:outline-none p-1"
          title={editLabel}
        >
          {editIcon || <Edit className="w-5 h-5" />}
        </button>
      )}
      
      {showDelete && onDelete && (
        <button
          onClick={() => onDelete(item)}
          className="text-red-600 hover:text-red-900 transition-colors focus:outline-none p-1"
          title={deleteLabel}
        >
          {deleteIcon || <Trash2 className="w-5 h-5" />}
        </button>
      )}
    </div>
  );
};

export default ActionButtons;
