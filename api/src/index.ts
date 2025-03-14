import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
//import jwt from 'jsonwebtoken';
//import bcrypt from 'bcrypt';
import mysql from 'mysql';
import { default as indexRouter } from './routes/index.js';
import { default as utilisateursRouter } from './routes/utilisateurs.js';



const __server_dirname = process.cwd ? process.cwd() : process.env.PWD as string;

console.log(__server_dirname + utilisateursRouter)

const app = express();

// Configurer CORS pour autoriser les requêtes d'une origine spécifique
//app.use(cors({
  //origin: 'http://ec2-18-185-136-232.eu-central-1.compute.amazonaws.com'
//}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', indexRouter);
app.use('/utilisateurs', utilisateursRouter);


// Démarrer le serveur
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

