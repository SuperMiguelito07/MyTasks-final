# Script para configurar las credenciales de Twilio en .env.local

$envPath = ".\.env.local"
$envContent = Get-Content $envPath -ErrorAction SilentlyContinue

# Verificar si el archivo existe
if ($null -eq $envContent) {
    # Crear el archivo si no existe
    $envContent = @()
}

# Buscar y reemplazar o añadir las variables de Twilio
$twilioAccountSid = "REACT_APP_TWILIO_ACCOUNT_SID=AC9c1165f492832c0ea91885b254acdfa0"
$twilioAuthToken = "REACT_APP_TWILIO_AUTH_TOKEN=e45a103c92467455839e69ed186781c9"
$twilioPhoneNumber = "REACT_APP_TWILIO_PHONE_NUMBER=+17625725930"

$updatedContent = @()
$accountSidFound = $false
$authTokenFound = $false
$phoneNumberFound = $false

foreach ($line in $envContent) {
    if ($line -match "REACT_APP_TWILIO_ACCOUNT_SID=") {
        $updatedContent += $twilioAccountSid
        $accountSidFound = $true
    }
    elseif ($line -match "REACT_APP_TWILIO_AUTH_TOKEN=") {
        $updatedContent += $twilioAuthToken
        $authTokenFound = $true
    }
    elseif ($line -match "REACT_APP_TWILIO_PHONE_NUMBER=") {
        $updatedContent += $twilioPhoneNumber
        $phoneNumberFound = $true
    }
    else {
        $updatedContent += $line
    }
}

# Añadir las variables que no se encontraron
if (-not $accountSidFound) {
    $updatedContent += $twilioAccountSid
}
if (-not $authTokenFound) {
    $updatedContent += $twilioAuthToken
}
if (-not $phoneNumberFound) {
    $updatedContent += $twilioPhoneNumber
}

# Guardar el archivo actualizado
$updatedContent | Out-File $envPath -Encoding utf8

Write-Host "Credenciales de Twilio configuradas correctamente en .env.local"
