<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\Permission\Role;
use App\Models\User;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * IMPORTANT: This migration removes 'kalab' as a role.
     * Kalab is now a POSITION in the struktur table, not a role.
     * Users who had 'kalab' role will be reassigned to 'admin' role.
     */
    public function up(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Find the kalab role
        $kalabRole = Role::where('name', 'kalab')->first();
        
        if ($kalabRole) {
            // Find all users with kalab role
            $kalabUsers = User::role('kalab')->get();
            
            echo "\n";
            echo "==============================================\n";
            echo "Converting 'kalab' role to position\n";
            echo "==============================================\n";
            echo "Found " . $kalabUsers->count() . " users with 'kalab' role\n";
            
            foreach ($kalabUsers as $user) {
                // Check if user already has admin role
                if (!$user->hasRole('admin')) {
                    $user->assignRole('admin');
                    echo "✓ Assigned 'admin' role to: {$user->name}\n";
                } else {
                    echo "○ {$user->name} already has 'admin' role\n";
                }
                
                // Remove kalab role
                $user->removeRole('kalab');
            }
            
            // Delete the kalab role
            $kalabRole->delete();
            echo "\n✓ 'kalab' role deleted\n";
            echo "==============================================\n";
            echo "Migration completed!\n";
            echo "Note: Kalab is now a POSITION, check kepengurusan_user.struktur_id\n";
            echo "==============================================\n\n";
        } else {
            echo "\n'kalab' role not found - skipping\n\n";
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate kalab role if rolling back
        $kalabRole = Role::create(['name' => 'kalab', 'guard_name' => 'web']);
        
        echo "\n";
        echo "==============================================\n";
        echo "'kalab' role restored\n";
        echo "Note: You'll need to manually reassign this role to users\n";
        echo "==============================================\n\n";
    }
};
