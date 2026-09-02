# 转型罗盘快照脚本
# 用法: powershell -ExecutionPolicy Bypass -File scripts/snapshot.ps1
# 作用: 在改动代码前把整个项目(排除 node_modules/.next/_backups/.git)复制到 _backups/<日期>/ 下

$proj = Split-Path -Parent $PSScriptRoot
$backupRoot = Join-Path $proj "_backups"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$dest = Join-Path $backupRoot $stamp

# 要排除的目录
$exclude = @("node_modules", ".next", "_backups", ".git")

# 收集需要复制的项目(递归取文件，再排除目标目录自身)
$items = Get-ChildItem $proj -Recurse -Force -ErrorAction SilentlyContinue | Where-Object {
    $rel = $_.FullName.Substring($proj.Length).TrimStart("\")
    $top = ($rel -split "\\")[0]
    $top -notin $exclude -and $rel -ne ""
}

foreach ($item in $items) {
    $target = Join-Path $dest $item.FullName.Substring($proj.Length).TrimStart("\")
    if ($item.PSIsContainer) {
        New-Item -ItemType Directory -Force -Path $target | Out-Null
    } else {
        New-Item -ItemType Directory -Force -Path (Split-Path $target) | Out-Null
        Copy-Item $item.FullName $target -Force
    }
}

$count = ($items | Where-Object { -not $_.PSIsContainer }).Count
Write-Output "快照完成: $dest (文件数: $count)"
