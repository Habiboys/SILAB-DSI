import { usePermission } from '@/Hooks/usePermission';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function StrukturPermissionManager({ jabatans, permissions, jabatanPermissions }) {
    const { isSuperAdmin } = usePermission();
    const [selectedJabatan, setSelectedJabatan] = useState(jabatans[0]?.jabatan || null);
    const [editingPermissions, setEditingPermissions] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('assign'); // 'matrix' or 'assign'

    // Access control
    if (!isSuperAdmin()) {
        return (
            <DashboardLayout>
                <Head title="Access Denied" />
                <div className="p-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h3 className="text-red-800 font-semibold">Access Denied</h3>
                        <p className="text-red-600">Only superadmin can access this page.</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const handleJabatanChange = (jabatan) => {
        setSelectedJabatan(jabatan);
        const perms = {};
        (jabatanPermissions[jabatan] || []).forEach(p => perms[p] = true);
        setEditingPermissions(perms);
    };

    const togglePermission = (permissionName) => {
        setEditingPermissions(prev => ({
            ...prev,
            [permissionName]: !prev[permissionName]
        }));
    };

    const savePermissions = () => {
        const selectedPermissions = Object.keys(editingPermissions).filter(p => editingPermissions[p]);
        
        router.put(route('struktur-permissions.update', selectedJabatan), {
            permissions: selectedPermissions,
        }, {
            onSuccess: () => toast.success('Permissions updated'),
            onError: () => toast.error('Failed to update permissions'),
        });
    };

    const handleDeleteJabatan = (jabatan) => {
        if (!confirm(`Remove all permissions for '${jabatan}'? The jabatan itself will remain in Data Master.`)) return;

        router.delete(route('struktur-permissions.delete', jabatan), {
            onSuccess: () => {
                toast.success(`Permissions removed for '${jabatan}'`);
                if (selectedJabatan === jabatan) {
                    setSelectedJabatan(jabatans[0]?.jabatan || null);
                }
            },
            onError: () => toast.error('Failed to remove permissions'),
        });
    };

    const filteredPermissions = searchQuery
        ? Object.entries(permissions).reduce((acc, [module, perms]) => {
              const filtered = perms.filter(p => 
                  p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.label.toLowerCase().includes(searchQuery.toLowerCase())
              );
              if (filtered.length > 0) acc[module] = filtered;
              return acc;
          }, {})
        : permissions;

    return (
        <DashboardLayout>
            <Head title="Struktur Permission Manager" />
            
            <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Struktur Permission Manager</h1>
                        <p className="text-gray-600">
                            Assign permissions to organizational positions. Jabatan are auto-detected from Data Master → Struktur.
                        </p>
                        <p className="text-sm text-blue-600 mt-1">
                            💡 To add new jabatan, go to Data Master → Struktur page
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex">
                            <button
                                onClick={() => setActiveTab('assign')}
                                className={`px-6 py-3 font-medium ${
                                    activeTab === 'assign'
                                        ? 'border-b-2 border-blue-600 text-blue-600'
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                Assign Permissions
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Assign Permissions Tab */}
                {activeTab === 'assign' && (
                    <div className="grid grid-cols-12 gap-6">
                        {/* Jabatan List */}
                        <div className="col-span-3 bg-white rounded-lg shadow">
                            <div className="p-4 border-b bg-gray-50">
                                <h3 className="font-semibold text-gray-800">Jabatan</h3>
                            </div>
                            <div className="divide-y max-h-[600px] overflow-y-auto">
                                {jabatans.map(jab => (
                                    <div
                                        key={jab.jabatan}
                                        onClick={() => handleJabatanChange(jab.jabatan)}
                                        className={`p-4 cursor-pointer hover:bg-gray-50 ${
                                            selectedJabatan === jab.jabatan ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-medium text-gray-800">{jab.jabatan}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-200 text-gray-600 uppercase">
                                                        {jab.base_role}
                                                    </span>
                                                    <span className="text-sm text-gray-500">{jab.permissions_count} extra perms</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteJabatan(jab.jabatan);
                                                }}
                                                className="text-red-600 hover:text-red-800"
                                                title="Remove all permissions (jabatan will remain in Data Master)"
                                            >
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Permissions Assignment */}
                        <div className="col-span-9 bg-white rounded-lg shadow">
                            {selectedJabatan ? (
                                <>
                                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-semibold text-gray-800">
                                                Assign Permissions to: {selectedJabatan}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {Object.keys(editingPermissions).filter(k => editingPermissions[k]).length} permissions selected
                                            </p>
                                        </div>
                                        <button
                                            onClick={savePermissions}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                    
                                    {/* Search */}
                                    <div className="p-4 border-b">
                                        <input
                                            type="text"
                                            placeholder="Search permissions..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    
                                    <div className="p-6 max-h-[600px] overflow-y-auto">
                                        <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-200 text-gray-700">
                                                    Inherited
                                                </span>
                                                <span className="text-sm text-gray-600">
                                                    = Permissions from base role (<strong>{jabatans.find(j => j.jabatan === selectedJabatan)?.base_role}</strong>). Cannot be removed here.
                                                </span>
                                            </div>
                                        </div>

                                        {Object.entries(filteredPermissions).map(([module, perms]) => (
                                            <div key={module} className="mb-6">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="font-semibold text-gray-800">{module}</h4>
                                                    <button
                                                        onClick={() => {
                                                            const currentJabatanData = jabatans.find(j => j.jabatan === selectedJabatan);
                                                            const inherited = currentJabatanData?.inherited_permissions || [];
                                                            
                                                            const newState = { ...editingPermissions };
                                                            const assignablePerms = perms.filter(p => !inherited.includes(p.name));
                                                            
                                                            if (assignablePerms.length > 0) {
                                                                const allSelected = assignablePerms.every(p => editingPermissions[p.name]);
                                                                assignablePerms.forEach(p => newState[p.name] = !allSelected);
                                                                setEditingPermissions(newState);
                                                            }
                                                        }}
                                                        className="text-sm text-blue-600 hover:text-blue-800"
                                                    >
                                                        Toggle All Assignable
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {perms.map(permission => {
                                                        const currentJabatanData = jabatans.find(j => j.jabatan === selectedJabatan);
                                                        const isInherited = currentJabatanData?.inherited_permissions?.includes(permission.name);

                                                        return (
                                                            <label
                                                                key={permission.name}
                                                                className={`flex items-center gap-2 p-2 rounded ${
                                                                    isInherited 
                                                                        ? 'bg-gray-100 cursor-not-allowed opacity-75' 
                                                                        : 'hover:bg-gray-50 cursor-pointer'
                                                                }`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isInherited || editingPermissions[permission.name] || false}
                                                                    onChange={() => !isInherited && togglePermission(permission.name)}
                                                                    disabled={isInherited}
                                                                    className={`rounded border-gray-300 ${
                                                                        isInherited 
                                                                            ? 'text-gray-400 focus:ring-gray-400' 
                                                                            : 'text-blue-600 focus:ring-blue-500'
                                                                    }`}
                                                                />
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`text-sm font-medium ${isInherited ? 'text-gray-600' : 'text-gray-700'}`}>
                                                                            {permission.label}
                                                                        </span>
                                                                        {isInherited && (
                                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-200 text-gray-600">
                                                                                {currentJabatanData?.base_role}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {permission.name}
                                                                    </div>
                                                                </div>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="p-6 text-center text-gray-500">
                                    Select a jabatan to assign permissions
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
