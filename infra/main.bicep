// Glass House Dance Secret Santa: App Service (Linux, Node) + Storage account (Table).
param location string = 'westus2'
// Free (F1) App Service quota is 0 in westus2 on this subscription; westus3 works.
param appLocation string = 'westus3'
param siteName string = 'team-pitch-secret-santa'
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

resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: 'plan-${siteName}'
  location: appLocation
  kind: 'linux'
  sku: { name: 'F1', tier: 'Free' }
  properties: { reserved: true }
}

resource site 'Microsoft.Web/sites@2023-12-01' = {
  name: siteName
  location: appLocation
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|22-lts'
      appCommandLine: 'node server.js'
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      appSettings: [
        { name: 'STORAGE_CONNECTION', value: 'DefaultEndpointsProtocol=https;AccountName=${storage.name};AccountKey=${storage.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}' }
        { name: 'ADMIN_KEY', value: adminKey }
        { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT', value: 'true' }
      ]
    }
  }
}

output siteUrl string = 'https://${site.properties.defaultHostName}'
