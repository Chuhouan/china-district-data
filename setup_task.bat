@echo off
chcp 65001 >nul
echo ================================================
echo  Windows任务计划程序 - 自动更新设置
echo ================================================
echo.

REM 获取node路径
for /f "tokens=*" %%i in ('where node') do set NODE_PATH=%%i

REM 获取当前目录
set PROJECT_PATH=%~dp0
set SCRIPT_PATH=%PROJECT_PATH%scraper.js

echo [信息] Node路径: %NODE_PATH%
echo [信息] 项目路径: %PROJECT_PATH%
echo [信息] 脚本路径: %SCRIPT_PATH%
echo.

echo 请选择设置方式：
echo   1. 每天凌晨3点自动运行（推荐）
echo   2. 每6小时运行一次
echo   3. 每小时运行一次（测试用）
echo   4. 退出
echo.
set /p CHOICE="请输入选项 (1-4): "

if "%CHOICE%"=="1" (
    set SCHEDULE=DAILY
    set TIME=03:00
    goto :CREATE_TASK
)
if "%CHOICE%"=="2" (
    set SCHEDULE=HOURLY
    set INTERVAL=6
    goto :CREATE_TASK
)
if "%CHOICE%"=="3" (
    set SCHEDULE=HOURLY
    set INTERVAL=1
    goto :CREATE_TASK
)
if "%CHOICE%"=="4" goto :END

:CREATE_TASK
echo.
echo [创建任务...]
echo 任务名称: ChinaDistrictDataAutoUpdate
echo 运行程序: %NODE_PATH%
echo 运行脚本: %SCRIPT_PATH%
echo.

if "%SCHEDULE%"=="DAILY" (
    schtasks /Create /SC DAILY /ST %TIME% /TN "ChinaDistrictDataAutoUpdate" /TR "\"%NODE_PATH%\" \"%SCRIPT_PATH%\"" /F /RL HIGHEST
) else (
    schtasks /Create /SC HOURLY /MO %INTERVAL% /TN "ChinaDistrictDataAutoUpdate" /TR "\"%NODE_PATH%\" \"%SCRIPT_PATH%\"" /F /RL HIGHEST
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ 任务创建成功！
    echo.
    echo [管理命令]
    echo   手动运行: schtasks /Run /TN "ChinaDistrictDataAutoUpdate"
    echo   删除任务: schtasks /Delete /TN "ChinaDistrictDataAutoUpdate" /F
    echo   查看任务: schtasks /Query /TN "ChinaDistrictDataAutoUpdate"
    echo.
    echo [下次运行时间]
    schtasks /Query /TN "ChinaDistrictDataAutoUpdate" /FO LIST | find "下次运行时间"
) else (
    echo.
    echo ✗ 任务创建失败，请尝试以管理员身份运行此脚本
)

goto :END

:END
echo.
pause
