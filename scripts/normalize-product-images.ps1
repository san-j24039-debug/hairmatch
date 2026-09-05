Add-Type -AssemblyName System.Drawing
$productDirectory = Join-Path $PSScriptRoot '..\assets\images\products'
$normalizedDirectory = Join-Path $productDirectory 'normalized'
New-Item -ItemType Directory -Force -Path $normalizedDirectory | Out-Null
Get-ChildItem -LiteralPath $productDirectory -File | Where-Object Extension -in '.png','.jpg' | ForEach-Object {
  $sourceBitmap = [System.Drawing.Bitmap]::FromFile($_.FullName)
  $left = $sourceBitmap.Width; $right = 0; $top = $sourceBitmap.Height; $bottom = 0
  for ($y=0; $y -lt $sourceBitmap.Height; $y+=2) {
    for ($x=0; $x -lt $sourceBitmap.Width; $x+=2) {
      $pixel = $sourceBitmap.GetPixel($x,$y)
      if ($pixel.A -gt 32 -and [Math]::Min($pixel.R,[Math]::Min($pixel.G,$pixel.B)) -lt 238) {
        $left=[Math]::Min($left,$x); $right=[Math]::Max($right,$x)
        $top=[Math]::Min($top,$y); $bottom=[Math]::Max($bottom,$y)
      }
    }
  }
  $left=[Math]::Max(0,$left-6); $top=[Math]::Max(0,$top-6)
  $right=[Math]::Min($sourceBitmap.Width,$right+8); $bottom=[Math]::Min($sourceBitmap.Height,$bottom+8)
  $cropWidth=$right-$left; $cropHeight=$bottom-$top
  $scale=[Math]::Min(500.0/$cropWidth,500.0/$cropHeight)
  $drawWidth=[int]($cropWidth*$scale); $drawHeight=[int]($cropHeight*$scale)
  $outputBitmap=New-Object System.Drawing.Bitmap(600,600)
  $graphics=[System.Drawing.Graphics]::FromImage($outputBitmap)
  $graphics.Clear([System.Drawing.Color]::White)
  $graphics.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $destination=New-Object System.Drawing.Rectangle([int]((600-$drawWidth)/2),[int]((600-$drawHeight)/2),$drawWidth,$drawHeight)
  $graphics.DrawImage($sourceBitmap,$destination,$left,$top,$cropWidth,$cropHeight,[System.Drawing.GraphicsUnit]::Pixel)
  $outputBitmap.Save((Join-Path $normalizedDirectory ($_.BaseName+'.png')),[System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose(); $outputBitmap.Dispose(); $sourceBitmap.Dispose()
  Write-Output ('Normalized: '+$_.Name)
}
