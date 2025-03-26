import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import { default as indexRouter } from './routes/index.js';
import { default as utilisateursRouter } from './routes/utilisateurs.js';
import { default as informationsRouter } from './routes/informations.js';
import { default as coursRouter } from './routes/cours.js';
import { default as compteRouter } from './routes/compte.js';
import { default as paiementRouter } from './routes/paiements.js';



const __server_dirname = process.cwd ? process.cwd() : process.env.PWD as string;

console.log(__server_dirname + utilisateursRouter)

const app = express();

app.use(express.json());

// Configuration CORS
const corsOptions = {
  origin: 'http://localhost:8081',  // Autorise uniquement localhost:8081
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
};

app.use(cors(corsOptions));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', indexRouter);
app.use('/utilisateurs', utilisateursRouter);
app.use('/informations', informationsRouter);
app.use('/cours', coursRouter);
app.use('/compte', compteRouter);
app.use('/paiements', paiementRouter);


// Démarrer le serveur
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

