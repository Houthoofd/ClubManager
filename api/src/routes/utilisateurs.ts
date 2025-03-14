import express from 'express';
import path from 'path';
import fs from 'fs';
import {Client, Client as SQLClient} from '../db/client';

const router = express.Router();

router.get('/', async (req, res) => {
  res.send({message: "hello from utilisateurs"})
});



export default router;