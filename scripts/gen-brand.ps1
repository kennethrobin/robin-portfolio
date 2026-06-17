# Generates brand assets for SEO / social: a 1200x630 share card, favicons
# and PWA icons. Uses System.Drawing with a reliable system font (GDI+'s
# PrivateFontCollection is unreliable with the .otf brand fonts). Re-run
# any time the wording or palette changes.
Add-Type -AssemblyName System.Drawing

$root   = Split-Path $PSScriptRoot -Parent
$out    = Join-Path $root 'public'
$ground = [System.Drawing.ColorTranslator]::FromHtml('#0a0a0c')

function New-Brush([int]$a) { New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($a, 255, 255, 255)) }
function New-Font([string]$name, [single]$px, [System.Drawing.FontStyle]$style) {
  New-Object System.Drawing.Font($name, $px, $style, [System.Drawing.GraphicsUnit]::Pixel)
}

# ---- 1200x630 social / OG share card -----------------------------------
$bmp = New-Object System.Drawing.Bitmap 1200, 630
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'
$g.TextRenderingHint = 'AntiAliasGridFit'
$g.Clear($ground)

# Build strings from code points so the .ps1's on-disk encoding can't
# mangle non-ASCII glyphs (PS 5.1 reads scripts as ANSI without a BOM).
$omac   = [char]0x014D   # ō  (o with macron)
$emdash = [char]0x2014   # —
$middot = [char]0x00B7   # ·
$wordmark = 'R' + $omac + 'bin'
$nameLine = 'Kenneth Robin ' + $emdash + ' Los Angeles'
$clients  = @('AT&T','BBC','HULU','FX','XBOX','SQUARESPACE','SAMSUNG') -join (' ' + $middot + ' ')

$mx = 90
# eyebrow
$g.DrawString('MOTION DESIGN  &  CREATIVE DIRECTION', (New-Font 'Segoe UI' 27 ([System.Drawing.FontStyle]::Bold)), (New-Brush 150), $mx, 96)
# wordmark
$g.DrawString($wordmark, (New-Font 'Segoe UI' 168 ([System.Drawing.FontStyle]::Bold)), (New-Brush 255), ($mx - 8), 150)
# name + location
$g.DrawString($nameLine, (New-Font 'Segoe UI' 44 ([System.Drawing.FontStyle]::Regular)), (New-Brush 220), $mx, 372)
# accent rule
$pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(80, 255, 255, 255)), 2
$g.DrawLine($pen, $mx, 470, 1110, 470)
# client row
$g.DrawString($clients, (New-Font 'Segoe UI' 27 ([System.Drawing.FontStyle]::Regular)), (New-Brush 130), $mx, 506)

$g.Dispose()
$bmp.Save((Join-Path $out 'og-image.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

# ---- square icon ('R') at several sizes --------------------------------
function New-Icon([int]$size, [string]$file) {
  $b = New-Object System.Drawing.Bitmap $size, $size
  $gg = [System.Drawing.Graphics]::FromImage($b)
  $gg.SmoothingMode = 'AntiAlias'
  $gg.TextRenderingHint = 'AntiAliasGridFit'
  $gg.Clear($ground)
  $f = New-Font 'Segoe UI' ($size * 0.64) ([System.Drawing.FontStyle]::Bold)
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = 'Center'; $sf.LineAlignment = 'Center'
  # nudge up a hair so the optical center sits right
  $rect = New-Object System.Drawing.RectangleF 0, ($size * -0.04), $size, $size
  $gg.DrawString('R', $f, (New-Brush 255), $rect, $sf)
  $gg.Dispose()
  $b.Save((Join-Path $out $file), [System.Drawing.Imaging.ImageFormat]::Png)
  $b.Dispose()
}
New-Icon 512 'icon-512.png'
New-Icon 192 'icon-192.png'
New-Icon 180 'apple-touch-icon.png'
New-Icon 32  'favicon-32.png'

Write-Output 'Brand assets written to /public.'
