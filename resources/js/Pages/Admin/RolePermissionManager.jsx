import { usePermission } from "@/Hooks/usePermission";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router } from "@inertiajs/react";
import React, { useState } from "react";
import { toast } from "sonner";
import Modal from "@/Components/Modal";
import { Trash2 } from "lucide-react";

export default function RolePermissionManager({
    roles,
    permissions,
    allPermissions,
}) {
    const { isSuperAdmin } = usePermission();
    const [selectedRole, setSelectedRole] = useState(roles[0] || null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState("");
    const [editingPermissions, setEditingPermissions] = useState(() => {
        
        const perms = {};
        if (roles[0]) {
            roles[0].permissions.forEach((p) => (perms[p] = true));
        }
        return perms;
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("matrix"); 

    
    if (!isSuperAdmin()) {
        return (
            <DashboardLayout>
                <Head title="Access Denied" />
                <div className="p-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h3 className="text-red-800 font-semibold">
                            Access Denied
                        </h3>
                        <p className="text-red-600">
                            You do not have permission to access this page.
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    
    const handleRoleChange = (role) => {
        setSelectedRole(role);
        const perms = {};
        role.permissions.forEach((p) => (perms[p] = true));
        setEditingPermissions(perms);
    };

    
    const togglePermission = (permissionName) => {
        setEditingPermissions((prev) => ({
            ...prev,
            [permissionName]: !prev[permissionName],
        }));
    };

    
    const savePermissions = () => {
        const selectedPermissions = Object.keys(editingPermissions).filter(
            (p) => editingPermissions[p],
        );

        router.post(
            route("admin.roles.permissions.update", selectedRole.id),
            {
                permissions: selectedPermissions,
            },
            {
                onSuccess: () => {
                    toast.success("Permissions updated successfully");
                },
                onError: (errors) => {
                    toast.error("Failed to update permissions");
                    console.error(errors);
                },
            },
        );
    };

    
    const handleCreateRole = (e) => {
        e.preventDefault();

        router.post(
            route("admin.roles.create"),
            {
                name: newRoleName,
                permissions: [],
            },
            {
                onSuccess: () => {
                    toast.success(`Role '${newRoleName}' created successfully`);
                    setNewRoleName("");
                    setIsCreateModalOpen(false);
                },
                onError: (errors) => {
                    toast.error("Failed to create role");
                    console.error(errors);
                },
            },
        );
    };

    
    const handleDeleteRole = (role) => {
        if (!confirm(`Are you sure you want to delete role '${role.name}'?`)) {
            return;
        }

        router.delete(route("admin.roles.delete", role.id), {
            onSuccess: () => {
                toast.success(`Role '${role.name}' deleted`);
                if (selectedRole?.id === role.id) {
                    setSelectedRole(roles[0] || null);
                }
            },
            onError: (errors) => {
                toast.error(errors.message || "Failed to delete role");
            },
        });
    };

    
    const filteredPermissions = searchQuery
        ? Object.entries(permissions).reduce((acc, [module, perms]) => {
              const filtered = perms.filter(
                  (p) =>
                      p.name
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                      p.label.toLowerCase().includes(searchQuery.toLowerCase()),
              );
              if (filtered.length > 0) {
                  acc[module] = filtered;
              }
              return acc;
          }, {})
        : permissions;

    return (
        <DashboardLayout>
            <Head title="Role & Permission Manager" />

            <div className="p-6">
                
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Role & Permission Manager
                        </h1>
                        <p className="text-gray-600">
                            Manage roles and assign permissions
                        </p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        Create New Role
                    </button>
                </div>

                
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex">
                            <button
                                onClick={() => setActiveTab("matrix")}
                                className={`px-6 py-3 font-medium ${
                                    activeTab === "matrix"
                                        ? "border-b-2 border-blue-600 text-blue-600"
                                        : "text-gray-600 hover:text-gray-800"
                                }`}
                            >
                                Permission Matrix
                            </button>
                            <button
                                onClick={() => setActiveTab("assign")}
                                className={`px-6 py-3 font-medium ${
                                    activeTab === "assign"
                                        ? "border-b-2 border-blue-600 text-blue-600"
                                        : "text-gray-600 hover:text-gray-800"
                                }`}
                            >
                                Assign Permissions
                            </button>
                        </nav>
                    </div>
                </div>

                
                {activeTab === "matrix" && (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-4 border-b bg-gray-50">
                            <input
                                type="text"
                                placeholder="Search permissions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                                            Permission
                                        </th>
                                        {roles.map((role) => (
                                            <th
                                                key={role.id}
                                                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                <div className="flex flex-col items-center gap-1">
                                                    <span>{role.name}</span>
                                                    <span className="text-xs text-gray-400 normal-case">
                                                        (
                                                        {role.permissions_count}{" "}
                                                        perms)
                                                    </span>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {Object.entries(filteredPermissions).map(
                                        ([module, perms]) => (
                                            <React.Fragment key={module}>
                                                <tr className="bg-gray-100">
                                                    <td
                                                        colSpan={
                                                            roles.length + 1
                                                        }
                                                        className="px-6 py-2 font-semibold text-gray-700"
                                                    >
                                                        {module}
                                                    </td>
                                                </tr>
                                                {perms.map((permission) => (
                                                    <tr
                                                        key={permission.name}
                                                        className="hover:bg-gray-50"
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 sticky left-0 bg-white">
                                                            <div>
                                                                <div className="font-medium">
                                                                    {
                                                                        permission.label
                                                                    }
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {
                                                                        permission.name
                                                                    }
                                                                </div>
                                                            </div>
                                                        </td>
                                                        {roles.map((role) => {
                                                            const hasPermission =
                                                                role.permissions.includes(
                                                                    permission.name,
                                                                );
                                                            return (
                                                                <td
                                                                    key={
                                                                        role.id
                                                                    }
                                                                    className="px-6 py-4 text-center"
                                                                >
                                                                    {hasPermission ? (
                                                                        <svg
                                                                            className="w-5 h-5 text-green-600 mx-auto"
                                                                            fill="currentColor"
                                                                            viewBox="0 0 20 20"
                                                                        >
                                                                            <path
                                                                                fillRule="evenodd"
                                                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                                                clipRule="evenodd"
                                                                            />
                                                                        </svg>
                                                                    ) : (
                                                                        <svg
                                                                            className="w-5 h-5 text-gray-300 mx-auto"
                                                                            fill="currentColor"
                                                                            viewBox="0 0 20 20"
                                                                        >
                                                                            <path
                                                                                fillRule="evenodd"
                                                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                                                clipRule="evenodd"
                                                                            />
                                                                        </svg>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ),
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                
                {activeTab === "assign" && (
                    <div className="grid grid-cols-12 gap-6">
                        
                        <div className="col-span-3 bg-white rounded-lg shadow">
                            <div className="p-4 border-b bg-gray-50">
                                <h3 className="font-semibold text-gray-800">
                                    Roles
                                </h3>
                            </div>
                            <div className="divide-y">
                                {roles.map((role) => (
                                    <div
                                        key={role.id}
                                        onClick={() => handleRoleChange(role)}
                                        className={`p-4 cursor-pointer hover:bg-gray-50 ${
                                            selectedRole?.id === role.id
                                                ? "bg-blue-50 border-l-4 border-blue-600"
                                                : ""
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-medium text-gray-800">
                                                    {role.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {role.permissions_count}{" "}
                                                    permissions
                                                </div>
                                            </div>
                                            {![
                                                "superadmin",
                                                "kadep",
                                                "admin",
                                                "asisten",
                                                "praktikan",
                                            ].includes(role.name) && (
                                                <button className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors" title="Hapus"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteRole(role);
                                                    }}
                                                    
                                                >
    <Trash2 className="w-4 h-4" />
</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        
                        <div className="col-span-9 bg-white rounded-lg shadow">
                            {selectedRole ? (
                                <>
                                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-semibold text-gray-800">
                                                Assign Permissions to:{" "}
                                                {selectedRole.name}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {
                                                    Object.keys(
                                                        editingPermissions,
                                                    ).filter(
                                                        (k) =>
                                                            editingPermissions[
                                                                k
                                                            ],
                                                    ).length
                                                }{" "}
                                                permissions selected
                                            </p>
                                        </div>
                                        <button
                                            onClick={savePermissions}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                                        >
                                            Save Changes
                                        </button>
                                    </div>

                                    <div className="p-6 max-h-[600px] overflow-y-auto">
                                        {Object.entries(permissions).map(
                                            ([module, perms]) => (
                                                <div
                                                    key={module}
                                                    className="mb-6"
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-semibold text-gray-800">
                                                            {module}
                                                        </h4>
                                                        <button
                                                            onClick={() => {
                                                                const newState =
                                                                    {
                                                                        ...editingPermissions,
                                                                    };
                                                                const allSelected =
                                                                    perms.every(
                                                                        (p) =>
                                                                            editingPermissions[
                                                                                p
                                                                                    .name
                                                                            ],
                                                                    );
                                                                perms.forEach(
                                                                    (p) =>
                                                                        (newState[
                                                                            p.name
                                                                        ] =
                                                                            !allSelected),
                                                                );
                                                                setEditingPermissions(
                                                                    newState,
                                                                );
                                                            }}
                                                            className="text-sm text-blue-600 hover:text-blue-800"
                                                        >
                                                            Toggle All
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {perms.map(
                                                            (permission) => (
                                                                <label
                                                                    key={
                                                                        permission.name
                                                                    }
                                                                    className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={
                                                                            editingPermissions[
                                                                                permission
                                                                                    .name
                                                                            ] ||
                                                                            false
                                                                        }
                                                                        onChange={() =>
                                                                            togglePermission(
                                                                                permission.name,
                                                                            )
                                                                        }
                                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                    />
                                                                    <div>
                                                                        <div className="text-sm font-medium text-gray-700">
                                                                            {
                                                                                permission.label
                                                                            }
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">
                                                                            {
                                                                                permission.name
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                </label>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="p-6 text-center text-gray-500">
                                    Select a role to assign permissions
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            
            <Modal
                show={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setNewRoleName("");
                }}
                maxWidth="md"
            >
                <div className="p-6">
                        <h3 className="text-xl font-semibold mb-4">
                            Create New Role
                        </h3>
                        <form onSubmit={handleCreateRole}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Role Name
                                </label>
                                <input
                                    type="text"
                                    value={newRoleName}
                                    onChange={(e) =>
                                        setNewRoleName(e.target.value)
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    placeholder="e.g., finance"
                                    required
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                                >
                                    Create
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreateModalOpen(false);
                                        setNewRoleName("");
                                    }}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
