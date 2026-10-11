<?php

putenv('SILAB_AUDIT_DATABASE=silab_audit_tests');
$app = require __DIR__.'/AuditEnvironment.php';
[$script, $run, $worker, $userId, $assetId] = $argv;
if (!preg_match('/^[a-f0-9]{32}$/', $run) || !in_array($worker, ['a', 'b'], true)) throw new RuntimeException('Invalid audit worker.');
$barrier = dirname(__DIR__, 2).'/.audit/loan-'.$run;
$synchronized = false;
Illuminate\Support\Facades\DB::listen(function ($query) use ($barrier, $worker, &$synchronized) {
    if ($synchronized || !preg_match('/^select \* from `aset` where /', $query->sql)) return;
    $synchronized = true;
    file_put_contents($barrier.'-'.$worker.'.ready', 'ready');
    $deadline = microtime(true) + 20;
    while (!is_file($barrier.'-a.ready') || !is_file($barrier.'-b.ready')) {
        if (microtime(true) > $deadline) throw new RuntimeException('Concurrent loan barrier timed out.');
        usleep(10000);
    }
});
$app['config']->set('session.driver', 'array');
$session = $app['session']->driver();
$session->start();
$request = Illuminate\Http\Request::create('/inventaris/peminjaman', 'POST', [
    'aset_ids' => [$assetId], 'nama_peminjam' => 'Audit concurrent '.$worker, 'keperluan' => 'Concurrency regression',
    'tanggal_pinjam' => '2026-10-10', 'tanggal_kembali_rencana' => '2026-10-11',
]);
$request->setLaravelSession($session);
$app->instance('request', $request);
Illuminate\Support\Facades\Auth::loginUsingId($userId);
try {
    $response = $app->make(App\Http\Controllers\PeminjamanAsetController::class)->store($request);
    echo json_encode(['status' => $response->getStatusCode()]);
} catch (Illuminate\Validation\ValidationException $exception) {
    echo json_encode(['status' => 422, 'errors' => $exception->errors()]);
}
