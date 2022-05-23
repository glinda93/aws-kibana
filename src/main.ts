import dotenv from "dotenv";
import { Client, Connection } from "@opensearch-project/opensearch";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import aws4 from "aws4";
import { ClientRequestArgs } from "http";

dotenv.config();

const host = process.env.AWS_DOMAIN_ENDPOINT;
const region = process.env.AWS_REGION;

const createAwsConnector = (
  credentials: aws4.Credentials,
  awsRegion: string
) => {
  class AmazonConnection extends Connection {
    buildRequestObject(params) {
      const request: ClientRequestArgs & { service?: string; region?: string } =
        super.buildRequestObject(params);
      request.service = "es";
      request.region = awsRegion;
      request.headers = request.headers || {};
      request.headers.host = request.hostname;

      return aws4.sign(request, credentials);
    }
  }
  return {
    Connection: AmazonConnection,
  };
};

const getClient = async () => {
  const credentials = await defaultProvider()();
  return new Client({
    ...createAwsConnector(credentials, region),
    node: host,
  });
};

async function run() {
  const client = await getClient();
  const status = await client.snapshot.status({ pretty: true });
  const response = status.body;
  console.dir(response, { depth: null });
}

run().catch(console.error);
