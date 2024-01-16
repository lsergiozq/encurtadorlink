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
var whitelist = ['',''];

if (process.env.FRONTEND_URL !== ""){
  whitelist = process.env.FRONTEND_URL.split(',');

  var corsOptions = {
    credentials: true,
    origin: function (origin, callback) {
      if (whitelist?.indexOf(origin) !== -1 || origin === undefined) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS - ' + origin))
      }
    }
  }
}


app.use(
  cors(corsOptions)
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
  
  // Array de domínios permitidos
  const allowedDomains = ['https://app.owcloud.com.br', 'https://teams.microsoft.com', 'https://debug.owcloud.com.br', 'http://srv01', 'https://ownet.tawk.help', 'https://teams.live.com', 'https://www.odontoway.com', 'https://api.whatsapp.com'];

  // Verificar se a urlOriginal está em um dos domínios permitidos
  const isAllowedDomain = allowedDomains.some(domain => urlOriginal.startsWith(domain));
  if (!isAllowedDomain) {
    res.status(400).json({ error: 'URL não permitida' });
    return;
  }

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

    const { OriginalUrl: urlOriginal } = results[0];
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
