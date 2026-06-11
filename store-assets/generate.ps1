# Gera os assets das lojas (Google Play / App Store) a partir de config.json.
# Uso:  powershell -ExecutionPolicy Bypass -File store-assets\generate.ps1
# Screenshots: coloque as capturas cruas em store-assets\raw\ (e raw-ipad\ para iPad)
# nomeadas com os prefixos de config.json (ex.: 01-home.png) e rode de novo.

param([string]$Root = $PSScriptRoot)

Add-Type -AssemblyName System.Drawing

$cfg = [IO.File]::ReadAllText((Join-Path $Root 'config.json'), [Text.Encoding]::UTF8) | ConvertFrom-Json
$brand = $cfg.brand

function ColorHex([string]$hex, [int]$alpha = 255) {
    $c = [System.Drawing.ColorTranslator]::FromHtml($hex)
    return [System.Drawing.Color]::FromArgb($alpha, $c.R, $c.G, $c.B)
}

function New-Canvas([int]$w, [int]$h) {
    $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    return ,@($bmp, $g)
}

function Fill-Gradient($g, [int]$w, [int]$h, $c1, $c2, [single]$angle) {
    $rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, $angle)
    $g.FillRectangle($brush, $rect)
    $brush.Dispose()
}

function New-RoundedPath([single]$x, [single]$y, [single]$w, [single]$h, [single]$r) {
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $r * 2
    $p.AddArc($x, $y, $d, $d, 180, 90)
    $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $p.CloseFigure()
    return $p
}

function Draw-Hexagon($g, [single]$cx, [single]$cy, [single]$r, $color, [single]$penW) {
    $pts = New-Object 'System.Drawing.PointF[]' 6
    for ($i = 0; $i -lt 6; $i++) {
        $a = [Math]::PI / 180.0 * (60 * $i - 30)
        $pts[$i] = New-Object System.Drawing.PointF(($cx + $r * [Math]::Cos($a)), ($cy + $r * [Math]::Sin($a)))
    }
    $pen = New-Object System.Drawing.Pen($color, $penW)
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $g.DrawPolygon($pen, $pts)
    $pen.Dispose()
}

function Draw-HexDecor($g, [int]$w, [int]$h) {
    $c = ColorHex $brand.honey $brand.hexAlpha
    Draw-Hexagon $g ($w * 0.92) ($h * 0.10) ($w * 0.085) $c ([Math]::Max(2, $w * 0.004))
    Draw-Hexagon $g ($w * 1.00) ($h * 0.22) ($w * 0.055) $c ([Math]::Max(2, $w * 0.003))
    Draw-Hexagon $g ($w * 0.06) ($h * 0.94) ($w * 0.07) $c ([Math]::Max(2, $w * 0.0035))
}

# Caixa ocupada (nao-transparente) do icone, para compor full-bleed sem o padding embutido
function Get-ContentBounds($bmp) {
    $s = 128
    $small = New-Object System.Drawing.Bitmap($bmp, $s, $s)
    $minX = $s; $minY = $s; $maxX = 0; $maxY = 0
    for ($y = 0; $y -lt $s; $y++) {
        for ($x = 0; $x -lt $s; $x++) {
            if ($small.GetPixel($x, $y).A -gt 10) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }
    $small.Dispose()
    $fx = $bmp.Width / [single]$s
    $fy = $bmp.Height / [single]$s
    return New-Object System.Drawing.RectangleF(($minX * $fx), ($minY * $fy), (($maxX - $minX + 1) * $fx), (($maxY - $minY + 1) * $fy))
}

function Draw-Hive($g, $icon, $src, [single]$cx, [single]$cy, [single]$boxSize) {
    $scale = [Math]::Min($boxSize / $src.Width, $boxSize / $src.Height)
    $dw = $src.Width * $scale
    $dh = $src.Height * $scale
    $dest = New-Object System.Drawing.RectangleF(($cx - $dw / 2), ($cy - $dh / 2), $dw, $dh)
    $g.DrawImage($icon, $dest, $src, [System.Drawing.GraphicsUnit]::Pixel)
}

# Desenha imagem cobrindo todo o canvas (estilo CSS background-size: cover)
function Draw-CoverImage($g, $img, [int]$W, [int]$H) {
    $scale = [Math]::Max($W / [single]$img.Width, $H / [single]$img.Height)
    $dw = $img.Width * $scale
    $dh = $img.Height * $scale
    $g.DrawImage($img, (New-Object System.Drawing.RectangleF((($W - $dw) / 2), (($H - $dh) / 2), $dw, $dh)))
}

function Draw-SoftShadow($g, [single]$x, [single]$y, [single]$w, [single]$h, [single]$r) {
    for ($i = 14; $i -ge 2; $i -= 2) {
        $alpha = [int](4 + (14 - $i))
        $b = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($alpha, 70, 45, 10))
        $p = New-RoundedPath ($x - $i) ($y - $i + ($i * 0.7)) ($w + 2 * $i) ($h + 2 * $i) ($r + $i)
        $g.FillPath($b, $p)
        $p.Dispose(); $b.Dispose()
    }
}

function Save-Png($bmp, [string]$path) {
    $dir = Split-Path $path -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force $dir | Out-Null }
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "ok: $path"
}

$iconPath = Join-Path $Root $brand.iconSource
$icon = New-Object System.Drawing.Bitmap((Resolve-Path $iconPath).Path)
$srcBounds = Get-ContentBounds $icon

# ---------------------------------------------------------------- Play icon 512x512 (full-bleed)
$c = New-Canvas 512 512
$bmp = $c[0]; $g = $c[1]
Fill-Gradient $g 512 512 (ColorHex $brand.bgTop) (ColorHex $brand.bgBottom) 90
Draw-HexDecor $g 512 512
Draw-Hive $g $icon $srcBounds 256 260 370
Save-Png $bmp (Join-Path $Root 'play\icon-512.png')
$g.Dispose(); $bmp.Dispose()

# ---------------------------------------------------------------- Feature graphic 1024x500
# Se existir ai\feature-bg.png (arte gerada por IA, colmeia a esquerda + espaco a direita),
# usa como fundo e so desenha o texto por cima; senao desenha o fundo padrao.
$fg = $cfg.featureGraphic
$c = New-Canvas 1024 500
$bmp = $c[0]; $g = $c[1]
$aiFeature = Join-Path $Root 'ai\feature-bg.png'
if (Test-Path $aiFeature) {
    $bg = New-Object System.Drawing.Bitmap((Resolve-Path $aiFeature).Path)
    Draw-CoverImage $g $bg 1024 500
    $bg.Dispose()
} else {
    Fill-Gradient $g 1024 500 (ColorHex $brand.honeyPale) (ColorHex $brand.honeyLight) 35
    $hexC = ColorHex $brand.honey 45
    Draw-Hexagon $g 950 70 70 $hexC 4
    Draw-Hexagon $g 1010 190 45 $hexC 3
    Draw-Hexagon $g 70 450 55 $hexC 3.5
    Draw-Hive $g $icon $srcBounds 210 250 340
}

$titleFont = New-Object System.Drawing.Font('Segoe UI', 96, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$tagFont = New-Object System.Drawing.Font('Segoe UI', 38, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$featFont = New-Object System.Drawing.Font('Segoe UI', 30, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$darkBrush = New-Object System.Drawing.SolidBrush(ColorHex $brand.textDark)
$softBrush = New-Object System.Drawing.SolidBrush(ColorHex $brand.textSoft)
$g.DrawString($fg.title, $titleFont, $darkBrush, 395, 130)
$g.DrawString($fg.tagline, $tagFont, $darkBrush, 405, 255)
$g.DrawString($fg.features, $featFont, $softBrush, 407, 320)
$titleFont.Dispose(); $tagFont.Dispose(); $featFont.Dispose()
Save-Png $bmp (Join-Path $Root 'play\feature-graphic-1024x500.png')
$g.Dispose(); $bmp.Dispose()

# ---------------------------------------------------------------- Screenshots emoldurados
function Make-Screenshot([string]$rawPath, $caption, [int]$W, [int]$H, [string]$outPath, [string]$bgPath) {
    $raw = New-Object System.Drawing.Bitmap((Resolve-Path $rawPath).Path)
    $c = New-Canvas $W $H
    $bmp = $c[0]; $g = $c[1]
    if ($bgPath -and (Test-Path $bgPath)) {
        $bg = New-Object System.Drawing.Bitmap((Resolve-Path $bgPath).Path)
        Draw-CoverImage $g $bg $W $H
        $bg.Dispose()
    } else {
        Fill-Gradient $g $W $H (ColorHex $brand.bgTop) (ColorHex $brand.bgBottom) 90
        Draw-HexDecor $g $W $H
    }

    $titleFont = New-Object System.Drawing.Font('Segoe UI', ($W * 0.058), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $subFont = New-Object System.Drawing.Font('Segoe UI', ($W * 0.034), [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
    $darkBrush = New-Object System.Drawing.SolidBrush(ColorHex $brand.textDark)
    $softBrush = New-Object System.Drawing.SolidBrush(ColorHex $brand.textSoft)
    $fmt = New-Object System.Drawing.StringFormat
    $fmt.Alignment = [System.Drawing.StringAlignment]::Center

    $padX = $W * 0.07
    $titleRect = New-Object System.Drawing.RectangleF($padX, ($H * 0.040), ($W - 2 * $padX), ($H * 0.105))
    $g.DrawString($caption.title, $titleFont, $darkBrush, $titleRect, $fmt)
    $titleSize = $g.MeasureString($caption.title, $titleFont, [int]($W - 2 * $padX))
    $subY = $H * 0.040 + $titleSize.Height + $H * 0.004
    $subRect = New-Object System.Drawing.RectangleF($padX, $subY, ($W - 2 * $padX), ($H * 0.08))
    $g.DrawString($caption.subtitle, $subFont, $softBrush, $subRect, $fmt)
    $subSize = $g.MeasureString($caption.subtitle, $subFont, [int]($W - 2 * $padX))

    $shotTop = $subY + $subSize.Height + $H * 0.022
    $bottomPad = $H * 0.035
    $maxW = $W * 0.84
    $maxH = $H - $shotTop - $bottomPad
    $scale = [Math]::Min($maxW / $raw.Width, $maxH / $raw.Height)
    $dw = $raw.Width * $scale
    $dh = $raw.Height * $scale
    $dx = ($W - $dw) / 2
    $dy = $shotTop + ($maxH - $dh) / 2
    $radius = $W * 0.045

    Draw-SoftShadow $g $dx $dy $dw $dh $radius
    $clip = New-RoundedPath $dx $dy $dw $dh $radius
    $state = $g.Save()
    $g.SetClip($clip)
    $g.DrawImage($raw, (New-Object System.Drawing.RectangleF($dx, $dy, $dw, $dh)))
    $g.Restore($state)
    $borderPen = New-Object System.Drawing.Pen((ColorHex $brand.honey 110), ([Math]::Max(3, $W * 0.004)))
    $g.DrawPath($borderPen, $clip)
    $borderPen.Dispose(); $clip.Dispose()

    Save-Png $bmp $outPath
    $titleFont.Dispose(); $subFont.Dispose(); $darkBrush.Dispose(); $softBrush.Dispose()
    $g.Dispose(); $bmp.Dispose(); $raw.Dispose()
}

foreach ($target in $cfg.targets) {
    $rawDir = Join-Path $Root $target.rawDir
    if (-not (Test-Path $rawDir)) {
        Write-Host "skip: $($target.name) (pasta $($target.rawDir)\ nao existe)"
        continue
    }
    $made = 0
    foreach ($cap in $cfg.captions) {
        $rawFile = Get-ChildItem $rawDir -File | Where-Object { $_.BaseName -like "$($cap.file)*" } | Select-Object -First 1
        if ($null -eq $rawFile) { continue }
        $out = Join-Path $Root ($target.outDir + '\' + $cap.file + '-' + $target.width + 'x' + $target.height + '.png')
        # Fundo de IA: ai\bg-01-home.png (especifico) ou ai\bg-default.png (todos)
        $bg = Join-Path $Root ('ai\bg-' + $cap.file + '.png')
        if (-not (Test-Path $bg)) { $bg = Join-Path $Root 'ai\bg-default.png' }
        Make-Screenshot $rawFile.FullName $cap $target.width $target.height $out $bg
        $made++
    }
    if ($made -eq 0) { Write-Host "skip: $($target.name) (nenhuma captura em $($target.rawDir)\ com os prefixos de config.json)" }
}

# ---------------------------------------------------------------- Artes prontas do ChatGPT
# Imagens ja finalizadas pelo ChatGPT (fundo + moldura + texto), pasta unica ai-final\
# (as mesmas artes servem para App Store e Google Play):
#   ai-final\01-home.png ... 06-household.png
#   ai-final\feature-graphic.png  -> feature graphic da Play
# Aqui so redimensionamos (cover-crop) para os tamanhos exatos das lojas.
$fgFinal = Join-Path $Root 'ai-final\feature-graphic.png'
if (Test-Path $fgFinal) {
    $img = New-Object System.Drawing.Bitmap((Resolve-Path $fgFinal).Path)
    $c = New-Canvas 1024 500
    $bmp = $c[0]; $g = $c[1]
    Draw-CoverImage $g $img 1024 500
    Save-Png $bmp (Join-Path $Root 'play\feature-graphic-1024x500.png')
    $g.Dispose(); $bmp.Dispose(); $img.Dispose()
}
foreach ($target in $cfg.targets) {
    $tDir = Join-Path $Root 'ai-final'
    if (-not (Test-Path $tDir)) { continue }
    foreach ($cap in $cfg.captions) {
        $f = Get-ChildItem $tDir -File | Where-Object { $_.BaseName -like "$($cap.file)*" } | Select-Object -First 1
        if ($null -eq $f) { continue }
        $img = New-Object System.Drawing.Bitmap($f.FullName)
        $c = New-Canvas $target.width $target.height
        $bmp = $c[0]; $g = $c[1]
        Draw-CoverImage $g $img $target.width $target.height
        $out = Join-Path $Root ($target.outDir + '\' + $cap.file + '-' + $target.width + 'x' + $target.height + '.png')
        Save-Png $bmp $out
        $g.Dispose(); $bmp.Dispose(); $img.Dispose()
    }
}

$icon.Dispose()
Write-Host 'pronto.'
