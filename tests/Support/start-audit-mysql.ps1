param([string]$MysqlBin = 'C:/laragon/bin/mysql/mysql-8.0.30-winx64/bin')

$ErrorActionPreference = 'Stop'
$auditWorkspace = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$auditDirectory = [IO.Path]::GetFullPath((Join-Path $auditWorkspace '.audit/mysql/data'))
if (-not $auditDirectory.StartsWith($auditWorkspace + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Direktori MySQL audit berada di luar workspace.'
}
$auditServer = Join-Path $MysqlBin 'mysqld.exe'
$auditClient = Join-Path $MysqlBin 'mysql.exe'
if (-not (Test-Path -LiteralPath $auditServer) -or -not (Test-Path -LiteralPath $auditClient)) {
    throw 'Berikan -MysqlBin yang menunjuk direktori bin MySQL 8.'
}
$auditConnection = @('--no-defaults', '--host=127.0.0.1', '--port=33179', '--user=root', '--batch', '--raw', '--skip-column-names')
function Test-AuditPort {
    $auditSocket = [Net.Sockets.TcpClient]::new()
    try {
        $auditConnect = $auditSocket.ConnectAsync('127.0.0.1', 33179)
        return $auditConnect.Wait(500) -and $auditSocket.Connected
    } catch { return $false } finally { $auditSocket.Dispose() }
}
$auditPort = Test-AuditPort
if (-not $auditPort) {
    New-Item -ItemType Directory -Path $auditDirectory -Force | Out-Null
    if (-not (Test-Path -LiteralPath (Join-Path $auditDirectory 'mysql'))) {
        if (@(Get-ChildItem -LiteralPath $auditDirectory -Force).Count -ne 0) {
            throw 'Direktori audit tidak kosong dan belum terinisialisasi. Tidak ada file yang dihapus.'
        }
        & $auditServer --no-defaults --initialize-insecure "--basedir=$([IO.Path]::GetFullPath((Join-Path $MysqlBin '..')))" "--datadir=$auditDirectory" --console
        if ($LASTEXITCODE -ne 0) { throw 'Inisialisasi MySQL audit gagal.' }
    }
    $auditArguments = @('--no-defaults', "--basedir=`"$([IO.Path]::GetFullPath((Join-Path $MysqlBin '..')))`"", "--datadir=`"$auditDirectory`"", '--bind-address=127.0.0.1', '--port=33179', '--mysqlx=OFF', '--skip-log-bin', '--innodb-buffer-pool-size=33554432', '--innodb-redo-log-capacity=16777216', '--console')
    $auditProcess = Start-Process -FilePath $auditServer -ArgumentList $auditArguments -WindowStyle Hidden -PassThru
    for ($auditAttempt = 0; $auditAttempt -lt 30; $auditAttempt++) {
        if (Test-AuditPort) { break }
        if ($auditProcess.HasExited) { throw 'MySQL audit berhenti sebelum siap.' }
        Start-Sleep -Milliseconds 500
    }
}
$auditActualDirectory = & $auditClient @auditConnection '--execute=SELECT @@datadir'
if ($LASTEXITCODE -ne 0 -or $auditActualDirectory.TrimEnd('/','\').Replace('\','/') -ine $auditDirectory.Replace('\','/')) {
    throw 'Port 33179 bukan instance dengan direktori audit yang diharapkan. Database tidak disentuh.'
}
& $auditClient @auditConnection '--execute=CREATE DATABASE IF NOT EXISTS silab_audit_tests CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE DATABASE IF NOT EXISTS silab_audit_e2e CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'
if ($LASTEXITCODE -ne 0) { throw 'Pembuatan database audit gagal.' }
Write-Output 'MySQL audit siap pada 127.0.0.1:33179; database asli tidak digunakan.'
