import express from "express"
import * as dotenv from "dotenv"

// Load .env file
dotenv.config()

/* -------------------------------------------------------------------------- */
/*                                Server setup                                */
/* -------------------------------------------------------------------------- */
const server = express()

server.set("view engine", "ejs")
server.set("views", "./views")
server.set("port", process.env.PORT || 8000)
server.use(express.static('public'))

server.listen(server.get("port"), () => {
	console.log(`Application started on http://localhost:${server.get("port")}`)
})

/* -------------------------------------------------------------------------- */
/*                                Server Routes                               */
/* -------------------------------------------------------------------------- */
server.get("/", async (req, res) => {
	const info = await dataFetch("https://api.werktijden.nl/2/employees")
	res.render("index", {info})
})

/* -------------------------------------------------------------------------- */
/*                                API Functions                               */
/* -------------------------------------------------------------------------- */
const options = {
	method: "GET",
	headers: {
		Authorization: `Bearer ${process.env.API_KEY}`,
	}
}
async function dataFetch(url) {
	const data = await fetch(url, options)
		.then((response) => response.json())
		.catch((error) => error);
	return data;
}