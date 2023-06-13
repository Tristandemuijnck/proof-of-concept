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

const date = new Date()
const start = new Date().toJSON().slice(0, 10)
const end = new Date(date.setDate(date.getDate() + 1)).toJSON().slice(0, 10)


/* -------------------------------------------------------------------------- */
/*                                Server Routes                               */
/* -------------------------------------------------------------------------- */
server.get("/", async (req, res) => {
	const employees = await dataFetch("https://api.werktijden.nl/2/employees")
	const punches = await dataFetch(`https://api.werktijden.nl/2/timeclock/punches?departmentId=98756&start=${start}&end=${end}`)
	//console.log(employees)
	// console.log(punches)
	res.render("index", {employees, punches, title:"Aanwezigheidsoverzicht"})
})

server.post("/", async (req, res) => {
	const postData = {
		"employee_id": 368786,
		"department_id": 98756,
	}

	postJson("https://api.werktijden.nl/2/timeclock/clockin", postData).then((data) => {
		if (data.status == 200) {
			res.redirect("/inklokken")
			console.log("Status 200: Done!")
		}
	})
})

server.get("/inklokken", async (req, res) => {
	res.render("inklokken", {title:"Inklokken"})
})

server.get("/uitklokken", async (req, res) => {
	res.render("uitklokken", {title:"Uitklokken"})
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

async function postJson(url, body) {
	console.log(2, JSON.stringify(body));
	return await fetch(url, {
			method: "post",
			body: JSON.stringify(body),
			headers: {
				"Content-Type": "application/json"
			},
		})
		.then((response) => response.json())
		.catch((error) => error);
}