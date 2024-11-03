import { EnvVariable, Config } from "@type";

const defaultConfig: Config = {
  contextVariables: {
    context: `orga-mgnt`,
    stage: 'dev', 
    owner: 'operations',
    usage: 'EPHEMERAL',
  },
  // sso:  { isReadyToDeploy: true, ssoInstanceArn: '', identityStoreId: '' },
  sso:  { 
    isReadyToDeploy: false,
  },
  // dns: { isExternal: false, domainName: 'example.com', mailExchangeDomainName: 'mail.example.com' },
  dns: { 
    isExternal: true,
    hostedZoneId: 'AAAAAAAAAAAAA',
    mailExchangeDomainName: 'mail.example.com',
  },
  github: {
    owner: 'org-name',
  },
  org: { 
    memebers: {
      bootstrap: true,
      accounts: [ { accountName: 'development' } ],
    },
    trustedAWSServices: [ 'sso.amazonaws.com' ],
    crossAccountParametersSharing: false,
  },
}

const getFinalConfig = (config: Partial<Config>): Config => {
  return {
    ...defaultConfig,
    contextVariables: {
      ...defaultConfig.contextVariables,
      ...config.contextVariables,
    },
    ...config
  }
}

export const getConfig = (stage: EnvVariable): Config => {
  switch (stage) {
    case 'test':
      return getFinalConfig({ contextVariables: { ...defaultConfig.contextVariables, stage: 'test', usage: 'PRODUCTION' } } );
    case 'prod':
      return getFinalConfig({ contextVariables: { ...defaultConfig.contextVariables, stage: 'prod', usage: 'PRODUCTION' } } );
    case 'dev':
      return getFinalConfig({ contextVariables: { ...defaultConfig.contextVariables, stage: 'dev', usage: 'PRODUCTION' } } );
    case 'sandbox':
      return getFinalConfig({ contextVariables: { ...defaultConfig.contextVariables, stage: 'sandbox', usage: 'POC' } } );
    default:
      return getFinalConfig({});
  }
};