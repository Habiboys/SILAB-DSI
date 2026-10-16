param(
    [Parameter(Mandatory=$true)][string]$DocPath,
    [Parameter(Mandatory=$true)][string]$OutputDir,
    [switch]$SkipImages
)
$ErrorActionPreference = 'Stop'
$taskDocPath = (Resolve-Path -LiteralPath $DocPath).Path
$null = New-Item -ItemType Directory -Path $OutputDir -Force
$taskOutput = (Resolve-Path -LiteralPath $OutputDir).Path
$wordApp = New-Object -ComObject Word.Application
$wordApp.Visible = $false
$wordApp.ScreenUpdating = $false
$wordApp.DisplayAlerts = 0
try {
    $guideDoc = $wordApp.Documents.Open($taskDocPath, $false, $false, $false)
    Write-Output 'Opened document'
    # Normalize the outline through Word so built-in heading styles retain all levels.
    $outline = $null
    foreach ($candidate in $guideDoc.ListTemplates) {
        if ($candidate.Name -eq 'SILAB Guidebook Headings') { $outline = $candidate; break }
    }
    if ($null -eq $outline) { $outline = $guideDoc.ListTemplates.Add($true, 'SILAB Guidebook Headings') }
    foreach ($level in 1..3) {
        $listLevel = $outline.ListLevels.Item($level)
        $listLevel.NumberFormat = @('BAB %1','%1.%2','%1.%2.%3')[$level-1]
        $listLevel.NumberStyle = 0
        $listLevel.StartAt = 1
        $listLevel.ResetOnHigher = $level-1
        $listLevel.TrailingCharacter = 1
        $listLevel.NumberPosition = 0
        $listLevel.TextPosition = 0
        $listLevel.LinkedStyle = 'Heading ' + $level
        $listLevel.Font.Name = 'Times New Roman'
    }
    foreach ($paragraph in $guideDoc.Paragraphs) {
        if ($paragraph.OutlineLevel -le 3) {
            $paragraph.Range.ListFormat.ApplyListTemplateWithLevel($outline,$true,2,1,$paragraph.OutlineLevel)
            if ($paragraph.Range.Text.Trim().StartsWith('Kendala pada Modul ')) {
                $paragraph.Format.PageBreakBefore = -1
            }
        }
    }
    Write-Output 'Normalized heading numbering'
    for ($pass=0; $pass -lt 3; $pass++) {
        Write-Output ('Updating fields pass ' + ($pass + 1))
        $null = $guideDoc.Fields.Update()
        foreach ($toc in $guideDoc.TablesOfContents) { $toc.Update() }
        foreach ($figures in $guideDoc.TablesOfFigures) { $figures.Update() }
        $guideDoc.Repaginate()
        Write-Output ('Repaginated pass ' + ($pass + 1))
    }
    # Word leaves an empty field-end paragraph after each generated list.
    # Keep that marker small so a full list does not produce an empty page.
    foreach ($paragraph in $guideDoc.Sections.Item(2).Range.Paragraphs) {
        if ($paragraph.Range.Text.Trim() -eq '' -and
            $paragraph.Range.InlineShapes.Count -eq 0 -and
            !$paragraph.Range.Text.Contains([char]12)) {
            $paragraph.Range.Font.Size = 1
            $paragraph.Format.SpaceBefore = 0
            $paragraph.Format.SpaceAfter = 0
            $paragraph.Format.LineSpacingRule = 4
            $paragraph.Format.LineSpacing = 1
            $paragraph.Format.KeepWithNext = 0
        }
    }
    $guideDoc.Repaginate()
    foreach ($section in $guideDoc.Sections) {
        foreach ($footer in $section.Footers) { $null = $footer.Range.Fields.Update() }
    }
    $guideDoc.Save()
    $headings = @()
    foreach ($paragraph in $guideDoc.Paragraphs) {
        if ($paragraph.OutlineLevel -le 3) {
            $headings += [PSCustomObject]@{
                level=$paragraph.OutlineLevel
                number=$paragraph.Range.ListFormat.ListString
                text=$paragraph.Range.Text.Trim()
            }
        }
    }
    $captions = @()
    foreach ($paragraph in $guideDoc.Paragraphs) {
        if ($paragraph.Range.Text.StartsWith('Gambar ')) { $captions += $paragraph.Range.Text.Trim() }
    }
    $report = [PSCustomObject]@{
        pages=$guideDoc.ComputeStatistics(2)
        tables_of_contents=$guideDoc.TablesOfContents.Count
        tables_of_figures=$guideDoc.TablesOfFigures.Count
        headings=$headings
        captions=$captions
    }
    $report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $taskOutput 'word-report.json') -Encoding UTF8
    Write-Output ('Pages: ' + $report.pages)
    if (!$SkipImages) {
        Add-Type -AssemblyName System.Drawing
        $guideDoc.ActiveWindow.View.Type = 3
        $guideDoc.ActiveWindow.View.DisplayPageBoundaries = $true
        $pages = $guideDoc.ActiveWindow.Panes.Item(1).Pages
        for ($i=1; $i -le $pages.Count; $i++) {
            $null = $guideDoc.GoTo(1,1,$i).Select()
            [byte[]]$bits = $pages.Item($i).EnhMetaFileBits
            $stream = [System.IO.MemoryStream]::new($bits,0,$bits.Length)
            $metafile = [System.Drawing.Imaging.Metafile]::new($stream)
            $bitmap = [System.Drawing.Bitmap]::new(1240,1754)
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            $graphics.Clear([System.Drawing.Color]::White)
            $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.DrawImage($metafile,0,0,1240,1754)
            $bitmap.Save((Join-Path $taskOutput "page-$i.png"),[System.Drawing.Imaging.ImageFormat]::Png)
            $graphics.Dispose(); $bitmap.Dispose(); $metafile.Dispose(); $stream.Dispose()
        }
    }
    $guideDoc.Close(0)
} finally { $wordApp.Quit() }
Write-Output $taskDocPath
