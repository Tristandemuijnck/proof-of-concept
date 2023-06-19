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

// console.log(start)

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

	let mwArrayIn = []
	let mwArrayOut = []
	let timePastClockIn
	let timePastClockOut

	let seenMwIds = []

	const clockedIn = punches.data.filter(pu => pu.type === 'clock_in')
	const clockedOut = punches.data.filter(pu => pu.type === 'clock_out')

	clockedIn.forEach(ci => {
		// Get all employees that are clocked in
		const medewerkers = employees.filter(em => em.id === ci.employee_id)
		const clockedInMw = medewerkers.find(mw => mw.id === ci.employee_id)

        const clonedArrIn = {...clockedInMw}

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

		clonedArrIn.ClockInTime = clockInTimeFormatted
		clonedArrIn.TimePastClockIn = timePastClockIn

        mwArrayIn.push(clonedArrIn)

		if (!seenMwIds.includes(clonedArrIn.id)) {
			seenMwIds.push(clonedArrIn.id)
		}
	})

	// console.log(seenMwIds)
	// console.log(clockedIn)

	// TODO Get all clock in's with specific employee id
	// const specificClockInEmployee =

	clockedOut.forEach(co => {
		// Get all employees that are clocked out
		const medewerkers = employees.filter(em => em.id === co.employee_id)
		const clockedOutMw = medewerkers.find(mw => mw.id === co.employee_id)

        const clonedArrOut = {...clockedOutMw}

		// Get the clocked out time
		const clockOutTime = getClockedInTime(co)
		const clockOutTimeFormatted = format(utcToZonedTime(new Date(co.timestamp), timeZone), 'HH:mm')

		// Get the time past since clocked out
		const diffInMinutes = differenceInMinutes(utcToZonedTime(new Date(), timeZone), utcToZonedTime(new Date(co.timestamp), timeZone))
		const diffInHours = differenceInHours(utcToZonedTime(new Date(), timeZone), utcToZonedTime(new Date(co.timestamp), timeZone))

		if(diffInHours > 0){
			timePastClockOut = `ongeveer ${diffInHours} uur geleden`
		}
		else {
			timePastClockOut = `${diffInMinutes} minuten geleden`
		}

		clonedArrOut.ClockOutTime = clockOutTimeFormatted
		clonedArrOut.TimePastClockOut = timePastClockOut

        mwArrayOut.push(clonedArrOut)
	})

    // console.log(mwArrayIn)

	res.render("index", {employees, punches, mwArrayIn, mwArrayOut, title:"Aanwezigheidsoverzicht"})
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

	const currentTime = format(utcToZonedTime(new Date(), timeZone), 'HH:mm')

	res.render("inklokken", {title:"Inklokken", departments, employees, currentTime})
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

	const currentTime = format(utcToZonedTime(new Date(), timeZone), 'HH:mm')

	res.render("uitklokken", {title:"Uitklokken", departments, employees, currentTime})
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