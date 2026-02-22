<table>
    <thead>
    <tr>
        <th>No</th>
        <th>NIM</th>
        <th>Nama</th>
        @foreach($pertemuans as $pertemuan)
            <th>{{ $pertemuan->judul }}</th>
        @endforeach
        <th>Total Kehadiran</th>
    </tr>
    </thead>
    <tbody>
    @foreach($praktikans as $index => $praktikan)
        <tr>
            <td>{{ $index + 1 }}</td>
            <td>{{ $praktikan->nim }}</td>
            <td>{{ $praktikan->user->name ?? $praktikan->nama }}</td>
            @php $totalHadir = 0; @endphp
            @foreach($pertemuans as $pertemuan)
                @php
                    // Get attendance status from the preloaded relationship or mapped array
                    // In the Export class we manually mapped it to 'attendance_list' property
                    $status = $praktikan->attendance_list[$pertemuan->id] ?? 'Belum Diisi';
                    if ($status === 'Hadir') {
                        $totalHadir++;
                    }
                @endphp
                <td>{{ $status }}</td>
            @endforeach
            <td>{{ $totalHadir }}</td>
        </tr>
    @endforeach
    </tbody>
</table>
