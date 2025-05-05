var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
// 🔥 Ajout de Socket.io
const http = require('http');
const { Server } = require('socket.io');

// Importer le routeur
var indexRouter = require('./src/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Configuration CORS
const corsOptions = {
  origin: 'http://localhost:8081',  // Autorise uniquement localhost:8081
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
};

app.use(cors(corsOptions));

// Utilisation du routeur pour la racine
app.use('/', indexRouter);

const publicPath = path.join(__dirname, 'public');
console.log("Chemin du dossier public :", publicPath);
app.use('/public', express.static(path.join(__dirname, 'public')));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});


// On crée le serveur HTTP avec Express
const server = http.createServer(app);

// Initialisation de Socket.io
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8081", // Ton front
    methods: ["GET", "POST"]
  }
});

// Gestion des connexions Socket.io
io.on('connection', (socket) => {
  console.log('Un utilisateur est connecté au chat');

  socket.on('chatMessage', (msg) => {
    console.log('Message reçu :', msg);
    io.emit('chatMessage', msg); // Renvoie à tous les clients
  });

  socket.on('disconnect', () => {
    console.log('Un utilisateur est déconnecté');
  });
});

// On exporte à la fois app et server
module.exports = { app, server };
