import express from "express"
import bodyParser from "body-parser"
import * as dotenv from "dotenv"
import fetch from "node-fetch"
import { format, formatISO, add, differenceInMinutes, differenceInHours } from "date-fns"
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

/* ----------------------- Date variables & functions ----------------------- */
const date = new Date()
const timeZone = 'Europe/Amsterdam'
const zonedDate = utcToZonedTime(date, timeZone)
const start = formatISO(new Date(zonedDate), { representation: 'date' })
const end = formatISO(add(new Date(zonedDate), { days: 1 }), { representation: 'date' })

// console.log(start, "Test start time")
// console.log(end, "Test end time")

function getClockedInTime(ci){
	const clockInDate = utcToZonedTime(new Date(ci.timestamp), timeZone)
	const clockedInTime = formatISO(new Date(clockInDate), { representation: 'time' })
	// const clockedInHours = format(new Date(clockInDate), 'HH:mm')
	return clockedInTime
}

/* -------------------------------------------------------------------------- */
/*                                Server Routes                               */
/* -------------------------------------------------------------------------- */
server.get("/", async (req, res) => {
	const employees = await dataFetch("https://api.werktijden.nl/2/employees")
	const punches = await dataFetch(`https://api.werktijden.nl/2/timeclock/punches?departmentId=98756&start=${start}&end=${end}`)
	// console.log(employees)
	// console.log(punches.data)

	let mwArray = []
	let timePastClockIn

	const clockedIn = punches.data.filter(pu => pu.type === 'clock_in')
	// console.log(clockedIn)

	clockedIn.forEach(ci => {
		// Get all employees that are clocked in
		const medewerkers = employees.filter(em => em.id === ci.employee_id)
		const clockedInMw = medewerkers.find(mw => mw.id === ci.employee_id)

		// Get the clocked in time
		const clockInTime = getClockedInTime(ci)
		const clockInTimeFormatted = format(utcToZonedTime(new Date(ci.timestamp), timeZone), 'HH:mm')

		// Get the time past since clocked in
		const diffInMinutes = differenceInMinutes(utcToZonedTime(new Date(), timeZone), utcToZonedTime(new Date(ci.timestamp), timeZone))
		const diffInHours = differenceInHours(utcToZonedTime(new Date(), timeZone), utcToZonedTime(new Date(ci.timestamp), timeZone))

		if(diffInHours > 0){
			timePastClockIn = `ongeveer ${diffInHours} uur geleden`
		} else {
			timePastClockIn = `${diffInMinutes} minuten geleden`
		}

		clockedInMw.ClockInTime = clockInTimeFormatted
		clockedInMw.TimePastClockIn = timePastClockIn
		mwArray = [...mwArray, clockedInMw]
	})


	// console.log(mwArray)

	res.render("index", {employees, punches, mwArray, title:"Aanwezigheidsoverzicht"})
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