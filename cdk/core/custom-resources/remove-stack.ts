import { CloudFormationClient, DeleteStackCommand } from '@aws-sdk/client-cloudformation';
import { ScheduledEvent } from 'aws-lambda';

const client = new CloudFormationClient({ region: process.env.AWS_REGION });
export const handler = async(event: ScheduledEvent) => {

  try {
    const command = new DeleteStackCommand({
      StackName: process.env.STACK_NAME,
      RoleARN: process.env.CLOUDFORMATION_ROLE_ARN,
    });
    await client.send(command);

  } catch (error) {
    console.error(error);
    throw error;
  }
}