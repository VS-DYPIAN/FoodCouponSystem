import pkg from 'pg';
const { Client } = pkg; // Extract `Client` from the default export

const con = new Client({
  host: "localhost",
  user: "postgres",
  port: 5432,
  password: "Gamechanger@14",
  database: "FoodCoupon"
});

con.connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch(err => console.error("Connection error", err.stack));

  con.query('Select * from users ' , (err,res) =>{
  if(!err)
  {
    console.log(res.rows)
    
  }
  else{
    console.log(err.message)
  }
  con.end;
})

export default con;
