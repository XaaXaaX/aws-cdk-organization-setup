#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { getConfig } from '@config';
import { getEnv } from '@helpers';
import { OrganizationStack, HostedZoneStack } from '@libs';

const app = new cdk.App();
const environment = getEnv(app);
const { 
  org: orgConfig, 
  dns: dnsConfig,
  github: gitHubConfig,
  contextVariables 
} = getConfig(environment);


const hostedZoneStack = new HostedZoneStack(app, HostedZoneStack.name, {
  contextVariables,
  dnsConfig,
});

const organizationStack = new OrganizationStack(app, OrganizationStack.name, { 
  contextVariables, 
  orgConfig,
  dnsConfig,
  gitHubConfig
});

organizationStack.addDependency(hostedZoneStack);

