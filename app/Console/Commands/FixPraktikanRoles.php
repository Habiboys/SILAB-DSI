<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Praktikan;

class FixPraktikanRoles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fix:praktikan-roles';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix praktikan roles for users who have praktikan data but missing praktikan role';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting to fix praktikan roles...');
        
        // Find users who have praktikan data but don't have praktikan role
        $usersWithPraktikanData = User::whereHas('praktikan')->get();
        
        $fixedCount = 0;
        $alreadyCorrectCount = 0;
        
        foreach ($usersWithPraktikanData as $user) {
            if (!$user->hasRole('praktikan')) {
                $user->assignRole('praktikan');
                $this->line("Fixed role for user: {$user->name} ({$user->email})");
                $fixedCount++;
            } else {
                $alreadyCorrectCount++;
            }
        }
        
        $this->info("Fix completed!");
        $this->info("Users fixed: {$fixedCount}");
        $this->info("Users already correct: {$alreadyCorrectCount}");
        $this->info("Total users with praktikan data: " . $usersWithPraktikanData->count());
        
        return 0;
    }
}