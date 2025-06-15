import express from 'express';
import {Compte} from '../db/clients/compte/compte.js';
import { z } from 'zod';
import { VerifyResultWithData } from '../../../packages/types/dist/index.js';
import { Chat } from '../db/clients/chat/chat.js';

const router = express.Router();


export default router;