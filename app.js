const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertTodoDbObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
  };
};

// ===============================API 1=================================================

app.post("/register", async (request, response) => {
  const { username, name, password, location, gender } = request.body;
  console.log(username);
  const q = `select * from user where username='${username}';`;
  console.log(q);
  const dbResponse = await db.get(q);
  console.log(dbResponse);
  if (dbResponse !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const query = `
  insert into user values(
'${username}',
'${name}',
'${hashedPassword}',
'${gender}',
'${location}'
  )
  ;`;

      await db.run(query);
      response.status(200);
      response.send("User created successfully");
    }
  }
});
// ===============================API 2=================================================

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const q = `select * from user where username='${username}';`;
  const dbResponse = await db.get(q);

  if (dbResponse === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      dbResponse.password
    );
    if (!isPasswordMatched) {
      response.status(400);
      response.send("Invalid password");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      response.status(200);
      response.send("Login success!");
    }
  }
});
// ===============================API 3=================================================
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const q = `select * from user where username='${username}';`;
  const dbResponse = await db.get(q);

  if (dbResponse !== undefined) {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbResponse.password
    );
    if (!isPasswordMatched) {
      response.status(400);
      response.send("Invalid current password");
    } else if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      const query = `
      update user
      set
      password='${hashedNewPassword}' where username='${username}'`;
      await db.run(query);
      response.status(200);
      response.send("Password updated");
    }
  }
});

module.exports = app;
