// Glass House Dance Secret Santa: Static Web App (site + managed API) and a Storage account (Table).
param location string = 'westus2'
@secure()
param adminKey string

var suffix = uniqueString(resourceGroup().id)

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: 'stsanta${suffix}'
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    supportsHttpsTrafficOnly: true
  }
}

resource site 'Microsoft.Web/staticSites@2023-12-01' = {
  name: 'swa-glasshouse-santa-${take(suffix, 6)}'
  location: location
  sku: { name: 'Free', tier: 'Free' }
  properties: {}
}

resource settings 'Microsoft.Web/staticSites/config@2023-12-01' = {
  parent: site
  name: 'appsettings'
  properties: {
    STORAGE_CONNECTION: 'DefaultEndpointsProtocol=https;AccountName=${storage.name};AccountKey=${storage.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
    ADMIN_KEY: adminKey
  }
}

output siteName string = site.name
output siteUrl string = 'https://${site.properties.defaultHostname}'
