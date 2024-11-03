#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { getConfig } from '@config';
import { getEnv } from '@helpers';
import { OrganizationStack, HostedZoneStack, SSOStack } from '@libs';

const app = new cdk.App();
const environment = getEnv(app);
const { 
  org: orgConfig, 
  sso: ssoConfig,
  dns: dnsConfig,
  contextVariables 
} = getConfig(environment);


const hostedZoneStack = new HostedZoneStack(app, HostedZoneStack.name, {
  contextVariables,
  dnsConfig,
});

const organizationStack = new OrganizationStack(app, OrganizationStack.name, { 
  contextVariables, 
  orgConfig,
  dnsConfig
});

if( ssoConfig.isReadyToDeploy ) {
  const ssoPermissions = new SSOStack(app, SSOStack.name, { 
    contextVariables,
    ssoConfig
  });
  ssoPermissions.addDependency(organizationStack);
}

organizationStack.addDependency(hostedZoneStack);

