<?php

namespace App\Http\Middleware;

use App\Models\{DetailAset, PermohonanAset, PeminjamanAset, PeminjamanAsetItem, WishlistAset};
use Closure;
use Illuminate\Http\Request;

class EnsureInventoryAccess
{
    public function handle(Request $request, Closure $next)
    {
        $controller = class_basename($request->route()->getControllerClass());
        $action = $request->route()->getActionMethod();
        $user = $request->user();
        abort_unless($user->hasPositionPermission('inventaris.view'), 403);
        if ($controller === 'DetailInventarisController' && in_array($action, ['store', 'update', 'destroy', 'updateKondisi', 'regenerateQr', 'bulkDelete'], true)) {
            abort_unless($user->hasPositionPermission('inventaris.manage-items'), 403);
        }
        if ($controller === 'PermohonanAsetController' && in_array($action, ['store', 'update', 'destroy', 'submit', 'bulkDelete'], true)) {
            abort_unless($user->hasPositionPermission('inventaris.manage-permohonan'), 403);
        }

        $currentLab = $user->getCurrentLab();
        if (isset($currentLab['all_access'])) return $next($request);
        $labId = $currentLab['laboratorium']->id ?? $user->access_lab_id;
        abort_unless($labId, 403, 'Akses laboratorium diperlukan.');
        foreach (['lab_id', 'laboratorium_id'] as $field) {
            if ($request->filled($field)) {
                abort_unless(is_string($request->input($field)) && $request->input($field) === (string) $labId, 403, 'Unauthorized laboratory access');
            }
        }

        $parameters = $request->route()->parameters();
        $id = $parameters['detailAset'] ?? $parameters['id'] ?? null;
        if ($controller === 'DetailInventarisController' && $id && $action !== 'index') {
            $asset = $id instanceof DetailAset ? $id : DetailAset::findOrFail($id);
            $this->assertAssetLab($asset, $labId);
        }
        if ($controller === 'PermohonanAsetController') {
            $application = $parameters['permohonan'] ?? null;
            if ($application && !$application instanceof PermohonanAset) $application = PermohonanAset::findOrFail($application);
            if ($wishlist = $parameters['wishlistItem'] ?? null) {
                $wishlist = $wishlist instanceof WishlistAset ? $wishlist : WishlistAset::findOrFail($wishlist);
                $application = $wishlist->permohonanAset;
            }
            if ($application) abort_unless((string) $application->laboratorium_id === (string) $labId, 403);
            if ($action === 'bulkDelete') {
                $request->validate(['ids' => 'required|array', 'ids.*' => 'required|string']);
                abort_if(PermohonanAset::whereIn('id', $request->input('ids'))->where('laboratorium_id', '!=', $labId)->exists(), 403);
            }
        }
        if ($controller === 'PeminjamanAsetController') {
            if ($id) {
                $loan = PeminjamanAset::findOrFail($id);
                foreach ($loan->items()->with('detailAset')->get() as $item) $this->assertAssetLab($item->detailAset, $labId);
            }
            if ($itemId = $parameters['itemId'] ?? null) $this->assertAssetLab(PeminjamanAsetItem::findOrFail($itemId)->detailAset, $labId);
        }

        $assetIds = $controller === 'DetailInventarisController' ? $request->input('ids', []) : $request->input('aset_ids', []);
        validator(['ids' => $assetIds], ['ids' => 'array', 'ids.*' => 'required|string'])->validate();
        if ($request->filled('aset_id')) $assetIds[] = $request->input('aset_id');
        if ($assetIds) {
            validator(['ids' => $assetIds], ['ids' => 'array', 'ids.*' => 'required|string'])->validate();
            abort_if(DetailAset::whereIn('id', $assetIds)->where('laboratorium_id', '!=', $labId)->exists(), 403);
        }
        $request->merge(['lab_id' => (string) $labId]);
        return $next($request);
    }

    private function assertAssetLab(?DetailAset $asset, string $labId): void
    {
        abort_unless($asset && (string) $asset->laboratorium_id === $labId, 403, 'Unauthorized laboratory access');
    }
}
