# Genera le OG images PNG statiche (1200x630) in public/.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts/og.ps1
#   powershell ... -File scripts/og.ps1 -HomeOnly          # solo la OG della homepage
#   powershell ... -File scripts/og.ps1 -Only <slug>       # solo un articolo / una nota
#   powershell ... -File scripts/og.ps1 -Only <slug> -Preview   # scrive in out/_tmp/og (per approvare)
#   powershell ... -File scripts/og.ps1 -Subtitle meta     # sottotitolo = etichetta + punto medio + data
#
# NB: le pagine indice (/thoughts/, /notes/) hanno le loro immagini, non passano di qui.
#
# Tre mestieri, tre sorgenti:
#   1. homepage  <- `og.png` (master disegnato a mano in root), ridotto a 1200x630;
#   2. articoli  <- `og-sfondo.png` (sfondo, da sfondo.svg: vedi scripts/gen-og-bg.mjs)
#                   + titolo in Instrument Serif Regular + sottotitolo in Inter Light,
#                   entrambi centrati sotto il logo (font in scripts/fonts/);
#
# I titoli, le descrizioni e le date vengono letti da lib/posts.ts e lib/notes.ts:
# zero duplicazioni. Rilanciare lo script quando cambia un articolo o cambia il dominio.

param(
  [switch]$HomeOnly,
  [ValidateSet("description", "meta")]
  [string]$Subtitle = "meta",
  [string]$Only = "",
  [switch]$Preview
)

Add-Type -AssemblyName System.Drawing

$Root     = Split-Path $PSScriptRoot -Parent
# Il punto medio si compone dal codepoint e non si scrive nel file: PowerShell 5.1
# legge i .ps1 senza BOM come ANSI, quindi un carattere non-ASCII scritto qui
# arriverebbe sdoppiato nel testo disegnato ("Notes A· 12 September 2026" invece
# di "Notes · 12 September 2026").
$Dot      = [char]0x00B7
$Bg       = [System.Drawing.Color]::FromArgb(252, 252, 252)
$Ink      = [System.Drawing.Color]::FromArgb(22, 22, 22)     # gray-1200 #161616
$Ink60    = [System.Drawing.Color]::FromArgb(60, 60, 60)     # gray-1100 #3C3C3C
$Ink40    = [System.Drawing.Color]::FromArgb(104, 104, 104)  # gray-1000 #686868
$OutRoot  = if ($Preview) { Join-Path $Root ("out\_tmp\og\" + $Subtitle) } else { Join-Path $Root "public" }

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

# ---------------------------------------------------------------- font del sito
# Instrument Serif (titoli) e Inter Light (sottotitoli) dai file in scripts/fonts/:
# PrivateFontCollection li usa da disco, senza installarli nel sistema.
$fonts = New-Object System.Drawing.Text.PrivateFontCollection
foreach ($ttf in @("InstrumentSerif-Regular.ttf", "Inter-Light.ttf")) {
  $path = Join-Path $Root "scripts\fonts\$ttf"
  if (!(Test-Path $path)) { Write-Error "font mancante: $path"; exit 1 }
  $fonts.AddFontFile($path)
}
# Attenzione al nome: "Instrument Serif" contiene "Inter", quindi un filtro
# largo sul secondo matcherebbe il primo e il sottotitolo uscirebbe in serif.
$serifFamily = $fonts.Families | Where-Object { $_.Name -like "Instrument*" } | Select-Object -First 1
$sansFamily  = $fonts.Families | Where-Object { $_.Name -like "Inter*" -and $_.Name -notlike "Instrument*" } | Select-Object -First 1
if (!$serifFamily -or !$sansFamily) {
  Write-Error ("font non riconosciuti: " + (($fonts.Families | ForEach-Object { $_.Name }) -join ", "))
  exit 1
}
Write-Output ("font: titolo in " + $serifFamily.Name + ", sottotitolo in " + $sansFamily.Name)

# ------------------------------------------------------------ 1. OG della home
# Il disegno e' un master a mano (og.png in root, come Vector.svg e mattia.png):
# qui si porta a 1200x630 e si ricodifica, senza disegnare niente. Il master e'
# 1920x1008, cioe' lo stesso rapporto di 1200x630, quindi la riduzione e' esatta.
function Copy-MasterCard($masterFile, $outPath) {
  $master = Join-Path $Root $masterFile
  if (!(Test-Path $master)) { Write-Output "master assente: $masterFile (salto)"; return }
  $srcImg = [System.Drawing.Image]::FromFile($master)
  $bmp = New-Object System.Drawing.Bitmap(1200, 630, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.Clear($Bg)
  $g.DrawImage($srcImg, 0, 0, 1200, 630)
  $srcImg.Dispose()
  Save-Og $bmp $g $outPath
}

function New-HomeCard($outPath) {
  if (Test-Path (Join-Path $Root "og.png")) { Copy-MasterCard "og.png" $outPath; return }
  Write-Output "og.png (master) assente: disegno la OG della homepage con il testo"
  $pair = New-OgCanvas; $bmp = $pair[0]; $g = $pair[1]
  $titleFont = New-Object System.Drawing.Font("Segoe UI Semibold", 96, [System.Drawing.FontStyle]::Bold)
  $subFont   = New-Object System.Drawing.Font("Segoe UI", 40)
  $smallFont = New-Object System.Drawing.Font("Segoe UI", 28)
  $g.DrawString("Mattia Ciuni", $titleFont, [System.Drawing.SolidBrush]::new($Ink), 76, 180)
  $g.DrawString("Founder & CEO @ Payle", $subFont, [System.Drawing.SolidBrush]::new($Ink60), 80, 330)
  $g.DrawString("usepayle.com", $smallFont, [System.Drawing.SolidBrush]::new($Ink40), 80, 440)
  Save-Og $bmp $g $outPath
}

# ------------------------------------------------- 2. OG di un articolo / una nota
# Sfondo (og-sfondo.png, che ha gia' il logo in alto al centro) + titolo centrato
# in Instrument Serif + sottotitolo in Inter Light, subito sotto. Il blocco dei due
# testi e' centrato verticalmente nella fascia sotto il logo, cosi' un titolo corto
# e uno lungo occupano lo stesso posto.
#
# Sotto il sottotitolo, la call to action: una pillola nera con angoli tondi e
# testo bianco ("Read thought" / "Read note"). Deve restare minimal: nessun bordo
# extra, nessuna ombra, solo il blocco pieno.
function Draw-CtaPill($g, $text, $centerX, $topY) {
  $pillFont = New-Object System.Drawing.Font($sansFamily, [float]30, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $paddingX = 44
  $pillH = 78
  $textSize = $g.MeasureString($text, $pillFont)
  # MeasureString aggiunge un po' di respiro ai lati: il meno lo compensa, cosi'
  # il padding dichiarato e' quello che si vede.
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
  return $pillH
}

function New-ArticleCard($bgPath, $title, $subText, $outPath, $zoneTop = 230, $zoneBottom = 604, $ctaText = "") {
  $bgImg = [System.Drawing.Image]::FromFile($bgPath)
  $bmp = New-Object System.Drawing.Bitmap(1200, 630, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint  = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.DrawImage($bgImg, 0, 0, 1200, 630)
  $bgImg.Dispose()

  $titleFont = New-Object System.Drawing.Font($serifFamily, [float]72, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $subFont   = New-Object System.Drawing.Font($sansFamily,  [float]27, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $titleBrush = New-Object System.Drawing.SolidBrush($Ink)
  $subBrush   = New-Object System.Drawing.SolidBrush($Ink40)

  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = [System.Drawing.StringAlignment]::Center
  $fmt.LineAlignment = [System.Drawing.StringAlignment]::Near
  $fmt.Trimming = [System.Drawing.StringTrimming]::None

  $titleW = 960; $titleX = 120
  $subW   = 820; $subX   = 190
  $gap    = 26

  $bigBox = New-Object System.Drawing.SizeF($titleW, 4000)
  $titleSize = $g.MeasureString($title, $titleFont, $bigBox, $fmt)
  $subSize = if ($subText) { $g.MeasureString($subText, $subFont, (New-Object System.Drawing.SizeF($subW, 4000)), $fmt) } else { New-Object System.Drawing.SizeF(0, 0) }

  $ctaH = 0; $ctaGap = 44
  if ($ctaText) { $ctaH = 78 + $ctaGap }
  $blockH = $titleSize.Height + $(if ($subText) { $gap + $subSize.Height } else { 0 }) + $ctaH
  $y = [Math]::Max($zoneTop, $zoneTop + (($zoneBottom - $zoneTop) - $blockH) / 2)

  $titleH = $titleSize.Height + 8
  $titleRect = New-Object System.Drawing.RectangleF($titleX, $y, $titleW, $titleH)
  $g.DrawString($title, $titleFont, $titleBrush, $titleRect, $fmt)
  if ($subText) {
    $subY = $y + $titleSize.Height + $gap
    $subH = $subSize.Height + 8
    $subRect = New-Object System.Drawing.RectangleF($subX, $subY, $subW, $subH)
    $g.DrawString($subText, $subFont, $subBrush, $subRect, $fmt)
  }
  if ($ctaText) {
    $ctaTop = $y + $titleSize.Height + $(if ($subText) { $gap + $subSize.Height } else { 0 }) + $ctaGap
    Draw-CtaPill $g $ctaText 600 $ctaTop | Out-Null
  }
  Save-Og $bmp $g $outPath
}

function Get-Articles($fileName, $label) {
  # -Encoding UTF8: i registri sono UTF-8 senza BOM (senza, un titolo accentato
  # arriverebbe al disegno sdoppiato dal default ANSI di PowerShell 5.1).
  $src = Get-Content (Join-Path $Root $fileName) -Raw -Encoding UTF8
  $re = [regex]'(?s)slug:\s*"([^"]+)".*?title:\s*"([^"]+)".*?description:\s*"((?:[^"\\]|\\.)*)".*?date:\s*"([^"]+)"'
  return $re.Matches($src) | ForEach-Object {
    [pscustomobject]@{
      Kind        = $label
      Slug        = $_.Groups[1].Value
      Title       = $_.Groups[2].Value
      Description = $_.Groups[3].Value
      Date        = $_.Groups[4].Value
      Meta        = $label + " " + $Dot + " " + ([datetime]::ParseExact($_.Groups[4].Value, "yyyy-MM-dd", $null).ToString("d MMMM yyyy", [System.Globalization.CultureInfo]::InvariantCulture))
    }
  }
}

# ---------------------------------------------------------------- esecuzione
if (!$Only -or $HomeOnly) { New-HomeCard (Join-Path $OutRoot "og.png") }
if ($Preview -and !$Only) { Write-Output "-Preview: la homepage si rigenera solo con -HomeOnly" }
if ($HomeOnly) { Write-Output "solo homepage: fatto"; exit 0 }

$bgCard = Join-Path $Root "og-sfondo.png"
if (!(Test-Path $bgCard)) {
  Write-Error 'og-sfondo.png assente: lancialo prima con  node scripts/gen-og-bg.mjs'
  exit 1
}
if ((Get-Item (Join-Path $Root "sfondo.svg")).LastWriteTime -gt (Get-Item $bgCard).LastWriteTime) {
  Write-Output 'ATTENZIONE: sfondo.svg e'' piu'' recente di og-sfondo.png: rilancia  node scripts/gen-og-bg.mjs'
}

$articles = @()
$articles += Get-Articles "lib/posts.ts" "Thoughts"
$articles += Get-Articles "lib/notes.ts" "Notes"
$articles += Get-Articles "lib/feedback.ts" "Feedback"
if ($Only) { $articles = $articles | Where-Object { $_.Slug -eq $Only } }
if (!$articles) { Write-Error "nessun articolo trovato con slug '$Only'"; exit 1 }

# Card senza CTA pill: per questi articoli vale il disegno di prima (testo
# centrato, nessuna pillola). Il commit che le ha approvate: b93b553.
$noCtaSlugs = @("finding-ghassen-the-co-founder-question-answered-in-three-weeks")

# Due immagini per ogni articolo, dallo stesso disegno:
#   og.png     la card social, col logo in alto (quella che dichiara og:image);
#   cover.png  l'immagine che sta in pagina sopra il titolo: senza logo, quindi
#              col testo centrato nel riquadro (non nella fascia sotto il logo).
#
# I post di **Feedback** hanno solo la `og.png`: la loro pagina non ha copertina
# (la card in pagina mostrerebbe dentro l'articolo la sua stessa call to action,
# «Read feedback»), quindi generare una cover significherebbe spedire un file che
# nessuna pagina nomina.
$bgCover = Join-Path $Root "og-sfondo-cover.png"
if (!(Test-Path $bgCover)) {
  Write-Error 'og-sfondo-cover.png assente: lancialo prima con  node scripts/gen-og-bg.mjs'
  exit 1
}

foreach ($a in $articles) {
  $dir = if ($a.Kind -eq "Thoughts") { "thoughts" } elseif ($a.Kind -eq "Feedback") { "feedback" } else { "notes" }
  $ogPath = Join-Path $OutRoot ($dir + "\" + $a.Slug + "\og.png")
  $coverPath = Join-Path $OutRoot ($dir + "\" + $a.Slug + "\cover.png")
  $subText = if ($Subtitle -eq "meta") { $a.Meta } else { $a.Description }
  $cta = if ($noCtaSlugs -contains $a.Slug) { "" } elseif ($a.Kind -eq "Thoughts") { "Read thought" } elseif ($a.Kind -eq "Feedback") { "Read feedback" } else { "Read note" }

  # Ghassen ha un master editoriale dedicato, fornito per questa pagina:
  # non va ricomposto con il template delle altre Thoughts.
  if ($a.Slug -eq "finding-ghassen-the-co-founder-question-answered-in-three-weeks" -and (Test-Path (Join-Path $Root "ghassen-og.png"))) {
    Copy-MasterCard "ghassen-og.png" $ogPath
  } else {
    New-ArticleCard $bgCard $a.Title $subText $ogPath 230 604 $cta
  }

  if ($a.Kind -ne "Feedback") {
    New-ArticleCard $bgCover $a.Title $subText $coverPath 60 570 $cta
  }
}

# --- OG delle pagine indice (/thoughts/ e /notes/) -----
# Anche queste sono master disegnati a mano (thoughts-og.png, notesog.png),
# come la homepage: qui si portano soltanto a 1200x630.
if (!$Only -and !$Preview) {
  Copy-MasterCard "thoughts-og.png" (Join-Path $OutRoot "thoughts\og.png")
  Copy-MasterCard "notesog.png"    (Join-Path $OutRoot "notes\og.png")
}
