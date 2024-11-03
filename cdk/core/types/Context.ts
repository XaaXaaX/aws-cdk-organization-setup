
export const AvailableEnvs = ['dev', 'test', 'prod', 'sandbox', 'orga'] as const; 
export type EnvVariable = typeof AvailableEnvs[number];

export type ContextVariables = {
    context: string;
    stage: EnvVariable;
    owner: string;
    usage: 'POC' | 'EPHEMERAL' | 'PRODUCTION' | 'MANAGEMENT';
}
export type ContextMetadata = ContextVariables & {
  [key: string]: string | undefined;
} & { [K in keyof ContextVariables]?: never };
