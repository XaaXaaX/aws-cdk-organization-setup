#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { getConfig } from '@config';
import { getEnv } from '@helpers';
import { SSOStack } from '@libs';

const app = new cdk.App();
const environment = getEnv(app);
const { 
  org: orgConfig, 
  sso: ssoConfig,
  contextVariables 
} = getConfig(environment);


if( ssoConfig.isReadyToDeploy ) {
  new SSOStack(app, SSOStack.name, { 
    contextVariables,
    ssoConfig,
    orgConfig,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION
    }
  });
}
