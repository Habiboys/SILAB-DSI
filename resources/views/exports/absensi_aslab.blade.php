<table>
    <thead>
    <tr>
        <th>No</th>
        <th>Nama Asisten</th>
        @foreach($pertemuans as $pertemuan)
            <th>{{ $pertemuan->judul }}</th>
        @endforeach
        <th>Total Kehadiran</th>
    </tr>
    </thead>
    <tbody>
    @foreach($aslabs as $index => $aslab)
        <tr>
            <td>{{ $index + 1 }}</td>
            <td>{{ $aslab->name }}</td>
            @php $totalHadir = 0; @endphp
            @foreach($pertemuans as $pertemuan)
                @php
                    $status = $aslab->attendance_list[$pertemuan->id] ?? 'Belum Diisi';
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
