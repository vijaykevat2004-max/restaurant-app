param([string]$exe, [string]$args)
$proc = Start-Process -FilePath $exe -ArgumentList $args -PassThru -NoNewWindow
$proc.Id