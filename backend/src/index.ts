import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import authRoutes from './routes/auth';
import bookingsRoutes from './routes/bookings';
import customersRoutes from './routes/customers';
import vehiclesRoutes from './routes/vehicles';
import articlesRoutes from './routes/articles';
import branchesRoutes from './routes/branches';
import { authenticate } from './middleware/auth';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const app = express();
app.use(cors());
app.use(express.json());

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'DesiCargo API', version: '1.0.0' },
  },
  apis: [],
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/auth', authRoutes);
app.use('/bookings', authenticate, bookingsRoutes);
app.use('/customers', authenticate, customersRoutes);
app.use('/vehicles', authenticate, vehiclesRoutes);
app.use('/articles', authenticate, articlesRoutes);
app.use('/branches', authenticate, branchesRoutes);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
