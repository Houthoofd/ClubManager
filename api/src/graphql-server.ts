import { createYoga } from 'graphql-yoga';
import express from 'express';
import { schema } from './graphql/schema.js';

const app = express();

/**
 * Configuration GraphQL Yoga
 */
const yoga = createYoga({
  schema,
  graphiql: {
    title: 'ClubManager GraphQL API',
  },
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  logging: {
    debug: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  },
});

// Monter GraphQL sur /graphql
app.use('/graphql', yoga);

// Route de santé
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ClubManager API' });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  console.log(`📊 GraphiQL available at http://localhost:${PORT}/graphql`);
});

export default app;
