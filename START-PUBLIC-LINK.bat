@echo off
title FleetForward - Start Public Link
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0START-PUBLIC-LINK.ps1"
