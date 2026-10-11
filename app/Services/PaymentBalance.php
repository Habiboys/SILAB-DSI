<?php

namespace App\Services;

use App\Models\{DendaPiket, PemasukanKeuangan, TagihanKas};
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

class PaymentBalance
{
    public static function lockFor(Model $transaction): ?Model
    {
        if (!$transaction instanceof PemasukanKeuangan) return null;
        if ($transaction->tagihan_kas_id) return TagihanKas::whereKey($transaction->tagihan_kas_id)->lockForUpdate()->firstOrFail();
        if ($transaction->denda_piket_id) return DendaPiket::whereKey($transaction->denda_piket_id)->lockForUpdate()->firstOrFail();
        return null;
    }

    public static function refresh(?Model $bill, bool $rejectOverpayment = false): void
    {
        if (!$bill) return;
        $field = $bill instanceof TagihanKas ? 'tagihan_kas_id' : 'denda_piket_id';
        $total = $bill instanceof TagihanKas ? $bill->total_tagihan : $bill->total_denda;
        $paid = PemasukanKeuangan::where($field, $bill->id)->lockForUpdate()->get()->sum(fn ($payment) => (float) $payment->getRawOriginal('nominal'));
        if ($rejectOverpayment && $paid > $total) {
            throw ValidationException::withMessages(['nominal' => 'Total pembayaran melebihi tagihan.']);
        }
        $bill->update(['sudah_dibayar' => $paid, 'status' => $paid >= $total ? 'lunas' : 'belum_lunas']);
    }
}
