import { EnvVariable, Config } from "@type";

const defaultConfig: Config = {
  contextVariables: {
    context: `orga-mgnt`,
    stage: 'dev', 
    owner: 'operations',
    usage: 'EPHEMERAL',
    
  },
  // sso:  { isReadyToDeploy: true, ssoInstanceArn: 'arn:aws:sso:::instance/ssoins-xxxxxxxxx', identityStoreId: 'd-xxxxxxxx' },
  sso:  { 
    isReadyToDeploy: false,
  },
  // dns: { isExternal: false, domainName: 'example.com', mailExchangeDomainName: 'mail.example.com' },
  dns: { 
    isExternal: true,
    hostedZoneId: '<HOSTED_ZONE_ID>', // Replace with actual hosted zone ID if external
    domainName: '<DOMAIN_NAME>', // Replace with actual domain name if external
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
    trustedAWSServices: [ 
        'sso.amazonaws.com',
        'servicequotas.amazonaws.com',
        'tagpolicies.tag.amazonaws.com',
        'stacksets.cloudformation.amazonaws.com',
        'account.amazonaws.com',
    ],
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