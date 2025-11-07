# =====================================================
# Script de Ejecución Automática - Migración SIRDS
# Sistema de Ciclos de Dotación
# =====================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   MIGRACIÓN - SISTEMA CICLOS DOTACIÓN  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuración
$DBName = "sirds"
$MigrationFile = "database\migrations\000_EJECUTAR_MIGRACION_COMPLETA.sql"

# Verificar que existe el archivo de migración
if (-not (Test-Path $MigrationFile)) {
    Write-Host "❌ ERROR: No se encuentra el archivo de migración" -ForegroundColor Red
    Write-Host "   Ruta esperada: $MigrationFile" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Archivo de migración encontrado" -ForegroundColor Green
Write-Host ""

# Solicitar credenciales
Write-Host "Credenciales de MySQL:" -ForegroundColor Yellow
$MySQLUser = Read-Host "  Usuario (por defecto: root)"
if ([string]::IsNullOrWhiteSpace($MySQLUser)) {
    $MySQLUser = "root"
}

$MySQLPassword = Read-Host "  Contraseña" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($MySQLPassword)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "INICIANDO MIGRACIÓN..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Crear archivo temporal con la contraseña (más seguro que -p en línea de comandos)
$TempConfigFile = [System.IO.Path]::GetTempFileName()
@"
[client]
user=$MySQLUser
password=$PlainPassword
"@ | Out-File -FilePath $TempConfigFile -Encoding ASCII

try {
    # Ejecutar migración
    Write-Host "Ejecutando script de migración..." -ForegroundColor Yellow
    
    # Verificar si mysql está en el PATH
    $mysqlCommand = Get-Command mysql -ErrorAction SilentlyContinue
    
    if ($null -eq $mysqlCommand) {
        Write-Host "❌ ERROR: MySQL no está en el PATH del sistema" -ForegroundColor Red
        Write-Host ""
        Write-Host "Opciones:" -ForegroundColor Yellow
        Write-Host "1. Agrega MySQL al PATH del sistema" -ForegroundColor White
        Write-Host "2. Ejecuta manualmente desde la consola de MySQL:" -ForegroundColor White
        Write-Host "   mysql -u $MySQLUser -p $DBName < $MigrationFile" -ForegroundColor Cyan
        exit 1
    }
    
    # Ejecutar migración usando el archivo de configuración temporal
    $result = & mysql --defaults-extra-file=$TempConfigFile $DBName 2>&1 < $MigrationFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "✓✓✓ MIGRACIÓN EXITOSA ✓✓✓" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Cambios aplicados:" -ForegroundColor Cyan
        Write-Host "  ✓ Área Producción consolidada (id_area=1)" -ForegroundColor Green
        Write-Host "  ✓ Área Mercadista agregada" -ForegroundColor Green
        Write-Host "  ✓ Tabla salario_minimo creada" -ForegroundColor Green
        Write-Host "  ✓ Tabla ciclo_dotacion creada" -ForegroundColor Green
        Write-Host "  ✓ Tabla empleado_ciclo creada" -ForegroundColor Green
        Write-Host "  ✓ SMLV 2025 registrado: $1,423,500" -ForegroundColor Green
        Write-Host "  ✓ Ciclo ejemplo creado: Dic 5, 2025" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Siguiente paso: Implementar backend (Fase 2)" -ForegroundColor Yellow
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ ERROR EN LA MIGRACIÓN" -ForegroundColor Red
        Write-Host ""
        Write-Host "Detalles del error:" -ForegroundColor Yellow
        Write-Host $result -ForegroundColor Red
        Write-Host ""
        Write-Host "Consulta el archivo README_EJECUCION.md para troubleshooting" -ForegroundColor Yellow
        exit 1
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ EXCEPCIÓN DURANTE LA MIGRACIÓN" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    exit 1
} finally {
    # Limpiar archivo temporal con credenciales
    if (Test-Path $TempConfigFile) {
        Remove-Item $TempConfigFile -Force
    }
}

Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
