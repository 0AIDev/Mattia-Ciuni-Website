# Genera le OG images PNG statiche (1200x630) in public/.
# Esegui con: powershell -NoProfile -ExecutionPolicy Bypass -File scripts/og.ps1
# Opzioni: -Domain "https://iltuodominio.com" (default: mattaciuni.xyz)
# I titoli dei post vengono letti da lib/posts.ts (slug + title) -> zero duplicazioni.
# Rifai girare lo script ogni volta che aggiungi/cambi un post.

param(
  [string]$Domain = "mattiaciuni.xyz"
)

Add-Type -AssemblyName System.Drawing

$Bg     = [System.Drawing.Color]::FromArgb(252, 252, 252)
$Ink    = [System.Drawing.Color]::FromArgb(22, 22, 22)
$Ink60  = [System.Drawing.Color]::FromArgb(60, 60, 60)
$Ink40  = [System.Drawing.Color]::FromArgb(160, 160, 160)

function New-OgCanvas {
  $bmp = New-Object System.Drawing.Bitmap(1200, 630)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.Clear($Bg)
  return $bmp, $g
}

function Get-WrappedLines($g, $text, $font, $maxWidth) {
  $lines = @()
  $current = ""
  foreach ($word in $text.Split(" ")) {
    $trial = if ($current -eq "") { $word } else { "$current $word" }
    $w = $g.MeasureString($trial, $font).Width
    if ($w -le $maxWidth) { $current = $trial }
    else { $lines += $current; $current = $word }
  }
  if ($current -ne "") { $lines += $current }
  return $lines
}

function Save-Og($bmp, $g, $path) {
  $g.Dispose()
  $dir = Split-Path $path -Parent
  if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output "wrote $path"
}

# --- 1. Homepage OG: public/og.png ---
$pair = New-OgCanvas; $bmp = $pair[0]; $g = $pair[1]
$titleFont = New-Object System.Drawing.Font("Segoe UI Semibold", 96, [System.Drawing.FontStyle]::Bold)
$subFont   = New-Object System.Drawing.Font("Segoe UI", 40)
$smallFont = New-Object System.Drawing.Font("Segoe UI", 28)
$g.DrawString("Mattia Ciuni", $titleFont, [System.Drawing.SolidBrush]::new($Ink), 76, 180)
$g.DrawString("Founder & CEO @ Payle", $subFont, [System.Drawing.SolidBrush]::new($Ink60), 80, 330)
$g.DrawString("usepayle.com", $smallFont, [System.Drawing.SolidBrush]::new($Ink40), 80, 440)
Save-Og $bmp $g "public/og.png"

# --- 2. Thoughts OG: public/thoughts/<slug>/og.png ---
$src = Get-Content "lib/posts.ts" -Raw
$slugs = [regex]::Matches($src, 'slug:\s*"([^"]+)"') | ForEach-Object { $_.Groups[1].Value }
$titles = [regex]::Matches($src, 'title:\s*"([^"]+)"') | ForEach-Object { $_.Groups[1].Value }

for ($i = 0; $i -lt $slugs.Count; $i++) {
  $pair = New-OgCanvas; $bmp = $pair[0]; $g = $pair[1]
  $eyeFont   = New-Object System.Drawing.Font("Segoe UI", 30)
  $postFont  = New-Object System.Drawing.Font("Segoe UI Semibold", 68, [System.Drawing.FontStyle]::Bold)
  $footFont  = New-Object System.Drawing.Font("Segoe UI", 30)
  $g.DrawString("$Domain - thoughts", $eyeFont, [System.Drawing.SolidBrush]::new($Ink40), 78, 90)
  $lines = Get-WrappedLines $g $titles[$i] $postFont 1040
  $y = 160
  foreach ($ln in $lines) {
    $g.DrawString($ln, $postFont, [System.Drawing.SolidBrush]::new($Ink), 76, $y)
    $y += 88
  }
  $g.DrawString("Mattia Ciuni - Founder & CEO @ Payle", $footFont, [System.Drawing.SolidBrush]::new($Ink60), 80, 500)
  Save-Og $bmp $g ("public/thoughts/" + $slugs[$i] + "/og.png")
}
