import express, { Request, Response } from 'express';
import mysql from 'mysql';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const bdHost: string = process.env.DB_HOST || '';
const bdUser: string = process.env.DB_USER || '';
const bdPwd: string = process.env.DB_PASSWORD || '';
const bdName: string = process.env.DB_DATABASE || '';
const bdPort: number = parseInt(process.env.DB_PORT || '3306', 10);

//Configuração do banco de dados
const connection = mysql.createConnection({
  host: bdHost,
  port: bdPort,
  user: bdUser,
  password: bdPwd,
  database: bdName,
});



// Configuração do CORS
app.use(
  cors({
    credentials: true,
    origin: process.env.FRONTEND_URL
  })
);

connection.connect((error) => {
  if (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    return;
  }
  console.log('Conexão estabelecida com sucesso ao banco de dados!');
});

// Método POST para encurtar a URL
app.post('/encurtar', (req: Request, res: Response) => {
  const { urlOriginal, dataValidade } = req.body;

  // Configurar os cabeçalhos CORS para permitir todas as origens (*)
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  // Gerar string reduzida de 8 caracteres aleatórios
  const stringReduzida = generateRandomString(8);
  
  // Construir a URL encurtada
  const urlEncurtada = `https://ow.app.br/${stringReduzida}`;

  // Salvar a URL no banco de dados
  const query = `INSERT INTO links (OriginalUrl, ShortUrl, ExpirationDate) VALUES (?, ?, ?)`;
  connection.query(query, [urlOriginal, stringReduzida, dataValidade], (error) => {
    if (error) {
      console.error('Erro ao salvar o link no banco de dados:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
      return;
    }

    res.status(201).json({ urlEncurtada });
  });
});

// Rota para redirecionar para a URL original
app.get('/:stringReduzida', (req: Request, res: Response) => {
  const { stringReduzida } = req.params;

  // Buscar a URL original no banco de dados
  const query = `SELECT OriginalUrl FROM links WHERE ShortUrl = ?`;
  connection.query(query, [stringReduzida], (error, results) => {
    if (error) {
      console.error('Erro ao buscar a URL original no banco de dados:', error);
      res.status(500).send('Erro interno do servidor');
      return;
    }

    if (results.length === 0) {
      res.status(404).send('URL não encontrada');
      return;
    }

    const { url_original: urlOriginal } = results[0];
    res.redirect(urlOriginal);
  });
});

// Função auxiliar para gerar uma string aleatória
function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';
  for (let i = 0; i < length; i++) {
    randomString += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return randomString;
}

// Iniciar o servidor
app.listen(process.env.PORT, () => {
  console.log('Servidor iniciado na porta ' + process.env.PORT);
});
