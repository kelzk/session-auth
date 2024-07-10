import pg from "pg";
import express from "express";
import cookie from "cookie";

const { Client } = pg;
const client = new Client({
  host: "localhost",
  user: "postgres",
  port: 5432,
  password: "root",
  database: "postgres",
});

client.connect();

const app = express();
const port = 3000;

app.use(express.json());

app.post("/", (req, res) => {
  const { username, password } = req.body;
  const hash = password;
  client.query(
    `SELECT * FROM users WHERE username='${username}' AND password='${hash}'`,
    (err, result) => {
      if (err) {
        console.log(err.message);
      }
      if (result.rowCount) {
        const sessionId = crypto.randomUUID();
        console.log(sessionId);
        client.query(
          `UPDATE users SET "sessionId" = '${sessionId}' WHERE username='${username}' AND password='${hash}'`,
          (err, result) => {
            if (err) {
              console.log(err.message);
            }
            client.end;
          }
        );
        res.cookie("sessionId", sessionId, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        });
      } else {
        res.status(401);
      }
      client.end;
    }
  );
});

app.get("/api", (req, res) => {
  const cookies = cookie.parse(req.headers.cookie);
  const sessionId = cookies.sessionId;

  client.query(
    `SELECT username FROM users WHERE "sessionId" = '${sessionId}'`,
    (err, result) => {
      if (err) {
        console.log(err.message);
      }
      if (result.rowCount) {
        client.query("SELECT * FROM users", (err, result) => {
          if (err) {
            console.log(err.message);
          }
          res.send(result.rows);

          client.end;
        });
      } else {
        res.status(401);
      }
    }
  );
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
