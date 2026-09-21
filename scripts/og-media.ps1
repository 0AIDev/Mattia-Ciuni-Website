# Genera le OG image di anteprima per Voice Notes e Videos (nuovo template).
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts/og-media.ps1          # scrive in public/
#   powershell ... -File scripts/og-media.ps1 -Preview                                # scrive in out/_tmp/og-media (per approvare)
#   powershell ... -File scripts/og-media.ps1 -Video -Title "..." -Subtitle "..." -Thumb og.png
#   powershell ... -File scripts/og-media.ps1 -Audio -Title "..." -Subtitle "..." -Duration 4:18
#
# Due disegni, stessa grammatica del resto del sito (Instrument Serif + Inter,
# sfondo #FCFCFC, inchiostro #161616):
#
#   video       ->  miniatura centrata (16:9, angoli tondi), titolo sotto, sottotitolo, CTA "Watch video";
#   voice note  ->  waveform centrata (barre, stile minimal) + durata, titolo, sottotitolo, CTA "Listen the voice note".
#
# La miniatura di default e' public/og.png; il testo arriva dai parametri, non dai
# registri: voice notes e videos non hanno ancora una sorgente dati, quindi lo
# script e' deliberatamente manuale. Quando esisteranno, si aggiungera' la lettura
# dal registro (come fa og.ps1 per lib/posts.ts e lib/notes.ts).

param(
  [switch]$Video,
  [switch]$Audio,
  [string]$Title = "",
  [string]$Subtitle = "",
  [string]$Thumb = "og.png",
  [string]$Duration = "0:00",
  [switch]$Preview
)

Add-Type -AssemblyName System.Drawing

$Root     = Split-Path $PSScriptRoot -Parent
$Dot      = [char]0x00B7
$Bg       = [System.Drawing.Color]::FromArgb(252, 252, 252)
$Ink      = [System.Drawing.Color]::FromArgb(22, 22, 22)
$Ink40    = [System.Drawing.Color]::FromArgb(104, 104, 104)
$OutRoot  = if ($Preview) { Join-Path $Root "out\_tmp\og-media" } else { Join-Path $Root "public" }

$fonts = New-Object System.Drawing.Text.PrivateFontCollection
foreach ($ttf in @("InstrumentSerif-Regular.ttf", "Inter-Light.ttf")) {
  $path = Join-Path $Root "scripts\fonts\$ttf"
  if (!(Test-Path $path)) { Write-Error "font mancante: $path"; exit 1 }
  $fonts.AddFontFile($path)
}
$serifFamily = $fonts.Families | Where-Object { $_.Name -like "Instrument*" } | Select-Object -First 1
$sansFamily  = $fonts.Families | Where-Object { $_.Name -like "Inter*" -and $_.Name -notlike "Instrument*" } | Select-Object -First 1

function New-Canvas {
  $bmp = New-Object System.Drawing.Bitmap(1200, 630, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.Clear($Bg)
  return $bmp, $g
}

function Draw-CtaPill($g, $text, $centerX, $topY) {
  $pillFont = New-Object System.Drawing.Font($sansFamily, [float]30, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $paddingX = 44
  $pillH = 78
  $textSize = $g.MeasureString($text, $pillFont)
  $pillW = [Math]::Ceiling($textSize.Width - 14) + $paddingX * 2
  $rect = New-Object System.Drawing.RectangleF(($centerX - $pillW / 2), $topY, $pillW, $pillH)
  $brush = New-Object System.Drawing.SolidBrush($Ink)
  $radius = $pillH / 2
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc($rect.X, $rect.Y, $radius * 2, $radius * 2, 180, 90)
  $path.AddArc($rect.Right - $radius * 2, $rect.Y, $radius * 2, $radius * 2, 270, 90)
  $path.AddArc($rect.Right - $radius * 2, $rect.Bottom - $radius * 2, $radius * 2, $radius * 2, 0, 90)
  $path.AddArc($rect.X, $rect.Bottom - $radius * 2, $radius * 2, $radius * 2, 90, 90)
  $path.CloseFigure()
  $g.FillPath($brush, $path)
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = [System.Drawing.StringAlignment]::Center
  $fmt.LineAlignment = [System.Drawing.StringAlignment]::Center
  $g.DrawString($text, $pillFont, [System.Drawing.Brushes]::White, $rect, $fmt)
}

function Draw-TitleBlock($g, $title, $subtitle, $topY) {
  $titleFont = New-Object System.Drawing.Font($serifFamily, [float]64, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $subFont   = New-Object System.Drawing.Font($sansFamily,  [float]27, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = [System.Drawing.StringAlignment]::Center
  $fmt.LineAlignment = [System.Drawing.StringAlignment]::Near

  $titleSize = $g.MeasureString($title, $titleFont, (New-Object System.Drawing.SizeF(1000, 2000)), $fmt)
  $rect = New-Object System.Drawing.RectangleF(100, $topY, 1000, ($titleSize.Height + 8))
  $g.DrawString($title, $titleFont, (New-Object System.Drawing.SolidBrush($Ink)), $rect, $fmt)

  $subY = $topY + $titleSize.Height + 18
  if ($subtitle) {
    $subSize = $g.MeasureString($subtitle, $subFont, (New-Object System.Drawing.SizeF(860, 2000)), $fmt)
    $subRect = New-Object System.Drawing.RectangleF(170, $subY, 860, ($subSize.Height + 8))
    $g.DrawString($subtitle, $subFont, (New-Object System.Drawing.SolidBrush($Ink40)), $subRect, $fmt)
    $subY += $subSize.Height + 8
  }
  return $subY
}

# ---------------------------------------------------------------- video
# Miniatura centrata (larghezza 640, 16:9), titolo sotto, sottotitolo, CTA.
function New-VideoCard($title, $subtitle, $thumbFile, $outPath) {
  $pair = New-Canvas; $bmp = $pair[0]; $g = $pair[1]
  $thumbPath = Join-Path $Root $thumbFile
  $thumbW = 560; $thumbH = 315; $thumbY = 52
  if (Test-Path $thumbPath) {
    $img = [System.Drawing.Image]::FromFile($thumbPath)
    $dest = New-Object System.Drawing.RectangleF((($1200 - $thumbW) / 2), $thumbY, $thumbW, $thumbH)
    $g.DrawImage($img, $dest)
    $img.Dispose()
  } else {
    Write-Output "miniatura assente: $thumbFile (disegno un riquadro grigio)"
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230, 230, 230))
    $g.FillRectangle($brush, (($1200 - $thumbW) / 2), $thumbY, $thumbW, $thumbH)
  }
  $textTop = $thumbY + $thumbH + 26
  $afterText = Draw-TitleBlock $g $title $subtitle $textTop
  Draw-CtaPill $g "Watch video" 600 ($afterText + 22) | Out-Null
  $g.Dispose()
  $dir = Split-Path $outPath -Parent
  if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output "wrote $outPath"
}

# ------------------------------------------------------------ voice note
# Waveform centrata (barre simmetriche, altezza pseudo-casuale ma deterministica),
# durata accanto, poi titolo, sottotitolo e CTA "Listen the voice note".
function New-AudioCard($title, $subtitle, $duration, $outPath) {
  $pair = New-Canvas; $bmp = $pair[0]; $g = $pair[1]
  $barW = 8; $barGap = 10
  $count = 36
  $waveW = $count * ($barW + $barGap) - $barGap
  $waveX = ($1200 - $waveW) / 2
  $waveCenterY = 172
  $maxH = 130
  $brush = New-Object System.Drawing.SolidBrush($Ink)
  # Altezza deterministica: una funzione fissa, cosi' lo stesso titolo disegna
  # sempre la stessa waveform (niente casualita' che cambia tra un build e l'altro).
  for ($i = 0; $i -lt $count; $i++) {
    $phase = [Math]::PI * 2 * ($i / $count)
    $h = 18 + ($maxH - 18) * (0.5 + 0.5 * [Math]::Sin($phase) * [Math]::Cos($phase * 0.7))
    $barRect = New-Object System.Drawing.RectangleF(($waveX + $i * ($barW + $barGap)), ($waveCenterY - $h / 2), $barW, $h)
    $g.FillRectangle($brush, $barRect)
  }
  $durFont = New-Object System.Drawing.Font($sansFamily, [float]26, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $durSize = $g.MeasureString($duration, $durFont)
  $durRect = New-Object System.Drawing.RectangleF(($waveX + $waveW + 26), ($waveCenterY - $durSize.Height / 2), ($durSize.Width + 20), ($durSize.Height + 8))
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = [System.Drawing.StringAlignment]::Near
  $fmt.LineAlignment = [System.Drawing.StringAlignment]::Center
  $g.DrawString($duration, $durFont, (New-Object System.Drawing.SolidBrush($Ink40)), $durRect, $fmt)

  $afterText = Draw-TitleBlock $g $title $subtitle 268
  Draw-CtaPill $g "Listen the voice note" 600 ($afterText + 22) | Out-Null
  $g.Dispose()
  $dir = Split-Path $outPath -Parent
  if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output "wrote $outPath"
}

# ---------------------------------------------------------------- esecuzione
if (!$Video -and !$Audio) {
  # Senza parametri: due anteprime di esempio in out/_tmp (non toccano public/).
  $Preview = $true
  $OutRoot = Join-Path $Root "out\_tmp\og-media"
  New-VideoCard "The money layer for AI agents" "Thoughts $Dot 1 October 2026" "og.png" (Join-Path $OutRoot "sample-video.png")
  New-AudioCard "The thought before the decision" "Voice note $Dot 21 September 2026" "4:18" (Join-Path $OutRoot "sample-audio.png")
  Write-Output "anteprime di esempio in $OutRoot (usa -Video o -Audio per una card vera)"
  exit 0
}

if (!$Title) { Write-Error "-Title e' obbligatorio con -Video o -Audio"; exit 1 }
$outFile = if ($Video) { Join-Path $OutRoot "videos\og.png" } else { Join-Path $OutRoot "voice-notes\og.png" }
if ($Video) { New-VideoCard $Title $Subtitle $Thumb $outFile }
else { New-AudioCard $Title $Subtitle $Duration $outFile }
