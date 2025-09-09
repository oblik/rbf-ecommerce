import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";

const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL;

if (!SUBGRAPH_URL) {
  throw new Error("Missing NEXT_PUBLIC_SUBGRAPH_URL environment variable");
}

// Custom JSON parser that handles BigInt
const customFetch = (uri: string, options: any) => {
  return fetch(uri, options).then(response => {
    return response.text().then(text => {
      // Replace BigInt values with strings to avoid parsing errors
      const modifiedText = text.replace(/:\s*(\d{15,})/g, ':"$1"');
      return new Response(modifiedText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    });
  });
};

// Create HTTP link
const httpLink = createHttpLink({
  uri: SUBGRAPH_URL,
});

// Create a single instance of the Apollo Client with BigInt handling
const client = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache({
      typePolicies: {
        Campaign: {
          fields: {
            goalAmount: {
              read(existing) {
                return existing || "0";
              }
            },
            totalRaised: {
              read(existing) {
                return existing || "0";
              }
            },
            totalDirectTransfers: {
              read(existing) {
                return existing || "0";
              }
            },
            actualBalance: {
              read(existing) {
                return existing || "0";
              }
            }
          }
        },
        Contribution: {
          fields: {
            amount: {
              read(existing) {
                return existing || "0";
              }
            }
          }
        },
        DirectTransfer: {
          fields: {
            amount: {
              read(existing) {
                return existing || "0";
              }
            }
          }
        }
      }
    }),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'network-only',
      },
      query: {
        fetchPolicy: 'network-only',
      },
    },
});

// The getClient function now returns the single instance
export const getClient = () => {
  return client;
};