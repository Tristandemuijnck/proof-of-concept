const viewSwitch = document.getElementById('color-mode')
const overzichtIn = document.getElementById('overzicht-ingeklokt')
const overzichtUit = document.getElementById('overzicht-uitgeklokt')

viewSwitch.addEventListener('change', () => {
	const switchState = viewSwitch.checked

	if (switchState) {
		overzichtIn.classList.toggle("switch-view")
		overzichtUit.classList.toggle("switch-view")
	} else {
		overzichtIn.classList.toggle("switch-view")
		overzichtUit.classList.toggle("switch-view")
	}
})