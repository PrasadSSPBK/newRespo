const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const bcrypt = require("bcrypt");
const databasePath = path.join(__dirname, "userData.db");
app.use(express.json);
let database = null;

const intializerDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("Server Running"));
  } catch (error) {
    console.log(`DB Error message:${error.message}`);
  }
};
intializerDbAndServer();

const userDbTable = (dbObject) => {
  return {
    username: dbObject.username,
    name: dbObject.name,
    password: dbObject.password,
    gender: dbObject.gender,
    location: dbObject.location,
  };
};

const validatePassword = (password) => {
  return password.length > 4;
};

//API 1 Register

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const checkUserQuery = `SELECT * from user WHERE username='${username};`;
  const checkUser = await database.get(checkUserQuery);
  if (checkUser === undefined) {
    const userRegisterQuery = `INSERT INTO USER
        (username,name,password,gender,location)
        values
        (
       '${username}',
       '${name}',
       '${hashedPassword}',
       '${gender}',
       '${location}'
      );`;
    if (validatePassword(password)) {
      await database.run(userRegisterQuery);
      //   response.status(200);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API 2 login

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const checkUserQuery = `SELECT * from user WHERE username='${username};`;
  const checkUser = await database.get(checkUserQuery);
  if (checkUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordCorrect = await bcrypt.compare(
      password,
      checkUser.password
    );
    if (isPasswordCorrect === false) {
      response.status(400);
      response.send("Invalid Password");
    } else {
      response.send("Login success!");
    }
  }
});

//API 3 change-password

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  const checkUserQuery = `SELECT * from user WHERE username="'${username};`;
  const checkUser = await database.get(checkUserQuery);
  if (checkUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordCorrect = await bcrypt.compare(
      oldPassword,
      checkUser.password
    );
    if (isPasswordCorrect === false) {
      response.status(400);
      response.send("Invalid current password");
    } else {
      if (validatePassword(newPassword)) {
        const updateQuery = `update user
                 SET
                 password="${hashedNewPassword}" WHERE username="${username}";`;
        const updatePassword = await database.run(updateQuery);
        response.status(200);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    }
  }
});

module.exports = app;
