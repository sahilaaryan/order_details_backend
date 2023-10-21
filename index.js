const Koa = require("koa");
const parser = require("koa-bodyparser");
const cors = require("@koa/cors");
const Router = require("koa-router");
const App = new Koa();
const router = new Router();
const port = 8000;
const { MongoClient, ObjectId } = require("mongodb");
const initDB = require("./database");
const reader = require("xlsx");
const config = require("dotenv");
config.config();
const client = new MongoClient(process.env.MONGO_URL);

client.connect().then(() => {
    console.log("Db connected");
});

router.get("/getInfo", async (ctx) => {
  const db = client.db("employeeDetails");
  const collection = db.collection("csvToJson");
  const file = reader.readFile("./export29913.xlsx");
  let data = [];
  const sheets = file.SheetNames;
  for (let i = 0; i < sheets.length; i++) {
    const temp = reader.utils.sheet_to_json(file.Sheets[file.SheetNames[i]]);
    temp.forEach((res, index) => {
      let obj = {};
      Object.entries(res).map(([key, value]) => {
        if (
          key.includes("PO Number") ||
          key.includes("Supplier") ||
          key.includes("Description")
        ) {
          obj[`${key}`] = value;
        }
      });
      obj.index = index+1;
      data.push(obj);
    });
  }
  let updateData = await collection.insertMany(data);
  ctx.body = updateData;
});

router.get("/allSuppliers", async (ctx) => {
    const db = client.db("employeeDetails");
    const collection = db.collection("csvToJson");
    let response = await collection.find({}).toArray();
    let result = [];
    if(response.length) {
        response.map((item) => {
            if(item["Supplier"]){
                result.push(item["Supplier"])
            }
        })
    }
    ctx.body = result;
})

router.get("/getUserAddedInfo", async (ctx) => {
  const db = client.db("employeeDetails");
  const collection = db.collection("csvToJson");
  let response = await collection.find({userInitiated: true}).toArray();
  if(response.length) {
    ctx.body = response;
  } else ctx.body = "No details Added"
})

router.post("/addOrder", async (ctx) => {
  const db = client.db("employeeDetails");
  const collection = db.collection("csvToJson");
  let params = ctx.request.body;
  let response = await collection.insertOne(params);
  if(response) {
    let updatedInfo = await collection.find({userInitiated: true}).toArray();
    ctx.body = updatedInfo;
  } else ctx.body = "something went wrong in addUserInfo"
})

router.post("/getPurchaseOrder", async (ctx) => {
  const db = client.db("employeeDetails");
  const collection = db.collection("csvToJson");
  let params = ctx.request.body;
  let response = await collection.find({Supplier: params.payload}).toArray();
  let result = [];
  if(response.length) {
      response.map((item) => {
          if(item["PO Number"]){
              result.push(item["PO Number"])
          }
      })
  }
  ctx.body = result;
})

router.post("/getDescription", async (ctx) => {
  const db = client.db("employeeDetails");
  const collection = db.collection("csvToJson");
  let params = ctx.request.body;
  let response = await collection.find({"PO Number": params.payload}).toArray();
  let result = [];
  if(response.length) {
      response.map((item) => {
          if(item["Description"]){
              result.push(item["Description"])
          }
      })
  }
  ctx.body = result;
})

App.use(parser())
  .use(cors())
  .use(router.routes())
  .use(router.allowedMethods())
  .use((ctx) => (ctx.body = "App is running"))
  .listen(port, () => {
    console.log(`🚀 Server listening http://127.0.0.1:${port}/ 🚀`);
  });
