import express from "express"
import bodyParser from "body-parser"
import * as dotenv from "dotenv"
import fetch from "node-fetch"
import { formatISO, add } from "date-fns"
import { utcToZonedTime } from "date-fns-tz"

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
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({extended: true}))

server.listen(server.get("port"), () => {
	console.log(`Application started on http://localhost:${server.get("port")}`)
})

/* ------------------------------- Date variables ------------------------------ */
const date = new Date()
const timeZone = 'Europe/Amsterdam'
const zonedDate = utcToZonedTime(date, timeZone)
const start = formatISO(new Date(zonedDate), { representation: 'date' })
const end = formatISO(add(new Date(zonedDate), { days: 1 }), { representation: 'date' })

console.log(date)
console.log(start)
console.log(end)

/* -------------------------------------------------------------------------- */
/*                                Server Routes                               */
/* -------------------------------------------------------------------------- */
server.get("/", async (req, res) => {
	const employees = await dataFetch("https://api.werktijden.nl/2/employees")
	const punches = await dataFetch(`https://api.werktijden.nl/2/timeclock/punches?departmentId=98756&start=${start}&end=${end}`)
	// console.log(employees)
	// console.log(punches)
	res.render("index", {employees, punches, title:"Aanwezigheidsoverzicht"})
})

server.post("/inklokken", async (req, res) => {
	const departmentId = Number(req.body.department)
	const employeeId = Number(req.body.employee)

	const postData = {
		"employee_id": employeeId,
		"department_id": departmentId,
	}

	postJson("https://api.werktijden.nl/2/timeclock/clockin", postData)
	res.redirect("/")
})

server.get("/inklokken", async (req, res) => {
	const departments = await dataFetch("https://api.werktijden.nl/2/departments")
	const employees = await dataFetch("https://api.werktijden.nl/2/employees")
	// console.log(employees)
	res.render("inklokken", {title:"Inklokken", departments, employees})
})

server.post("/uitklokken", async (req, res) => {
	const departmentId = Number(req.body.department)
	const employeeId = Number(req.body.employee)

	const postData = {
		"employee_id": employeeId,
		"department_id": departmentId,
	}

	postJson("https://api.werktijden.nl/2/timeclock/clockout", postData)
	res.redirect("/")
})

server.get("/uitklokken", async (req, res) => {
	const departments = await dataFetch("https://api.werktijden.nl/2/departments")
	const employees = await dataFetch("https://api.werktijden.nl/2/employees")

	res.render("uitklokken", {title:"Uitklokken", departments, employees})
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
			method: "POST",
			body: JSON.stringify(body),
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${process.env.API_KEY}`,
			},
		})
		.then((response) => response.json())
		.catch((error) => error);
}