import express from "express"

const server = express()

server.set("view engine", "ejs")
server.set("views", "./views")
server.set("port", process.env.PORT || 8000)

server.use(express.static('public'))

server.listen(server.get("port"), () => {
	console.log(`Application started on http://localhost:${server.get("port")}`)
})

server.get("/", (req, res) => {
	res.render("index")
})