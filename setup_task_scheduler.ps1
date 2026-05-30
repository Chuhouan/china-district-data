# Windows任务计划程序自动设置脚本
# 管理员权限运行此脚本

$TaskName = "ChinaDistrictDataAutoUpdate"
$Description = "中国行政区划数据自动更新任务"
$ProjectPath = "c:\Users\63259\CodeBuddy\20260529212928"
$NodePath = (Get-Command node).Source
$ScriptPath = Join-Path $ProjectPath "scraper.js"

# 检查是否以管理员身份运行
if (!([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "请以管理员身份运行此脚本！"
    exit 1
}

# 检查任务是否已存在
$ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($ExistingTask) {
    Write-Host "任务 '$TaskName' 已存在，将先删除再重建..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# 创建任务动作：执行 scraper.js
$Action = New-ScheduledTaskAction -Execute $NodePath -Argument $ScriptPath -WorkingDirectory $ProjectPath

# 创建任务触发器：每天凌晨3点运行
$Trigger = New-ScheduledTaskTrigger -Daily -At "03:00"

# 任务设置
$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -WakeToRun `
    -MultipleInstances IgnoreNew `
    -ExecutionTimeLimit (New-TimeSpan -Hours 2)

# 运行账户（SYSTEM账户可以在无用户登录时运行）
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

# 创建任务
Register-ScheduledTask `
    -TaskName $TaskName `
    -Description $Description `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -Principal $Principal `
    -Force

Write-Host "✓ 任务计划程序已设置成功！" -ForegroundColor Green
Write-Host "  任务名称: $TaskName" -ForegroundColor Cyan
Write-Host "  运行时间: 每天凌晨 3:00" -ForegroundColor Cyan
Write-Host "  运行账户: SYSTEM (无需登录)" -ForegroundColor Cyan
Write-Host "`n管理命令：" -ForegroundColor Yellow
Write-Host "  查看任务: taskschd.msc" -ForegroundColor Gray
Write-Host "  手动运行: Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
Write-Host "  禁用任务: Disable-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
Write-Host "  删除任务: Unregister-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
Write-Host "`n下次运行时间：" -ForegroundColor Yellow
(Get-ScheduledTask -TaskName $TaskName | Get-ScheduledTaskInfo).NextRunTime
