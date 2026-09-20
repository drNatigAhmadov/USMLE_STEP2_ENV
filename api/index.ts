import { createRequestHandler } from '@vercel/node';
import app from '../backend/src/index';

export default createRequestHandler(app);