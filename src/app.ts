import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { auth } from './lib/auth';
import { toNodeHandler } from "better-auth/node";
import cookieParser from 'cookie-parser';

import router from './routes';

const app: Application = express();

app.all("/api/auth/*splat", toNodeHandler(auth));

// parsers
app.use(express.json());
app.use(cors());
app.use(cookieParser());

// application routes
app.use('/api/v1', router);

app.get('/', (req: Request, res: Response) => {
  res.send('Swenker Server is running');
});

export default app;
