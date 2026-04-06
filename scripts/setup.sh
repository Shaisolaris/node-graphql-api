#!/bin/bash
set -e
echo "🚀 Setting up node-graphql-api"
npm install
echo ""
echo "✅ Ready! No database needed — uses in-memory store with auto-seeded data."
echo ""
echo "Start:    npm run dev"
echo "Explore:  http://localhost:4000/graphql (GraphQL Playground)"
echo ""
echo "Demo credentials: alice@acme.com / password123"
echo "See examples/queries.graphql for ready-to-use queries"
