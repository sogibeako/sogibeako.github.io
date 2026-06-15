param(
  [int]$Port = 8030,
  [string]$HostName = "127.0.0.1",
  [switch]$NoOpen
)

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootFull = [System.IO.Path]::GetFullPath($Root)
$RootPrefix = $RootFull.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar

$MimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".htm"  = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".txt"  = "text/plain; charset=utf-8"
  ".svg"  = "image/svg+xml"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".gif"  = "image/gif"
  ".webp" = "image/webp"
  ".ico"  = "image/x-icon"
  ".mp3"  = "audio/mpeg"
  ".wav"  = "audio/wav"
  ".mp4"  = "video/mp4"
  ".wasm" = "application/wasm"
}

function Send-Response {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$StatusCode,
    [string]$StatusText,
    [byte[]]$Body,
    [string]$ContentType = "text/plain; charset=utf-8"
  )

  $Header = "HTTP/1.1 $StatusCode $StatusText`r`n" +
    "Content-Type: $ContentType`r`n" +
    "Content-Length: $($Body.Length)`r`n" +
    "Connection: close`r`n" +
    "Cache-Control: no-store`r`n`r`n"

  $HeaderBytes = [System.Text.Encoding]::ASCII.GetBytes($Header)
  $Stream.Write($HeaderBytes, 0, $HeaderBytes.Length)
  if ($Body.Length -gt 0) {
    $Stream.Write($Body, 0, $Body.Length)
  }
}

function Resolve-RequestPath {
  param([string]$UrlPath)

  $CleanPath = $UrlPath.Split("?")[0].Split("#")[0]
  $CleanPath = [System.Uri]::UnescapeDataString($CleanPath)
  $CleanPath = $CleanPath.TrimStart("/")

  if ([string]::IsNullOrWhiteSpace($CleanPath)) {
    $CleanPath = "index.html"
  }

  $RelativePath = $CleanPath -replace "/", [System.IO.Path]::DirectorySeparatorChar
  $FullPath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($RootFull, $RelativePath))

  if (-not $FullPath.StartsWith($RootPrefix, [System.StringComparison]::OrdinalIgnoreCase) -and
      -not $FullPath.Equals($RootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
    return $null
  }

  return $FullPath
}

function Get-RelativeUrl {
  param([string]$FullPath)

  $Relative = $FullPath.Substring($RootPrefix.Length)
  return ($Relative -replace "\\", "/")
}

function Get-DirectoryListing {
  param(
    [string]$DirectoryPath,
    [string]$RequestPath
  )

  $DisplayPath = [System.Net.WebUtility]::HtmlEncode([System.Uri]::UnescapeDataString($RequestPath))
  $Rows = New-Object System.Collections.Generic.List[string]

  if ($DirectoryPath -ne $RootFull) {
    $Rows.Add('<li><a href="../">../</a></li>')
  }

  Get-ChildItem -LiteralPath $DirectoryPath -Force |
    Sort-Object @{ Expression = { -not $_.PSIsContainer } }, Name |
    ForEach-Object {
      $Name = $_.Name
      $HrefName = [System.Uri]::EscapeDataString($Name).Replace("%2F", "/")
      if ($_.PSIsContainer) {
        $Name = "$Name/"
        $HrefName = "$HrefName/"
      }

      $SafeName = [System.Net.WebUtility]::HtmlEncode($Name)
      $Rows.Add("<li><a href=""$HrefName"">$SafeName</a></li>")
    }

  $Body = @"
<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>pub local server</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 32px; line-height: 1.6; color: #1f2937; }
    h1 { font-size: 24px; margin: 0 0 16px; }
    ul { padding-left: 24px; }
    a { color: #0369a1; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>Index of $DisplayPath</h1>
  <ul>
    $($Rows -join "`n    ")
  </ul>
</body>
</html>
"@

  return [System.Text.Encoding]::UTF8.GetBytes($Body)
}

$Address = [System.Net.IPAddress]::Parse($HostName)
$Listener = [System.Net.Sockets.TcpListener]::new($Address, $Port)

try {
  $Listener.Start()

  Write-Host ""
  Write-Host "Serving pub from: $RootFull"
  Write-Host "Pub top:                    http://${HostName}:$Port/"
  Write-Host "Example - JSS project 0025: http://${HostName}:$Port/jssproject/0025/index.html"
  Write-Host ""
  Write-Host "Press Ctrl+C to stop the server."
  Write-Host ""

  if (-not $NoOpen) {
    Start-Process "http://${HostName}:$Port/"
  }

  while ($true) {
    $Client = $Listener.AcceptTcpClient()
    try {
      $Stream = $Client.GetStream()
      $Reader = [System.IO.StreamReader]::new($Stream, [System.Text.Encoding]::ASCII, $false, 8192, $true)
      $RequestLine = $Reader.ReadLine()

      while ($Reader.Peek() -gt -1) {
        $Line = $Reader.ReadLine()
        if ([string]::IsNullOrEmpty($Line)) { break }
      }

      if (-not $RequestLine) {
        continue
      }

      $Parts = $RequestLine.Split(" ")
      $Method = $Parts[0]
      $UrlPath = if ($Parts.Length -gt 1) { $Parts[1] } else { "/" }

      if ($Method -ne "GET" -and $Method -ne "HEAD") {
        $Body = [System.Text.Encoding]::UTF8.GetBytes("Method not allowed")
        Send-Response $Stream 405 "Method Not Allowed" $Body
        continue
      }

      $FilePath = Resolve-RequestPath $UrlPath
      if (-not $FilePath -or (-not [System.IO.File]::Exists($FilePath) -and -not [System.IO.Directory]::Exists($FilePath))) {
        $Body = [System.Text.Encoding]::UTF8.GetBytes("404 File not found")
        Send-Response $Stream 404 "Not Found" $Body
        continue
      }

      if ([System.IO.Directory]::Exists($FilePath)) {
        $Listing = Get-DirectoryListing $FilePath $UrlPath
        Send-Response $Stream 200 "OK" $Listing "text/html; charset=utf-8"
        continue
      }

      $Extension = [System.IO.Path]::GetExtension($FilePath).ToLowerInvariant()
      $ContentType = if ($MimeTypes.ContainsKey($Extension)) { $MimeTypes[$Extension] } else { "application/octet-stream" }
      $Bytes = if ($Method -eq "HEAD") { [byte[]]::new(0) } else { [System.IO.File]::ReadAllBytes($FilePath) }
      Send-Response $Stream 200 "OK" $Bytes $ContentType
    } catch {
      try {
        $Body = [System.Text.Encoding]::UTF8.GetBytes("500 Internal server error")
        Send-Response $Stream 500 "Internal Server Error" $Body
      } catch {}
    } finally {
      $Client.Close()
    }
  }
} finally {
  $Listener.Stop()
}
