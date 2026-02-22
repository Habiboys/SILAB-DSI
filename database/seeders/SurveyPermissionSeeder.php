<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission\Permission;
use App\Models\Permission\Role;

class SurveyPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            'survey.view',
            'survey.create',
            'survey.edit',
            'survey.delete',
            'survey.view_results',
            'survey.participate', // Usually for all authenticated users
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Assign to Superadmin and Admin
        $adminRoles = Role::whereIn('name', ['superadmin', 'admin'])->get();
        foreach ($adminRoles as $role) {
            $role->givePermissionTo($permissions);
        }

        // Assign participate to others (assistants, students, etc if needed, or handle via logic)
        // For now, let's give 'survey.participate' to all roles
        $allRoles = Role::all();
        $participatePermission = Permission::where('name', 'survey.participate')->first();
        if ($participatePermission) {
            foreach ($allRoles as $role) {
                if (!$role->hasPermissionTo('survey.participate')) {
                    $role->givePermissionTo('survey.participate');
                }
            }
        }
    }
}
