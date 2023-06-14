import express from "express"
import bodyParser from "body-parser"
import * as dotenv from "dotenv"
import fetch from "node-fetch"

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

const date = new Date()
const start = new Date(date).getFullYear() + "-" + (new Date(date).getMonth() + 1) + "-" + new Date(date).getDate()
const end = new Date(date).getFullYear() + "-" + (new Date(date).getMonth() + 1) + "-" + (new Date(date).getDate() + 1)

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
	// console.log(req.body)
	const departmentId = Number(req.body.department)
	const employeeId = Number(req.body.employee)

	// Check if employee is already clocked in
	const punches = await dataFetch(`https://api.werktijden.nl/2/timeclock/punches?departmentId=${departmentId}&start=${start}&end=${end}`)
	const isClockedIn = punches.data.some(punch => punch.employee_id === employeeId && punch.type === "clock_in")

	// console.log(punches)

	const postData = {
		"employee_id": employeeId,
		"department_id": departmentId,
	}

	// console.log(postData)

	if (!isClockedIn) {
		postJson("https://api.werktijden.nl/2/timeclock/clockin", postData)
		res.redirect("/")
	} else {
		res.redirect("/")
	}
	// postJson("https://api.werktijden.nl/2/timeclock/clockin", postData)
	// res.redirect("/")
})

server.get("/inklokken", async (req, res) => {
	const departments = await dataFetch("https://api.werktijden.nl/2/departments")
	const employees = await dataFetch("https://api.werktijden.nl/2/employees")
	const punches = await dataFetch(`https://api.werktijden.nl/2/timeclock/punches?departmentId=98756&start=${start}&end=${end}`)


	// console.log(employees)
	res.render("inklokken", {title:"Inklokken", departments, employees, punches})
})

server.post("/uitklokken", async (req, res) => {
	// console.log(req.body)
	const departmentId = Number(req.body.department)
	const employeeId = Number(req.body.employee)

	// Check if employee is already clocked out
	const punches = await dataFetch(`https://api.werktijden.nl/2/timeclock/punches?departmentId=${departmentId}&start=${start}&end=${end}`)
	const isClockedOut = punches.data.some(punch => punch.employee_id === employeeId && punch.type === "clock_out")

	// console.log(req.body)
	// console.log(isClockedOut)
	// console.log(punches)

	const postData = {
		"employee_id": employeeId,
		"department_id": departmentId,
	}

	if (!isClockedOut) {
		postJson("https://api.werktijden.nl/2/timeclock/clockout", postData)
		res.redirect("/")
	} else {
		res.redirect("/uitklokken")
	}

	// postJson("https://api.werktijden.nl/2/timeclock/clockout", postData)
	// res.redirect("/")
})

server.get("/uitklokken", async (req, res) => {
	const departments = await dataFetch("https://api.werktijden.nl/2/departments")
	const employees = await dataFetch("https://api.werktijden.nl/2/employees")
	const punches = await dataFetch(`https://api.werktijden.nl/2/timeclock/punches?departmentId=98756&start=${start}&end=${end}`)

	res.render("uitklokken", {title:"Uitklokken", departments, employees, punches})
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