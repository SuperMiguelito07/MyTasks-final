# Script para configurar las credenciales de Twilio en .env.local

$envPath = ".\.env.local"
$envContent = Get-Content $envPath -ErrorAction SilentlyContinue

# Verificar si el archivo existe
if ($null -eq $envContent) {
    # Crear el archivo si no existe
    $envContent = @()
}

# Buscar y reemplazar o añadir las variables de Twilio
$twilioAccountSid = "REACT_APP_TWILIO_ACCOUNT_SID=your_account_sid"
$twilioAuthToken = "REACT_APP_TWILIO_AUTH_TOKEN=your_auth_token"
$twilioPhoneNumber = "REACT_APP_TWILIO_PHONE_NUMBER=your_twilio_phone"
$verifiedPhoneNumber = "REACT_APP_VERIFIED_PHONE_NUMBER=your_verified_phone"

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
