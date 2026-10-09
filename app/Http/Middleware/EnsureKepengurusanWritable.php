<?php

namespace App\Http\Middleware;

use App\Models\KepengurusanLab;
use App\Services\KepengurusanAccess;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EnsureKepengurusanWritable
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->user() || !KepengurusanAccess::applies($request)) return $next($request);
        $action = $request->route()->getActionMethod();
        $controller = class_basename($request->route()->getControllerClass());
        if ($request->isMethodSafe() && !in_array($action, ['create', 'edit'], true)) return $next($request);
        if ($controller === 'KepengurusanLabController' && in_array($action, ['store', 'toggleActive'], true)) return $next($request);

        return DB::transaction(function () use ($request, $next, $controller, $action) {
            $periods = [];
            $resources = KepengurusanAccess::resources($request);
            KepengurusanAccess::assertResourceScope($request, $resources);
            foreach ($resources as $resource) {
                if ($period = KepengurusanAccess::forModel($resource)) $periods[$period->id] = $period;
            }
            $transfer = $controller === 'AnggotaController' && $action === 'transferFromPrevious';
            if ($transfer) {
                $source = KepengurusanLab::findOrFail($request->input('kepengurusan_lab_id'));
                $target = KepengurusanLab::findOrFail($request->input('active_kepengurusan_id'));
                abort_unless($source->laboratorium_id === $target->laboratorium_id && $source->id !== $target->id, 403, 'Transfer harus antarperiode pada laboratorium yang sama.');
                $periods[$target->id] = $target;
            } elseif ($selected = KepengurusanAccess::selected($request)) {
                $periods[$selected->id] = $selected;
            }
            if (!$transfer && $request->filled('kepengurusan_lab_id')) {
                $period = KepengurusanLab::findOrFail($request->input('kepengurusan_lab_id'));
                $periods[$period->id] = $period;
            }
            abort_unless(count($periods) === 1, 403, 'Konteks kepengurusan tidak sesuai dengan data yang dikelola.');
            $period = KepengurusanLab::whereKey(array_key_first($periods))->lockForUpdate()->firstOrFail();
            KepengurusanAccess::assertWritable($period);
            foreach (['lab_id', 'laboratorium_id', 'laboratory_id'] as $field) {
                abort_if($request->filled($field) && (string) $request->input($field) !== (string) $period->laboratorium_id, 403, 'Laboratorium tidak sesuai dengan kepengurusan.');
            }
            abort_if($request->filled('tahun_id') && (string) $request->input('tahun_id') !== (string) $period->tahun_kepengurusan_id, 403, 'Periode tidak sesuai dengan kepengurusan.');
            $current = $request->user()?->getCurrentLab() ?? [];
            if (empty($current['all_access'])) {
                $lab = $current['laboratorium']->id ?? $request->user()?->access_lab_id;
                abort_unless($lab && (string) $lab === (string) $period->laboratorium_id, 403, 'Unauthorized laboratory access');
            }
            $request->attributes->set('writable_kepengurusan', $period);
            if (!$transfer) $request->merge(['kepengurusan_lab_id' => $period->id, 'active_kepengurusan_id' => $period->id, 'active_tahun_id' => $period->tahun_kepengurusan_id]);
            return $next($request);
        });
    }
}
