import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function PesertaManager({ kegiatan, can }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);

  // Form for adding participant
  const { data: addData, setData: setAddData, post: postAdd, processing: addProcessing, reset: resetAdd, errors: addErrors } = useForm({
    user_id: '',
    peran: 'peserta'
  });
  
  // Note: For user selection, ideally we need a list of users. 
  // For now, I'll use a simple input or assume a user list is passed or fetched. 
  // To make it robust, we should probably fetch users via async select or pass them from controller.
  // Given the context, let's assume we need to fetch users or enter an ID/Email. 
  // Let's use a simple text input for User ID for now (MVP) or better, link to a user search if possible.
  // Actually, usually we pass `users` prop from controller. I didn't pass `users` in `show` method.
  // I will stick to a simple ID input for now or ask the user to input User ID (Not ideal UI).
  // BETTER: Lets just show the list and actions for now. Adding participants might need a better UI later.
  // Wait, I can't add participants easily without a user list. 
  // I'll add a "Refresh/Import" notion or just manually input User ID.
  
  const submitAdd = (e) => {
    e.preventDefault();
    postAdd(route('kegiatan.peserta.store', kegiatan.id), {
      onSuccess: () => {
        toast.success('Peserta berhasil ditambahkan');
        resetAdd();
        setShowAddForm(false);
      },
      onError: () => toast.error('Gagal menambahkan peserta')
    });
  };

  const deletePeserta = (id) => {
    if (confirm('Hapus peserta ini?')) {
      router.delete(route('kegiatan.peserta.destroy', { kegiatan: kegiatan.id, pesertaId: id }), {
        onSuccess: () => toast.success('Peserta dihapus')
      });
    }
  };

  // Template Upload
  const { data: tmplData, setData: setTmplData, post: postTmpl, processing: tmplProcessing, reset: resetTmpl } = useForm({
    template: null
  });

  const submitTemplate = (e) => {
    e.preventDefault();
    postTmpl(route('kegiatan.template.upload', kegiatan.id), {
      forceFormData: true,
      onSuccess: () => {
         toast.success('Template berhasil diunggah');
         setShowTemplateForm(false);
         resetTmpl();
      },
      onError: () => toast.error('Gagal upload template')
    });
  };

  // Generate Certificates
  const [generating, setGenerating] = useState(false);
  const handleGenerate = () => {
    if (confirm('Generate sertifikat untuk semua peserta?')) {
        setGenerating(true);
        router.post(route('kegiatan.sertifikat.generate', kegiatan.id), {}, {
            onSuccess: () => {
                toast.success('Sertifikat berhasil digenerate');
                setGenerating(false);
            },
            onError: () => {
                toast.error('Gagal generate sertifikat');
                setGenerating(false);
            }
        });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Peserta & Sertifikat</h3>
        <div className="space-x-2">
            {can.create && (
                <>
                <button 
                    onClick={() => setShowTemplateForm(!showTemplateForm)}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-sm rounded hover:bg-indigo-100 font-medium"
                >
                    {showTemplateForm ? 'Batal Upload' : 'Upload Template'}
                </button>
                <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 text-sm rounded hover:bg-blue-100 font-medium"
                >
                    {showAddForm ? 'Batal Tambah' : '+ Tambah Peserta'}
                </button>
                </>
            )}
        </div>
      </div>

        {/* Template Upload Form */}
        {showTemplateForm && (
            <div className="bg-gray-50 p-4 rounded mb-4 border border-indigo-100">
                <h4 className="text-sm font-medium mb-2">Upload Template Sertifikat (.docx)</h4>
                <div className="mb-4 text-xs text-indigo-800 bg-white/60 p-3 rounded border border-indigo-200">
                    <strong>Panduan Variabel (.docx):</strong> Gunakan format <code>{`\${nama_variabel}`}</code> pada template dokumen Word Anda.
                    <ul className="list-disc ml-5 mt-1 grid grid-cols-2 lg:grid-cols-3 gap-x-4">
                        <li><code>{`\${nama}`}</code> : Nama Tercetak</li>
                        <li><code>{`\${nim}`}</code> : NIM / ID</li>
                        <li><code>{`\${peran}`}</code> : Panitia / Peserta dll</li>
                        <li><code>{`\${kegiatan}`}</code> : Nama Kegiatan</li>
                        <li><code>{`\${tanggal}`}</code> : Tanggal Mulai</li>
                        <li><code>{`\${nomor}`}</code> : Nomor Sertifikat</li>
                    </ul>
                </div>
                <form onSubmit={submitTemplate} className="flex gap-2 items-center">
                    <input 
                        type="file" 
                        accept=".docx"
                        onChange={e => setTmplData('template', e.target.files[0])}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    <button 
                        type="submit" 
                        disabled={tmplProcessing}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm disabled:opacity-50"
                    >
                        {tmplProcessing ? 'Uploading...' : 'Upload'}
                    </button>
                </form>
            </div>
        )}

      {/* Add Peserta Form */}
      {showAddForm && (
        <div className="bg-blue-50 p-4 rounded mb-4 border border-blue-100">
             <h4 className="text-sm font-medium mb-2">Tambah Peserta Manual</h4>
             <form onSubmit={submitAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input 
                    type="number" 
                    placeholder="User ID" 
                    value={addData.user_id}
                    onChange={e => setAddData('user_id', e.target.value)}
                    className="rounded-md border-gray-300 text-sm"
                    required
                />
                <select 
                    value={addData.peran}
                    onChange={e => setAddData('peran', e.target.value)}
                    className="rounded-md border-gray-300 text-sm"
                >
                    <option value="peserta">Peserta</option>
                    <option value="panitia">Panitia</option>
                </select>
                <button 
                    type="submit"
                    disabled={addProcessing}
                    className="bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                    Tambah
                </button>
             </form>
             <p className="text-xs text-blue-600 mt-2">* Masukkan User ID pengguna yang sudah terdaftar di sistem.</p>
        </div>
      )}

      {/* Action Bar: Generate */}
      {kegiatan.peserta && kegiatan.peserta.length > 0 && can.create && (
          <div className="mb-4 flex justify-end">
              <button 
                 onClick={handleGenerate}
                 disabled={generating}
                 className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium flex items-center gap-2"
              >
                 {generating ? 'Processing...' : 'Generate Semua Sertifikat'}
              </button>
          </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Peran</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sertifikat</th>
                    {can.create && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>}
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {kegiatan.peserta && kegiatan.peserta.length > 0 ? (
                    kegiatan.peserta.map(p => (
                        <tr key={p.id}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.user?.name || `User ID: ${p.user_id}`}</td>
                            <td className="px-4 py-3 text-sm text-gray-500 capitalize">{p.peran}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                                {p.file_sertifikat ? (
                                    <a 
                                        href={`/storage/${p.file_sertifikat}`} 
                                        target="_blank"
                                        className="text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                        <span>Download</span>
                                        <span className="text-xs text-gray-400">({p.no_sertifikat})</span>
                                    </a>
                                ) : (
                                    <span className="text-gray-400 italic">Belum ada</span>
                                )}
                            </td>
                            {can.create && (
                                <td className="px-4 py-3 text-right text-sm">
                                    <button 
                                        onClick={() => deletePeserta(p.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Hapus
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-gray-500 text-sm">
                            Belum ada peserta terdaftar.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
}
