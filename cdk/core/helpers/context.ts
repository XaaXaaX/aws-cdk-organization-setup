import { EnvVariable } from '@type';
import { App } from 'aws-cdk-lib';

export const IsDevelopmentEnv = (env: EnvVariable) => env === 'dev';
export const IsTestingEnv = (env: EnvVariable) => env === 'test';
export const IsProductionEnv = (env: EnvVariable) => env === 'prod';
export const IsSandboxEnv = (env: EnvVariable) => env === 'sandbox';


export const isEnvValid = (env: EnvVariable): env is EnvVariable =>
  IsDevelopmentEnv(env) || 
  IsTestingEnv(env) ||
  IsProductionEnv(env) ||
  IsSandboxEnv(env);

export const getEnv = (app: App): EnvVariable => {
  return app.node.tryGetContext('env');
};
